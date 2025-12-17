import React, { useRef, useState, useEffect } from 'react';
import { X, Check, Sliders, Image as ImageIcon, RotateCw, Save } from 'lucide-react';

const FILTERS = [
  { name: 'Normal', filter: 'none' },
  { name: 'Vivid', filter: 'saturate(1.5) contrast(1.1)' },
  { name: 'Noir', filter: 'grayscale(1) contrast(1.2)' },
  { name: 'Warm', filter: 'sepia(0.3) saturate(1.2)' },
  { name: 'Cool', filter: 'hue-rotate(180deg) opacity(0.8)' }, // Just an example
  { name: 'Vintage', filter: 'sepia(0.5) contrast(0.8) brightness(1.1)' },
];

const ImageEditor = ({ imageUrl, onSave, onClose }) => {
  const canvasRef = useRef(null);
  const [filter, setFilter] = useState(FILTERS[0]);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load image onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setLoading(true);
    setError(null);

    const img = new Image();
    
    // Attempt 1: With CORS (for export)
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      draw(img);
      setLoading(false);
    };

    img.onerror = () => {
       console.warn("CORS error or invalid image. Trying fallback...");
       // Attempt 2: Without CORS (might prevent saving)
       const imgFallback = new Image();
       imgFallback.src = imageUrl;
       
       imgFallback.onload = () => {
         canvas.width = imgFallback.width;
         canvas.height = imgFallback.height;
         draw(imgFallback);
         setLoading(false);
         // Note: toBlob might fail later if CORS header is missing
       };
       
       imgFallback.onerror = (e) => {
         console.error("Image load failed", e);
         setLoading(false);
         setError("No se pudo cargar la imagen para editar. Verifica que sea un archivo de imagen válido.");
       };
    };
  }, [imageUrl]);

  // Redraw when settings change
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    img.onload = () => {
      draw(img);
    };
  }, [filter, brightness, contrast, saturation]);

  const draw = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Apply filters
    const filterString = `
      brightness(${brightness}%) 
      contrast(${contrast}%) 
      saturate(${saturation}%) 
      ${filter.filter !== 'none' ? filter.filter : ''}
    `.trim();
    
    ctx.filter = filterString;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    canvas.toBlob((blob) => {
      const file = new File([blob], "edited-image.jpg", { type: "image/jpeg" });
      onSave(file);
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-slate-900 w-full max-w-4xl rounded-3xl border border-slate-800 flex flex-col md:flex-row overflow-hidden shadow-2xl h-[80vh]">
        
        {/* Canvas Area */}
        <div className="flex-1 bg-black/50 flex items-center justify-center p-8 relative">
           {loading && <div className="absolute inset-0 flex items-center justify-center text-white">Cargando imagen...</div>}
           {error && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-black/80 z-10 p-4 text-center">
                <span className="text-4xl mb-2">😢</span>
                <p>{error}</p>
             </div>
           )}
           <canvas 
             ref={canvasRef} 
             className="max-w-full max-h-full object-contain shadow-2xl border border-slate-800"
           />
           <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-red-500/20 text-white hover:text-red-400 rounded-full transition-colors">
              <X size={20} />
           </button>
        </div>

        {/* Controls */}
        <div className="w-full md:w-80 bg-slate-950 p-6 border-l border-slate-800 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h3 className="text-white font-bold flex items-center gap-2 mb-4">
              <Sliders size={18} className="text-indigo-400" /> Ajustes
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Brillo</span>
                  <span>{brightness}%</span>
                </div>
                <input 
                  type="range" min="50" max="150" value={brightness} 
                  onChange={(e) => setBrightness(e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Contraste</span>
                  <span>{contrast}%</span>
                </div>
                <input 
                  type="range" min="50" max="150" value={contrast} 
                  onChange={(e) => setContrast(e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Saturación</span>
                  <span>{saturation}%</span>
                </div>
                <input 
                  type="range" min="0" max="200" value={saturation} 
                  onChange={(e) => setSaturation(e.target.value)}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
             <h3 className="text-white font-bold flex items-center gap-2 mb-4">
              <ImageIcon size={18} className="text-indigo-400" /> Filtros
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {FILTERS.map(f => (
                <button
                  key={f.name}
                  onClick={() => setFilter(f)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all ${filter.name === f.name ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-auto pt-6 border-t border-slate-900">
             <button 
               onClick={handleSave}
               className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/20"
             >
               <Save size={18} /> Guardar Cambios
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
