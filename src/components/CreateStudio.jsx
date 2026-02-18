
import React from 'react';
import { useCreateStudio } from '../hooks/useCreateStudio';
import PageSelector from './PageSelector';
import PlatformSelector from './PlatformSelector';
import ImageEditor from './ImageEditor';
import VideoScriptPanel from './VideoScriptPanel';
import ViralCoach from './ViralCoach';
import HashtagGenerator from './HashtagGenerator';
import PreviewPhone from './PreviewPhone';
import MediaPreview from './MediaPreview'; 
import { 
  LayoutDashboard, Upload, Loader2, ImagePlus, Package, CheckCircle2, Trash2, ShoppingBag, 
  RefreshCw, ChevronUp, ChevronDown, Edit2, Sparkles, Tag, DollarSign, Save, X, Music, 
  Link, Video, ImageIcon, Zap, Clock, Download, Smartphone, Sliders, Calendar 
} from 'lucide-react';

const CreateStudio = (props) => {
  const { 
    state,
    actions
  } = useCreateStudio(props);

  const {
      uploading, setUploading,
      rendering, setRendering,
      customAudioUrl, setCustomAudioUrl,
      audioType, setAudioType,
      audioStartTime, setAudioStartTime,
      audioDuration, setAudioDuration,
      syncing, setSyncing,
      editingImage, setEditingImage,
      showEditor, setShowEditor,
      showCatalog, setShowCatalog,
      currentPreviewIndex, setCurrentPreviewIndex,
      scheduleMode, setScheduleMode,
      scheduledDate, setScheduledDate,
      targetPlatforms, setTargetPlatforms,
      contentType, setContentType,
      hook, setHook,
      audio, setAudio,
      selectedTone, setSelectedTone,
      customInstructions, setCustomInstructions,
      trendingAudio, setTrendingAudio,
      hooksList, setHooksList,
      loadingHooks, setLoadingHooks,
      loadingCaption, setLoadingCaption,
      loadingTags, setLoadingTags,
      pages, setPages,
      showPageSelector, setShowPageSelector,
      pendingAccessToken, setPendingAccessToken,
      savedPresets, setSavedPresets
  } = state;

  const {
      handleSync,
      handleAnalyzeImage,
      handleFileUpload,
      handleDeleteProduct,
      handleSaveUpdateProduct,
      handleImageEditorSave,
      handleDownloadVideo,
      handlePageSelect,
      handleHookSelect,
      handlePlatformToggle,
      handleScheduleClick,
      generateAIHooks,
      generateAICaption,
      generateAITags
  } = actions;

  const { 
    products, 
    selectedProduct, 
    setSelectedProduct, 
    caption, 
    setCaption,
    videoScript, 
    selectedHook, 
    setSelectedHook,
    analyzingImage
  } = props;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-8">
      {showPageSelector && (
        <PageSelector 
          pages={pages} 
          onSelect={handlePageSelect} 
          onClose={() => setShowPageSelector(false)} 
        />
      )}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 pb-20 custom-scrollbar">
        
        {/* Header Section */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60 shadow-lg space-y-4 backdrop-blur-sm">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              Estudio Viral <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 px-2 py-1 rounded-full uppercase tracking-wider">AI Powered</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-light">Diseña, optimiza y lanza tu próxima campaña viral.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <PlatformSelector 
              platforms={targetPlatforms} 
              onToggle={handlePlatformToggle} 
            />
            
            <div className="flex p-1.5 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
               <button onClick={() => setContentType('video')} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-300 ${contentType === 'video' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500'}`}>
                 <Video size={16} /> Video
               </button>
               <button onClick={() => setContentType('photo')} className={`px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-300 ${contentType === 'photo' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500'}`}>
                 <ImageIcon size={16} /> Foto
               </button>
            </div>
          </div>
        </div>

        {/* Product Selection */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60 shadow-lg backdrop-blur-sm space-y-6">
           <div className="flex items-center gap-2 mb-2">
             <div className="bg-indigo-500/20 p-2 rounded-lg"><LayoutDashboard size={18} className="text-indigo-400"/></div>
             <h3 className="text-lg font-bold text-white">¿Qué vendemos hoy?</h3>
           </div>
           
           {/* Section 1: Quick Upload - Horizontal Layout */}
           <div className="bg-slate-950/30 rounded-2xl p-4 border border-slate-800/50">
             <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest pl-1">
                <Upload size={12} className="inline mr-1" /> Carga Rápida
             </label>
             <label className="cursor-pointer w-full h-24 rounded-xl border-2 border-dashed border-indigo-500/30 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-4 group relative overflow-hidden">
                <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileUpload} disabled={uploading} />
                {uploading ? (
                  <Loader2 className="animate-spin text-indigo-400" size={24} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload size={20} className="text-indigo-400" />
                  </div>
                )}
                <div className="text-left">
                   <p className="font-bold text-indigo-300 text-sm">Subir Archivo Multimedia</p>
                   <p className="text-[10px] text-indigo-400/60">Arrastra o haz clic para subir foto/video</p>
                </div>
             </label>
           </div>

            {/* Section 1.5: Local Gallery - Grid Layout */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3 pl-1">
                 <div className="bg-indigo-500/20 p-1.5 rounded-lg"><ImagePlus size={16} className="text-indigo-400"/></div>
                 <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Galería Personalizada</h4>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                 {products.filter(p => p.isLocal).map(prod => (
                   <button key={prod.id} onClick={() => setSelectedProduct(prod)} className={`p-3 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group flex flex-col gap-2 ${selectedProduct?.id === prod.id ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900'}`}>
                     <div className="w-full aspect-square rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800/50">
                       {prod.image_url ? (
                         prod.image_url.match(/\.(mp4|webm|mov)$/i) ? (
                           <video 
                             src={prod.image_url} 
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                             muted 
                             loop 
                             onMouseOver={e => e.target.play()}
                             onMouseOut={e => {e.target.pause(); e.target.currentTime = 0;}}
                           />
                         ) : (
                           <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         )
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-950"><Package size={24}/></div>
                       )}
                       
                       {selectedProduct?.id === prod.id && (
                         <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center backdrop-blur-[1px] animate-in fade-in duration-200">
                            <div className="bg-indigo-500 rounded-full p-1.5 shadow-lg"><CheckCircle2 size={16} className="text-white"/></div>
                         </div>
                       )}
                     </div>
                     <div className="w-full">
                       <p className={`font-bold text-xs truncate transition-colors ${selectedProduct?.id === prod.id ? 'text-indigo-300' : 'text-slate-300 group-hover:text-white'}`}>{prod.name}</p>
                       <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-slate-500 font-mono">${prod.price}</span>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">{prod.stock || 0}</span>
                            <div 
                                onClick={(e) => handleDeleteProduct(e, prod)}
                                className="p-1 hover:bg-red-500/20 rounded-md group/trash transition-colors"
                                title="Eliminar producto"
                            >
                                <Trash2 size={12} className="text-slate-600 group-hover/trash:text-red-400" />
                            </div>
                        </div>
                      </div>
                    </div>
                  </button>
                  ))}
                  {products.filter(p => p.isLocal).length === 0 && (
                     <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                        <p className="text-slate-500 text-xs">Aún no has subido contenido.</p>
                     </div>
                  )}
               </div>
            </div>

            {/* Section 2: Store Catalog - Grid Layout */}
            <div>
              <div 
                onClick={() => setShowCatalog(!showCatalog)}
                className="w-full flex items-center justify-between mb-3 pl-1 group hover:bg-slate-800/50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-800 cursor-pointer"
              >
                 <div className="flex items-center gap-2">
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg"><ShoppingBag size={16} className="text-emerald-400"/></div>
                    <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide cursor-pointer group-hover:text-white transition-colors">
                       Catálogo Web
                    </label>
                 </div>
                 <div className="flex items-center gap-2">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         handleSync();
                       }}
                       disabled={syncing}
                       className="p-1 hover:bg-slate-700 rounded-lg text-emerald-400 transition-colors disabled:opacity-50"
                       title="Sincronizar desde Web"
                     >
                        <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
                     </button>
                    <div className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-mono">{products.filter(p => !p.isLocal).length} WEB</span>
                    </div>
                    {showCatalog ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
                </div>
                </div>
              
              {showCatalog && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1 animate-in slide-in-from-top-2 fade-in duration-300">
                   {products.filter(p => !p.isLocal).map(prod => (
                     <button key={prod.id} onClick={() => setSelectedProduct(prod)} className={`p-3 rounded-xl border text-left transition-all duration-300 relative overflow-hidden group flex flex-col gap-2 ${selectedProduct?.id === prod.id ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900'}`}>
                       <div className="w-full aspect-square rounded-lg bg-slate-900 overflow-hidden relative border border-slate-800/50">
                         {prod.image_url ? (
                           prod.image_url.match(/\.(mp4|webm|mov)$/i) ? (
                             <video 
                               src={prod.image_url} 
                               className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                               muted 
                               loop 
                               onMouseOver={e => e.target.play()}
                               onMouseOut={e => {e.target.pause(); e.target.currentTime = 0;}}
                             />
                           ) : (
                             <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                           )
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-950"><Package size={24}/></div>
                         )}
                         
                         {selectedProduct?.id === prod.id && (
                           <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center backdrop-blur-[1px] animate-in fade-in duration-200">
                              <div className="bg-emerald-500 rounded-full p-1.5 shadow-lg"><CheckCircle2 size={16} className="text-white"/></div>
                           </div>
                         )}
                       </div>
                       <div className="w-full">
                         <p className={`font-bold text-xs truncate transition-colors ${selectedProduct?.id === prod.id ? 'text-emerald-300' : 'text-slate-300 group-hover:text-white'}`}>{prod.name}</p>
                         <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-slate-500 font-mono">${prod.price}</span>
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">{prod.stock || 0}</span>
                         </div>
                     </div>
                   </button>
                   ))}
                </div>
              )}
        </div>
        
        {/* NEW: Editable Product Details Card */}
        {selectedProduct && (
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60 shadow-lg backdrop-blur-sm space-y-4 animate-in fade-in slide-in-from-top-4">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                  <div className="bg-indigo-500/20 p-2 rounded-lg"><Edit2 size={18} className="text-indigo-400"/></div>
                  <h3 className="text-lg font-bold text-white">Detalles del Producto</h3>
               </div>
               
               <button 
                 onClick={handleAnalyzeImage}
                 disabled={analyzingImage || !selectedProduct}
                 className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full hover:bg-amber-500/20 transition-all border border-amber-500/20 disabled:opacity-50"
                 title="Analizar luz, composición y atractivo con Gemini Vision"
               >
                  {analyzingImage ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                  Analizar Foto
               </button>
             </div>
             
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nombre (Para la IA)</label>
                    <input 
                      type="text" 
                      value={selectedProduct.name}
                      onChange={(e) => {
                         const newName = e.target.value;
                         setSelectedProduct(prev => ({ ...prev, name: newName }));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
                    />
                 </div>

                 <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Categoría</label>
                     <div className="relative">
                        <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                           type="text"
                           value={selectedProduct.category || ''}
                           onChange={(e) => {
                              const newCat = e.target.value;
                              setSelectedProduct(prev => ({ ...prev, category: newCat }));
                           }}
                           placeholder="Ej: Ofertas, Verano..."
                           className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-8 text-white focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-xs"
                        />
                     </div>
                 </div>

                 <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Precio</label>
                     <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input 
                          type="number"
                          value={selectedProduct.price}
                          onChange={(e) => {
                             const newPrice = e.target.value;
                             setSelectedProduct(prev => ({ ...prev, price: newPrice }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-8 text-white focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                        />
                     </div>
                 </div>
              </div>
               
               <button 
                  onClick={handleSaveUpdateProduct}
                  className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-slate-700 flex items-center justify-center gap-2"
               >
                  <Save size={14} /> {selectedProduct.id && typeof selectedProduct.id === 'number' ? 'Actualizar Producto' : 'Guardar en Inventario'}
               </button>
            </div>
         )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Caption Area */}
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60 shadow-lg backdrop-blur-sm space-y-4">
             <div>
                <div className="flex justify-between items-center mb-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Instrucciones Extra (Brand Voice)</label>
                   {customInstructions && (
                      <button 
                        onClick={() => {
                           const name = prompt("Nombre para este estilo (ej. 'Modo Nike'):");
                           if (name) {
                               setSavedPresets(prev => [...prev, { id: Date.now(), name, text: customInstructions }]);
                           }
                        }}
                        className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition-colors flex items-center gap-1"
                      >
                         <Save size={12} /> Guardar Estilo
                      </button>
                   )}
                </div>
                
                {savedPresets.length > 0 && (
                   <div className="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                      {savedPresets.map(preset => (
                         <div key={preset.id} className="flex items-center gap-1 bg-slate-800/50 rounded-lg pl-2 pr-1 py-1 border border-slate-700/50 shrink-0 group">
                            <button 
                              onClick={() => setCustomInstructions(preset.text)}
                              className="text-[10px] text-slate-300 font-medium hover:text-white truncate max-w-[100px]"
                              title={preset.text}
                            >
                               {preset.name}
                            </button>
                            <button 
                              onClick={(e) => {
                                 e.stopPropagation();
                                 if(confirm("¿Borrar preset?")) setSavedPresets(prev => prev.filter(p => p.id !== preset.id));
                              }}
                              className="p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400 transition-colors"
                            >
                               <X size={10} />
                            </button>
                         </div>
                      ))}
                   </div>
                )}

                <textarea 
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ej: Menciona envío gratis, quedan pocas unidades, sé sarcástico..."
                  className="w-full h-20 p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600 resize-none"
                />
             </div>

             <div className="flex justify-between items-center">
               <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">2. Caption Creativo</label>
               <button 
                onClick={generateAICaption}
                disabled={!selectedProduct || loadingCaption}
                className="text-[10px] flex items-center gap-1.5 text-white font-bold bg-linear-to-r from-indigo-500 to-purple-600 hover:opacity-90 px-3 py-1.5 rounded-full transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {loadingCaption ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>}
                 MAGIC WRITE
               </button>
             </div>
             <textarea 
               value={caption} 
               onChange={(e) => setCaption(e.target.value)} 
               placeholder={contentType === 'video' ? "Escribe algo que conecte..." : "Describe las bondades del producto..."} 
               className="w-full h-[500px] p-5 rounded-xl bg-slate-950/50 border border-slate-800 text-base leading-relaxed text-slate-200 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600 custom-scrollbar" 
             />
             <HashtagGenerator 
               product={selectedProduct?.name} 
               category={selectedProduct?.category} 
               loading={loadingTags}
               onGenerate={generateAITags}
               onCopy={(tags) => setCaption(prev => prev + " " + tags)} 
             />
          </div>
          


          {/* Audio Selection Panel (New) */}
          {contentType === 'video' && (
             <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/60 shadow-lg backdrop-blur-sm space-y-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Music size={14} className="text-pink-500" /> Soundtrack
                    </label>
                    <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                        <button 
                            onClick={() => setAudioType('file')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${audioType === 'file' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            Archivo
                        </button>
                        <button 
                            onClick={() => setAudioType('url')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${audioType === 'url' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            URL
                        </button>
                    </div>
                </div>

                {audioType === 'file' ? (
                    <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer bg-slate-950 hover:bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-xl p-3 transition-all flex items-center gap-3 group">
                            <div className="bg-slate-800 p-2 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                                <Upload size={16} className="text-slate-400"/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-300 group-hover:text-white truncate">
                                    {customAudioUrl && customAudioUrl.startsWith('blob:') ? "Audio Cargado" : "Subir MP3/WAV"}
                                </p>
                            </div>
                            <input 
                                type="file" 
                                accept="audio/*" 
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if(file) {
                                        const url = URL.createObjectURL(file);
                                        setCustomAudioUrl(url);
                                        // Reset trim
                                        setAudioStartTime(0);
                                    }
                                }}
                            />
                        </label>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="relative">
                            <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
                            <input 
                                type="text" 
                                placeholder="https://ejemplo.com/musica.mp3"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 pl-8 text-xs text-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
                                onBlur={(e) => {
                                    if(e.target.value) setCustomAudioUrl(e.target.value);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Audio Trimmer & Preview */}
                {customAudioUrl && (
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 animate-in fade-in">
                        <div className="flex justify-between items-center mb-2">
                             <p className="text-[10px] font-bold text-slate-400">Recortar / Previsualizar</p>
                             <p className="text-[10px] font-mono text-indigo-400">Inicio: {audioStartTime}s</p>
                        </div>
                        
                        {/* Hidden Audio Element for Logic */}
                        <audio 
                            src={customAudioUrl} 
                            id="preview-audio"
                            onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                            controls
                            className="w-full h-8 opacity-80"
                        />
                        
                        <div className="mt-3 flex items-center gap-3">
                            <span className="text-[10px] text-slate-500 font-mono">0s</span>
                            <input 
                                type="range" 
                                min="0" 
                                max={audioDuration || 60} 
                                step="1"
                                value={audioStartTime}
                                onChange={(e) => {
                                    const time = Number(e.target.value);
                                    setAudioStartTime(time);
                                    const audioEl = document.getElementById('preview-audio');
                                    if(audioEl) {
                                        audioEl.currentTime = time;
                                        audioEl.play(); 
                                    }
                                }}
                                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer hover:bg-slate-700 accent-indigo-500"
                            />
                            <span className="text-[10px] text-slate-500 font-mono">{Math.floor(audioDuration)}s</span>
                        </div>
                         <p className="text-[9px] text-slate-500 mt-1 text-center italic">Ajusta el slider para elegir dónde empieza la canción en el video.</p>
                    </div>
                )}
             </div>
          )}

          {contentType === 'video' ? (
            <VideoScriptPanel 
               strategy={videoScript} 
               loading={loadingHooks}
               onGenerate={generateAIHooks}
               onSelectHook={setSelectedHook}
               selectedHook={selectedHook} 
            />
          ) : (
            <ViralCoach
                trendingAudio={trendingAudio}
                hooks={hooksList}
                onRegenerateHooks={generateAIHooks}
                loadingHooks={loadingHooks}
                onSelectHook={handleHookSelect} // CHANGED: Use local handler to sync state
                selectedHook={hook} // CHANGED: Pass local state for visual feedback
                onSelectAudio={(audio) => setAudio(audio)}
                contentType={contentType}
                selectedTone={selectedTone}
                onSelectTone={setSelectedTone}
                strategy={videoScript} // Pass as strategy
                product={selectedProduct}
            />
          )}

        </div>

        {/* Footer Action */}
        <div className="bg-linear-to-r from-indigo-600 to-violet-600 p-[2px] rounded-2xl shadow-xl shadow-indigo-900/30">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-[14px] p-4 flex justify-between items-center text-white">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"><CheckCircle2 size={24} /></div>
                <div>
                   <p className="font-bold text-lg">Listo para despegar 🚀</p>
                   <p className="text-xs text-slate-400">Publicando en <span className="text-white font-bold capitalize">{Object.keys(targetPlatforms).filter(k => targetPlatforms[k]).join(' + ') || '...'}</span> como <span className="text-white font-bold capitalize">{contentType}</span></p>
                </div>
             </div>
             <div className="flex flex-col gap-3 min-w-[200px]">
                {/* Mode Toggles */}
                <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                   <button 
                     onClick={() => setScheduleMode('now')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${scheduleMode === 'now' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                   >
                     <Zap size={14} /> Ahora
                   </button>
                   <button 
                     onClick={() => setScheduleMode('later')}
                     className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-bold transition-all ${scheduleMode === 'later' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                   >
                     <Clock size={14} /> Programar
                   </button>
                </div>

                {/* Date Input */}
                {scheduleMode === 'later' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                     <input 
                       type="datetime-local" 
                       value={scheduledDate}
                       onChange={(e) => setScheduledDate(e.target.value)}
                       className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none"
                     />
                     <button 
                        onClick={() => {
                           // Smart AI suggestion simulation
                           const tomorrow = new Date();
                           tomorrow.setDate(tomorrow.getDate() + 1);
                           tomorrow.setHours(18, 0, 0, 0); // Default to 18:00
                           setScheduledDate(tomorrow.toISOString().slice(0, 16));
                           alert("🤖 IA: Basado en tu audiencia, mañana a las 18:00 es el pico de tráfico.");
                        }}
                        className="w-full mt-2 text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center justify-center gap-1"
                     >
                        <Sparkles size={10} /> Sugerir Mejor Hora
                     </button>
                  </div>
                )}
             </div>
             
             <button onClick={handleScheduleClick} className={`px-8 py-3 font-bold rounded-xl transition-colors shadow-lg hover:shadow-xl hover:scale-105 transform duration-200 ${scheduleMode === 'now' ? 'bg-white text-indigo-700 hover:bg-slate-50' : 'bg-indigo-500 text-white hover:bg-indigo-400 border border-indigo-400'}`}>
               {scheduleMode === 'now' ? 'Lanzar Ya' : 'Agendar'}
             </button>
          </div>
        </div>
        
        {/* Video Render Actions */}
        {contentType === 'video' && (
           <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={handleDownloadVideo}
                disabled={rendering}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 disabled:opacity-50 transition-colors"
                title="Renderizar y descargar video MP4"
              >
                  {rendering ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                  {rendering ? "Creando Video..." : "Descargar Video"}
              </button>
           </div>
        )}
      </div>

      {/* Preview Section */}
      <div className="lg:w-[350px] shrink-0 flex flex-col items-center bg-slate-950 rounded-[40px] p-6 border border-slate-800 h-fit sticky top-4 shadow-2xl">
        <div className="flex items-center gap-2 mb-6 opacity-60">
           <Smartphone size={16} className="text-slate-400"/>
           <h3 className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Vista Previa</h3>
        </div>
        <PreviewPhone type={targetPlatforms.instagram ? 'instagram' : 'facebook'} contentType={contentType} content={caption} product={selectedProduct} audio={audio} hooks={hook} />
        {contentType === 'video' && audio && (
          <div className="mt-6 flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-full shadow-lg border border-slate-800">
             <div className="animate-spin-slow">
              <Music size={14} className="text-pink-500" />
             </div>
             <p className="text-xs font-medium text-slate-400">Audio: <span className="text-slate-200 font-bold">{audio}</span></p>
          </div>
        )}
        
        {selectedProduct && contentType === 'photo' && (
          <button 
            onClick={() => {
              setEditingImage(selectedProduct.image_url);
              setShowEditor(true);
            }}
            className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-bold text-xs flex items-center gap-2 transition-all border border-slate-700 hover:border-indigo-500"
          >
            <Sliders size={14} /> Editar Imagen
          </button>
        )}
      </div>
      {showEditor && editingImage && (
        <ImageEditor 
          imageUrl={editingImage} 
          onClose={() => setShowEditor(false)}
          onSave={handleImageEditorSave}
        />
      )}

    </div>
  );
};

export default CreateStudio;
