import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { analyzeBrandVoice } from '../services/ai';

const BrandVoiceTrainer = () => {
    const [presets, setPresets] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('ai_presets') || '[]');
        setPresets(stored);
    }, []);

    const handleAnalyze = async (e) => {
        const text = document.getElementById('voice-samples').value;
        if (!text || text.length < 50) return alert("Pega al menos 50 caracteres para analizar.");

        setAnalyzing(true);
        try {
            const analysis = await analyzeBrandVoice(text);
            
            const newPreset = {
                id: Date.now(),
                name: "Mi Voz (Auto)",
                text: analysis.system_instruction,
                analysis: analysis // Store full analysis for display
            };
            
            const newPresets = [...presets, newPreset];
            setPresets(newPresets);
            localStorage.setItem('ai_presets', JSON.stringify(newPresets));

            alert(`¡Análisis Completado!\n\nTono: ${analysis.tone_description}\nEmojis: ${analysis.emoji_style}`);
            document.getElementById('voice-samples').value = ''; // Clear
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDelete = (id) => {
        if(confirm("¿Borrar este perfil?")) {
            const newPresets = presets.filter(p => p.id !== id);
            setPresets(newPresets);
            localStorage.setItem('ai_presets', JSON.stringify(newPresets));
        }
    };

    return (
        <div className="h-full p-6 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-3 rounded-full">
                            <Sparkles className="text-indigo-400" size={32} />
                        </div>
                        Entrenador de Voz
                    </h2>
                    <p className="text-slate-400 mt-2 text-lg">
                        Enséñale a la IA tu estilo único para que escriba exactamente como tú.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Input Area */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                        <h3 className="text-xl font-bold text-white mb-4">1. Sube tu Contenido</h3>
                        <p className="text-slate-400 text-sm mb-4">
                            Pega aquí tus mejores captions, tweets o correos antiguos. Cuanto más texto, mejor nos entenderá.
                        </p>
                        <textarea
                            id="voice-samples"
                            placeholder="Ej: '¡Hola a todos! Se viene algo increíble...' (Pega varios ejemplos)"
                            className="w-full h-64 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none mb-4 custom-scrollbar resize-none font-mono text-sm leading-relaxed"
                        ></textarea>
                        
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="w-full py-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {analyzing ? (
                                <>Analizando Patrones...</>
                            ) : (
                                <><Sparkles size={20} /> Analizar y Crear Perfil</>
                            )}
                        </button>
                    </div>

                    {/* Right: Active Profiles */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                            <h3 className="text-xl font-bold text-white mb-4">2. Perfiles Activos</h3>
                            {presets.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <Sparkles size={48} className="mx-auto mb-4 text-slate-600"/>
                                    <p className="text-slate-500">No tienes perfiles entrenados aún.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {presets.map(preset => (
                                        <div key={preset.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl hover:border-indigo-500/50 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-white text-lg">{preset.name}</h4>
                                                <button onClick={() => handleDelete(preset.id)} className="text-slate-500 hover:text-red-400 text-xs">Borrar</button>
                                            </div>
                                            {preset.analysis && (
                                                <div className="flex gap-2 flex-wrap mb-3">
                                                    <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-1 rounded border border-indigo-500/20">
                                                        {preset.analysis.tone_description ? preset.analysis.tone_description.substring(0, 30) + '...' : 'Estilo personalizado'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="text-xs text-slate-500 bg-slate-900 p-3 rounded-lg font-mono line-clamp-3">
                                                {preset.text}
                                            </div>
                                            <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                                <CheckCircle2 size={14} /> Listo para usar
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrandVoiceTrainer;
