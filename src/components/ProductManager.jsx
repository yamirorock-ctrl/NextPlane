import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { uploadMedia } from '../services/storage';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Loader2, 
  ImagePlus, 
  Package,
  DollarSign,
  Tag,
  Rocket,
  BarChart2,
  Clock,
  Sparkles
} from 'lucide-react';

const ProductManager = ({ onRelaunch }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer/Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    price: '',
    category: '',
    image_url: '',
    link: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Fetch products AND their related posts to calculate stats
      // Note: This requires a foreign key from posts.product_id to products.id (which exists)
      const { data, error } = await supabase
        .from('products')
        .select(`
            *,
            posts (
                id,
                scheduled_date,
                status
            )
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Process stats
      const productsWithStats = data.map(p => {
          const validPosts = p.posts || [];
          const lastPost = validPosts.sort((a,b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0];
          
          return {
              ...p,
              postCount: validPosts.length,
              lastPromoted: lastPost ? lastPost.scheduled_date : null
          };
      });

      setProducts(productsWithStats || []);
    } catch (e) {
      console.error("Error fetching products:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (product = null) => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({ id: null, name: '', price: '', category: '', image_url: '', link: '' });
    }
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert("Error eliminando: " + e.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const productData = {
        name: formData.name, // Ensure name is saved
        price: formData.price, // Ensure price is saved
        category: formData.category,
        image_url: formData.image_url,
        link: formData.link
      };

      if (formData.id) {
        // UPDATE
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', formData.id)
          .select();
        
        if (error) throw error;
        // Optimization: Don't refetch all, just update local. Keep stats.
        setProducts(prev => prev.map(p => p.id === formData.id ? { ...p, ...data[0] } : p));
      } else {
        // INSERT
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select();
          
        if (error) throw error;
        setProducts(prev => [{...data[0], postCount: 0, lastPromoted: null}, ...prev]);
      }
      setIsDrawerOpen(false);
    } catch (e) {
      alert("Error guardando: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setSaving(true); 
      // Temporarily show loading on button while uploading image
      const url = await uploadMedia(file);
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch (e) {
      alert("Error subiendo imagen: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-white flex items-center gap-2">
             <Package className="text-indigo-500" /> Catálogo Maestro
           </h2>
           <p className="text-slate-400 text-sm">Tus productos listos para campañas virales.</p>
        </div>
        <button 
          onClick={() => handleOpenDrawer()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          placeholder="Buscar producto por nombre o categoría..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
           <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-indigo-500" size={32} />
           </div>
        ) : filteredProducts.length === 0 ? (
           <div className="text-center py-20 opacity-50">
              <Package size={48} className="mx-auto mb-2" />
              <p>No hay productos en tu catálogo.</p>
              <button onClick={() => handleOpenDrawer()} className="text-indigo-400 font-bold mt-2 hover:underline">¡Agrega el primero!</button>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col">
                <div className="aspect-square relative bg-slate-950 overflow-hidden">
                  {product.image_url ? (
                    product.image_url.match(/\.(mp4|webm|mov)$/i) ? (
                      <video 
                        src={product.image_url} 
                        className="w-full h-full object-cover" 
                        muted 
                        loop 
                        onMouseOver={e => e.target.play()}
                        onMouseOut={e => {e.target.pause(); e.target.currentTime = 0;}}
                      />
                    ) : (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 flex-col gap-2">
                      <ImagePlus size={32} />
                      <span className="text-xs">Sin Imagen</span>
                    </div>
                  )}
                  
                  {/* Price Tag */}
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-md rounded-full text-sm font-bold text-white border border-white/10 shadow-lg">
                    ${product.price}
                  </div>

                  {/* Quick Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    {onRelaunch && (
                      <button 
                        onClick={() => onRelaunch(product)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all"
                        title="Crear Post con IA"
                      >
                         <Sparkles size={16} /> Crear Post
                      </button>
                    )}
                  </div>
                  
                  {/* Edit/Delete Small Actions */}
                  <div className="absolute bottom-3 right-3 flex gap-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                     <button 
                        onClick={() => handleOpenDrawer(product)}
                        className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                     <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 bg-slate-800 text-red-400 hover:text-red-300 rounded-lg hover:bg-slate-700"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Info & Stats */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-white text-base truncate pr-2" title={product.name}>{product.name}</h3>
                        <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                            <Tag size={10} /> {product.category || 'General'}
                        </p>
                      </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-slate-800 grid grid-cols-2 gap-2">
                     <div className="bg-slate-950 p-2 rounded-lg text-center">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-center items-center gap-1"><BarChart2 size={10}/> Posts</span>
                        <span className="text-white font-mono font-bold">{product.postCount || 0}</span>
                     </div>
                     <div className="bg-slate-950 p-2 rounded-lg text-center">
                        <span className="block text-[10px] text-slate-500 uppercase font-bold mb-1 flex justify-center items-center gap-1"><Clock size={10}/> Última vez</span>
                        <span className={`text-[10px] font-bold ${product.lastPromoted ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {product.lastPromoted ? new Date(product.lastPromoted).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Nunca'}
                        </span>
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer / Modal */}
      {isDrawerOpen && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 h-full shadow-2xl p-6 border-l border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white">
                 {formData.id ? 'Editar Producto' : 'Nuevo Producto'}
               </h3>
               <button onClick={() => setIsDrawerOpen(false)} className="text-slate-400 hover:text-white">
                 <X size={24} />
               </button>
             </div>

             <form onSubmit={handleSave} className="flex-1 flex flex-col gap-4 overflow-y-auto">
                {/* Image Upload */}
                <div className="flex justify-center mb-4">
                  <label className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-700 hover:border-indigo-500 bg-slate-950 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-colors">
                     {formData.image_url ? (
                       <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                       <div className="text-slate-500 group-hover:text-indigo-400 flex flex-col items-center">
                         <ImagePlus size={24} />
                         <span className="text-xs mt-2">Subir Foto</span>
                       </div>
                     )}
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={20} className="text-white" />
                     </div>
                     <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nombre del Producto</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Precio</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-8 text-white focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Categoría</label>
                    <input 
                      type="text" 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="Ej: Moda, Tech..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Link de la Tienda (Opcional)</label>
                  <input 
                    type="url" 
                    value={formData.link || ''}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    placeholder="https://tu-tienda.com/producto..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Este link se usará para compartir en WhatsApp.</p>
                </div>

                <div className="flex-1"></div>

                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {formData.id ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
