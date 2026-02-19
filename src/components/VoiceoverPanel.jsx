import React, { useState, useEffect, useRef } from 'react';
import { Mic, Play, Square, Volume2, Sparkles, Loader2, Check, PauseCircle } from 'lucide-react';

const VoiceoverPanel = ({ text, onAudioGenerated }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [rate, setRate] = useState(1); // Speed
  const [pitch, setPitch] = useState(1); // Tone
  
  // Ref to track if unmounted
  const mounted = useRef(true);

  // Helper: Strip emojis for audio
  const cleanTextForAudio = (str) => {
    if (!str) return "";
    return str
      .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '') // Basic Emoji ranges
      .replace(/\s+/g, ' ') // Collapse spaces
      .trim();
  };

  useEffect(() => {
    mounted.current = true;
    
    const loadVoices = () => {
      let avail = window.speechSynthesis.getVoices();
      if (avail.length === 0) return;

      // Smart Sort: Google > Microsoft > Others
      avail = avail.sort((a, b) => {
          const scoreA = (a.name.includes('Google') ? 2 : 0) + (a.name.includes('Microsoft') ? 1 : 0);
          const scoreB = (b.name.includes('Google') ? 2 : 0) + (b.name.includes('Microsoft') ? 1 : 0);
          return scoreB - scoreA;
      });

      // Filter: Spanish/English only to reduce noise
      const filtered = avail.filter(v => v.lang.startsWith('es') || v.lang.startsWith('en'));
      setVoices(filtered.length ? filtered : avail);
      
      // Select first logic
      if (!selectedVoice && filtered.length > 0) {
          // Try to find a "Google Español" one if possible, usually best quality on Chrome
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

  const handleStop = () => {
      window.speechSynthesis.cancel();
      setPreviewing(false);
  };

  const handlePreview = () => {
    if (!selectedVoice || !text) return;

    // STOP first
    window.speechSynthesis.cancel();
    
    // Clean text!
    const speakableText = cleanTextForAudio(text);
    if (!speakableText) return;

    setPreviewing(true);

    const utterance = new SpeechSynthesisUtterance(speakableText);
    utterance.voice = selectedVoice;
    utterance.rate = rate; 
    utterance.pitch = pitch;

    utterance.onend = () => { if(mounted.current) setPreviewing(false); };
    utterance.onerror = () => { if(mounted.current) setPreviewing(false); };

    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateValues = () => {
      const speakableText = cleanTextForAudio(text);
      if(!speakableText) return alert("No hay texto legible para el audio.");

      const config = {
          type: 'tts',
          text: speakableText, // Send CLEAN text config
          originalText: text,
          voiceURI: selectedVoice.voiceURI,
          rate: rate,
          pitch: pitch,
          lang: selectedVoice.lang
      };
      
      onAudioGenerated(config); 
      setGeneratedUrl('TTS_CONFIGURED');
  };

  return (
    <div className="glass-panel p-4 rounded-2xl space-y-4 border border-indigo-500/20">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic size={16} className="text-indigo-400" /> Generador de Voz (TTS)
            </h3>
            {previewing && (
                <button 
                    onClick={handleStop}
                    className="text-[10px] bg-red-500/20 text-red-300 px-2 py-1 rounded border border-red-500/30 flex items-center gap-1 hover:bg-red-500/30 transition-colors animate-pulse"
                >
                    <PauseCircle size={12} /> DETENER
                </button>
            )}
        </div>

        <div className="space-y-3">
             {/* Voice Selection */}
             <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Voz Neural (Mejoradas primero)</label>
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

             {/* Controls */}
             <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Velocidad ({rate}x)</label>
                    <input 
                        type="range" min="0.8" max="1.2" step="0.1" 
                        value={rate} onChange={e => setRate(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Tono</label>
                    <input 
                        type="range" min="0.8" max="1.2" step="0.1" 
                        value={pitch} onChange={e => setPitch(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                 </div>
             </div>

             {/* Preview & action */}
             <div className="flex gap-2">
                 {previewing ? (
                     <button 
                        onClick={handleStop}
                        className="flex-1 py-2 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 rounded-lg text-xs font-bold text-red-200 transition-colors flex items-center justify-center gap-2"
                     >
                        <Square size={12} fill="currentColor" /> Detener Voz
                     </button>
                 ) : (
                     <button 
                        onClick={handlePreview}
                        disabled={!text}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                     >
                        <Play size={12} fill="currentColor" /> Probar Voz
                     </button>
                 )}
                 
                 <button 
                    onClick={handleGenerateValues}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${generatedUrl ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                 >
                    <Sparkles size={12} /> {generatedUrl ? 'Voz Aplicada' : 'Usar Voz'}
                 </button>
             </div>
        </div>
    </div>
  );
};

export default VoiceoverPanel;
