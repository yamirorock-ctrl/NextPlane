import React, { useState, useEffect } from 'react';
import { instagramService } from '../services/social/instagram';
import { Calendar, Instagram, LayoutGrid, Clock, Eye } from 'lucide-react';

const GridPreview = ({ accessToken, instagramId, scheduledPosts }) => {
    const [existingMedia, setExistingMedia] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMedia = async () => {
            if (accessToken && instagramId) {
                setLoading(true);
                const media = await instagramService.getRecentMedia(accessToken, instagramId, 12);
                setExistingMedia(media);
                setLoading(false);
            }
        };
        fetchMedia();
    }, [accessToken, instagramId]);

    // Combinar programados (futuro) con existentes (pasado)
    // Los programados van al principio porque son lo que "vendrá"
    const instagramScheduled = scheduledPosts?.filter(p => p.platform === 'instagram' && p.status === 'scheduled') || [];
    
    // Ordenar programados por fecha (los más cercanos arriba)
    const sortedScheduled = [...instagramScheduled].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <LayoutGrid className="text-pink-500" size={24} />
                        Planificador de Feed
                    </h3>
                    <p className="text-slate-400 text-sm">Visualiza la estética de tu perfil antes de publicar.</p>
                </div>
                <div className="flex items-center gap-2 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">
                    <Instagram size={14} className="text-pink-400" />
                    <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider tabular-nums">@{existingMedia[0]?.username || 'perfil'}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1 md:gap-2 max-w-[500px] mx-auto bg-slate-950 p-2 rounded-2xl border border-white/5 shadow-2xl">
                {/* 1. Muestra los posts PROGRAMADOS (con badge especial) */}
                {sortedScheduled.map((post, idx) => (
                    <div key={`sched-${idx}`} className="relative aspect-square group overflow-hidden rounded-lg cursor-pointer border-2 border-indigo-500/50">
                        <img 
                            src={post.image_url} 
                            alt="Scheduled" 
                            className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center opacity-100 group-hover:bg-indigo-900/20 transition-all">
                            <div className="flex flex-col items-center">
                                <Clock size={20} className="text-white drop-shadow-md animate-pulse" />
                                <span className="text-[8px] font-bold text-white uppercase mt-1 px-1 bg-indigo-600 rounded">Programado</span>
                            </div>
                        </div>
                        <div className="absolute top-1 right-1">
                             <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                        </div>
                    </div>
                ))}

                {/* 2. Muestra los posts REALES de Instagram */}
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={`load-${i}`} className="aspect-square bg-slate-900 animate-pulse rounded-lg"></div>
                    ))
                ) : (
                    existingMedia.map((media) => (
                        <div key={media.id} className="relative aspect-square group overflow-hidden rounded-lg cursor-pointer">
                            <img 
                                src={media.media_type === 'VIDEO' ? media.thumbnail_url : media.media_url} 
                                alt={media.caption} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Eye size={20} className="text-white" />
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8 flex justify-center gap-6">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <div className="w-3 h-3 bg-indigo-500/50 border border-indigo-500 rounded-sm"></div>
                    Simulación
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <div className="w-3 h-3 bg-slate-800 rounded-sm"></div>
                    Publicado
                </div>
            </div>
        </div>
    );
};

export default GridPreview;
