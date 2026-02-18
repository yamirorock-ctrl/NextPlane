import React, { useState, useEffect, useMemo } from 'react';
import { 
    Pause, Play, VolumeX, Volume2, ChevronLeft, ChevronRight, Image as ImageIcon, Heart, MessageCircle, Share2, Music
} from 'lucide-react';

const PreviewPhone = ({ contentType, content, product, audio, hooks, onSlideChange }) => {
  const isVideoMode = contentType === 'video';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  // Normalize slides
  const slides = useMemo(() => {
    if (!product) return [];
    if (product.gallery && product.gallery.length > 0) return product.gallery;
    if (product.image_url) return [product.image_url];
    return [];
  }, [product]);

  // Notify parent of slide change
  useEffect(() => {
     if (onSlideChange) {
        onSlideChange(currentSlide);
     }
  }, [currentSlide, onSlideChange]);

  // Auto-advance slideshow
  useEffect(() => {
    if (slides.length <= 1 || !isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentSlide(curr => (curr + 1) % slides.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [slides, slides.length, isAutoPlay]);
  
  // Controls
  const nextSlide = () => setCurrentSlide(curr => (curr + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(curr => (curr - 1 + slides.length) % slides.length);
  
  // Get current media
  const currentMedia = slides[currentSlide];
  const isVideo = currentMedia?.endsWith('.mp4') || currentMedia?.endsWith('.webm') || (slides.length === 1 && product?.type === 'video');

  return (
    <div className="mx-auto w-[280px] h-[620px] bg-black rounded-[40px] overflow-hidden border-8 border-slate-900 shadow-2xl relative transition-all duration-300 ring-1 ring-slate-800">
      {/* Controls Overlay (Only if multiple slides) */}
      <div className="absolute top-12 right-2 z-40 flex flex-col gap-2">
         {slides.length > 1 && (
            <button 
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/10 ${isAutoPlay ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white text-slate-900 hover:bg-slate-200'}`}
              title={isAutoPlay ? "Pausar Carrusel" : "Reproducir Carrusel"}
            >
              {isAutoPlay ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            </button>
         )}
         {isVideo && (
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-lg border border-white/10 ${!isMuted ? 'bg-white text-slate-900' : 'bg-black/50 text-white'}`}
              title={isMuted ? "Activar Sonido" : "Silenciar"}
            >
              {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
         )}
      </div>

      {/* Manual Navigation Areas (Invisible tap zones) */}
      {slides.length > 1 && !isAutoPlay && (
         <>
            <div className="absolute top-1/2 left-0 w-12 h-24 -translate-y-1/2 z-30 flex items-center justify-start pl-1 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={prevSlide}>
               <div className="bg-black/20 backdrop-blur rounded-r-lg p-1"><ChevronLeft size={20} className="text-white"/></div>
            </div>
            <div className="absolute top-1/2 right-0 w-12 h-24 -translate-y-1/2 z-30 flex items-center justify-end pr-1 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" onClick={nextSlide}>
              <div className="bg-black/20 backdrop-blur rounded-l-lg p-1"><ChevronRight size={20} className="text-white"/></div>
            </div>
         </>
      )}

      {/* Dynamic Island imitation */}
      <div className="absolute top-2 w-full z-30 flex justify-center">
         <div className="w-[80px] h-[24px] bg-black rounded-full flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-900/50"></div>
         </div>
      </div>
      
      <div className={`w-full h-full relative ${isVideoMode ? (product?.imageColor?.replace('/20', '') || 'bg-slate-800') : 'bg-slate-50'} flex flex-col transition-all duration-500`}>
        
        {isVideoMode && (
          <div className="absolute top-10 left-0 w-full px-4 flex justify-between z-10 text-white/90">
            <span className="text-xs font-bold shadow-sm backdrop-blur-sm px-2 py-0.5 rounded-full bg-black/20">Live</span>
            <div className="flex gap-4 text-xs font-medium shadow-sm">
              <span className="opacity-60 text-white hover:opacity-100">Siguiendo</span>
              <span className="font-bold text-white border-b-2 border-white pb-1">Para ti</span>
            </div>
            <span className="w-4"></span>
          </div>
        )}

        {isVideoMode ? (
          <div className="flex-1 flex items-center justify-center bg-black relative">
            {product && currentMedia ? (
              isVideo ? (
                <div className="absolute inset-0 z-0 animate-in fade-in duration-500" key={currentMedia}>
                  <video 
                    src={currentMedia} 
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                  />
                   <div className="absolute inset-0 bg-black/20 z-10" />
                   <div className="relative z-20 pt-32 px-4 text-center">
                    <h2 className="text-4xl font-black text-white leading-none uppercase drop-shadow-2xl tracking-tighter mb-4 shadow-black">{product.name}</h2>
                  </div>
                </div>
              ) : (
                // Fallback for when "video" mode is on but product is an image (static video background)
                <div className="absolute inset-0 z-0 animate-in fade-in duration-500" key={currentMedia}>
                  <div className="absolute inset-0 bg-black/40 z-10" />
                  <img 
                    src={currentMedia} 
                    alt={product.name} 
                    className="w-full h-full object-cover animate-ken-burns"
                  />
                  <div className="relative z-20 pt-32 px-4 text-center">
                    <h2 className="text-4xl font-black text-white leading-none uppercase drop-shadow-2xl tracking-tighter mb-4 shadow-black">{product.name}</h2>
                    <div className="bg-white/90 text-black px-4 py-2 rounded-full font-bold shadow-2xl inline-block transform hover:scale-105 transition-transform">
                      Solo ${product.price}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <p className="text-white/50 font-medium">Selecciona producto...</p>
            )}
            
            {/* Carousel Indicators for Video Mode */}
            {slides.length > 1 && (
               <div className="absolute bottom-32 w-full flex justify-center gap-1.5 z-20">
                  {slides.map((_, idx) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all ${currentSlide === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
                  ))}
               </div>
            )}

            {hooks && (
              <div className="absolute top-24 w-full px-4 animate-in slide-in-from-top-4 duration-500">
                <div className="bg-red-600/90 backdrop-blur text-white text-sm font-bold py-2 px-4 rounded-lg shadow-xl transform rotate-1 inline-block border border-white/20">
                  {hooks}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col pt-12 overflow-y-auto no-scrollbar bg-white">
            <div className="flex items-center justify-between px-4 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">V</div>
                <span className="text-xs font-bold text-gray-900">Next Plane.Oficial</span>
              </div>
              <span className="text-gray-400 font-bold">•••</span>
            </div>
            
            {/* Carousel Container for Photo Mode */}
            <div className={`w-full aspect-square bg-gray-100 flex items-center justify-center mb-3 relative overflow-hidden group`}>
               {product && currentMedia ? (
                 isVideo ? (
                    <video src={currentMedia} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                 ) : (
                    <img src={currentMedia} alt={product.name} className="w-full h-full object-cover" />
                 )
               ) : (
                 <div className="text-center z-10">
                    <ImageIcon size={48} className="text-gray-400 mx-auto mb-2" />
                    <p className="font-bold text-gray-600">{product?.name || "Producto"}</p>
                 </div>
               )}
               
               {/* Photo Mode Dots */}
               {slides.length > 1 && (
                 <div className="absolute bottom-2 w-full flex justify-center gap-1.5 z-10">
                    {slides.map((_, idx) => (
                      <div key={idx} className={`h-1.5 rounded-full transition-all shadow-sm ${currentSlide === idx ? 'w-4 bg-indigo-500' : 'w-1.5 bg-white/60'}`} />
                    ))}
                 </div>
               )}
            </div>

            <div className="px-4 mb-3 flex gap-4 text-gray-800">
               <Heart size={22} className="hover:text-red-500 transition-colors" />
               <MessageCircle size={22} className="hover:text-blue-500 transition-colors" />
               <Share2 size={22} className="hover:text-green-500 transition-colors" />
            </div>
            
            {/* Scrollable Text Area for Photo Mode */}
            <div className="px-4 pb-4 overflow-y-auto max-h-[220px] custom-scrollbar">
               <p className="text-xs font-bold mb-1">1,240 Me gusta</p>
               <p className="text-xs text-gray-800 leading-snug">
                 <span className="font-bold mr-1">Next Plane.Oficial</span>
                 {hooks && <span className="font-semibold block mb-1">{hooks}</span>}
                 {content || "Escribe tu copy..."} <span className="text-indigo-600">#viral #tienda</span>
               </p>
            </div>
          </div>
        )}

        {isVideoMode && (
          <div className="absolute bottom-24 right-2 flex flex-col gap-5 items-center z-10">
            <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-white overflow-hidden shadow-lg">
               <div className="w-full h-full bg-linear-to-tr from-indigo-500 to-purple-600"></div>
            </div>
            <div className="flex flex-col items-center gap-1 drop-shadow-md">
              <Heart size={30} className="text-white fill-white transition-transform active:scale-75" />
              <span className="text-[10px] text-white font-bold">12.5K</span>
            </div>
            <div className="flex flex-col items-center gap-1 drop-shadow-md">
              <MessageCircle size={28} className="text-white fill-white/10" />
              <span className="text-[10px] text-white font-bold">482</span>
            </div>
            <div className="flex flex-col items-center gap-1 drop-shadow-md">
              <Share2 size={28} className="text-white fill-white/10" />
              <span className="text-[10px] text-white font-bold">Share</span>
            </div>
          </div>
        )}

        {isVideoMode && (
          <div className=" absolute bottom-0 w-full p-4 bg-linear-to-t from-black via-black/60 to-transparent pt-16 z-10 text-white text-left">
            <div className="flex items-center gap-2 mb-2">
               <p className="font-bold text-sm text-shadow-sm">@NextPlane.Oficial</p>
               <span className="bg-indigo-500 text-white text-[9px] font-bold px-1 rounded-sm">SEGUIR</span>
            </div>
            <p className="text-xs leading-snug pr-12 line-clamp-4 opacity-90 mb-3 overflow-y-auto max-h-[100px] no-scrollbar">
              {content || "Escribe tu copy..."} <span className="font-bold">#viral #tienda</span>
            </p>
            {audio && (
              <div className="flex items-center gap-2">
                <div className="animate-spin-slow bg-slate-900 rounded-full p-1 border border-white/20">
                  <Music size={10} />
                </div>
                <div className="flex items-center gap-1 overflow-hidden">
                   <div className="text-xs w-32 truncate opacity-90 animate-marquee whitespace-nowrap">{audio}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPhone;
