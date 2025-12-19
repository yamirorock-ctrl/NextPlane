import React from 'react';

const MediaPreview = ({ src, className, alt = "Preview" }) => {
  if (!src) return null;

  const isVideo = src.match(/\.(mp4|webm|mov|ogg)$/i) || src.includes('video');

  if (isVideo) {
    return (
      <video 
        src={src} 
        className={className} 
        muted 
        playsInline
        onMouseOver={e => e.target.play()}
        onMouseOut={e => {
            e.target.pause();
            e.target.currentTime = 0;
        }}
      />
    );
  }

  return <img src={src} alt={alt} className={className} />;
};

export default MediaPreview;
