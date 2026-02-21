import React, { useState } from 'react';
import { useCreateStudio } from '../hooks/useCreateStudio';
import PageSelector from './PageSelector';
import PlatformSelector from './PlatformSelector';
import ImageEditor from './ImageEditor';
import VideoScriptPanel from './VideoScriptPanel';
import ViralCoach from './ViralCoach';
import HashtagGenerator from './HashtagGenerator';
import PreviewPhone from './PreviewPhone';
import MediaPreview from './MediaPreview'; 
import VoiceoverPanel from './VoiceoverPanel'; 
import BrandVoiceManager from './BrandVoiceManager'; 
import SubtitleEditor from './SubtitleEditor'; 
import { 
  LayoutDashboard, Upload, Loader2, ImagePlus, Package, CheckCircle2, Trash2, ShoppingBag, 
  RefreshCw, ChevronUp, ChevronDown, Edit2, Sparkles, Tag, DollarSign, Save, X, Music, 
  Link, Video, ImageIcon, Zap, Clock, Download, Smartphone, Sliders, Calendar, ArrowRight, ArrowLeft, Volume2, VolumeX, User, Play 
} from 'lucide-react';

const STEPS = [
    { id: 1, title: "Origen", icon: Package },
    { id: 2, title: "Estrategia", icon: Sparkles },
    { id: 3, title: "Lanzamiento", icon: RocketIcon }
];

function RocketIcon(props) { return <Zap {...props} /> } // Alias

const CreateStudio = (props) => {
  const [currentStep, setCurrentStep] = useState(props.selectedProduct ? 2 : 1);
  const { state, actions } = useCreateStudio(props);

  // Destructure state
  const {
      uploading, setUploading, rendering, setRendering, customAudioUrl, setCustomAudioUrl,
      audioType, setAudioType, audioStartTime, setAudioStartTime, audioDuration, setAudioDuration,
      syncing, setSyncing, editingImage, setEditingImage, showEditor, setShowEditor,
      showCatalog, setShowCatalog, scheduleMode, setScheduleMode, scheduledDate, setScheduledDate,
      targetPlatforms, setTargetPlatforms, contentType, setContentType, hook, setHook,
      audio, setAudio, bgVolume, setBgVolume, selectedTone, setSelectedTone, customInstructions, setCustomInstructions,
      trendingAudio, setTrendingAudio, hooksList, setHooksList, loadingHooks, setLoadingHooks,
      loadingCaption, setLoadingCaption, loadingTags, setLoadingTags, pages, setPages,
      showPageSelector, setShowPageSelector, savedPresets, setSavedPresets,
    subtitles,
    setSubtitles,
    voiceoverConfig, // Added this
  } = state;

  // Destructure actions
  const {
      handleSync, handleAnalyzeImage, handleFileUpload, handleDeleteProduct,
      handleSaveUpdateProduct, handleImageEditorSave, handleDownloadVideo, handlePageSelect,
      handleHookSelect, handlePlatformToggle, handleScheduleClick, generateAIHooks,
      generateAICaption, generateAITags
  } = actions;

  // Destructure passed props
  const { 
    products, selectedProduct, setSelectedProduct, caption, setCaption,
    videoScript, selectedHook, setSelectedHook, analyzingImage
  } = props;

  // -- Navigation Helpers --
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  
  const canProceed = () => {
      if (currentStep === 1) return !!selectedProduct; // Must select something
      if (currentStep === 2) return caption.length > 10; // Must have some text
      return true;
  };



  const [showBrandManager, setShowBrandManager] = useState(false);
  const [showAudioLibrary, setShowAudioLibrary] = useState(false);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <BrandVoiceManager 
        isOpen={showBrandManager} 
        onClose={() => setShowBrandManager(false)}
        onSelectPreset={(preset) => {
            setSelectedTone(preset.name);
            setCustomInstructions(prev => prev ? prev + "\n" + preset.instructions : preset.instructions);
        }}
      />
      {showPageSelector && (
        <PageSelector pages={pages} onSelect={handlePageSelect} onClose={() => setShowPageSelector(false)} />
      )}

      {/* -- WIZARD HEADER -- */}
      <div className="h-20 shrink-0 flex items-center justify-between px-8 border-b border-white/5 bg-slate-900/30 backdrop-blur-md z-20">
          <h2 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-indigo-300 flex items-center gap-2">
            <Zap className="text-amber-400" size={24} fill="currentColor" />
            Estudio Viral
          </h2>
          
          {/* Progress Tracker */}
          <div className="flex items-center gap-4">
              {STEPS.map((step, idx) => {
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;
                  return (
                      <div key={step.id} className="flex items-center gap-2">
                          <div 
                              onClick={() => isCompleted && setCurrentStep(step.id)} // Allow clicking back
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all cursor-${isCompleted ? 'pointer' : 'default'} ${isActive ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]' : isCompleted ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                          >
                              {isCompleted ? <CheckCircle2 size={20} /> : <step.icon size={18} />}
                          </div>
                          <span className={`text-sm font-bold hidden md:block ${isActive ? 'text-white' : 'text-slate-600'}`}>{step.title}</span>
                          {idx < STEPS.length - 1 && <div className="w-8 h-1 bg-slate-800 rounded-full" />}
                      </div>
                  );
              })}
          </div>

          <div className="flex gap-2">
              <button 
                disabled={currentStep === 1}
                onClick={prevStep}
                className="px-4 py-2 rounded-xl text-slate-400 hover:bg-white/5 disabled:opacity-30 transition-colors"
              >
                 <ArrowLeft size={20} />
              </button>
              <button 
                onClick={currentStep === 3 ? handleScheduleClick : nextStep}
                disabled={!canProceed()}
                className={`px-6 py-2 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${currentStep === 3 ? 'bg-linear-to-r from-emerald-500 to-teal-500 hover:scale-105' : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:grayscale'}`}
              >
                  {currentStep === 3 ? 'Despegar 🚀' : 'Siguiente'} <ArrowRight size={16} />
              </button>
          </div>
      </div>

      {/* -- MAIN WORKSPACE (Scrollable) -- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
         <div className="max-w-5xl mx-auto min-h-full">
            
            {/* STEP 1: ASSET SELECTION */}
            {currentStep === 1 && (
                <div className="animate-fade-in-up space-y-6">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black text-white mb-2">¿Qué vamos a promocionar hoy?</h1>
                        <p className="text-slate-400">Selecciona un producto de tu inventario o sube contenido nuevo.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Option A: Quick Upload */}
                        <div className="glass-panel p-8 rounded-3xl border-dashed border-2 border-slate-700 hover:border-indigo-500 transition-colors group text-center flex flex-col items-center justify-center min-h-[300px]">
                            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Upload size={32} className="text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Subir Archivo</h3>
                            <p className="text-slate-400 text-sm mb-6 max-w-xs">Arrastra fotos o videos aquí para crear un post rápido sin producto asociado.</p>
                            <label className="cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
                                Seleccionar Archivo
                                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>

                        {/* Option B: Gallery Grid */}
                        <div className="glass-panel p-6 rounded-3xl flex flex-col h-[400px]">
                            <div className="flex justify-between items-center mb-4">
                               <h3 className="font-bold text-lg text-white flex items-center gap-2"><ShoppingBag className="text-emerald-400"/> Inventario</h3>
                               <div className="flex bg-slate-900 rounded-lg p-1">
                                   <button onClick={() => setShowCatalog(false)} className={`px-3 py-1 rounded text-xs font-bold transition-all ${!showCatalog ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>Local</button>
                                   <button onClick={() => setShowCatalog(true)} className={`px-3 py-1 rounded text-xs font-bold transition-all ${showCatalog ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>Web</button>
                               </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-4">
                                {products.filter(p => showCatalog ? !p.isLocal : p.isLocal).length === 0 ? (
                                    <div className="col-span-full flex flex-col items-center justify-center opacity-50 py-10">
                                        <Package size={32} className="mb-2"/>
                                        <p className="text-xs">Sin productos aquí</p>
                                    </div>
                                ) : (
                                    products.filter(p => showCatalog ? !p.isLocal : p.isLocal).map(prod => (
                                        <button 
                                            key={prod.id} 
                                            onClick={() => setSelectedProduct(prod)}
                                            className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all group shrink-0 ${selectedProduct?.id === prod.id ? 'border-indigo-500 ring-4 ring-indigo-500/30 z-10 scale-105' : 'border-slate-800 hover:border-slate-500 hover:scale-[1.02]'}`}
                                        >
                                            <div className="w-full h-full bg-slate-900">
                                                <MediaPreview src={prod.image_url} className="w-full h-full object-cover" />
                                            </div>
                                            
                                            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3 text-left">
                                                <p className="font-bold text-white text-xs truncate drop-shadow-md">{prod.name}</p>
                                                <div className="flex justify-between items-center mt-1">
                                                    <p className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-900/50 px-1.5 rounded">${prod.price}</p>
                                                    {prod.stock !== undefined && (
                                                        <span className="text-[9px] text-slate-300 bg-slate-800/80 px-1.5 rounded">x{prod.stock}</span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {selectedProduct?.id === prod.id && (
                                                <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1.5 rounded-full shadow-lg animate-in zoom-in spin-in-90 duration-300">
                                                    <CheckCircle2 size={14} strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    ))
                                )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: STRATEGY & AI */}
            {currentStep === 2 && (
                <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-12 gap-8">
                     {/* Left: AI Controls */}
                     <div className="lg:col-span-7 space-y-6">
                        {/* Format Selector */}
                        <div className="glass-panel p-2 rounded-2xl flex gap-2">
                            <button onClick={() => setContentType('photo')} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${contentType === 'photo' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                                <ImageIcon size={18} /> {selectedProduct?.gallery?.length > 1 ? "Carrusel / Fotos" : "Foto Estática"}
                            </button>
                            <button onClick={() => setContentType('video')} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${contentType === 'video' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800/50'}`}>
                                <Video size={18} /> Video Reel
                            </button>
                        </div>
                        
                        {/* Gallery Selection (for multi-image products) */}
                        {selectedProduct?.gallery && selectedProduct.gallery.length > 1 && (
                            <div className="glass-panel p-4 rounded-2xl">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center justify-between">
                                    <span>Seleccionar Fotos ({selectedProduct.gallery.length})</span>
                                    <span className="text-[10px] text-indigo-400">Clic para activar/desactivar</span>
                                </h3>
                                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                    {selectedProduct.gallery.map((img, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => {
                                                const newGallery = selectedProduct.gallery.filter((_, i) => i !== idx);
                                                if (newGallery.length === 0) return alert("Debes dejar al menos una imagen");
                                                setSelectedProduct({ ...selectedProduct, gallery: newGallery });
                                            }}
                                            className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 group hover:ring-2 ring-indigo-500 transition-all"
                                            title="Eliminar de esta selección"
                                        >
                                            <MediaPreview src={img} className="w-full h-full object-cover opacity-100 group-hover:opacity-50 transition-opacity" />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                <X className="text-white drop-shadow-md" size={20} />
                                            </div>
                                            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                                        </button>
                                    ))}
                                    {/* Show deleted/hidden images? 
                                       Actually, since we filter them out of 'gallery', we can't show them to add back easily unless we store 'originalGallery'. 
                                       For now, this 'delete from session' approach is simple. 
                                       If user wants them back, they can re-select product from step 1 or we need 'originalGallery'.
                                       Let's assume for MVP, removing is key. Re-adding requires restart or stricter state.
                                    */}
                                </div>
                            </div>
                        )}
                        
                        {/* Prompt / Instructions */}
                        <div className="glass-panel p-6 rounded-3xl space-y-4 relative group">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <Sparkles className="text-amber-400" size={18}/> Dirección Creativa
                                </h3>
                                <button 
                                    onClick={() => setShowBrandManager(true)}
                                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 flex items-center gap-1 transition-all hover:bg-indigo-500/20"
                                >
                                    <User size={12} /> Mis Voces
                                </button>
                            </div>
                            
                            {/* Selected Persona Indicator */}
                            {selectedTone && !['Profesional', 'Divertido', 'Urgente', 'Inspirador'].includes(selectedTone) && (
                                <div className="bg-indigo-600/20 border border-indigo-500/50 p-2 rounded-lg flex items-center gap-2 mb-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                                        <Sparkles size={12} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-indigo-200 font-bold">Usando: {selectedTone}</p>
                                    </div>
                                    <button onClick={() => setSelectedTone('Profesional')} className="text-indigo-400 hover:text-white"><X size={14}/></button>
                                </div>
                            )}
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Instrucciones Especiales</label>
                                <textarea 
                                    className="glass-input w-full h-24 mt-2 resize-none" 
                                    placeholder="Ej: Hazlo sonar urgente, usa emojis de fuego, enfócate en el descuento..."
                                    value={customInstructions}
                                    onChange={(e) => setCustomInstructions(e.target.value)}
                                />
                            </div>
                             
                             {/* AI Generators */}
                            <div className="flex gap-4 pt-2">
                                <button 
                                    onClick={generateAICaption}
                                    disabled={loadingCaption}
                                    className="flex-1 bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loadingCaption ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                    Generar Copy Mágico
                                </button>
                                <button 
                                    onClick={handleAnalyzeImage}
                                    disabled={analyzingImage}
                                    className="px-4 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/20 rounded-xl font-bold transition-all disabled:opacity-50"
                                    title="Analizar Imagen con Visión"
                                >
                                    {analyzingImage ? <Loader2 className="animate-spin" /> : <ImagePlus size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="glass-panel p-6 rounded-3xl space-y-4">
                             <div className="flex justify-between">
                                 <h3 className="font-bold text-white">Editor de Texto</h3>
                                 <HashtagGenerator 
                                    product={selectedProduct?.name} 
                                    category={selectedProduct?.category}
                                    loading={loadingTags}
                                    onGenerate={generateAITags}
                                    onCopy={(tags) => setCaption(prev => prev + " " + tags)}
                                 />
                             </div>
                             <textarea 
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                className="glass-input w-full h-64 font-medium leading-relaxed"
                                placeholder="..."
                             />
                        </div>

                        {/* NEW: AUDIO & VOICEOVER SECTION */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-white flex items-center gap-2 px-1">
                                <Music size={18} className="text-pink-400" /> Audio Studio
                            </h3>
                            
                            {/* 1. Voiceover (TTS) */}
                            <VoiceoverPanel 
                                text={caption} 
                                onAudioGenerated={(config) => actions.setVoiceoverConfig(config)} 
                            />

                            {/* Subtitle Editor - Appears when voiceover is configured */}
                            {voiceoverConfig && (
                                <SubtitleEditor 
                                    initialText={caption}
                                    audioDuration={voiceoverConfig?.duration || (voiceoverConfig.text ? voiceoverConfig.text.length / 15 : 10)} 
                                    onSubtitlesChange={setSubtitles}
                                />
                            )}

                            {/* 2. Safe Music Selection */}
                            <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20">
                                <div className="flex items-center justify-between mb-4">
                                     <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                        <Volume2 size={16} className="text-indigo-400" /> Música de Fondo
                                     </h3>
                                     <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20">
                                        Royalty Free / Safe
                                     </span>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    <button 
                                        className={`p-3 rounded-xl border transition-all text-left flex flex-col items-center justify-center gap-2 ${!customAudioUrl && !audio ? 'bg-indigo-600 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                                        onClick={() => { setCustomAudioUrl(null); setAudio(null); }}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                                            <VolumeX size={14} className="text-slate-400"/>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-300">Silencio</span>
                                    </button>

                                    <button 
                                        className={`p-3 rounded-xl border transition-all text-left flex flex-col items-center justify-center gap-2 ${audio && !customAudioUrl ? 'bg-pink-600 border-pink-500 ring-2 ring-pink-500/20' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}
                                        onClick={() => setShowAudioLibrary(true)}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                                            <Music size={14} className="text-pink-400"/>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] font-bold text-white block">Biblioteca</span>
                                            {audio && <span className="text-[8px] text-pink-200 truncate max-w-[60px] block">Seleccionado</span>}
                                        </div>
                                    </button>

                                    <label className={`p-3 rounded-xl border transition-all text-left flex flex-col items-center justify-center gap-2 cursor-pointer ${customAudioUrl ? 'bg-emerald-600 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                                            <Upload size={14} className="text-emerald-400"/>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-300">Subir</span>
                                        <input type="file" className="hidden" accept="audio/*" onChange={(e) => {
                                            if(e.target.files[0]) {
                                               const url = URL.createObjectURL(e.target.files[0]);
                                               setCustomAudioUrl(url);
                                               setAudio(null); // Clear library selection
                                            }
                                        }} />
                                    </label>
                                </div>

                                {/* VOLUME FADER */}
                                {(audio || customAudioUrl) && (
                                    <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                            <span className="flex items-center gap-1"><Volume2 size={12}/> Volumen Fondo</span>
                                            <span>{Math.round(bgVolume * 100)}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="1" 
                                            step="0.01" 
                                            value={bgVolume} 
                                            onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

        {/* Audio Library Modal */}
        {showAudioLibrary && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-700 shadow-2xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Music className="text-pink-500" /> Biblioteca de Sonidos
                        </h3>
                        <button onClick={() => setShowAudioLibrary(false)} className="text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="grid gap-3">
                            {trendingAudio.map((track) => (
                                <button 
                                    key={track.id}
                                    onClick={() => {
                                        setAudio(track.id);
                                        setCustomAudioUrl(null); // Clear custom upload
                                        setShowAudioLibrary(false);
                                    }}
                                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${audio === track.id ? 'bg-pink-600/20 border-pink-500' : 'bg-slate-800 border-slate-700 hover:border-pink-500/50'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center shrink-0">
                                        <Play size={16} className="text-pink-400 ml-1" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className="font-bold text-white text-sm">{track.title}</h4>
                                        <p className="text-xs text-slate-400">{track.author || 'Viral Audio'} • {track.usage || 'Trending'}</p>
                                    </div>
                                    {audio === track.id && <CheckCircle2 className="text-pink-500" />}
                                </button>
                            ))}
                            {trendingAudio.length === 0 && (
                                <p className="text-center text-slate-500 py-10">Cargando audios...</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
                     </div>

                     {/* Right: Contextual Helper (ViralCoach) & Preview */}
                     <div className="lg:col-span-5 h-full flex flex-col gap-6">
                         
                         {/* 1. REAL-TIME PREVIEW (Sticky) */}
                         <div className="sticky top-6 z-20 flex justify-center">
                             <div className="w-[280px] h-[580px] rounded-[3rem] border-8 border-slate-900 bg-black overflow-hidden shadow-2xl relative ring-1 ring-slate-800">
                                 {/* Dynamic Island */}
                                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl z-50"></div>
                                 
                                 <PreviewPhone 
                                     contentType={contentType}
                                     content={caption}
                                     product={selectedProduct}
                                     // Resolve audio URL: Custom or Trending ID
                                     audio={customAudioUrl || (trendingAudio.find(a => a.id === audio)?.url)}
                                     bgVolume={bgVolume}
                                     voiceover={voiceoverConfig}
                                     subtitles={subtitles}
                                     hooks={[selectedHook || hook]}
                                     onSlideChange={() => {}}
                                 />
                             </div>
                         </div>

                         {/* 2. Viral Coach (Scrollable below preview) */}
                         <div className="space-y-6 pb-20">
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
                                    contentType={contentType} 
                                    hooks={hooksList}
                                    loadingHooks={loadingHooks}
                                    onRegenerateHooks={generateAIHooks}
                                    onSelectHook={setHook}
                                    selectedHook={hook}
                                    selectedTone={selectedTone} // Pass tone
                                    onSelectTone={setSelectedTone} // Pass tone setter
                                />
                            )}
                         </div>
                     </div>
                </div>
            )}

            {/* STEP 3: PREVIEW & LAUNCH */}
            {currentStep === 3 && (
                <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-2 gap-12 items-start h-full pb-20">
                     
                     {/* Left: Final Check Settings */}
                     <div className="space-y-8 lg:sticky lg:top-0">
                         <div className="glass-panel p-8 rounded-[40px] space-y-6 border border-indigo-500/30 shadow-[0_0_50px_rgba(79,70,229,0.1)]">
                             <div className="flex items-center gap-3 mb-4">
                                 <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/30">
                                     <RocketIcon size={24} />
                                 </div>
                                 <h2 className="text-2xl font-black text-white">Configuración de Despegue</h2>
                             </div>
                             
                             {/* Platform Select */}
                             <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Destinos</label>
                                 <PlatformSelector platforms={targetPlatforms} onToggle={handlePlatformToggle} />
                             </div>

                             {/* Date & Time */}
                             <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                 <div className="flex bg-slate-900 rounded-xl p-1 mb-4">
                                     <button onClick={() => setScheduleMode('now')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${scheduleMode === 'now' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500'}`}>Publicar Ahora</button>
                                     <button onClick={() => setScheduleMode('later')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${scheduleMode === 'later' ? 'bg-indigo-500 text-white shadow' : 'text-slate-500'}`}>Programar</button>
                                 </div>
                                 
                                 {scheduleMode === 'later' && (
                                     <input 
                                       type="datetime-local" 
                                       value={scheduledDate}
                                       onChange={(e) => setScheduledDate(e.target.value)}
                                       className="glass-input w-full text-center"
                                     />
                                 )}
                             </div>
                             
                             <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3">
                                 <div className="mt-1"><Clock className="text-blue-400" size={16}/></div>
                                 <p className="text-xs text-blue-200">
                                     Tu post se lanzará automáticamente en las plataformas seleccionadas. Asegúrate de que la imagen/video cumpla con las normas.
                                 </p>
                             </div>
                         </div>
                     </div>

                     {/* Right: Phone Preview */}
                     <div className="flex flex-col items-center justify-center">
                         <h3 className="text-slate-500 font-bold uppercase tracking-widest mb-6 text-sm">Previsualización Real</h3>
                         <div className="zoom-in-95 origin-top transition-transform duration-500">
                            <PreviewPhone 
                                type={targetPlatforms.instagram ? 'instagram' : 'facebook'} 
                                contentType={contentType} 
                                content={caption} 
                                product={selectedProduct} 
                                audio={customAudioUrl || (trendingAudio.find(a => a.id === audio)?.url)} 
                                bgVolume={bgVolume}
                                voiceover={voiceoverConfig}
                                subtitles={subtitles} 
                                hooks={hook} 
                            />
                         </div>
                         {selectedProduct && contentType === 'photo' && (
                           <button 
                             onClick={() => { setEditingImage(selectedProduct.image_url); setShowEditor(true); }}
                             className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                           >
                             <Edit2 size={16} /> Retocar Imagen
                           </button>
                         )}
                     </div>
                </div>
            )}

         </div>
      </div>
       
       {/* Modals */}
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
