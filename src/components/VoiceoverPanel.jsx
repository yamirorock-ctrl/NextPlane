import React, { useState, useEffect } from 'react';
import { Mic, Play, Square, Volume2, Sparkles, Loader2, Check } from 'lucide-react';

const VoiceoverPanel = ({ text, onAudioGenerated }) => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [rate, setRate] = useState(1); // Speed
  const [pitch, setPitch] = useState(1); // Tone

  useEffect(() => {
    // Load available system voices
    const loadVoices = () => {
      const avail = window.speechSynthesis.getVoices();
      // Filter for Spanish/English mainly, or quality ones
      const filtered = avail.filter(v => v.lang.startsWith('es') || v.lang.startsWith('en'));
      setVoices(filtered.length ? filtered : avail);
      if (filtered.length && !selectedVoice) setSelectedVoice(filtered[0]);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, [selectedVoice]);

  const handlePreview = () => {
    if (!selectedVoice || !text) return;

    window.speechSynthesis.cancel();
    setPreviewing(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.rate = rate; // 0.8 to 1.2 is usually good for video
    utterance.pitch = pitch;

    utterance.onend = () => setPreviewing(false);
    utterance.onerror = () => setPreviewing(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleGenerateValues = () => {
      // In a real app with external API, here we would fetch the MP3.
      // For browser TTS, we can't easily get a Blob/URL directly without complex recording.
      // SO, for this MVP, we will simulate "Generation" by returning a marker 
      // ensuring the Preview Phone knows to use TTS playback.
      const config = {
          type: 'tts',
          text: text,
          voiceURI: selectedVoice.voiceURI,
          rate: rate,
          pitch: pitch,
          lang: selectedVoice.lang
      };
      
      // We create a fake blob URL (or data) just to handle logic downstream if needed,
      // But mainly we return the config object.
      onAudioGenerated(config); 
      setGeneratedUrl('TTS_CONFIGURED');
  };

  return (
    <div className="glass-panel p-4 rounded-2xl space-y-4 border border-indigo-500/20">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic size={16} className="text-indigo-400" /> Generador de Voz (TTS)
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                <Check size={10} /> Copyright Safe
            </span>
        </div>

        <div className="space-y-3">
             {/* Voice Selection */}
             <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Voz Neural</label>
                <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value))}
                    value={selectedVoice?.name || ''}
                >
                    {voices.map(v => (
                        <option key={v.name} value={v.name}>
                            {v.name} ({v.lang})
                        </option>
                    ))}
                </select>
             </div>

             {/* Controls */}
             <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Velocidad ({rate}x)</label>
                    <input 
                        type="range" min="0.5" max="1.5" step="0.1" 
                        value={rate} onChange={e => setRate(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Tono</label>
                    <input 
                        type="range" min="0.5" max="1.5" step="0.1" 
                        value={pitch} onChange={e => setPitch(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                 </div>
             </div>

             {/* Preview & action */}
             <div className="flex gap-2">
                 <button 
                    onClick={handlePreview}
                    disabled={!text}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                 >
                    {previewing ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                    {previewing ? 'Detener' : 'Probar Audio'}
                 </button>
                 <button 
                    onClick={handleGenerateValues}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${generatedUrl ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                 >
                    <Sparkles size={12} /> {generatedUrl ? 'Voz Aplicada' : 'Usar esta Voz'}
                 </button>
             </div>
        </div>

        {/* Warning about mixing */}
        <div className="bg-slate-900/50 p-2 rounded text-[10px] text-slate-400 border border-slate-700">
            ℹ️ <span className="font-bold text-slate-300">Tip:</span> Esta voz se mezclará con la música de fondo si eliges una. Instagram respetará esto como "Audio Original".
        </div>
    </div>
  );
};

export default VoiceoverPanel;
