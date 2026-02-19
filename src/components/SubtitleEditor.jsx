import React, { useState, useEffect } from 'react';
import { Type, Clock, Plus, Trash2, GripVertical, CheckCircle2 } from 'lucide-react';

const SubtitleEditor = ({ initialText, audioDuration, onSubtitlesChange }) => {
  const [segments, setSegments] = useState([]);

  // Auto-generate segments from text on load or text change
  useEffect(() => {
      if (!initialText) return;
      
      // Split by newlines or punctuation if typically formatted
      // Simple logic: Split by lines first
      const lines = initialText.split(/\n+/).filter(l => l.trim().length > 0);
      
      // Calculate estimated time per segment
      const totalDuration = audioDuration || (lines.length * 3); // Default 3s per line if no audio
      const timePerLine = totalDuration / lines.length;

      const newSegments = lines.map((text, idx) => ({
          id: idx,
          text: text.trim(),
          start: idx * timePerLine,
          end: (idx + 1) * timePerLine
      }));

      setSegments(newSegments);
      onSubtitlesChange(newSegments);
  }, [initialText, audioDuration]); // dependency on initialText implies reset if upstream changes significantly

  const updateSegment = (id, field, value) => {
      const newSegments = segments.map(s => s.id === id ? { ...s, [field]: value } : s);
      setSegments(newSegments);
      onSubtitlesChange(newSegments);
  };

  const addSegment = () => {
      const last = segments[segments.length - 1];
      const newSeg = {
          id: Date.now(),
          text: "Nueva línea...",
          start: last ? last.end : 0,
          end: last ? last.end + 2 : 2
      };
      const newSegments = [...segments, newSeg];
      setSegments(newSegments);
      onSubtitlesChange(newSegments);
  };

  const removeSegment = (id) => {
      const newSegments = segments.filter(s => s.id !== id);
      setSegments(newSegments);
      onSubtitlesChange(newSegments);
  };

  // Helper to format s to mm:ss
  const fmt = (s) => {
      const m = Math.floor(s / 60);
      const dec = Math.floor(s % 60);
      return `${m}:${dec < 10 ? '0' : ''}${dec}`;
  };

  return (
    <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 space-y-4">
        <div className="flex items-center justify-between border-b border-indigo-500/10 pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Type size={16} className="text-emerald-400" /> Editor de Subtítulos
            </h3>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                {segments.length} líneas • {fmt(audioDuration || 0)}s
            </span>
        </div>

        <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
            {segments.map((seg, idx) => (
                <div key={seg.id} className="group flex items-start gap-2 bg-slate-900/40 hover:bg-slate-900/60 p-2 rounded-lg border border-transparent hover:border-indigo-500/30 transition-all">
                    <div className="mt-2 cursor-grab text-slate-600 hover:text-slate-400">
                        <GripVertical size={14} />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                        <textarea 
                            value={seg.text}
                            onChange={(e) => updateSegment(seg.id, 'text', e.target.value)}
                            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none resize-none font-medium leading-relaxed overflow-hidden"
                            rows={Math.max(1, Math.ceil(seg.text.length / 40))}
                        />
                        <div className="flex items-center gap-2">
                            <Clock size={10} className="text-slate-500" />
                            <input 
                                type="number" 
                                value={seg.start.toFixed(1)} 
                                onChange={(e) => updateSegment(seg.id, 'start', parseFloat(e.target.value))}
                                className="w-12 bg-slate-800 text-[9px] text-slate-300 rounded px-1 text-center focus:ring-1 ring-indigo-500 outline-none"
                            />
                            <span className="text-[9px] text-slate-500">-</span>
                            <input 
                                type="number" 
                                value={seg.end.toFixed(1)} 
                                onChange={(e) => updateSegment(seg.id, 'end', parseFloat(e.target.value))}
                                className="w-12 bg-slate-800 text-[9px] text-slate-300 rounded px-1 text-center focus:ring-1 ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={() => removeSegment(seg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-all"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
            ))}
        </div>

        <button 
            onClick={addSegment}
            className="w-full py-2 border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl text-xs font-bold text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-2 transition-all"
        >
            <Plus size={14} /> Añadir Línea de Subtítulo
        </button>
    </div>
  );
};

export default SubtitleEditor;
