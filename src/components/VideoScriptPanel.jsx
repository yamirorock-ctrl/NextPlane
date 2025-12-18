import React from 'react';
import { Video, Sparkles, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

const VideoScriptPanel = ({ strategy, loading, onGenerate, onSelectHook, selectedHook }) => {
  if (!strategy && !loading) {
     return (
        <div className="bg-slate-900/50 p-8 rounded-2xl border border-dashed border-slate-700 text-center space-y-4">
           <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500">
              <Video size={32} />
           </div>
           <div>
              <h3 className="text-white font-bold text-lg">Guionista IA</h3>
              <p className="text-slate-400 text-sm">Genera guiones virales con ganchos, estructura y música.</p>
           </div>
           <button 
             onClick={onGenerate}
             className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-sm transition-all shadow-lg shadow-indigo-500/20"
           >
             <Sparkles size={16} className="inline mr-2" />
             Generar Guion
           </button>
        </div>
     );
  }

  if (loading) {
     return (
        <div className="bg-slate-900/50 p-12 rounded-2xl border border-slate-700 text-center">
           <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto mb-4" />
           <p className="text-slate-300 font-bold animate-pulse">Escribiendo tu próximo viral...</p>
        </div>
     );
  }

  return (
     <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-800/50 shadow-lg space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
           <div className="flex items-center gap-2">
              <Sparkles className="text-amber-300" size={20} />
              <h3 className="font-bold text-slate-200">Guion Generado</h3>
           </div>
           <button onClick={onGenerate} className="text-xs text-indigo-400 hover:text-white flex items-center gap-1">
              <RefreshCw size={12} /> Regenerar
           </button>
        </div>

        {/* Hooks Selection */}
        <div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">1. Elige un Gancho (Hook)</p>
           <div className="space-y-2">
              {strategy.hook_options.map((hook, i) => (
                 <button 
                   key={i}
                   onClick={() => onSelectHook(hook)}
                   className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden group ${selectedHook === hook ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500/50'}`}
                 >
                    <div className="flex justify-between items-start gap-2">
                       <span className="font-bold text-sm leading-relaxed">"{hook}"</span>
                       {selectedHook === hook && <CheckCircle2 size={16} className="text-white shrink-0" />}
                    </div>
                 </button>
              ))}
           </div>
        </div>

        {/* Script Body */}
        <div>
           <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">2. Estructura Visual</p>
           <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs space-y-3 text-slate-300">
              <div className="flex gap-3">
                <span className="text-indigo-400 font-bold min-w-[60px]">VISUAL:</span>
                <p>{strategy.visual_concept}</p>
              </div>
              <div className="flex gap-3">
                <span className="text-pink-400 font-bold min-w-[60px]">ÁNGULO:</span>
                <p>{strategy.angle}</p>
              </div>
              <div className="flex gap-3">
                <span className="text-emerald-400 font-bold min-w-[60px]">CAPTION:</span>
                <p className="italic opacity-80">{strategy.caption}</p>
              </div>
           </div>
        </div>
     </div>
  );
};

export default VideoScriptPanel;
