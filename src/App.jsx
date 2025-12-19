import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

import { supabase, storeClient } from './lib/supabase';
import { generateViralStrategy, generateCaption, initAI, verifyConnection, debugModels, generateHashtags, analyzeBrandVoice, analyzeImageQuality } from './services/ai.js';
import { facebookService } from './services/social/facebook';
import { instagramService } from './services/social/instagram';
import PageSelector from './components/PageSelector';
import PlatformSelector from './components/PlatformSelector';
import ImageEditor from './components/ImageEditor';
import CalendarView from './components/CalendarView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ProductManager from './components/ProductManager';
import SocialInbox from './components/SocialInbox';
import BriefExport from './components/BriefExport';
import SocialListening from './components/SocialListening';
import BrandVoiceTrainer from './components/BrandVoiceTrainer';
import VideoScriptPanel from './components/VideoScriptPanel';
import CritiqueModal from './components/CritiqueModal';


import { tiktokService } from './services/social/tiktok';
import { whatsappService } from './services/social/whatsapp';
import { aiResponder } from './services/aiResponder';
import { 
  LayoutDashboard, 
  Plane, 
  ShoppingBag, 
  BarChart3, 
  Instagram, 
  Facebook, 
  Send, 
  Sparkles, 
  TrendingUp, 
  Music, 
  Video, 
  Zap,
  CheckCircle2,
  Menu,
  X,
  Copy,
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Smartphone,
  Download,
  Calendar,
  Rocket,
  RefreshCw,
  Loader2,
  Settings,
  Key,
  Upload,
  Save,
  Sliders,
  Package,
  ChevronDown,
  ChevronUp,
  Heading,
  ImagePlus,
  ChevronRight,
  ChevronLeft,
  Tag,
  Monitor,
  Apple,
  Trash2,
  Pause,
  Volume2,
  VolumeX,
  Play,
  Clock,
  DollarSign, // NEW
  Edit2,       // NEW
  Sun,
  Maximize
} from 'lucide-react';

// --- Datos Simulados "Live" ---

// MOCK_PRODUCTS removed in favor of Supabase fetching

const DEFAULT_HOOKS = [
  "🛑 ¡Deja de hacer scroll! Tienes que ver esto.",
  "🤫 El secreto que las tiendas no quieren que sepas...",
  "Pov: Encontraste el regalo perfecto por menos de $50."
];

// TRENDING_AUDIO moved to tiktokService

// --- Componentes Auxiliares ---

const SuccessModal = ({ onClose, platform }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl shadow-indigo-500/20 transform transition-all scale-100 relative">
      <div className="absolute -inset-4 border-8 border-indigo-500/30 rounded-full animate-pulse"></div>
      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-emerald-500/30">
        <Rocket size={40} className="text-emerald-400 animate-bounce" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">¡Lanzamiento Exitoso!</h3>
      <p className="text-slate-400 mb-6 font-light">
        Tu contenido ha sido programado en <span className="font-bold capitalize text-indigo-400">{platform}</span>. El algoritmo va a amarlo.
      </p>
      <button 
        onClick={onClose}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/40"
      >
        Volver al Panel
      </button>
    </div>
  </div>
);

const DownloadModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
    <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
        <X size={24} />
      </button>
      <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-indigo-500/30">
        <Smartphone size={32} className="text-indigo-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Lleva Next Plane contigo</h3>
      <p className="text-slate-400 mb-6 font-light">Escanea para descargar la App de gestión en iOS y Android.</p>
      
      <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-lg">
        {/* Fake QR Code Pattern */}
        <div className="grid grid-cols-5 gap-1 w-32 h-32">
           {[...Array(25)].map((_, i) => (
             <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`}></div>
           ))}
        </div>
      </div>
      
      <div className="flex gap-3 justify-center">
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors">
           <span></span> App Store
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors">
           <span>▶</span> Google Play
        </button>
      </div>
    </div>
  </div>
);

// --- Componentes Principales ---

const Sidebar = ({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen, onDownloadClick, pageName }) => {
  const menuItems = [
    { id: 'create', label: 'Estudio Viral', icon: <Zap size={20} className="text-amber-400" /> },
    { id: 'dashboard', label: 'Panel General', icon: <LayoutDashboard size={20} /> },
    { id: 'calendar', label: 'Calendario', icon: <Calendar size={20} className="text-amber-400" /> },
    { id: 'inbox', label: 'Mensajes', icon: <MessageCircle size={20} className="text-indigo-400" /> },
    { id: 'listening', label: 'Listening', icon: <TrendingUp size={20} className="text-emerald-400" /> },
    { id: 'training', label: 'Entrenador', icon: <Sparkles size={20} className="text-violet-400" /> },
    { id: 'analytics', label: 'Analítica', icon: <BarChart3 size={20} className="text-pink-400" /> },
    { id: 'products', label: 'Productos', icon: <ShoppingBag size={20} /> },
    { id: 'settings', label: 'Configuración', icon: <Settings size={20} className="text-slate-400" /> },
  ];

  return (
    <>
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />}
      <div className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-950 border-r border-slate-800 text-white z-30 transform transition-transform duration-300 flex flex-col ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="relative group">
              <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-50 rounded-full group-hover:opacity-75 transition-opacity"></div>
              <img src="/logo.png" alt="Yaminator" className="w-10 h-10 rounded-full relative z-10 border-2 border-indigo-500/50 shadow-inner object-cover bg-slate-950" />
            </div>
            <span className="bg-linear-to-r from-white to-slate-400 bg-clip-text text-transparent transform translate-y-0.5">Yaminator</span>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-slate-400"><X size={24} /></button>
        </div>
        
      {/* Active Workspace Indicator */}
      {pageName && (
        <div className="mx-4 mt-2 mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-500">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-blue-500/20">
                {pageName.substring(0, 2).toUpperCase()}
             </div>
             <div className="overflow-hidden">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Conectado a:</p>
                <p className="text-sm font-bold text-white truncate">{pageName}</p>
             </div>
           </div>
           
           {/* Instagram Status */}
           {localStorage.getItem('meta_instagram_id') && (
              <div className="flex items-center gap-2 pl-11">
                 <div className="w-4 h-4 rounded-full bg-linear-to-tr from-yellow-500 to-purple-600 flex items-center justify-center">
                    <Instagram size={10} className="text-white" />
                 </div>
                 <span className="text-[10px] text-slate-400 font-medium">Instagram Vinculado</span>
              </div>
           )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
              className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all ${
                activeTab === item.id 
                  ? 'bg-linear-to-tr from-indigo-500/20 to-violet-500/20 text-white border border-white/10 shadow-lg shadow-indigo-500/10' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-white border border-transparent'
              }`} >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 shrink-0 space-y-4">
          <button 
            onClick={() => { onDownloadClick(); setMobileMenuOpen(false); }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors text-sm font-medium border border-slate-800"
          >
            <Download size={16} />
            Instalar App
          </button>

          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 opacity-10">
                <TrendingUp size={60} />
             </div>
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Puntuación Viral</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-emerald-400">92</span>
              <span className="text-xs text-slate-500 mb-1 font-bold">/ 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[92%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const ViralCoach = ({ hooks, onSelectHook, onSelectAudio, contentType, onRegenerateHooks, loadingHooks, trendingAudio, selectedTone, onSelectTone, strategy, product }) => {
  const tones = ["Sarcástico", "Profesional", "Urgente", "Amigable", "Polémico"];

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-800/50 shadow-lg space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Sparkles className="text-amber-300" size={20} />
        <h3 className="font-bold text-slate-200">IA Viral Coach</h3>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">
          Vibe / Tono
        </label>
        <div className="flex flex-wrap gap-2">
          {(() => {
             // Combine default tones with Custom Presets from LocalStorage
             const presets = JSON.parse(localStorage.getItem('ai_presets') || '[]');
             const presetNames = presets.map(p => p.name);
             const allTones = ["Sarcástico", "Profesional", "Urgente", "Amigable", "Polémico", ...presetNames];
             
             return allTones.map(t => {
               // Check if it's a custom preset to render it differently (gold border?)
               const isCustom = presetNames.includes(t);
               return (
                 <button
                   key={t}
                   onClick={() => {
                        // If it's a preset, we need to pass the FULL instruction, not just the name.
                        // But wait, our parent (CreateStudio) calls `generateViralStrategy(..., selectedTone, ...)`
                        // And `ai.js` now handles customs.
                        // So we just need to ensure that if I select "Mi Estilo", the `selectedTone` state becomes the INSTRUCTION, not the name?
                        // OR, we update `ai.js` to look up the preset?
                        // SIMPLER APPROACH: Pass the instruction text properly to the parent state.
                        
                        if (isCustom) {
                            const preset = presets.find(p => p.name === t);
                            // We pass the instruction text as the 'tone'
                            // But we want the UI to show the NAME selected.
                            // This requires a minor refactor in App state or just dealing with it.
                            // Let's pass the INSTRUCTION text. 
                            // *Wait*, if we pass the instruction text, the button rendering logic (selectedTone === t) will FAIL because state != name.
                            // Better: Keep state as Name, look up instruction when Generating.
                            onSelectTone(t); 
                        } else {
                            onSelectTone(t);
                        }
                   }}
                   className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                     selectedTone === t 
                       ? 'bg-indigo-500 text-white border-indigo-400 shadow-custom' 
                       : isCustom 
                         ? 'bg-slate-800 text-amber-400 border-amber-500/30 hover:border-amber-500/50'
                         : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
                   }`}
                 >
                   {isCustom && <Sparkles size={10} />}
                   {t}
                 </button>
               );
             });
          })()}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {contentType === 'video' ? 'Hooks (3s Rule)' : 'Titulares de Impacto'}
          </p>
          <button 
            onClick={onRegenerateHooks} 
            disabled={loadingHooks}
            className="text-indigo-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors disabled:opacity-50"
            title="Generar nuevas ideas con Gemini"
          >
            {loadingHooks ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>
        
        <div className="space-y-2">
          {hooks.slice(0, 3).map((hook, idx) => (
            <button 
              key={idx}
              onClick={() => onSelectHook(hook)}
              className="w-full text-left p-3 text-sm bg-slate-800/50 hover:bg-indigo-600/10 hover:text-indigo-300 text-slate-300 rounded-lg transition-all border border-slate-700/50 hover:border-indigo-500/30 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 w-[2px] h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="font-medium leading-relaxed">{hook.replace('[PROBLEMA]', 'perder dinero')}</span>
              <span className="hidden group-hover:block absolute right-2 top-2 text-[10px] uppercase font-bold text-indigo-400 bg-indigo-400/10 px-1.5 rounded">Usar</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Audio Trending 🎵</p>
        <div className="space-y-2">
          {trendingAudio.map((audio) => (
            <button 
              key={audio.id}
              onClick={() => onSelectAudio(audio.name)}
              className="w-full flex items-center justify-between p-2.5 text-sm border border-slate-800 rounded-lg hover:border-pink-500/30 hover:bg-pink-500/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
                   {audio.trending ? <TrendingUp size={14} /> : <Music size={14} />}
                </div>
                <div className="text-left">
                  <span className="text-slate-300 block font-medium group-hover:text-pink-300 transition-colors">{audio.name}</span>
                  <span className="text-xs text-slate-500">{audio.uses} videos</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-pink-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      <BriefExport strategy={strategy} product={product} tone={selectedTone} />
    </div>
  );
};

const HashtagGenerator = ({ product, category, onCopy, onGenerate, loading }) => {
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> Hashtags Inteligentes
        </label>
        <button 
          onClick={onGenerate} 
          disabled={!product || loading}
          className="text-xs text-indigo-400 font-bold hover:text-indigo-300 disabled:opacity-50 flex items-center gap-1 transition-colors"
        >
          {loading ? (
            <><Loader2 size={12} className="animate-spin" /> Analizando...</>
          ) : (
            <><Sparkles size={12} /> Generar Tags</>
          )}
        </button>
      </div>
      
      <div className="bg-slate-900/50 p-4 rounded-xl border border-dashed border-slate-700 min-h-[80px] relative group hover:border-indigo-500/30 transition-colors">
        <p className="text-xs text-slate-600 italic mb-2 text-center mt-2 select-none" id="hashtag-placeholder">
           {loading ? "Gemini está analizando tendencias..." : "Los hashtags optimizados aparecerán aquí"}
        </p>
        <div id="hashtag-result" className="flex flex-wrap gap-2 justify-center"></div>
      </div>
    </div>
  );
};

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
    <div className="mx-auto w-[280px] h-[550px] bg-black rounded-[40px] overflow-hidden border-8 border-slate-900 shadow-2xl relative transition-all duration-300 ring-1 ring-slate-800">
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
            <div className="px-4 pb-4">
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
            <p className="text-xs leading-snug pr-12 line-clamp-2 opacity-90 mb-3">
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

import { uploadMedia } from './services/storage';
import imageCompression from 'browser-image-compression';

const CreateStudio = ({ 
  onSchedule, 
  apiKey, 
  onPageConnect,
  products, setProducts,
  selectedProduct, setSelectedProduct,
  caption, setCaption,
  generatedHashtags, setGeneratedHashtags,
  // Video Props
  videoScript, 
  selectedHook, 
  setSelectedHook,
  onGenerateScript,
  // Art Critic Props (Lifted)
  onAnalyzeImage,
  analyzingImage
}) => {

  
  // Settings States

  const [uploading, setUploading] = useState(false);
  const [editingImage, setEditingImage] = useState(null); // URL of image to edit
  const [showEditor, setShowEditor] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false); // Collapsed by default as requested
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // NEW: Image Analysis State (Sales Art Critic)
  // State lifted to App component to share with Modal
  
  const handleAnalyzeImage = () => {
      onAnalyzeImage && onAnalyzeImage();
  };

  // Brand Voice Presets (Local for now)
  const [savedPresets, setSavedPresets] = useState(() => JSON.parse(localStorage.getItem('ai_presets') || '[]'));
  useEffect(() => { localStorage.setItem('ai_presets', JSON.stringify(savedPresets)); }, [savedPresets]);

  // Scheduling State
  const [scheduleMode, setScheduleMode] = useState('now'); // 'now', 'later'
  const [scheduledDate, setScheduledDate] = useState(''); // ISO string YYYY-MM-DDTHH:mm

  // ... (useEffects)

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);

      // Filter and process files
      const processedFilesPromises = files.map(async (file) => {
          // VIDEO CHECK
          if (file.type.startsWith('video/')) {
             if (file.size > 100 * 1024 * 1024) { // 100MB Limit Warning
                 if (!confirm(`El video "${file.name}" pesa ${Math.round(file.size/1024/1024)}MB. Puede tardar en subir. ¿Continuar?`)) {
                    return null; // Skip this file
                 }
             }
             return file;
          }
          
          // IMAGE COMPRESSION
          if (file.type.startsWith('image/')) {
             try {
               const options = {
                 maxSizeMB: 1,
                 maxWidthOrHeight: 1920,
                 useWebWorker: true,
                 fileType: file.type // Preserve original type
               };
               const compressedFile = await imageCompression(file, options);
               console.log(`Compresión: ${(file.size/1024/1024).toFixed(2)}MB -> ${(compressedFile.size/1024/1024).toFixed(2)}MB`);
               return compressedFile;
             } catch (error) {
               console.warn("Fallo compresión, usando original:", error);
               return file;
             }
          }

          return file; 
      });

      const filesToUpload = (await Promise.all(processedFilesPromises)).filter(f => f !== null);

      if (filesToUpload.length === 0) {
        setUploading(false);
        return;
      }

      // Upload all files in parallel
      const uploadPromises = filesToUpload.map(file => uploadMedia(file));
      const publicUrls = await Promise.all(uploadPromises);
      
      // Smart Thumbnail Logic: Find first image, otherwise use first file
      let thumbnail = publicUrls[0];
      const videoExtensions = ['.mp4', '.webm', '.mov'];
      
      // If first file is video, look for an image
      const isFirstVideo = videoExtensions.some(ext => publicUrls[0].toLowerCase().endsWith(ext));
      if (isFirstVideo) {
         // Try to find an image in the gallery
         const firstImage = publicUrls.find(url => !videoExtensions.some(ext => url.toLowerCase().endsWith(ext)));
         if (firstImage) {
            thumbnail = firstImage;
         }
      }

      const newProductData = {
        name: files.length > 1 ? `Galería (${files.length} items)` : 'Producto Personalizado',
        price: 0.00,
        category: 'Carga Rápida',
        image_url: thumbnail, // Uses an image for thumbnail if available
        gallery: publicUrls,  // Keeps original order
        image_color: 'bg-indigo-500/20' // Default fallback
      };

      // 1. Save to Supabase (Persistence)
      const { data: savedProduct, error } = await supabase
        .from('products')
        .insert([newProductData])
        .select()
        .single();
      
      if (error) {
         console.error("Error saving product:", error);
         // Fallback to local state if DB fails (or create custom object)
         const customProduct = {
            id: 'custom-' + Date.now(),
            ...newProductData,
            type: files[0].type.startsWith('video') ? 'video' : 'photo'
         };
         setProducts([customProduct, ...products]);
         setSelectedProduct(customProduct);
         alert("Imagen subida pero no se pudo guardar en base de datos: " + error.message);
      } else {
         // 2. Update Local State with DB Data
         const finalProduct = {
             ...savedProduct,
             isLocal: true,
             type: files[0].type.startsWith('video') ? 'video' : 'photo'
         };
         setProducts([finalProduct, ...products]);
         setSelectedProduct(finalProduct);
      }

      
      // Auto-set content type
      setContentType(files[0].type.startsWith('video') ? 'video' : 'photo');

    } catch (error) {
      alert("Error subiendo archivos: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (e, product) => {
    e.stopPropagation(); // Prevent selection
    if (!product.isLocal) return; // Basic safety check
    
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', product.id);
            
            if (error) throw error;
            
            // Update local state
            setProducts(prevProducts => prevProducts.filter(p => p.id !== product.id));
            if (selectedProduct?.id === product.id) {
                setSelectedProduct(null);
            }
        } catch (err) {
            alert("Error eliminando producto: " + err.message);
        }
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      // Fetch both sources in parallel
      const [localRes, storeRes] = await Promise.all([
         supabase.from('products').select('*'),
         storeClient ? storeClient.from('products').select('*') : Promise.resolve({ data: [] })
      ]);

      const allProducts = [];

      // Process Local
      if (localRes.error) {
         console.error("Local fetch error:", localRes.error);
      } else if (localRes.data) {
         allProducts.push(...localRes.data.map(p => ({
            ...p, 
            isLocal: true,
            image_url: p.image_url || p.image_color
         })));
      }

      // Process External
      if (storeRes && storeRes.error) {
         console.error("Store fetch error:", storeRes.error);
      } else if (storeRes && storeRes.data) {
         const storeMapped = storeRes.data.map(p => ({
            ...p,
            original_id: p.id,
            id: 'store-' + p.id, // Client-side ID
            isLocal: false,
            image_url: p.image || p.image_url 
         }));
         allProducts.push(...storeMapped);
      }
      
      // Set state ONCE to avoid race conditions/duplicates
      setProducts(allProducts);
    };
    fetchProducts();
  }, []);
  // Multi-Platform State
  const [targetPlatforms, setTargetPlatforms] = useState({ instagram: true, facebook: false });
  const [contentType, setContentType] = useState('photo'); // Default to photo

  const [hook, setHook] = useState('');
  const [audio, setAudio] = useState('');
  
  // Estados para IA
  const [selectedTone, setSelectedTone] = useState("Profesional");
  const [customInstructions, setCustomInstructions] = useState("");
  const [trendingAudio, setTrendingAudio] = useState([]);
  const [hooksList, setHooksList] = useState(DEFAULT_HOOKS);
  const [currentStrategy, setCurrentStrategy] = useState(null);

  // Load Trending Audio
  useEffect(() => {
    const loadAudio = async () => {
      const audioList = await tiktokService.getTrendingAudio();
      setTrendingAudio(audioList);
    };
    loadAudio();
  }, []);
  const [loadingHooks, setLoadingHooks] = useState(false);
  const [loadingCaption, setLoadingCaption] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);


  // Facebook/Instagram Page Selection State
  const [pages, setPages] = useState([]);
  const [showPageSelector, setShowPageSelector] = useState(false);
  const [pendingAccessToken, setPendingAccessToken] = useState(null);

  // Handle Facebook Auth Callback on Mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = facebookService.handleAuthCallback();
      if (token) {
        console.log("Logged in with Facebook! Token caught.");
        setPendingAccessToken(token);
        // localStorage.setItem("meta_access_token", token); // don't save yet, wait for page select
        
        try {
          const fetchedPages = await facebookService.getPages(token);
          if (fetchedPages.length === 0) {
            alert("No se encontraron páginas de Facebook administradas por este usuario.");
          } else {
            setPages(fetchedPages);
            setShowPageSelector(true);
          }
        } catch (error) {
          alert("Error fetching pages: " + error.message);
        }
      }
    };
    checkAuth();
  }, []);

  const handlePageSelect = async (page) => {
    // Save everything needed for future API calls
    const token = page.access_token || pendingAccessToken;
    localStorage.setItem("meta_access_token", token);
    localStorage.setItem("meta_page_id", page.id);
    localStorage.setItem("meta_page_name", page.name);
    
    // Update App State
    if(onPageConnect) {
        onPageConnect(page); // Let parent handle state updates
    }

    // Check for linked Instagram Account
    try {
        const igUserId = await instagramService.getInstagramAccount(token, page.id);
        if (igUserId) {
            localStorage.setItem("meta_instagram_id", igUserId);
            console.log("Found linked Instagram Account:", igUserId);
        } else {
            console.log("No linked Instagram Account found for this page.");
            localStorage.removeItem("meta_instagram_id"); // Clear old if any
        }

        setShowPageSelector(false);
        alert(`¡Conectado a ${page.name}!\n${igUserId ? '✅ Instagram Business vinculado también.' : '⚠️ No se detectó Instagram vinculado.'}`);

    } catch (error) {
        console.error("Error checking Instagram:", error);
        setShowPageSelector(false);
        alert(`¡Conectado a ${page.name}!, pero hubo un error verificando Instagram.`);
    }
  };


  const handleHookSelect = (h) => {
    setHook(h);
    if (!caption && contentType === 'photo') setCaption(h + " ");
  };

  // Platform toggle handler
  const handlePlatformToggle = (id) => {
    setTargetPlatforms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleScheduleClick = async () => {
    if (!selectedProduct) {
        alert("Selecciona un producto primero");
        return;
    }

    if (scheduleMode === 'later' && !scheduledDate) {
       alert("Selecciona una fecha y hora para programar.");
       return;
    }

    setUploading(true);
    let results = [];
    let errors = [];
    const isScheduled = scheduleMode === 'later';
    const finalDate = isScheduled ? new Date(scheduledDate).toISOString() : new Date().toISOString();

    try {
    // 4. Final Data Assembly
    let finalCaption = caption;

    // AUTO-APPEND HASHTAGS: If AI generated tags and they aren't in the text, add them.
    if (generatedHashtags && !finalCaption.includes(generatedHashtags)) {
        console.log("Auto-appending AI Hashtags...");
        finalCaption += "\n\n" + generatedHashtags;
    }

    const postData = {
        caption: finalCaption,
        video: null,
        image: selectedProduct.image_url, 
        // hashtags: hashtags || "", // REMOVED: Caused ReferenceError
        targetPlatforms: targetPlatforms,
        date: finalDate,
        product: selectedProduct // ADDED: For Relaunch functionality
    };
      
      // IF SCHEDULED: Skip immediate API calls
      if (isScheduled) {
         results.push("Programado (Simulado)");
         // In a real app, this would use a Cron Job or Supabase function
      } else {
         // IMMEDIATE PUBLISH
         console.log("🚀 Launching Multi-Platform Campaign...", targetPlatforms);

        // --- INSTAGRAM ---
        if (targetPlatforms.instagram) {
            try {
                const token = localStorage.getItem("meta_page_access_token") || localStorage.getItem("meta_access_token");
                const pageId = localStorage.getItem("meta_page_id");
                const igUserId = localStorage.getItem("meta_instagram_id") || await instagramService.getInstagramAccount(token, pageId);
                
                if (igUserId && token) {
                    // Check if it's a multi-image product (gallery)
                    if (selectedProduct.gallery && selectedProduct.gallery.length > 1 && contentType === 'photo') {
                        console.log("Posting Carousel...", selectedProduct.gallery);
                        await instagramService.publishCarousel(token, igUserId, selectedProduct.gallery, postData.caption);
                    } else {
                        await instagramService.publishPhoto(token, igUserId, selectedProduct.image_url, postData.caption);
                    }
                    results.push("Instagram");
                } else {
                    throw new Error("No hay cuenta de Instagram vinculada.");
                }
            } catch (e) {
                console.error("IG Error:", e);
                errors.push(`Instagram: ${e.message}`);
            }
        }

        // --- FACEBOOK PAGE ---
        if (targetPlatforms.facebook) {
            try {
                const token = localStorage.getItem("meta_page_access_token") || localStorage.getItem("meta_access_token");
                const pageId = localStorage.getItem("meta_page_id");
                
                if (pageId && token) {
                    await facebookService.postToFacebook(postData.caption, selectedProduct.image_url, pageId, token);
                    results.push(`Facebook`);
                } else {
                    throw new Error("No hay página de Facebook configurada.");
                }
            } catch (e) {
                console.error("FB Error:", e);
                errors.push(`Facebook: ${e.message}`);
            }
        }
        }
        
        // --- WHATSAPP ---
        if (targetPlatforms.whatsapp) {
          try {
             const message = `${postData.caption}\n\n${selectedProduct.image_url}`;
             const link = whatsappService.getShareLink(message);
             // Use Electron shell if available to open external, otherwise window.open
             if (window.electronAPI) {
                 window.electronAPI.openExternal(link);
             } else {
                 window.open(link, '_blank');
             }
             results.push("WhatsApp");
          } catch(e) {
             console.error("WhatsApp Error:", e);
             errors.push("WhatsApp: " + e.message);
          }
        }

      // 2b. Register in Supabase (Always, for history or schedule)
      // Only if success or scheduled
      if (results.length > 0) {
        try {
            const dbPost = {
                product_id: selectedProduct.id,
                platform: Object.keys(targetPlatforms).filter(k => targetPlatforms[k]).join(','), 
                content_type: contentType,
                image_url: selectedProduct.image_url,
                caption: caption,
                scheduled_date: finalDate,
                status: isScheduled ? 'scheduled' : 'published'
            };
            if (supabase) {
                await supabase.from('posts').insert([dbPost]);
                
                // Refresh local timeline if needed
                onSchedule({ ...postData, ...dbPost, product: selectedProduct });
            }
        } catch(dbErr) {
            console.error("DB Save Error:", dbErr);
        }
      }

      // 3. Report Results
      setUploading(false);
      
      let message = "";
      if (isScheduled) {
         message = `📅 Post programado para: ${new Date(finalDate).toLocaleString()}`;
      } else {
         if (results.length > 0) message += `✅ Éxito en: ${results.join(', ')}\n`;
         if (errors.length > 0) message += `❌ Errores:\n${errors.join('\n')}`;
      }
      
      alert(message || "Selecciona al menos una plataforma.");

    } catch (e) {
      console.error("Critical Error:", e);
      setUploading(false);
      alert("Error crítico: " + e.message);
    }
  };


  const generateAIHooks = async () => {
    if (!selectedProduct || !apiKey) {
      alert("Selecciona un producto y configura tu API Key de Gemini");
      return;
    }
    
    setLoadingHooks(true);
    try {
      // Determine effective tone (Preset instructions or Standard Tone key)
      let effectiveTone = selectedTone;
      const presets = JSON.parse(localStorage.getItem('ai_presets') || '[]');
      const matchingPreset = presets.find(p => p.name === selectedTone);
      
      if (matchingPreset) {
         console.log("Using Custom Voice Preset:", matchingPreset.name);
         effectiveTone = matchingPreset.text; // Pass full system instruction
      }

      // Use the new Advanced Strategy Generator
      const strategy = await generateViralStrategy(
        selectedProduct, 
        effectiveTone, 
        selectedProduct.image_url, 
        customInstructions,
        caption // Pass current caption as optional context
      );
      setHooksList(strategy.hook_options);
      
      // Auto-fill other fields based on strategy
      // if (strategy.caption) setCaption(strategy.caption); // DISABLED: Don't overwrite creative caption
      
      // Store the full strategy in a temporary state or just log it for now
      setCurrentStrategy(strategy);
      console.log("Viral Strategy:", strategy);
      alert(`¡Estrategia Viral Generada!\n\nÁngulo: ${strategy.angle}\nConcepto Visual: ${strategy.visual_concept}`);

    } catch (error) {
      console.error("Error generating AI content:", error);
      alert("Error generando contenido. Revisa tu API Key.");
    } finally {
      setLoadingHooks(false);
    }
  };

  // Video Script Generator (New Wrapper)
  const generateVideoScript = async () => {
      await generateAIHooks();
      // The generateAIHooks function now sets currentStrategy, which we can map to videoScript structure
      // But purely for UI separation, let's extract it here if needed, or just rely on currentStrategy
  };

  const generateAICaption = async () => {
    if (!selectedProduct) return;
    setLoadingCaption(true);
    
    try {
        // Determine effective tone (Preset instructions or Standard Tone key)
        let effectiveTone = selectedTone;
        const presets = JSON.parse(localStorage.getItem('ai_presets') || '[]');
        const matchingPreset = presets.find(p => p.name === selectedTone);
        
        if (matchingPreset) {
           effectiveTone = matchingPreset.text; 
        }

       const newCaption = await generateCaption(
         selectedProduct, 
         contentType === 'video' ? 'TikTok' : 'Instagram', 
         effectiveTone, 
         customInstructions,
         selectedProduct.image_url // Pass the image for visual analysis
       );
       setCaption(newCaption);
    } catch (error) {
      console.error("Error generating caption:", error);
    } finally {
      setLoadingCaption(false);
    }
  };

  const generateAITags = async () => {
    if (!selectedProduct) return;
    setLoadingTags(true);
    try {
       // Determine effective tone (Preset instructions or Standard Tone key)
       let effectiveTone = selectedTone;
       const presets = JSON.parse(localStorage.getItem('ai_presets') || '[]');
       const matchingPreset = presets.find(p => p.name === selectedTone);
       
       if (matchingPreset) {
          effectiveTone = matchingPreset.text; 
       }

       const text = await generateHashtags(
         selectedProduct, 
         'instagram', 
         effectiveTone, 
         selectedProduct.image_url, // Pass Image
         caption, // Pass Caption Context
         hooksList.join(' | ') // Pass Hooks Context
       );
       setGeneratedHashtags(text); // Save for auto-append
      
      const container = document.getElementById('hashtag-result');
      const placeholder = document.getElementById('hashtag-placeholder');
      if (placeholder) placeholder.style.display = 'none';
      if (container) {
        container.innerHTML = '';
        text.split(' ').forEach((tag, i) => {
          if(!tag.trim()) return;
          const span = document.createElement('button');
          span.className = "text-[11px] bg-slate-800 text-indigo-400 px-3 py-1.5 rounded-full border border-slate-700 font-bold hover:bg-indigo-500 hover:text-white transition-all animate-in zoom-in duration-300";
          span.style.animationDelay = `${i * 100}ms`;
          span.innerText = tag;
          span.onclick = () => setCaption(prev => prev + " " + tag);
          container.appendChild(span);
        });
      }
    } catch (error) { 
        console.error("Error generating tags:", error);
        alert("Error: Verifica tu API Key");
    } finally {
      setLoadingTags(false);
    }
  };



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
              <button 
                onClick={() => setShowCatalog(!showCatalog)}
                className="w-full flex items-center justify-between mb-3 pl-1 group hover:bg-slate-800/50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-800"
              >
                 <div className="flex items-center gap-2">
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg"><ShoppingBag size={16} className="text-emerald-400"/></div>
                    <label className="block text-sm font-bold text-slate-300 uppercase tracking-wide cursor-pointer group-hover:text-white transition-colors">
                       Catálogo Web
                    </label>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700">
                        <span className="text-[10px] text-slate-400 font-mono">{products.filter(p => !p.isLocal).length} WEB</span>
                    </div>
                    {showCatalog ? <ChevronUp size={16} className="text-slate-500"/> : <ChevronDown size={16} className="text-slate-500"/>}
                </div>
              </button>
              
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
                         // Also update in the main list so the grid reflects changes
                         setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, name: newName } : p));
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
                              setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, category: newCat } : p));
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
                             setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, price: newPrice } : p));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-8 text-white focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                        />
                     </div>
                 </div>
              </div>
               
               <button 
                  onClick={async () => {
                     if(!selectedProduct.name) return alert("Ponle un nombre al producto");
                     
                     const productData = {
                        name: selectedProduct.name,
                        price: parseFloat(selectedProduct.price) || 0,
                        category: selectedProduct.category || 'General',
                        image_url: selectedProduct.image_url,
                        gallery: selectedProduct.gallery || []
                     };

                     try {
                        let result;
                        
                        // Check if it's already a real DB item (has numeric ID or we treat it as existing)
                        // Note: handleFileUpload already saves it, so it likely has an ID.
                        // We check if it is a 'local' temp ID or a real DB ID. 
                        // Supabase IDs are usually numbers (bigint). simpler check: if it has an ID, try update.
                        
                        if (selectedProduct.id && typeof selectedProduct.id === 'number') {
                            // UPDATE
                            const { data, error } = await supabase
                                .from('products')
                                .update(productData)
                                .eq('id', selectedProduct.id)
                                .select();
                                
                            if(error) throw error;
                            
                            // Check if update returned data
                            if (data && data.length > 0) {
                                result = data[0]; 
                            } else {
                                // Fallback: Maybe ID was not found? Try Insert?
                                console.warn("Update returned no rows. Attempting Insert.");
                                const ins = await supabase
                                   .from('products')
                                   .insert([productData])
                                   .select();
                                
                                if(ins.error) throw ins.error;
                                result = ins.data[0];
                            }

                            alert("✅ ¡Producto Actualizado!");
                            
                            // Update list
                            setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...result, isLocal: true } : p));
                        } else {
                            // INSERT (Fresh save)
                            const { data, error } = await supabase
                                .from('products')
                                .insert([productData])
                                .select();
                                
                            if(error) throw error;
                            result = data[0];
                            alert("✅ ¡Producto Guardado!");
                            
                            // Add to list
                            setProducts(prev => [...prev, { ...result, isLocal: true }]);
                        }

                        // Sync current selection
                        setSelectedProduct({ ...result, isLocal: true });

                     } catch(err) {
                        alert("Error guardando: " + err.message);
                     }
                  }}
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
          

          {contentType === 'video' ? (
            <VideoScriptPanel 
               strategy={videoScript} 
               loading={loadingHooks}
               onGenerate={onGenerateScript}
               onSelectHook={setSelectedHook}
               selectedHook={selectedHook} 
            />
          ) : (
            <ViralCoach
                trendingAudio={trendingAudio}
                hooks={hooksList}
                onRegenerateHooks={onGenerateScript}
                loadingHooks={loadingHooks}
                onSelectHook={setSelectedHook}
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
          onSave={async (file) => {
             setUploading(true);
             try {
                const newUrl = await uploadMedia(file);
                // Update selected product with new image
                setSelectedProduct(prev => ({
                   ...prev,
                   image_url: newUrl,
                   // If it was local, we keep it local but updated
                }));
                setShowEditor(false);
                alert("✨ Imagen editada y guardada.");
             } catch(e) {
                alert("Error guardando imagen: " + e.message);
             } finally {
                setUploading(false);
             }
          }}
        />
      )}
      <CritiqueModal critique={critique} onClose={() => setCritique(null)} />
    </div>
  );
};



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
                             <img src={post.image} alt="Product" className="w-full h-full object-cover" />
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

const SettingsView = ({ 
  apiKey, setApiKey, 
  metaAppId, setMetaAppId, 
  metaAppSecret, setMetaAppSecret,
  metaAccessToken, setMetaAccessToken,
  metaPageId, setMetaPageId,
  tiktokKey, setTiktokKey,
  tiktokSecret, setTiktokSecret,
  setMetaPageName, // New prop
  metaPageAccessToken, setMetaPageAccessToken, // New prop for Page Token
  knowledgeBase, setKnowledgeBase // New prop for AI
}) => {
  // Local state for found pages list
  const [foundPages, setFoundPages] = useState([]);

  return (
  <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
     <div className="text-center">
        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
           <Settings size={32} className="text-indigo-400 animate-spin-slow" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Configuración</h2>
        <p className="text-slate-400 mb-2">Conecta tus cuentas de desarrollador y entrena a tu IA.</p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
          <CheckCircle2 size={12} />
          <span>AUTOGUARDADO ACTIVADO</span>
        </div>
     </div>
      
     {/* AI Brain / Knowledge Base */}
     <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10"><span className="font-bold text-6xl">🧠</span></div> 
         <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
             <Sparkles size={16} className="text-amber-400" /> Cerebro IA (Knowledge Base)
         </h3>
         <p className="text-xs text-slate-400 mb-4">
            Escribe aquí TODA la información que la IA necesita saber para responder a tus clientes (precios, horarios, políticas, envíos).
         </p>
         <textarea 
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            placeholder="Ej: Somos Next Plane. Enviamos gratis. Aceptamos Efectivo..."
            className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/50 outline-none resize-none custom-scrollbar"
         />
     </div>
      
     {/* Google Gemini */}
     <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <label className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
             <Sparkles size={16} className="text-amber-400" /> Google Gemini API Key
        </label>
         <div className="flex gap-2">
            <input 
                 type="password" 
                 value={apiKey} 

                 onChange={(e) => setApiKey(e.target.value)}
                 placeholder="sk-..." 
                 className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-400 transition-all font-mono text-sm"
             />
             <button 
                onClick={async () => {
                   if(!apiKey) return alert("Pega una API Key primero");
                   try {
                       const models = await debugModels(apiKey);
                       if(models.length > 0) {
                           alert("✅ Conexión Exitosa con Google Gemini.\n\nModelos Disponibles para tu llave:\n" + models.join("\n- "));
                       } else {
                           alert("⚠️ La llave parece válida pero no arrojó modelos.");
                       }
                   } catch(e) {
                       alert("❌ Error validando llave: " + e.message);
                   }
                }}
                className="bg-emerald-500/10 text-emerald-400 px-4 rounded-xl border border-emerald-500/20 font-bold text-xs flex items-center gap-2 hover:bg-emerald-500/20 transition-colors">
                <CheckCircle2 size={16} /> Verificar
             </button>
         </div>
         <p className="text-xs text-slate-500 mt-2">Usado para generar hooks, copys y estrategias virales.</p>
      </div>

      {/* Meta (Facebook/Instagram) */}
      <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-sm relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10"><span className="font-bold text-6xl">Fb</span></div>
         <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
             <div className="flex -space-x-2">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] border border-slate-900">f</div>
                <div className="w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center text-[10px] border border-slate-900">In</div>
             </div>
             Meta Graph API (Facebook & Instagram)
         </h3>
         
         <div className="space-y-4">
             <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">App ID</label>
                 <input 
                     type="text" 
                     value={metaAppId}
                     onChange={(e) => setMetaAppId(e.target.value)}
                     placeholder="123456789..." 
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                 />
             </div>
             <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">App Secret</label>
                 <input 
                     type="password" 
                     value={metaAppSecret}
                     onChange={(e) => setMetaAppSecret(e.target.value)}
                     placeholder="................" 
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                 />
             </div>
             <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">User Access Token</label>
                 <div className="flex gap-2">
                    <input 
                        type="password" 
                        value={metaAccessToken}
                        onChange={async (e) => {
                            let val = e.target.value;
                            if (val.includes("access_token=")) {
                                const match = val.match(/access_token=([^&]+)/);
                                if (match && match[1]) {
                                    val = match[1];
                                    
                                    // AUTOMATIC EXCHANGE
                                    alert("⏳ Canjeando por token de larga duración... Espere un momento.");
                                    try {
                                      const longToken = await facebookService.exchangeForLongLivedToken(val);
                                      alert("✅ ¡Token 'Eterno' Generado y Guardado! (60 días)");
                                      val = longToken;
                                    } catch(e) {
                                      console.error(e);
                                      alert("⚠️ Error generando Token Eterno:\n" + e.message + "\n\nSe usará el token corto (1 hora).");
                                    }
                                }
                            }
                            setMetaAccessToken(val);
                        }}
                        placeholder="Pega el Token (o la URL completa del login)" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono text-xs truncate"
                    />
                    <button 
                        onClick={() => {
                            if(!metaAccessToken) return alert("Pega un token primero");
                            
                            const btn = document.getElementById('validate-btn');
                            if(btn) {
                                btn.innerText = "⏳";
                                btn.disabled = true;
                            }

                            console.log("Validating token:", metaAccessToken.substring(0, 10) + "...");

                            facebookService.getPages(metaAccessToken)
                                .then(pages => {
                                    console.log("Pages found:", pages);
                                    if(pages.length > 0) {
                                        setFoundPages(pages); 
                                        alert(`✅ ¡Encontré ${pages.length} páginas!\n\nSelecciona abajo a cuál quieres conectarte.`);
                                    } else {
                                        setFoundPages([]);
                                        alert("El token es válido pero NO encontré Fan Pages administradas por ti.");
                                    }
                                })
                                .catch(e => {
                                    console.error("Validation Error:", e);
                                    alert("Error validando: " + e.message + "\n\nRevisa que el token esté completo.");
                                })
                                .finally(() => {
                                    if(btn) {
                                        btn.innerText = "Validar";
                                        btn.disabled = false;
                                    }
                                });
                        }}
                        id="validate-btn"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 rounded-xl font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Validar
                    </button>
                 </div>

                 {/* Found Pages List */}
                 {foundPages.length > 0 && (
                   <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Páginas Disponibles:</p>
                      {foundPages.map(page => (
                         <div key={page.id} className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500 transition-colors">
                            <div>
                               <p className="font-bold text-white text-sm">{page.name}</p>
                               <p className="text-[10px] text-slate-500 font-mono">ID: {page.id}</p>
                            </div>
                            <button 
                              onClick={async () => {
                                setMetaPageId(page.id);
                                localStorage.setItem("meta_page_id", page.id);
                                localStorage.setItem("meta_page_name", page.name);
                                setMetaPageName && setMetaPageName(page.name);
                                
                                // Save Page Access Token separately
                                if(setMetaPageAccessToken && page.access_token) {
                                    setMetaPageAccessToken(page.access_token);
                                    localStorage.setItem("meta_page_access_token", page.access_token);
                                }

                                // Save Instagram ID if available
                                if(page.instagram_business_account && page.instagram_business_account.id) {
                                    localStorage.setItem("meta_instagram_id", page.instagram_business_account.id);
                                    alert(`¡Conectado a ${page.name}! 🚀\n\nTambién se vinculó Instagram (${page.instagram_business_account.id}).`);
                                } else {
                                    localStorage.removeItem("meta_instagram_id");
                                    // alert(`¡Conectado a ${page.name}! 🚀\n\n(No se detectó cuenta de Instagram vinculada a esta página).`);
                                }
                                
                                // Auto-Subscribe Webhooks
                                try {
                                   await facebookService.subscribeApp(page.id, page.access_token);
                                   alert(`¡Conectado y Sincronizado con ${page.name}! 🚀\n\n✅ Webhook Activo\n${page.instagram_business_account?.id ? '✅ Instagram Vinculado' : '⚠️ Sin Instagram'}`);
                                } catch(subErr) {
                                   console.error("Auto-subscribe failed:", subErr);
                                   alert(`¡Conectado a ${page.name}! pero falló la suscripción al Webhook.\nRevisa la consola.`);
                                }
                             }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${metaPageId === page.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                            >
                              {metaPageId === page.id ? 'Conectado' : 'Conectar'}
                            </button>
                         </div>
                      ))}
                   </div>
                 )}
             </div>

             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Page ID</label>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={metaPageId}
                        onChange={(e) => setMetaPageId(e.target.value)}
                        placeholder="Ej: 100523..." 
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                    />
                    <button 
                        onClick={async () => {
                            if(!metaPageId) return alert("No hay Page ID");
                            if(!metaPageAccessToken) return alert("No hay Token de Página guardado. Intenta 'Validar' y 'Conectar' nuevamente arriba.");
                            try {
                                const btn = document.getElementById('sync-btn');
                                if(btn) btn.innerText = "⏳";
                                await facebookService.subscribeApp(metaPageId, metaPageAccessToken);
                                alert("✅ ¡Sincronización Exitosa!\n\nEl Webhook ahora está activo para esta página.");
                            } catch(e) {
                                console.error(e);
                                alert("❌ Error: " + e.message);
                            } finally {
                                const btn = document.getElementById('sync-btn');
                                if(btn) btn.innerText = "🔄 Sincronizar";
                            }
                        }}
                        id="sync-btn"
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 rounded-xl font-bold text-xs border border-slate-700 hover:border-slate-500 transition-all"
                        title="Forzar suscripción a Webhooks"
                    >
                        🔄 Sincronizar
                    </button>
                </div>
            </div>
            
            <div className="h-px bg-slate-800 my-4"></div>
             <button 
               onClick={async () => {
                 try {
                   localStorage.removeItem('meta_page_access_token');
                   setMetaPageAccessToken('');
                   await facebookService.login();
                 } catch(e) { alert("Error: " + e.message); }
               }}
               className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
             >
               <Facebook size={16} /> Conectar Cuenta (Nueva App)
             </button>
        </div>
     </div>

     {/* TikTok */}
     <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><span className="font-bold text-6xl">Tk</span></div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-[10px] border border-slate-700">Tk</span> TikTok for Developers
        </h3>
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Client Key</label>
                <input 
                    type="text" 
                    value={tiktokKey}
                    onChange={(e) => setTiktokKey(e.target.value)}
                    placeholder="Ej: aw345..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-pink-500 transition-all font-mono text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Client Secret</label>
                <input 
                    type="password" 
                    value={tiktokSecret}
                    onChange={(e) => setTiktokSecret(e.target.value)}
                    placeholder="Ej: ..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-pink-500 transition-all font-mono text-sm"
                />
            </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
            Requerido para publicar en TikTok. <a href="https://developers.tiktok.com/" target="_blank" className="text-pink-400 hover:underline">Crear App &rarr;</a>
        </p>
     </div>
  </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-slate-950 text-white h-screen overflow-auto">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Algo salió mal 😔</h1>
          <p className="mb-2">Por favor, envía una captura de esto al soporte:</p>
          <pre className="bg-slate-900 p-4 rounded text-xs font-mono border border-red-900/50">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children; 
  }
}

const App = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [isAuthRedirect, setIsAuthRedirect] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPlatform, setLastPlatform] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState([]);
  
  // GLOBAL STATE (Lifted from CreateStudio)
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [caption, setCaption] = useState('');

  const [generatedHashtags, setGeneratedHashtags] = useState("");
  
  // NEW: Image Analysis State (Sales Art Critic) - Lifted here
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [critique, setCritique] = useState(null);

  const handleAnalyzeImage = async () => {
    const imgToAnalyze = selectedProduct?.image_url || (selectedProduct?.gallery && selectedProduct.gallery[0]);

    if(!imgToAnalyze) return alert("Selecciona un producto con imagen");
    
    setAnalyzingImage(true);
    try {
        const result = await analyzeImageQuality(imgToAnalyze);
        setCritique(result);
    } catch(e) {
        alert("Error analizando imagen: " + e.message);
    } finally {
        setAnalyzingImage(false);
    }
  };
  
  // Persist API Key & Settings
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [metaAppId, setMetaAppId] = useState(localStorage.getItem('meta_app_id') || '');
  
  // Detect OAuth Redirect (The "Second App" Scenario)
  useEffect(() => {
     if(window.location.hash && window.location.hash.includes("access_token=")) {
        setIsAuthRedirect(true);
        // We don't extract it here anymore, we let the user copy the URL 
        // OR if this was a direct redirect in the same window (Web Mode), we could handle it.
        // But the current flow relies on the user copying the URL in Electron.
        
        // Wait! In Electron "Web Mode" or if the user is just pasting the URL:
        // The user manually pastes the URL into the input below.
        // So we need to update the binding where the user INPUTS the token.
     }
  }, []);


  const [metaAppSecret, setMetaAppSecret] = useState(localStorage.getItem('meta_app_secret') || '');
  
  const [metaAccessToken, setMetaAccessToken] = useState(localStorage.getItem('meta_access_token') || '');
  const [metaPageId, setMetaPageId] = useState(localStorage.getItem('meta_page_id') || '');
  const [metaPageName, setMetaPageName] = useState(() => localStorage.getItem('meta_page_name') || ''); // New State
  const [metaPageAccessToken, setMetaPageAccessToken] = useState(() => localStorage.getItem('meta_page_access_token') || ''); // PAGE Token
  const [metaInstagramId, setMetaInstagramId] = useState(() => localStorage.getItem('meta_instagram_id') || ''); // IG ID check
  const [metaWhatsAppId, setMetaWhatsAppId] = useState(() => localStorage.getItem('meta_whatsapp_id') || ''); // WhatsApp Phone ID

  const [tiktokKey, setTiktokKey] = useState(localStorage.getItem('tiktok_client_key') || '');
  const [tiktokSecret, setTiktokSecret] = useState(localStorage.getItem('tiktok_client_secret') || '');

  // Knowledge Base State
  const [knowledgeBase, setKnowledgeBase] = useState(() => localStorage.getItem('ai_knowledge_base') || '');
  useEffect(() => { localStorage.setItem('ai_knowledge_base', knowledgeBase); }, [knowledgeBase]);

  // Init AI Responder
  useEffect(() => {
      if(apiKey) {
          aiResponder.init(apiKey);
      }
      return () => aiResponder.stop();
  }, [apiKey]);


  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
    if (apiKey) initAI(apiKey);
  }, [apiKey]);

  // Effects for auto-saving keys
  useEffect(() => { localStorage.setItem('meta_app_id', metaAppId); }, [metaAppId]);
  useEffect(() => { localStorage.setItem('meta_app_secret', metaAppSecret); }, [metaAppSecret]);
  useEffect(() => { localStorage.setItem('meta_access_token', metaAccessToken); }, [metaAccessToken]);
  useEffect(() => { localStorage.setItem('meta_page_id', metaPageId); }, [metaPageId]);
  useEffect(() => { localStorage.setItem('meta_page_name', metaPageName); }, [metaPageName]); // Persist Name
  useEffect(() => { localStorage.setItem('meta_page_access_token', metaPageAccessToken); }, [metaPageAccessToken]);
  useEffect(() => { localStorage.setItem('meta_page_access_token', metaPageAccessToken); }, [metaPageAccessToken]);

  useEffect(() => { localStorage.setItem('tiktok_client_key', tiktokKey); }, [tiktokKey]);
  useEffect(() => { localStorage.setItem('tiktok_client_secret', tiktokSecret); }, [tiktokSecret]);

  // Load posts from Supabase on mount


  // Auto-cleanup Trash (>10 days)
  useEffect(() => {
     const cleanupTrash = async () => {
         const tenDaysAgo = new Date();
         tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
         
         const { error } = await supabase
            .from('posts')
            .delete()
            .lt('deleted_at', tenDaysAgo.toISOString());
            
         if(error) console.error("Error cleaning trash:", error);
     };
     cleanupTrash();
  }, []);

  // Load Posts from DB
  useEffect(() => {
    const fetchPosts = async () => {
       try {
           const { data, error } = await supabase
               .from('posts')
               .select(`
                   *,
                   product:products(*) 
               `)
               .order('created_at', { ascending: false });
           
           if(data) {
               // Map DB format to App format if needed, or use as is. 
               // Our App expects: { caption, image, product, ... }
               // DB has: { caption, image_url, product: {...} }
               const mappedPosts = data.map(p => ({
                   ...p,
                   image: p.image_url, // Map back for UI
                   date: p.scheduled_date
                   // product is already populated via join
               }));
               setScheduledPosts(mappedPosts);
           }
       } catch(e) {
           console.error("Error loading posts:", e);
       }
    };
    fetchPosts();
  }, []);

  const handleSchedule = async (postData) => {
    // 1. Prepare for DB
    const dbPost = {
        platform: postData.targetPlatforms?.tiktok ? 'tiktok' : 'facebook', // Simplified
        content_type: 'photo', // Default
        caption: postData.caption,
        image_url: postData.image,
        scheduled_date: postData.date,
        product_id: postData.product?.id && typeof postData.product.id === 'number' ? postData.product.id : null,
        status: 'scheduled'
    };

    try {
        // 2. Save to Supabase
        const { data, error } = await supabase.from('posts').insert([dbPost]).select().single();
        if(error) throw error;

        // 3. Update Local State (optimistic or with DB result)
        // We attach the full product object manually so UI shows it immediately without refetch
        const newPost = { 
            ...data, 
            image: data.image_url, 
            product: postData.product // Keep the full object for UI
        };
        
        setScheduledPosts([newPost, ...scheduledPosts]);

        const activePlatforms = [];
        if (postData.targetPlatforms?.instagram) activePlatforms.push('Instagram');
        if (postData.targetPlatforms?.facebook) activePlatforms.push('Facebook');
        setLastPlatform(activePlatforms.join(' + ') || 'Platform');
        
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setActiveTab('dashboard');
        }, 2500);


    } catch(err) {
        alert("Error programando post: " + err.message);
    }
  };

  const handleSoftDelete = async (post) => {
    if(!confirm("¿Mover a la papelera?")) return;
    try {
        const { error } = await supabase
            .from('posts')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', post.id);
        
        if(error) throw error;
        // Update local
        setScheduledPosts(prev => prev.map(p => p.id === post.id ? { ...p, deleted_at: new Date().toISOString() } : p));
    } catch(e) {
        alert("Error moviendo a papelera: " + e.message);
    }
  };

  const handleRestore = async (post) => {
    try {
        const { error } = await supabase
            .from('posts')
            .update({ deleted_at: null })
            .eq('id', post.id);

        if(error) throw error;
        setScheduledPosts(prev => prev.map(p => p.id === post.id ? { ...p, deleted_at: null } : p));
        alert("♻️ Post restaurado");
    } catch(e) {
        alert("Error restaurando: " + e.message);
    }
  };

  const handleEmptyTrash = async () => {
    if(!confirm("¿Vaciar papelera permanentemente? Esta acción es irreversible.")) return;
    try {
        // Delete items where deleted_at is NOT null
        const { error } = await supabase
            .from('posts')
            .delete()
            .not('deleted_at', 'is', null);

        if(error) throw error;
        
        // Clear locally
        setScheduledPosts(prev => prev.filter(p => !p.deleted_at));
        alert("🗑️ Papelera vaciada");
    } catch(e) {
        alert("Error vaciando papelera: " + e.message);
    }
  };

  const handleRelaunch = (post) => {
      // 1. Restore Product State
      if (post.product) {
          setSelectedProduct(post.product);
      } else {
          // Fallback if no product object saved
          setSelectedProduct({
              name: "Producto Relanzado",
              price: 0,
              image_url: post.image,
              isLocal: true,
              id: Date.now()
          });
      }

      // 2. Restore Content State
      setCaption(post.caption);
      // We don't restore generatedHashtags separate state because they are already in the caption
      setGeneratedHashtags(""); 

      // 3. Switch to Studio
      setActiveTab('create'); // 'create' is the correct key for Studio in AppContent
      
      // 4. Notify User (Optional toast/alert)
      alert("✨ Post cargado en el Estudio. Puedes editarlo o lanzarlo de nuevo.");
  };

  const handleProductRelaunch = (product) => {
      setSelectedProduct(product);
      setCaption(''); // Reset caption for fresh start
      setGeneratedHashtags('');
      setActiveTab('create');
      // Optional feedback
      // alert(`✨ Producto "${product.name}" cargado en el Estudio.`); 
  };

  if (isAuthRedirect) {
     return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-white p-10 text-center animate-in fade-in zoom-in duration-500">
           <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-2xl shadow-emerald-500/20">
              <CheckCircle2 size={48} className="text-emerald-400" />
           </div>
           <h1 className="text-4xl font-bold mb-4">¡Conexión Exitosa!</h1>
           <p className="text-slate-400 text-lg max-w-md mb-8">
              Facebook te ha autorizado. Ahora necesitamos llevar este permiso a la aplicación principal.
           </p>
           
           <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg mb-8 shadow-xl">
              <p className="text-xs font-bold text-indigo-400 uppercase mb-2 tracking-wider">Paso Único:</p>
              <p className="text-white font-medium mb-4">
                 Copia la dirección web que ves arriba (la URL) y pégala en la configuración de la App.
              </p>
              <div className="flex gap-2">
                 <input 
                   readOnly 
                   value={window.location.href} 
                   className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-500 font-mono truncate cursor-not-allowed"
                 />
                 <button 
                   onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      alert("¡Copiado! Ahora vuelve a la otra ventana.");
                   }}
                   className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-xs"
                 >
                   Copiar
                 </button>
              </div>
           </div>

           <p className="text-xs text-slate-600">
              Ya puedes cerrar esta ventana después de copiar.
           </p>
        </div>
     );
  }

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden selection:bg-indigo-500/30 selection:text-white">
      {showDownload && <DownloadModal onClose={() => setShowDownload(false)} />}
      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} platform={lastPlatform} />}
      {critique && <CritiqueModal critique={critique} onClose={() => setCritique(null)} />}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        onDownloadClick={() => setShowDownload(true)}
        pageName={metaPageName} 
      />
      
      <div className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute top-0 left-0 w-full h-[300px] bg-indigo-900/10 blur-[100px] pointer-events-none"></div>
        
        <header className="md:hidden bg-slate-950/80 backdrop-blur-md border-b border-slate-800 text-white p-4 flex items-center justify-between z-20 sticky top-0">
          <div className="flex items-center gap-3 font-bold">
            <img src="/logo.png" alt="Yaminator" className="w-8 h-8 rounded-full border border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)] bg-slate-900 object-cover" />
            <span>Yaminator</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)}><Menu size={24} /></button>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 z-10 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto h-full">
            {activeTab === 'create' && <CreateStudio 
                onSchedule={handleSchedule} 
                apiKey={apiKey} 
                onPageConnect={(page) => {
                    setMetaPageId(page.id);
                    setMetaPageName(page.name);
                    if(page.access_token) setMetaPageAccessToken(page.access_token);
                }}
                // Passed State
                products={products}
                setProducts={setProducts}
                selectedProduct={selectedProduct}
                setSelectedProduct={setSelectedProduct}
                caption={caption}
                setCaption={setCaption}
                generatedHashtags={generatedHashtags}
                setGeneratedHashtags={setGeneratedHashtags}
                // Video Props
                videoScript={currentStrategy} // We use the strategy object as the script source
                selectedHook={selectedHook}
                setSelectedHook={setSelectedHook}
                onGenerateScript={generateAIHooks} // Reuse the main strategy generator
                onAnalyzeImage={handleAnalyzeImage}
                analyzingImage={analyzingImage}
            />}
            {activeTab === 'dashboard' && (
                <Dashboard 
                    posts={scheduledPosts} 
                    onRelaunch={handleRelaunch}
                    onDelete={handleSoftDelete}
                    onRestore={handleRestore}
                    onEmptyTrash={handleEmptyTrash}
                />
            )}
            {activeTab === 'calendar' && <CalendarView 
              posts={scheduledPosts} 
              onAddClick={(date) => {
                 // Future: Pre-select this date in CreateStudio
                 setActiveTab('create');
                 // Optional: alert(`Create for ${date}`);
              }}
            />}
            {activeTab === 'inbox' && <SocialInbox 
                pageId={metaPageId} 
                accessToken={metaPageAccessToken || metaAccessToken} 
                pageName={metaPageName}
                instagramId={metaInstagramId}
            />}
            {activeTab === 'listening' && <SocialListening pageId={metaPageId} accessToken={metaPageAccessToken || metaAccessToken} pageName={metaPageName} />}
            {activeTab === 'training' && <BrandVoiceTrainer />}
            {activeTab === 'analytics' && <AnalyticsDashboard pageId={metaPageId} accessToken={metaPageAccessToken || metaAccessToken} pageName={metaPageName} />}
            {activeTab === 'settings' && <SettingsView 
              apiKey={apiKey} setApiKey={setApiKey}
              metaAppId={metaAppId} setMetaAppId={setMetaAppId}
              metaAppSecret={metaAppSecret} setMetaAppSecret={setMetaAppSecret}
              metaAccessToken={metaAccessToken} setMetaAccessToken={setMetaAccessToken}
              metaPageId={metaPageId} setMetaPageId={setMetaPageId}
              tiktokKey={tiktokKey} setTiktokKey={setTiktokKey}
              tiktokSecret={tiktokSecret} setTiktokSecret={setTiktokSecret}
              setMetaPageName={setMetaPageName} // Passed here!
              metaPageAccessToken={metaPageAccessToken} setMetaPageAccessToken={setMetaPageAccessToken}
              knowledgeBase={knowledgeBase} setKnowledgeBase={setKnowledgeBase}
            />}
            {activeTab === 'products' && <ProductManager onRelaunch={handleProductRelaunch} />}
            {activeTab === 'trends' && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center">
                  <LayoutDashboard size={40} className="text-slate-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-700">Próximamente</h2>
                <p className="text-slate-500">Estamos cocinando algo especial para la sección {activeTab}.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};


export default App;
