import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Play, VolumeX, Volume2, Image as ImageIcon, Heart, MessageCircle, Share2, Music
} from 'lucide-react';
import MediaPreview from './MediaPreview';

const PreviewPhone = ({ contentType, content, product, audio, voiceover, hooks, onSlideChange, subtitles = [] }) => {
  const isVideoMode = contentType === 'video';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isMuted, setIsMuted] = useState(false); 
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  
  // Audio Refs
  const bgAudioRef = useRef(null);
  const voiceAudioRef = useRef(null);
  const progressInterval = useRef(null);

  // --- SUBTITLE SYNC ---
  useEffect(() => {
     if (!isAutoPlay || isMuted || (!audio && !voiceover)) {
         setCurrentSubtitle("");
         if (progressInterval.current) clearInterval(progressInterval.current);
         return;
     }

     const checkTime = () => {
         let time = 0;
         // Prefer voice time, fallback to BG music time
         if (voiceAudioRef.current && !voiceAudioRef.current.paused) {
             time = voiceAudioRef.current.currentTime;
         } else if (bgAudioRef.current && !bgAudioRef.current.paused) {
             time = bgAudioRef.current.currentTime;
         } else if (window.speechSynthesis.speaking) {
             // TTS time estimation is hard, let's skip for now or use a global timer
             // For MVP, subtitles work best with Audio Files.
             // If TTS, we might just show first few lines or rotate them?
             // Let's rely on the fact that SubtitleEditor provides timed segments.
             // If TTS, we don't have a precise time source easily accessible.
             // Fallback: If TTS is active, perhaps we can use a simpler mechanic or just show the text static.
         }

         if (subtitles.length > 0) {
             const active = subtitles.find(s => time >= s.start && time < s.end);
             setCurrentSubtitle(active ? active.text : "");
         } else {
             // Fallback to "karaoke" style if no explicit subtitles but content exists
             setCurrentSubtitle(content?.slice(0, 100) || "");
         }
     };

     progressInterval.current = setInterval(checkTime, 100);
     return () => clearInterval(progressInterval.current);
  }, [isAutoPlay, isMuted, subtitles, audio, voiceover]);

  // --- BACKGROUND MUSIC & DUCKING LOGIC ---
  useEffect(() => {
      // Initialize BG Audio
      if (!audio) {
          if (bgAudioRef.current) {
              bgAudioRef.current.pause();
              bgAudioRef.current = null;
          }
      } else {
          if (!bgAudioRef.current) {
              bgAudioRef.current = new Audio(audio);
              bgAudioRef.current.loop = true;
          } else if (bgAudioRef.current.src !== audio) {
              bgAudioRef.current.src = audio;
          }
      }

      // Initialize Voice Audio (if file type)
      if (voiceover?.type === 'audio-file' && voiceover.url) {
           if (!voiceAudioRef.current) {
               voiceAudioRef.current = new Audio(voiceover.url);
           } else if (voiceAudioRef.current.src !== voiceover.url) {
               voiceAudioRef.current.src = voiceover.url;
           }
      } else {
          // Cleanup if switched to TTS or none
          if (voiceAudioRef.current) {
              voiceAudioRef.current.pause();
              voiceAudioRef.current = null;
          }
      }

      const bgEl = bgAudioRef.current;
      const voiceEl = voiceAudioRef.current;

      // CORE PLAYBACK & DUCKING
      if (bgEl) {
          const hasVoice = !!voiceover; 
          bgEl.volume = isMuted ? 0 : (hasVoice ? 0.15 : 0.8);

          if (isAutoPlay && !isMuted) {
              bgEl.play().catch(e => console.log("BG Autoplay blocked", e));
          } else {
              bgEl.pause();
          }
      }

      if (voiceEl) {
          voiceEl.volume = isMuted ? 0 : 1.0;
          if (voiceover.rate) voiceEl.playbackRate = voiceover.rate;

          if (isAutoPlay && !isMuted) {
              if (voiceEl.paused) {
                  voiceEl.currentTime = 0; 
                  voiceEl.play().catch(e => console.log("Voice Autoplay blocked", e));
              }
          } else {
              voiceEl.pause();
          }
      }

      return () => {
          if (!isAutoPlay || isMuted) {
              if (bgEl) bgEl.pause();
              if (voiceEl) voiceEl.pause();
          }
      };
  }, [audio, voiceover, isMuted, isAutoPlay]);


  // --- TTS LOGIC (Text to Speech) ---
  useEffect(() => {
    if (voiceover?.type !== 'tts') {
        window.speechSynthesis.cancel();
        return;
    }

    if (isMuted || !isAutoPlay) {
        window.speechSynthesis.cancel();
        return;
    }

    const timer = setTimeout(() => {
        if (!isAutoPlay || isMuted) return;
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();

        const cleanText = voiceover.text 
            ? voiceover.text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim()
            : "";

        if(!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.voiceURI === voiceover.voiceURI) || voices.find(v => v.lang === voiceover.lang);
        if (voice) utterance.voice = voice;
        
        utterance.rate = voiceover.rate || 1;
        utterance.pitch = voiceover.pitch || 1;
        utterance.volume = 1;

        window.speechSynthesis.speak(utterance);
    }, 500);

    return () => {
        clearTimeout(timer);
        window.speechSynthesis.cancel();
    };
  }, [voiceover, isMuted, isAutoPlay, currentSlide]);

  
  // --- SLIDESHOW LOGIC ---
  const slides = useMemo(() => {
    if (!product) return [];
    if (product.gallery && product.gallery.length > 0) return product.gallery;
    if (product.image_url) return [product.image_url];
    return [];
  }, [product]);

  useEffect(() => {
     if (onSlideChange) onSlideChange(currentSlide);
  }, [currentSlide, onSlideChange]);

  useEffect(() => {
    if (slides.length <= 1 || !isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentSlide(curr => (curr + 1) % slides.length);
    }, 3500); 
    return () => clearInterval(interval);
  }, [slides, isAutoPlay]);
  
  const currentMedia = slides[currentSlide];
  const currentMediaStr = typeof currentMedia === 'string' ? currentMedia : (currentMedia instanceof File ? URL.createObjectURL(currentMedia) : String(currentMedia || ''));
  const isRealVideoFile = currentMediaStr.match(/\.(mp4|webm|mov|ogg)$/i);
  const isArtificialVideo = isVideoMode && !isRealVideoFile; 

  return (
    <div className="mx-auto w-[280px] h-[600px] bg-black rounded-[40px] overflow-hidden border-[6px] border-slate-900 shadow-2xl relative transition-all duration-300 ring-1 ring-slate-800 z-10">
      
      {/* Dynamic Island */}
      <div className="absolute top-2 w-full z-30 flex justify-center pointer-events-none">
         <div className="w-[80px] h-[22px] bg-black rounded-full flex items-center justify-center gap-2">
            <div className="w-1 h-1 rounded-full bg-indigo-900/50"></div>
         </div>
      </div>

      {/* Mute Toggle Overlay */}
      <button 
        onClick={() => setIsMuted(prev => !prev)}
        className="absolute top-4 right-4 z-40 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:bg-black/60 transition-colors pointer-events-auto"
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>

      {/* Main Screen Content */}
      <div className={`w-full h-full relative ${isVideoMode ? 'bg-black' : 'bg-white'} flex flex-col`}>
        
        {/* TikTok/Reels Overlay */}
        {isVideoMode && (
          <div className="absolute top-12 left-0 w-full px-4 flex justify-between z-20 text-white/90 pointer-events-none">
            <span className="text-[10px] font-bold shadow-sm backdrop-blur-sm px-2 py-0.5 rounded-full bg-black/20">Live</span>
            <div className="flex gap-4 text-xs font-medium shadow-sm">
              <span className="opacity-60 text-white">Siguiendo</span>
              <span className="font-bold text-white border-b-2 border-white pb-0.5">Para ti</span>
            </div>
            <span className="w-4"></span>
          </div>
        )}

        {/* Media Container */}
        {isVideoMode ? (
            <div className="flex-1 relative bg-black">
                {product && currentMedia ? (
                    <MediaPreview 
                        src={currentMedia} 
                        className="w-full h-full object-cover"
                        animate={isArtificialVideo && isAutoPlay}
                        overlayText={hooks} 
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <ImageIcon size={32} className="opacity-50 mb-2"/>
                        <p className="text-xs">Selecciona contenido</p>
                    </div>
                )}
                
                {/* SUBTITLES / CAPTION OVERLAY */}
                {/* Only show if playing and not muted */}
                {!isMuted && isAutoPlay && (
                    <div className="absolute bottom-32 left-0 w-full px-6 pointer-events-none z-20 flex justify-center">
                        <div className="bg-black/40 backdrop-blur-sm p-3 rounded-xl text-center max-w-[90%] transition-all duration-300">
                             <p className="text-white font-bold text-sm leading-snug drop-shadow-md animate-fade-in-up">
                                 {currentSubtitle || (subtitles.length > 0 ? "..." : (content?.slice(0, 80) + "..."))}
                             </p>
                        </div>
                    </div>
                )}

                {/* Play/Pause Center Overlay */}
                <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                     {!isAutoPlay && (
                         <div className="bg-black/40 backdrop-blur-sm p-4 rounded-full animate-fade-in pointer-events-auto cursor-pointer hover:bg-black/60 transition-all scale-110" onClick={() => setIsAutoPlay(true)}>
                             <Play size={32} className="text-white fill-white" />
                         </div>
                     )}
                </div>

                {/* Click to Pause Area (Full Screen) */}
                <div className="absolute inset-0 z-10" onClick={() => setIsAutoPlay(prev => !prev)}></div>
                
                {/* Right Action Bar */}
                <div className="absolute right-2 bottom-20 flex flex-col gap-4 items-center z-20 pointer-events-none">
                     <div className="w-10 h-10 rounded-full border border-white p-0.5 overflow-hidden bg-slate-800">
                         <div className="w-full h-full bg-linear-to-tr from-indigo-500 to-purple-500 rounded-full animate-spin-slow" style={{animationPlayState: isAutoPlay ? 'running' : 'paused'}}></div>
                     </div>
                     {[
                         { icon: Heart, label: "12.5K", fill: true },
                         { icon: MessageCircle, label: "480", fill: false },
                         { icon: Share2, label: "Share", fill: false }
                     ].map((action, i) => (
                         <div key={i} className="flex flex-col items-center gap-1 drop-shadow-md">
                             <action.icon size={26} className="text-white" fill={action.fill ? "white" : "rgba(255,255,255,0.2)"} />
                             <span className="text-[10px] text-white font-bold">{action.label}</span>
                         </div>
                     ))}
                     <div className={`w-10 h-10 rounded-full bg-slate-900 border border-slate-700/50 flex items-center justify-center mt-2 ${isAutoPlay ? 'animate-spin-slow' : ''}`}>
                         <Music size={14} className="text-white"/>
                     </div>
                </div>

                {/* Bottom Info Overlay */}
                <div className="absolute bottom-0 w-full p-4 pb-8 bg-linear-to-t from-black via-black/40 to-transparent z-20 text-left pointer-events-none">
                    <p className="font-bold text-white text-sm mb-1 text-shadow">@tutienda.oficial</p>
                    <p className="text-white/90 text-[11px] leading-snug line-clamp-3 pr-10 mb-2 font-medium">
                        {content || "Escribe un copy genial..."} <span className="font-bold">#viral #tendencia</span>
                    </p>
                    {audio && (
                        <div className="flex items-center gap-2 mt-1 opacity-80">
                            <Music size={10} className="text-white" /> 
                            <span className="text-[10px] text-white animate-marquee whitespace-nowrap overflow-hidden w-40">{audio}</span>
                        </div>
                    )}
                </div>
            </div>
        ) : (
            // PHOTO MODE
            <div className="flex-1 flex flex-col pt-10 overflow-y-auto no-scrollbar bg-white">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                   <div className="flex items-center gap-2">
                       <div className="w-7 h-7 bg-linear-to-tr from-yellow-400 to-red-500 rounded-full p-[1.5px]">
                           <div className="w-full h-full bg-white rounded-full border border-white overflow-hidden">
                                <div className="w-full h-full bg-slate-200"></div>
                           </div>
                       </div>
                       <span className="text-xs font-bold text-slate-900">tutienda</span>
                   </div>
                   <span className="text-black font-bold mb-2">...</span>
                </div>
                <div className="aspect-square bg-slate-100 relative overflow-hidden group">
                     {product && currentMedia ? (
                         <MediaPreview src={currentMedia} className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-300">
                             <ImageIcon size={40} />
                         </div>
                     )}
                     {slides.length > 1 && (
                         <div className="absolute bottom-3 w-full flex justify-center gap-1">
                             {slides.map((_, i) => (
                                 <div key={i} className={`h-1.5 rounded-full transition-all ${currentSlide === i ? 'w-1.5 bg-blue-500' : 'w-1.5 bg-white/60'}`} />
                             ))}
                         </div>
                     )}
                </div>
                <div className="px-3 py-2 flex justify-between items-center">
                    <div className="flex gap-3">
                        <Heart size={22} className="text-black hover:text-red-500" />
                        <MessageCircle size={22} className="text-black -rotate-90" />
                        <Share2 size={22} className="text-black" />
                    </div>
                </div>
                <div className="px-3 pb-4">
                    <p className="text-xs font-bold text-slate-900 mb-1">1,204 Me gusta</p>
                    <p className="text-xs text-slate-800 leading-snug">
                        <span className="font-bold mr-1">tutienda</span>
                        {content || "..."}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">Hace 2 horas</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPhone;
