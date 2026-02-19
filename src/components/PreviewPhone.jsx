import React, { useState, useEffect, useMemo } from 'react';
import { 
    Pause, Play, VolumeX, Volume2, ChevronLeft, ChevronRight, Image as ImageIcon, Heart, MessageCircle, Share2, Music
} from 'lucide-react';
import MediaPreview from './MediaPreview';

const PreviewPhone = ({ contentType, content, product, audio, voiceover, hooks, onSlideChange }) => {
  const isVideoMode = contentType === 'video';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isMuted, setIsMuted] = useState(false); // Default unmuted for better UX? Or muted for autoplay policy. Let's start muted but allow unmute.
  
  // Audio Refs
  const audioRef = React.useRef(null);

  // Handle Background Audio (Music)
  useEffect(() => {
      if (!audio) {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
          return;
      }

      if (!audioRef.current) {
          audioRef.current = new Audio(audio);
          audioRef.current.loop = true;
      } else if (audioRef.current.src !== audio) {
          audioRef.current.src = audio;
      }

      const audioEl = audioRef.current;
      
      // Volume Ducking logic
      if (voiceover) {
          audioEl.volume = isMuted ? 0 : 0.2; // Lower volume if voiceover exists
      } else {
          audioEl.volume = isMuted ? 0 : 0.8;
      }

      if (isAutoPlay && !isMuted) {
          console.log("Attempting bg audio play");
          audioEl.play().catch(e => console.log("Autoplay blocked", e));
      } else {
          audioEl.pause();
      }

      return () => {
          if(!isAutoPlay || isMuted) audioEl.pause();
      };
  }, [audio, isMuted, isAutoPlay, voiceover]);


  // Handle Voiceover (TTS)
  useEffect(() => {
    // Cancel any ongoing speech when component unmounts or deps change
    return () => window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    if (!voiceover || isMuted || !isAutoPlay) {
        window.speechSynthesis.cancel();
        return;
    }

    // Small delay to let music start first
    const timer = setTimeout(() => {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(voiceover.text);
        
        // Try to find the exact voice again
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.voiceURI === voiceover.voiceURI) || voices.find(v => v.lang === voiceover.lang);
        if (voice) utterance.voice = voice;
        
        utterance.rate = voiceover.rate || 1;
        utterance.pitch = voiceover.pitch || 1;
        utterance.volume = 1; // Max volume for voice

        window.speechSynthesis.speak(utterance);
    }, 500);

    return () => clearTimeout(timer);
  }, [voiceover, isMuted, isAutoPlay, currentSlide]); // Restart on slide change? Maybe not. Let's remove currentSlide if we want it continuous.
  // Actually, for a single ad, we want it to run once per loop usually, or just once.
  // Re-adding it to deps ONLY if we want it to restart. For now, let's keep it simple: plays when Voiceover changes or un-mutes.

  // Normalize slides
  const slides = useMemo(() => {
    if (!product) return [];
    if (product.gallery && product.gallery.length > 0) return product.gallery;
    if (product.image_url) return [product.image_url];
    return [];
  }, [product]);

  // Notify parent of slide change
  useEffect(() => {
     if (onSlideChange) onSlideChange(currentSlide);
  }, [currentSlide, onSlideChange]);

  // Auto-advance slideshow
  useEffect(() => {
    if (slides.length <= 1 || !isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentSlide(curr => (curr + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides, slides.length, isAutoPlay]);
  
  // Controls
  const nextSlide = () => setCurrentSlide(curr => (curr + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(curr => (curr - 1 + slides.length) % slides.length);
  
  // Get current media
  const currentMedia = slides[currentSlide];
  
  // Magic Check: content is video if file extension says so OR if we are in Video Mode with only 1 image (Ken Burns)
  const isRealVideoFile = currentMedia?.match(/\.(mp4|webm|mov|ogg)$/i);
  const isArtificialVideo = isVideoMode && !isRealVideoFile; 

  return (
    <div className="mx-auto w-[280px] h-[600px] bg-black rounded-[40px] overflow-hidden border-[6px] border-slate-900 shadow-2xl relative transition-all duration-300 ring-1 ring-slate-800 z-10">
      
      {/* Dynamic Island */}
      <div className="absolute top-2 w-full z-30 flex justify-center pointer-events-none">
         <div className="w-[80px] h-[22px] bg-black rounded-full flex items-center justify-center gap-2">
            <div className="w-1 h-1 rounded-full bg-indigo-900/50"></div>
         </div>
      </div>

      {/* Mute Toggle Overlay (Visible on hover or tap) */}
      <button 
        onClick={() => setIsMuted(prev => !prev)}
        className="absolute top-4 right-4 z-40 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full text-white/80 hover:bg-black/60 transition-colors"
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>

      {/* Main Screen Content */}
      <div className={`w-full h-full relative ${isVideoMode ? 'bg-black' : 'bg-white'} flex flex-col`}>
        
        {/* TikTok/Reels Header Overlay */}
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
            // VIDEO MODE (TikTok Style)
            <div className="flex-1 relative bg-black">
                {product && currentMedia ? (
                    <MediaPreview 
                        src={currentMedia} 
                        className="w-full h-full object-cover"
                        animate={isArtificialVideo} // Trigger Ken Burns if artificial
                        overlayText={hooks} // Pass hook for overlay animation
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                        <ImageIcon size={32} className="opacity-50 mb-2"/>
                        <p className="text-xs">Selecciona contenido</p>
                    </div>
                )}
                
                {/* Right Action Bar */}
                <div className="absolute right-2 bottom-20 flex flex-col gap-4 items-center z-20">
                     <div className="w-10 h-10 rounded-full border border-white p-0.5 overflow-hidden bg-slate-800">
                         <div className="w-full h-full bg-linear-to-tr from-indigo-500 to-purple-500 rounded-full"></div>
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
                     <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700/50 flex items-center justify-center animate-spin-slow mt-2">
                         <Music size={14} className="text-white"/>
                     </div>
                </div>

                {/* Bottom Info Overlay */}
                <div className="absolute bottom-0 w-full p-4 pb-8 bg-linear-to-t from-black via-black/40 to-transparent z-20 text-left">
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
            // PHOTO MODE (Instagram Feed Style)
            <div className="flex-1 flex flex-col pt-10 overflow-y-auto no-scrollbar bg-white">
                {/* Header */}
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

                {/* Image */}
                <div className="aspect-square bg-slate-100 relative overflow-hidden group">
                     {product && currentMedia ? (
                         <MediaPreview src={currentMedia} className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-300">
                             <ImageIcon size={40} />
                         </div>
                     )}
                     
                     {/* Dots */}
                     {slides.length > 1 && (
                         <div className="absolute bottom-3 w-full flex justify-center gap-1">
                             {slides.map((_, i) => (
                                 <div key={i} className={`h-1.5 rounded-full transition-all ${currentSlide === i ? 'w-1.5 bg-blue-500' : 'w-1.5 bg-white/60'}`} />
                             ))}
                         </div>
                     )}
                </div>

                {/* Actions */}
                <div className="px-3 py-2 flex justify-between items-center">
                    <div className="flex gap-3">
                        <Heart size={22} className="text-black hover:text-red-500" />
                        <MessageCircle size={22} className="text-black -rotate-90" />
                        <Share2 size={22} className="text-black" />
                    </div>
                </div>

                {/* Caption */}
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
