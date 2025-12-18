import React from 'react';
import { X, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Microscope } from 'lucide-react';

const CritiqueModal = ({ critique, onClose }) => {
  if (!critique) return null;

  // critique structure from ai.js: 
  // { score: number, strengths: [], weaknesses: [], improvement_tips: [], viral_prediction: string }

  const scoreColor = critique.score >= 8 ? 'text-emerald-400' : critique.score >= 6 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = critique.score >= 8 ? 'bg-emerald-500' : critique.score >= 6 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
            <Microscope size={24} className="text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
               <h3 className="text-xl font-bold text-white">Análisis de Ventas</h3>
               <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">AI Vision</span>
            </div>
            <p className="text-slate-400 text-xs">Crítica constructiva para maximizar conversión</p>
          </div>
        </div>

        {/* Score */}
        <div className="mb-6 flex items-center justify-between bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
           <span className="text-slate-400 text-sm font-bold uppercase tracking-wider">Potencial de Venta</span>
           <div className="flex items-end gap-2">
              <span className={`text-4xl font-black ${scoreColor}`}>{critique.score}</span>
              <span className="text-slate-600 font-bold mb-1">/ 10</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5">
           
           {/* Strengths */}
           <div>
              <h4 className="text-emerald-400 font-bold text-sm uppercase flex items-center gap-2 mb-2">
                 <CheckCircle2 size={16} /> Puntos Fuertes
              </h4>
              <ul className="space-y-2">
                 {critique.strengths && critique.strengths.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 flex gap-2">
                       <span className="text-emerald-500">•</span> {item}
                    </li>
                 ))}
              </ul>
           </div>

           {/* Weaknesses */}
           <div>
              <h4 className="text-red-400 font-bold text-sm uppercase flex items-center gap-2 mb-2">
                 <AlertTriangle size={16} /> A Mejorar
              </h4>
              <ul className="space-y-2">
                 {critique.weaknesses && critique.weaknesses.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm bg-red-500/5 p-2 rounded-lg border border-red-500/10 flex gap-2">
                       <span className="text-red-500">•</span> {item}
                    </li>
                 ))}
              </ul>
           </div>

            {/* Tips */}
           <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
              <h4 className="text-indigo-300 font-bold text-sm uppercase flex items-center gap-2 mb-2">
                 <Sparkles size={16} /> Tips de Experto
              </h4>
              <p className="text-slate-300 text-sm italic leading-relaxed">
                 "{critique.improvement_tips}"
              </p>
           </div>
           
           {/* Viral Prediction */}
           {critique.viral_prediction && (
              <div className="flex items-start gap-3 p-3 bg-slate-800 rounded-xl">
                 <TrendingUp size={20} className="text-pink-400 mt-0.5" />
                 <div>
                    <span className="text-pink-400 font-bold text-xs uppercase block mb-1">Predicción Viral</span>
                    <p className="text-slate-300 text-xs">{critique.viral_prediction}</p>
                 </div>
              </div>
           )}

        </div>

      </div>
    </div>
  );
};

export default CritiqueModal;
