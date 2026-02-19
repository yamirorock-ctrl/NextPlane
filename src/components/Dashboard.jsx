import React, { useState } from 'react';
import { 
    Calendar, Zap, Trash2, Sparkles, RefreshCw, Facebook, Instagram, 
    ArrowRight, TrendingUp, MessageCircle, Plus, LayoutDashboard 
} from 'lucide-react';
import MediaPreview from './MediaPreview';

// Helper for greeting based on time
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
};

const StatCard = ({ title, value, subtext, icon: Icon, color, trend, breakdown }) => (
    <div className="glass-card p-6 relative overflow-hidden group flex flex-col justify-between h-full">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-all duration-500 group-hover:scale-110 ${color}`}></div>
        <div className="relative z-10">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                {Icon && <Icon size={14} className="opacity-70" />}
                {title}
            </h3>
            <p className="text-3xl font-black text-white tracking-tight">{value}</p>
            <div className="flex items-center gap-2 mt-2 mb-2">
                {trend && (
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                        <TrendingUp size={8} /> {trend}
                    </span>
                )}
                <p className="text-xs text-slate-500 font-medium">{subtext}</p>
            </div>
        </div>
        
        {breakdown && (
             <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-start gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                 <div className="flex items-center gap-1.5" title="Facebook">
                    <Facebook size={12} className="text-blue-500" />
                    <span>{new Intl.NumberFormat('es-MX', { notation: "compact" }).format(breakdown.fb || 0)}</span>
                 </div>
                 <div className="h-3 w-px bg-white/10"></div>
                 <div className="flex items-center gap-1.5" title="Instagram">
                    <Instagram size={12} className="text-pink-500" />
                    <span>{new Intl.NumberFormat('es-MX', { notation: "compact" }).format(breakdown.ig || 0)}</span>
                 </div>
             </div>
        )}
    </div>
);

const QuickAction = ({ icon: Icon, label, desc, onClick, colorClass }) => (
    <button 
        onClick={onClick}
        className="group relative flex items-center p-4 gap-4 rounded-2xl border border-white/5 bg-slate-800/40 hover:bg-slate-800/80 transition-all duration-300 text-left overflow-hidden"
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 shadow-lg ${colorClass}`}>
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{label}</h4>
            <p className="text-xs text-slate-400">{desc}</p>
        </div>
        <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
            <ArrowRight size={16} className="text-slate-500" />
        </div>
    </button>
);

const Dashboard = ({ posts, stats, onNewPost, onRelaunch, onDelete, onRestore, onEmptyTrash, onViewChange }) => {
  const [view, setView] = useState('active'); // 'active' | 'trash'
  const activePosts = posts.filter(p => !p.deleted_at);
  const trashPosts = posts.filter(p => p.deleted_at);

  // Real Stats
  const followers = stats?.followers || 0;
  const impressions = stats?.impressions || 0;
  const engagement = stats?.engagement || 0;
  // engagementRate calculation can be tricky with day-trend data, but let's approximate
  const engagementRate = impressions > 0 ? ((engagement / impressions) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="space-y-8 animate-fade-in-up pb-20">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-white via-indigo-200 to-slate-400">
                    {getGreeting()}, Creador.
                </h1>
                <p className="text-slate-400 text-sm mt-1">Aquí tienes el resumen de tu imperio viral.</p>
            </div>
            {stats && (
                <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur px-4 py-2 rounded-2xl border border-white/5">
                    {stats.picture && <img src={stats.picture} alt="Page" className="w-8 h-8 rounded-full border border-indigo-500/30" />}
                    <div className="text-right">
                         <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest">Estado</span>
                         <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                             <span className="relative flex h-2 w-2">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                             </span>
                             Conectado
                         </span>
                    </div>
                </div>
            )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
                title="Programados" 
                value={activePosts.filter(p => p.status === 'scheduled').length} 
                subtext="Posts en cola" 
                icon={Calendar}
                color="bg-indigo-500"
                trend="Activo"
            />
            <StatCard 
                title="Alcance (28d)" 
                value={new Intl.NumberFormat('es-MX', { notation: "compact" }).format(impressions)} 
                subtext="Impresiones totales" 
                icon={TrendingUp}
                color="bg-purple-500"
                trend={impressions > 0 ? "+Hoy" : "Sin datos"}
                breakdown={{ 
                    fb: stats?.breakdown?.fb?.impressions || 0,
                    ig: stats?.breakdown?.ig?.impressions || 0
                }}
            />
            <StatCard 
                title="Engagement" 
                value={new Intl.NumberFormat('es-MX', { notation: "compact" }).format(engagement)}
                subtext={`Tasa: ${engagementRate}`}
                icon={Zap}
                color="bg-amber-500"
                breakdown={{ 
                    fb: stats?.breakdown?.fb?.engagement || 0,
                    ig: stats?.breakdown?.ig?.reach || 0 // Using Reach as proxy/placeholder or 0 if explicitly wanted strictly engagement
                }}
            />
            <StatCard 
                title="Seguidores" 
                value={new Intl.NumberFormat('es-MX', { notation: "compact" }).format(followers)}
                subtext="Comunidad total" 
                icon={MessageCircle}
                color="bg-emerald-500"
                breakdown={{ 
                    fb: stats?.breakdown?.fb?.followers || stats?.breakdown?.fb?.fan_count || 0,
                    ig: stats?.breakdown?.ig?.followers || 0
                }}
            />
            {/* Quick Action in Grid */}
            <button 
                onClick={onNewPost}
                className="glass-card p-6 flex flex-col items-center justify-center gap-3 border-dashed border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all group cursor-pointer text-center"
            >
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus size={20} className="text-indigo-400" />
                </div>
                <span className="text-sm font-bold text-indigo-300">Nuevo Post Rápido</span>
            </button>
        </div>

        {/* Main Content Area: Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Post Feed */}
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <LayoutDashboard size={20} className="text-indigo-500" />
                        Feed de Actividad
                    </h2>
                    
                    {/* View Switcher */}
                    <div className="flex p-1 bg-slate-900/80 rounded-lg border border-white/5">
                        <button 
                            onClick={() => setView('active')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'active' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Activos
                        </button>
                        <button 
                            onClick={() => setView('trash')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${view === 'trash' ? 'bg-red-900/30 text-red-400' : 'text-slate-400 hover:text-red-400'}`}
                        >
                            Papelera
                        </button>
                    </div>
                </div>

                {/* Post List */}
                <div className="glass-panel rounded-3xl overflow-hidden min-h-[400px]">
                    {(view === 'active' ? activePosts : trashPosts).length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-60">
                            <Sparkles size={48} className="text-slate-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-300">Tu agenda está vacía</h3>
                            <p className="text-sm text-slate-500 max-w-xs mx-auto">
                                El momento perfecto para crear contenido viral es ahora.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                             {(view === 'active' ? activePosts : trashPosts).map((post, idx) => (
                                <div key={idx} className="p-4 flex gap-4 hover:bg-white/5 transition-colors group">
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-white/5 relative">
                                        {post.image ? (
                                            <MediaPreview src={post.image} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-indigo-500">
                                                <Zap size={20} />
                                            </div>
                                        )}
                                        {/* Platform Icon Badge */}
                                        <div className="absolute bottom-0 right-0 p-1 bg-black/60 backdrop-blur-sm rounded-tl-lg">
                                            {post.platform === 'instagram' ? <Instagram size={10} /> : <Facebook size={10} />}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-white truncate pr-4">{post.product?.name || 'Post Genérico'}</h4>
                                            <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-white/5">
                                                {new Date(post.scheduled_date || Date.now()).toLocaleDateString([], {day:'2-digit', month:'short'})}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 truncate mt-1 max-w-[90%] opacity-80">{post.caption}</p>
                                    </div>

                                    {/* Actions (Hover) */}
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-center px-2">
                                        {view === 'active' ? (
                                            <button onClick={() => onDelete(post)} className="text-slate-500 hover:text-red-400 transition-colors" title="Papelera">
                                                <Trash2 size={16} />
                                            </button>
                                        ) : (
                                            <button onClick={() => onRestore(post)} className="text-slate-500 hover:text-emerald-400 transition-colors" title="Restaurar">
                                                <RefreshCw size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                             ))}
                        </div>
                    )}
                </div>
                
                {view === 'trash' && trashPosts.length > 0 && (
                     <div className="flex justify-end">
                        <button onClick={onEmptyTrash} className="text-xs font-bold text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-500/20">
                            Vaciar Papelera ({trashPosts.length})
                        </button>
                     </div>
                )}
            </div>

            {/* Right Column: Widgets */}
            <div className="space-y-6">
                
                {/* Coming Soon / Pro Tips */}
                <div className="glass-card p-6 bg-linear-to-br from-indigo-900/20 to-slate-900/40">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            <Sparkles size={16} />
                        </div>
                        <h3 className="font-bold text-white">Consejo Viral</h3>
                    </div>
                    <p className="text-sm text-indigo-200/80 leading-relaxed italic">
                        "Los carrusels en Instagram tienen un 20% más de engagement los fines de semana. ¡Prueba crear uno hoy!"
                    </p>
                </div>

                {/* Mini Calendar Snapshot */}
                <div className="glass-card p-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Próximos Eventos</h3>
                    <div className="space-y-3">
                         {[1,2,3].map(i => (
                             <div key={i} className="flex gap-3 items-center opacity-50">
                                 <div className="w-10 text-center">
                                     <span className="block text-xs font-bold text-slate-500">FEB</span>
                                     <span className="block text-lg font-black text-slate-300">{18+i}</span>
                                 </div>
                                 <div className="h-8 w-px bg-slate-800"></div>
                                 <div>
                                     <div className="h-2 w-24 bg-slate-800 rounded mb-1"></div>
                                     <div className="h-2 w-16 bg-slate-800 rounded"></div>
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>

            </div>

        </div>
    </div>
  );
};

export default Dashboard;
