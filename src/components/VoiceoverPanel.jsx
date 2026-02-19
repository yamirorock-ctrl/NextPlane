import React, { useState, useEffect, useRef } from 'react';
import { Mic, Play, Square, Volume2, Sparkles, Loader2, Check, PauseCircle, Upload, Trash2, StopCircle, Type } from 'lucide-react';

const VoiceoverPanel = ({ text, onAudioGenerated }) => {
  const [mode, setMode] = useState('tts'); // 'tts' | 'record'
  
  // TTS State
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [previewingTTS, setPreviewingTTS] = useState(false);
  const [ttsConfig, setTTSConfig] = useState({ rate: 1, pitch: 1 });
  
  // Recording/Upload State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0); // Speed for recorded audio
  
  // Shared State
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const mounted = useRef(true);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null); 

  // --- TTS LOGIC ---
  const cleanTextForAudio = (str) => {
    if (!str) return "";
    return str
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  useEffect(() => {
    mounted.current = true;
    const loadVoices = () => {
      let avail = window.speechSynthesis.getVoices();
      if (avail.length === 0) return;
      avail = avail.sort((a, b) => {
          const scoreA = (a.name.includes('Google') ? 2 : 0) + (a.name.includes('Microsoft') ? 1 : 0);
          const scoreB = (b.name.includes('Google') ? 2 : 0) + (b.name.includes('Microsoft') ? 1 : 0);
          return scoreB - scoreA;
      });
      const filtered = avail.filter(v => v.lang.startsWith('es') || v.lang.startsWith('en'));
      setVoices(filtered.length ? filtered : avail);
      if (!selectedVoice && filtered.length > 0) {
          const best = filtered.find(v => v.name.includes('Google') && v.lang.startsWith('es')) || filtered[0];
          setSelectedVoice(best);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { 
        mounted.current = false; 
        window.speechSynthesis.cancel();
    };
  }, []);

  const handleTTSPreview = () => {
    if (!selectedVoice || !text) return;
    window.speechSynthesis.cancel();
    const speakableText = cleanTextForAudio(text);
    if (!speakableText) return;
    setPreviewingTTS(true);
    const utterance = new SpeechSynthesisUtterance(speakableText);
    utterance.voice = selectedVoice;
    utterance.rate = ttsConfig.rate; 
    utterance.pitch = ttsConfig.pitch;
    utterance.onend = () => { if(mounted.current) setPreviewingTTS(false); };
    utterance.onerror = () => { if(mounted.current) setPreviewingTTS(false); };
    window.speechSynthesis.speak(utterance);
  };

  const handleTTSStop = () => {
      window.speechSynthesis.cancel();
      setPreviewingTTS(false);
  };

  // --- RECORDING LOGIC ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedBlob(blob);
          setAudioUrl(url);
          stream.getTracks().forEach(track => track.stop()); // Stop mic
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

    } catch (err) {
      alert("No se pudo acceder al micrófono. Verifica los permisos.");
      console.error(err);
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          clearInterval(timerRef.current);
      }
  };

  const handleFileUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setRecordedBlob(file); // Act as blob
          setAudioUrl(url);
      }
  };

  const clearRecording = () => {
      setRecordedBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setPlaybackRate(1.0);
  };

  // Effect to update playback rate of preview audio
  useEffect(() => {
      if (audioPlayerRef.current) {
          audioPlayerRef.current.playbackRate = playbackRate;
      }
  }, [playbackRate, audioUrl]);


  // --- GENERATE / APPLY ---
  const handleApply = (targetMode) => {
      const currentMode = targetMode || mode;
      
      if (currentMode === 'tts') {
          const speakableText = cleanTextForAudio(text);
          if(!speakableText && !text) return alert("Texto vacío"); 
          
          if (!selectedVoice) return alert("Selecciona una voz");

          onAudioGenerated({
              type: 'tts',
              text: speakableText || text,
              originalText: text,
              voiceURI: selectedVoice.voiceURI,
              rate: ttsConfig.rate,
              pitch: ttsConfig.pitch,
              lang: selectedVoice.lang
          });
      } else {
          if (!audioUrl) return alert("Graba o sube un audio primero");
          onAudioGenerated({
              type: 'audio-file',
              url: audioUrl,
              blob: recordedBlob,
              rate: playbackRate // Pass configured rate!
          });
      }
      setGeneratedUrl('APPLIED');
  };

  // Helper format time
  const formatTime = (sec) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="glass-panel p-4 rounded-2xl space-y-4 border border-indigo-500/20">
        
        {/* TABS */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl">
            <button 
                onClick={() => setMode('tts')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${mode === 'tts' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                <Sparkles size={14} /> Voz IA
            </button>
            <button 
                onClick={() => setMode('record')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${mode === 'record' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                <Mic size={14} /> Mi Voz
            </button>
        </div>

        {/* CONTENT AREA */}
        <div className="min-h-[180px]">
            {mode === 'tts' ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Voz Neural</label>
                        <div className="relative">
                            <select 
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                                onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value))}
                                value={selectedVoice?.name || ''}
                            >
                                {voices.map(v => (
                                    <option key={v.name} value={v.name}>
                                        {v.name.replace('Microsoft', '').replace('Google', '').trim()} ({v.lang})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-2 top-2.5 pointer-events-none text-slate-400">▼</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Velocidad</label>
                            <input 
                                type="range" min="0.8" max="1.2" step="0.1" 
                                value={ttsConfig.rate} onChange={e => setTTSConfig({...ttsConfig, rate: parseFloat(e.target.value)})}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Tono</label>
                            <input 
                                type="range" min="0.8" max="1.2" step="0.1" 
                                value={ttsConfig.pitch} onChange={e => setTTSConfig({...ttsConfig, pitch: parseFloat(e.target.value)})}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                        {previewingTTS ? (
                             <button onClick={handleTTSStop} className="flex-1 py-2 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 rounded-lg text-xs font-bold text-red-200 flex items-center justify-center gap-2 transition-colors">
                                <Square size={12} fill="currentColor" /> Detener
                             </button>
                        ) : (
                             <button onClick={handleTTSPreview} disabled={!text} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 transition-colors">
                                <Play size={12} fill="currentColor" /> Probar
                             </button>
                        )}
                        <button onClick={() => handleApply('tts')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${generatedUrl === 'APPLIED' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                            <Sparkles size={12} /> {generatedUrl === 'APPLIED' ? 'Voz Lista' : 'Usar Voz IA'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    {!audioUrl ? (
                         // RECORDING STATE (Initial)
                         <div className="flex flex-col items-center justify-center py-4 space-y-4">
                             {isRecording ? (
                                 <div className="text-center space-y-2">
                                     <div className="relative inline-block">
                                         <div className="w-16 h-16 rounded-full bg-rose-500/20 animate-ping absolute inset-0"></div>
                                         <button onClick={stopRecording} className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center relative z-10 shadow-lg shadow-rose-500/30 transition-all scale-105">
                                             <Square size={24} className="text-white fill-white" />
                                         </button>
                                     </div>
                                     <p className="text-rose-400 font-mono font-bold text-lg animate-pulse">{formatTime(recordingTime)}</p>
                                     <p className="text-xs text-slate-400">Grabando... Haz clic para terminar</p>
                                 </div>
                             ) : (
                                 <div className="text-center space-y-4 w-full">
                                     <button onClick={startRecording} className="w-16 h-16 mx-auto rounded-full bg-slate-800 border-2 border-slate-700 hover:border-rose-500 hover:bg-slate-700 flex items-center justify-center transition-all group">
                                         <Mic size={24} className="text-slate-400 group-hover:text-rose-500 transition-colors" />
                                     </button>
                                     <div className="text-[10px] text-slate-500">Click para grabar</div>
                                     
                                     <div className="flex items-center gap-3 w-full px-4">
                                         <div className="h-px bg-slate-700 flex-1"></div>
                                         <span className="text-[10px] text-slate-500 uppercase font-bold">O sube un archivo</span>
                                         <div className="h-px bg-slate-700 flex-1"></div>
                                     </div>

                                     <label className="block w-full cursor-pointer px-4">
                                         <div className="bg-slate-800/50 hover:bg-slate-800 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-3 flex items-center justify-center gap-2 transition-all group">
                                             <span className="text-xs font-bold text-slate-400 group-hover:text-white flex items-center gap-2">
                                                 <Upload size={14} /> Seleccionar MP3 / WAV
                                             </span>
                                         </div>
                                         <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                                     </label>
                                 </div>
                             )}
                         </div>
                    ) : (
                        // REVIEW STATE (Has Audio)
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                    Audio {recordedBlob instanceof File ? 'Subido' : 'Grabado'}
                                </span>
                                <button onClick={clearRecording} className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            
                            <audio ref={audioPlayerRef} src={audioUrl} controls className="w-full h-8 opacity-70 rounded-lg bg-black/20" />

                            {/* Audio Enhancements */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-black/20 p-2 rounded-lg">
                                    <label className="text-[9px] uppercase font-bold text-slate-500 mb-1 flex items-center justify-between">
                                        Velocidad <span className="text-white">{playbackRate}x</span>
                                    </label>
                                    <input 
                                        type="range" min="0.8" max="1.5" step="0.1" 
                                        value={playbackRate} onChange={e => setPlaybackRate(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
                                    />
                                </div>
                                <div className="bg-black/20 p-2 rounded-lg flex items-center justify-center">
                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                                        <Type size={12} /> Auto-Subtítulos
                                    </span>
                                </div>
                            </div>

                            <button onClick={() => handleApply('record')} className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${generatedUrl === 'APPLIED' ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}`}>
                                <Check size={14} /> {generatedUrl === 'APPLIED' ? 'Usando este Audio' : 'Confirmar y Usar'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};

export default VoiceoverPanel;
