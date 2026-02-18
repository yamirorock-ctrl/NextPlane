import React, { useState } from 'react';
import { 
    Sparkles, Loader2, RefreshCw, CheckCircle2, TrendingUp, Music, ChevronRight
} from 'lucide-react';
import BriefExport from './BriefExport';

const ViralCoach = ({ hooks, onSelectHook, selectedHook, onSelectAudio, contentType, onRegenerateHooks, loadingHooks, trendingAudio, selectedTone, onSelectTone, strategy, product }) => {
  const tones = ["Sarcástico", "Profesional", "Urgente", "Amigable", "Polémico"];

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-800/50 shadow-lg space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Sparkles className="text-amber-300" size={20} />
        <h3 className="font-bold text-slate-200">IA Viral Coach</h3>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
          Vibe / Tono
        </label>
        <div className="flex flex-wrap gap-2">
          {(() => {
             // Combine default tones with Custom Presets from LocalStorage
             const presets = JSON.parse(localStorage.getItem('ai_presets') || '[]');
             const presetNames = presets.map(p => p.name);
             const allTones = ["Sarcástico", "Profesional", "Urgente", "Amigable", "Polémico", ...presetNames];
             
             return allTones.map(t => {
               // Check if it's a custom preset to render it differently (gold border?)
               const isCustom = presetNames.includes(t);
               return (
                 <button
                   key={t}
                   onClick={() => {
                        // If it's a preset, we need to pass the FULL instruction, not just the name.
                        // But wait, our parent (CreateStudio) calls `generateViralStrategy(..., selectedTone, ...)`
                        // And `ai.js` now handles customs.
                        // So we just need to ensure that if I select "Mi Estilo", the `selectedTone` state becomes the INSTRUCTION, not the name?
                        // OR, we update `ai.js` to look up the preset?
                        // SIMPLER APPROACH: Pass the instruction text properly to the parent state.
                        
                        if (isCustom) {
                            const preset = presets.find(p => p.name === t);
                            // We pass the instruction text as the 'tone'
                            // But we want the UI to show the NAME selected.
                            // This requires a minor refactor in App state or just dealing with it.
                            // Let's pass the INSTRUCTION text. 
                            // *Wait*, if we pass the instruction text, the button rendering logic (selectedTone === t) will FAIL because state != name.
                            // Better: Keep state as Name, look up instruction when Generating.
                            onSelectTone(t); 
                        } else {
                            onSelectTone(t);
                        }
                   }}
                   className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                     selectedTone === t 
                       ? 'bg-indigo-500 text-white border-indigo-400 shadow-custom' 
                       : isCustom 
                         ? 'bg-slate-800 text-amber-400 border-amber-500/30 hover:border-amber-500/50'
                         : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                   }`}
                 >
                   {isCustom && <Sparkles size={10} />}
                   {t}
                 </button>
               );
             });
          })()}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {contentType === 'video' ? 'Hooks (3s Rule)' : 'Titulares de Impacto'}
          </p>
          <button 
            onClick={onRegenerateHooks} 
            disabled={loadingHooks}
            className="text-indigo-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors disabled:opacity-50"
            title="Generar nuevas ideas con Gemini"
          >
            {loadingHooks ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>
        
        <div className="space-y-2">
          {hooks.slice(0, 3).map((hook, idx) => (
            <button 
              key={idx}
              onClick={() => onSelectHook(hook)}
              className={`w-full text-left p-3 text-sm rounded-lg transition-all border group relative overflow-hidden ${selectedHook === hook ? 'bg-indigo-500/20 text-white border-indigo-500 shadow-md ring-1 ring-indigo-500/50' : 'bg-slate-800/50 hover:bg-indigo-600/10 hover:text-indigo-300 text-slate-300 border-slate-700/50 hover:border-indigo-500/30'}`}
            >
              {selectedHook === hook && <div className="absolute left-0 top-0 w-[4px] h-full bg-indigo-500"></div>}
              <div className="absolute left-0 top-0 w-[2px] h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="font-medium leading-relaxed block pr-12">{hook.replace('[PROBLEMA]', 'perder dinero')}</span>
              
              {selectedHook === hook ? (
                 <span className="absolute right-2 top-2 text-[10px] uppercase font-bold text-white bg-indigo-500 px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                    <CheckCircle2 size={10} /> Usando
                 </span>
              ) : (
                 <span className="hidden group-hover:block absolute right-2 top-2 text-[10px] uppercase font-bold text-indigo-400 bg-indigo-400/10 px-1.5 rounded">Usar</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Audio Trending 🎵</p>
        <div className="space-y-2">
          {trendingAudio.map((audio) => (
            <button 
              key={audio.id}
              onClick={() => onSelectAudio(audio.name)}
              className="w-full flex items-center justify-between p-2.5 text-sm border border-slate-800 rounded-lg hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                   {audio.trending ? <TrendingUp size={14} /> : <Music size={14} />}
                </div>
                <div className="text-left">
                  <span className="text-slate-300 block font-medium group-hover:text-pink-300 transition-colors">{audio.name}</span>
                  <span className="text-xs text-slate-500">{audio.uses} videos</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-pink-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      <BriefExport strategy={strategy} product={product} tone={selectedTone} />
    </div>
  );
};

export default ViralCoach;
