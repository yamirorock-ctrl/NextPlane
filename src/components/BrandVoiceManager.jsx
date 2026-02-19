import React, { useState, useEffect } from 'react';
import { Sparkles, Save, Trash2, Plus, X, User, MessageSquare } from 'lucide-react';

const BrandVoiceManager = ({ isOpen, onClose, onSelectPreset }) => {
  const [presets, setPresets] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPreset, setCurrentPreset] = useState({ name: '', instructions: '' });

  // Load presets on mount
  useEffect(() => {
    const loaded = JSON.parse(localStorage.getItem('ai_presets') || '[]');
    setPresets(loaded);
  }, [isOpen]);

  const handleSave = () => {
    if (!currentPreset.name || !currentPreset.instructions) return alert("Completa ambos campos");

    const newPresets = [...presets];
    const existingIndex = newPresets.findIndex(p => p.name === currentPreset.name);

    if (existingIndex >= 0) {
      newPresets[existingIndex] = currentPreset;
    } else {
      newPresets.push(currentPreset);
    }

    localStorage.setItem('ai_presets', JSON.stringify(newPresets));
    setPresets(newPresets);
    setIsEditing(false);
    setCurrentPreset({ name: '', instructions: '' });
  };

  const handleDelete = (name) => {
    const newPresets = presets.filter(p => p.name !== name);
    localStorage.setItem('ai_presets', JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  const handleSelect = (preset) => {
    onSelectPreset(preset);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
           <h2 className="text-xl font-black text-white flex items-center gap-2">
             <User className="text-indigo-400" /> Personalidades de Marca
           </h2>
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
             <X size={20} />
           </button>
        </div>

        <div className="p-6 h-[400px] overflow-y-auto custom-scrollbar">
            
            {/* Creates New / Edit Form */}
            {isEditing ? (
              <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Nombre del Tono</label>
                    <input 
                      autoFocus
                      type="text" 
                      className="glass-input w-full mt-1" 
                      placeholder="Ej: Amigo Entusiasta"
                      value={currentPreset.name}
                      onChange={e => setCurrentPreset({...currentPreset, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase">Instrucciones para la IA</label>
                    <textarea 
                      className="glass-input w-full h-32 mt-1 resize-none leading-relaxed" 
                      placeholder="Ej: Usa emojis de fuego y cohetes. Sé muy directo y persuasivo. Trata al lector de 'tú'. No uses palabras muy técnicas..."
                      value={currentPreset.instructions}
                      onChange={e => setCurrentPreset({...currentPreset, instructions: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-2 rounded-xl text-slate-400 font-bold hover:bg-white/5 transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">Guardar Voz</button>
                  </div>
              </div>
            ) : (
              // List View
              <div className="space-y-3">
                 <button 
                    onClick={() => { setCurrentPreset({name: '', instructions: ''}); setIsEditing(true); }}
                    className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 font-bold transition-all group mb-4"
                 >
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus size={16} />
                    </div>
                    Crear Nueva Voz
                 </button>

                 {presets.length === 0 && (
                   <p className="text-center text-slate-500 text-sm py-8">No tienes personalidades guardadas.</p>
                 )}

                 {presets.map((preset, idx) => (
                   <div key={idx} className="group flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-2xl border border-white/5 transition-all">
                      <div className="flex items-start gap-3 cursor-pointer flex-1" onClick={() => handleSelect(preset)}>
                          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                              <Sparkles size={16} className="text-white" />
                          </div>
                          <div>
                             <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{preset.name}</h4>
                             <p className="text-xs text-slate-400 line-clamp-1">{preset.instructions}</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => { setCurrentPreset(preset); setIsEditing(true); }}
                            className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
                          >
                             <MessageSquare size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(preset.name)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400"
                          >
                             <Trash2 size={16} />
                          </button>
                      </div>
                   </div>
                 ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BrandVoiceManager;
