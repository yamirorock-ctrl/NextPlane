import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

const HashtagGenerator = ({ product, category, onCopy, onGenerate, loading }) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> Hashtags Inteligentes
        </label>
        <button 
          onClick={onGenerate} 
          disabled={!product || loading}
          className="text-xs text-indigo-400 font-bold hover:text-indigo-300 disabled:opacity-50 flex items-center gap-1 transition-colors"
        >
          {loading ? (
            <><Loader2 size={12} className="animate-spin" /> Analizando...</>
          ) : (
            <><Sparkles size={12} /> Generar Tags</>
          )}
        </button>
      </div>
      
      <div className="bg-slate-900/50 p-4 rounded-xl border border-dashed border-slate-700 min-h-[80px] relative group hover:border-indigo-500/30 transition-colors">
        <p className="text-xs text-slate-600 italic mb-2 text-center mt-2 select-none" id="hashtag-placeholder">
           {loading ? "Gemini está analizando tendencias..." : "Los hashtags optimizados aparecerán aquí"}
        </p>
        <div id="hashtag-result" className="flex flex-wrap gap-2 justify-center"></div>
      </div>
    </div>
  );
};

export default HashtagGenerator;
