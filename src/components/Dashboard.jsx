import React, { useState } from 'react';
import { 
    Calendar, Zap, Trash2, Sparkles, RefreshCw, Facebook, Instagram 
} from 'lucide-react';
import MediaPreview from './MediaPreview';

const Dashboard = ({ posts, onRelaunch, onDelete, onRestore, onEmptyTrash }) => {
  const [view, setView] = useState('active'); // 'active' | 'trash'

  const activePosts = posts.filter(p => !p.deleted_at);
  const trashPosts = posts.filter(p => p.deleted_at);

  return (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60 shadow-lg backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute right-0 top-0 p-8 bg-indigo-500/10 blur-2xl rounded-full group-hover:bg-indigo-500/20 transition-colors duration-500"></div>
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Posts Programados</h3>
        <p className="text-4xl font-black text-white">{activePosts.length}</p>
        <p className="text-xs text-indigo-400 mt-2 font-medium">+2 esta semana</p>
      </div>
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60 shadow-lg backdrop-blur-sm relative overflow-hidden group">
         <div className="absolute right-0 top-0 p-8 bg-emerald-500/10 blur-2xl rounded-full group-hover:bg-emerald-500/20 transition-colors duration-500"></div>
         <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Alcance Potencial</h3>
         <p className="text-4xl font-black text-emerald-400">{(activePosts.length * 1.5)}K</p>
         <p className="text-xs text-emerald-600 mt-2 font-medium">Trending Up ↗</p>
      </div>
       <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60 shadow-lg backdrop-blur-sm relative overflow-hidden flex items-center justify-center">
         <div className="text-center">
            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Siguiente Hito</h3>
            <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-indigo-500 mx-auto mb-2 flex items-center justify-center text-white font-bold">85%</div>
            <p className="text-xs text-white">100K Views</p>
         </div>
      </div>
    </div>

    <div>
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <Calendar size={24} className="text-indigo-500" /> 
            <span>{view === 'active' ? 'Calendario de Contenidos' : 'Papelera de Reciclaje'}</span>
          </h2>
          
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
             <button 
                onClick={() => setView('active')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'active' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
             >
                <Zap size={14} /> Activos
             </button>
             <button 
                onClick={() => setView('trash')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${view === 'trash' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'text-slate-400 hover:text-red-400'}`}
             >
                <Trash2 size={14} /> Papelera ({trashPosts.length})
             </button>
          </div>
      </div>

      {view === 'trash' && trashPosts.length > 0 && (
         <div className="flex justify-between items-center mb-4 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
            <p className="text-xs text-red-300 font-medium">⚠️ Los elementos en la papelera se eliminarán permanentemente después de 10 días.</p>
            <button 
               onClick={onEmptyTrash}
               className="text-xs font-bold text-red-400 hover:text-white bg-red-500/20 hover:bg-red-500 px-3 py-1.5 rounded-lg border border-red-500/30 transition-all flex items-center gap-2"
            >
               <Trash2 size={12} /> Vaciar Papelera
            </button>
         </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {(view === 'active' ? activePosts : trashPosts).length === 0 ? (
          <div className="p-16 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${view === 'active' ? 'bg-slate-800' : 'bg-red-900/20'}`}>
              {view === 'active' ? <Sparkles size={32} className="text-slate-600" /> : <Trash2 size={32} className="text-red-500/50" />}
            </div>
            <p className="text-slate-300 font-bold text-lg">{view === 'active' ? 'Tu feed está vacío' : 'Papelera vacía'}</p>
            <p className="text-sm text-slate-500 mt-1">{view === 'active' ? 'Ve al Estudio Viral para comenzar a crear magia.' : 'No hay posts eliminados recientemente.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {(view === 'active' ? activePosts : trashPosts).map((post, idx) => (
              <div key={idx} className="p-5 flex items-center gap-5 hover:bg-slate-800/50 transition-colors group">
                 {/* Product Image */}
                 <div className="shrink-0">
                    {post.image ? (
                        <div className={`w-16 h-16 rounded-2xl overflow-hidden border border-slate-700 shadow-lg relative ${view === 'trash' ? 'grayscale opacity-50' : ''}`}>
                             <MediaPreview src={post.image} className="w-full h-full object-cover" />
                             <div className={`absolute bottom-0 right-0 p-1 rounded-tl-lg ${post.platform === 'tiktok' ? 'bg-black' : 'bg-blue-600'}`}>
                                {post.platform === 'tiktok' ? <span className="text-[8px] font-bold text-white block">Tik</span> : <Facebook size={10} className="text-white"/>}
                             </div>
                        </div>
                    ) : (
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${post.platform === 'tiktok' ? 'bg-black border border-slate-700' : post.platform === 'facebook' ? 'bg-blue-600' : 'bg-linear-to-tr from-purple-500 to-pink-500'} ${view === 'trash' ? 'grayscale opacity-50' : ''}`}>
                            {post.platform === 'tiktok' && <span className="font-bold text-xs">Tik</span>}
                            {post.platform === 'facebook' && <Facebook size={24} />}
                            {post.platform === 'reels' && <Instagram size={24} />}
                        </div>
                    )}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <p className={`font-bold text-lg truncate transition-colors ${view === 'trash' ? 'text-slate-500 line-through' : 'text-white group-hover:text-indigo-400'}`}>{post.product ? post.product.name : 'Campaña General'}</p>
                    <p className="text-sm text-slate-400 truncate pr-4">{post.caption}</p>
                    {view === 'trash' && post.deleted_at && <p className="text-[10px] text-red-500 mt-1">Eliminado: {new Date(post.deleted_at).toLocaleDateString()}</p>}
                 </div>
                 
                 <div className="text-right flex flex-col items-end gap-2">
                    {view === 'active' ? (
                        <>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wide">Programado</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onRelaunch(post)}
                                    className="text-xs font-bold text-indigo-400 hover:text-white flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500 px-3 py-1.5 rounded-lg transition-all border border-indigo-500/20"
                                >
                                    <RefreshCw size={12} /> Re-Lanzar
                                </button>
                                <button 
                                    onClick={() => onDelete(post)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors"
                                    title="Mover a papelera"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-2">
                             <button 
                                onClick={() => onRestore(post)}
                                className="text-xs font-bold text-emerald-400 hover:text-white flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500 px-3 py-1.5 rounded-lg transition-all border border-emerald-500/20"
                            >
                                <RefreshCw size={12} /> Restaurar
                            </button>
                            <button 
                                onClick={() => {
                                    if(confirm("¿Eliminar para siempre?")) onDelete(post); // Should be onPermanentDelete ideally, but mapped to logic
                                }}
                                className="hidden" // Hiding individual permanent delete for now, use empty trash for bulk
                            >
                            </button>
                        </div>
                    )}
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

export default Dashboard;
