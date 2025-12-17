import React from 'react';
import { Layout, CheckCircle2 } from 'lucide-react';

const PageSelector = ({ pages, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Layout className="text-blue-500" /> Selecciona tu Página
        </h3>
        <p className="text-slate-400 mb-6 font-light">
          Elige la página de Facebook donde quieres publicar tu contenido.
        </p>
        
        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => onSelect(page)}
              className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-800/50 hover:bg-blue-600/10 hover:border-blue-500/50 transition-all group flex items-center justify-between"
            >
              <span className="font-bold text-slate-200 group-hover:text-blue-300 transition-colors">
                {page.name}
              </span>
              <CheckCircle2 size={18} className="text-slate-700 group-hover:text-blue-500 transition-colors" />
            </button>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default PageSelector;
