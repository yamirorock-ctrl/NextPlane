import React from 'react';
import { Instagram, Facebook, Music, MessageCircle, Check } from 'lucide-react';

const PlatformSelector = ({ platforms, onToggle }) => {
  const options = [
    { id: 'instagram', label: 'Instagram', icon: <Instagram size={18} />, color: 'text-pink-500', bg: 'bg-pink-500/10 border-pink-500/20' },
    { id: 'facebook', label: 'Facebook Page', icon: <Facebook size={18} />, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
    // { id: 'tiktok', label: 'TikTok', icon: <Music size={18} />, color: 'text-black dark:text-white' }, // Future
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} />, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
  ];

  return (
    <div className="glass-panel p-4 rounded-xl mb-6 animate-fade-in-up">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
        Destinos de Publicación
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = platforms[opt.id];
          return (
            <button
              key={opt.id}
              onClick={() => onToggle(opt.id)}
              className={`
                relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 border
                ${isActive 
                  ? 'bg-slate-800 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                  : 'bg-slate-900/50 border-slate-700/50 hover:bg-slate-800'
                }
              `}
            >
              <div className={`p-1.5 rounded-md ${opt.bg} ${opt.color}`}>
                {opt.icon}
              </div>
              <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>
                {opt.label}
              </span>
              
              {/* Toggle Status Indicator */}
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center ml-2 transition-all
                ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-600'}
              `}>
                <Check size={12} className={`transition-transform ${isActive ? 'scale-100' : 'scale-0'}`} />
              </div>
              
              {isActive && (
                 <span className="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-indigo-500 to-transparent opacity-50"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PlatformSelector;
