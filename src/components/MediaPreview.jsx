import React from 'react';

const MediaPreview = ({ src, className, alt = "Preview", animate = false, overlayText = null }) => {
  if (!src) return null;

  const isVideo = src.match(/\.(mp4|webm|mov|ogg)$/i) || src.includes('video');

  if (isVideo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
          <video 
            src={src} 
            className="w-full h-full object-cover" 
            muted 
            playsInline
            loop
            autoPlay={animate} // Auto-play if preview mode
            onMouseOver={e => !animate && e.target.play()} // Only hover play if not already playing
            onMouseOut={e => {
                if(!animate) {
                    e.target.pause();
                    e.target.currentTime = 0;
                }
            }}
          />
          {overlayText && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                 <h2 className="text-white font-black text-center text-2xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-in zoom-in duration-700 bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                    {overlayText}
                 </h2>
             </div>
          )}
      </div>
    );
  }

  // Image Handling with Ken Burns & Overlay
  return (
    <div className={`relative overflow-hidden ${className}`}>
        <img 
            src={src} 
            alt={alt} 
            className={`w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${animate ? 'scale-125 translate-x-3 translate-y-3' : ''}`} 
        />
        
        {/* Animated Overlay Layers (Only if animating) */}
        {animate && (
            <>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
                
                {/* Text Hook Overlay */}
                {overlayText && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                         <h2 className="text-white font-black text-center text-3xl uppercase tracking-tighter drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-10 fade-in duration-1000 delay-300 leading-tight">
                            <span className="bg-indigo-600 px-2 box-decoration-clone leading-[1.4] pb-1 shadow-lg">
                                {overlayText}
                            </span>
                         </h2>
                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default MediaPreview;
