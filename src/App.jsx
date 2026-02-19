import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import AuthPage from './pages/Auth';
import { GoogleGenerativeAI } from "@google/generative-ai";

import { supabase, storeClient } from './lib/supabase';
import { generateViralStrategy, generateCaption, initAI, verifyConnection, debugModels, generateHashtags, analyzeBrandVoice, analyzeImageQuality } from './services/ai.js';
import { facebookService } from './services/social/facebook';
import { instagramService } from './services/social/instagram';
import SettingsView from './components/SettingsView';
import { useAppSettings } from './hooks/useAppSettings';
import PageSelector from './components/PageSelector';
import PlatformSelector from './components/PlatformSelector';
import ImageEditor from './components/ImageEditor';
import CalendarView from './components/CalendarView';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ProductManager from './components/ProductManager';
import SocialInbox from './components/SocialInbox';
import GridPreview from './components/GridPreview';
import SocialListening from './components/SocialListening';
import BrandVoiceTrainer from './components/BrandVoiceTrainer';
import VideoScriptPanel from './components/VideoScriptPanel';
import CritiqueModal from './components/CritiqueModal';
import MediaPreview from './components/MediaPreview';
import PrivacyPolicy from './components/PrivacyPolicy';
import Dashboard from './components/Dashboard';

import CreateStudio from './components/CreateStudio';
import ViralCoach from './components/ViralCoach';
import HashtagGenerator from './components/HashtagGenerator';
import PreviewPhone from './components/PreviewPhone';
import { uploadMedia } from './services/storage';
import { renderVideo } from './services/videoRenderer';
import { compressVideo } from './services/videoCompression';
import imageCompression from 'browser-image-compression';


import { tiktokService } from './services/social/tiktok';
import { whatsappService } from './services/social/whatsapp';
import { aiResponder } from './services/aiResponder';
import { usePostScheduler } from './hooks/usePostScheduler'; // Import Scheduler
import { syncProductsFromFeed } from './utils/productSync';
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
  Plus, 
  Trash2, 
  RefreshCcw, 
  Settings as SettingsIcon,
  TrendingDown,
  ChevronDown,
  Layout,
  LogOut,
  ImagePlus,
  ChevronRight,
  ChevronLeft,
  Tag,
  Monitor,
  Apple,
  Pause,
  Volume2,
  VolumeX,
  Play,
  Clock,
  DollarSign, 
  Edit2,      
  Sun,
  Maximize,
  AlertCircle
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
           <span>ï£¿</span> App Store
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 rounded-lg text-xs font-medium transition-colors">
           <span>â–¶</span> Google Play
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
    { id: 'grid', label: 'Previsualizar Grid', icon: <ImageIcon size={20} className="text-blue-400" /> },
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


        </div>
      </div>
    </>
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
    const isPrivacy = window.location.href.toLowerCase().includes('privacy') || window.location.href.toLowerCase().includes('politica');
  
    if (isPrivacy) {
        return <PrivacyPolicy />;
    }

    return (
        <ErrorBoundary>
            <AuthProvider>
                <AppDispatcher />
            </AuthProvider>
        </ErrorBoundary>
    );
};

const AppDispatcher = () => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!user) {
        return <AuthPage />;
    }

    return <AppContent />;
};



import MainLayout from './components/MainLayout';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard'); // Default to Dashboard for the "OS" feel
  const [isAuthRedirect, setIsAuthRedirect] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPlatform, setLastPlatform] = useState('');
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [isScheduling, setIsScheduling] = useState(false);
  
  const { settings, updateSettings, signOut, user, loading: settingsLoading } = useAuth(); 

  // GLOBAL STATE (Lifted from CreateStudio)
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [caption, setCaption] = useState('');

  const [generatedHashtags, setGeneratedHashtags] = useState("");
  
  // NEW: Image Analysis State (Sales Art Critic) - Lifted here
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [critique, setCritique] = useState(null);
  const [currentStrategy, setCurrentStrategy] = useState(null);
  const [selectedHook, setSelectedHook] = useState(null);

  // New: Create Post with Date
  const [selectedDateForCreate, setSelectedDateForCreate] = useState(null);
  const [pageStats, setPageStats] = useState(null); // Real Page Stats

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
  
  // Persist API Key & Settings -- NOW USING SUPABASE SETTINGS!
  // We sync local state with 'settings' object from DB using the hook
  const {
      apiKey, setApiKey,
      metaAppId, setMetaAppId,
      metaAppSecret, setMetaAppSecret,
      metaAccessToken, setMetaAccessToken,
      metaPageId, setMetaPageId,
      metaPageName, setMetaPageName,
      metaPageAccessToken, setMetaPageAccessToken,
      metaInstagramId, setMetaInstagramId,
      tiktokKey, setTiktokKey,
      tiktokSecret, setTiktokSecret,
      knowledgeBase, setKnowledgeBase,
      saveField
  } = useAppSettings(settings, updateSettings);

  // Initialize Scheduler
  usePostScheduler(scheduledPosts, setScheduledPosts, settings || {});

  // Detect OAuth Redirect & Auto-Exchange Token
  useEffect(() => {
     const hash = window.location.hash;
     if (hash && hash.includes("access_token=")) {
        // 1. Extract Token
        const params = new URLSearchParams(hash.substring(1));
        const shortToken = params.get("access_token");
        
        if (shortToken) {
            console.log("🔗 Token detectado en URL. Iniciando canje automático...");
            
            // 2. Get Credentials (Try State -> Settings -> LocalStorage)
            const appId = metaAppId || settings?.meta_app_id || localStorage.getItem("meta_app_id");
            const appSecret = metaAppSecret || settings?.meta_app_secret || localStorage.getItem("meta_app_secret");

            if (appId && appSecret) {
                // 3. Exchange
                facebookService.exchangeForLongLivedToken(shortToken, appId, appSecret)
                    .then(longToken => {
                        console.log("✅ Token canjeado automáticamente:", longToken.substring(0, 10) + "...");
                        
                        // 4. Save & Update State
                        setMetaAccessToken(longToken);
                        saveField('meta_access_token', longToken);
                        alert("✅ ¡Conexión con Facebook Exitosa! Token guardado.");
                        
                        // 5. Clear URL to prevent re-runs
                        window.history.replaceState(null, null, ' ');
                        setIsAuthRedirect(false); // Hide manual modal
                    })
                    .catch(err => {
                        console.error("Auto-Exchange Error:", err);
                        alert("⚠️ Error canjeando token automáticamente: " + err.message);
                    });
            } else {
                console.warn("⚠️ Token detectado pero faltan App ID/Secret. Se requiere intervención manual.");
                setIsAuthRedirect(true); 
            }
        }
     }
  }, [settings, metaAppId, metaAppSecret]);

  // NEW: Load Dashboard Stats (Real One - Combined)
  useEffect(() => {
    const fetchStats = async () => {
        const token = metaPageAccessToken || metaAccessToken;
        // Wait for settings to load properly
        if (!settingsLoading && metaPageId && token) {
            console.log("🔄 Loading Social Stats (FB + IG)...");
            
            const [fbStats, igStats] = await Promise.all([
                facebookService.getPageInsights(metaPageId, token),
                metaInstagramId ? instagramService.getInsights(token, metaInstagramId) : null
            ]);

            // Combine stats
            const combined = {
                followers: (fbStats?.followers || 0) + (igStats?.followers || 0),
                impressions: (fbStats?.impressions || 0) + (igStats?.impressions || 0),
                engagement: (fbStats?.engagement || 0), 
                picture: igStats?.picture || fbStats?.picture, // Prefer IG pic if available
                breakdown: { fb: fbStats, ig: igStats }
            };
            
            if(combined.followers > 0 || combined.impressions > 0) setPageStats(combined);
        }
    };
    fetchStats();
  }, [metaPageId, metaPageAccessToken, metaAccessToken, settingsLoading, metaInstagramId]);

  // Init AI Responder & Helper
  useEffect(() => {
      if(settings && settings.gemini_api_key) {
          aiResponder.init(settings);
          initAI(settings.gemini_api_key);
      }
      return () => aiResponder.stop();
  }, [settings]);

  // Effects for auto-saving keys REMOVED (Replaced by saveField)

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
    if (isScheduling) return;
    setIsScheduling(true);

    // 1. Prepare for DB
    let platform = 'facebook';
    if (postData.targetPlatforms?.tiktok) platform = 'tiktok';
    else if (postData.targetPlatforms?.instagram) platform = 'instagram';

    const dbPost = {
        platform: platform,
        content_type: (postData.image && (postData.image.match(/\.(mp4|webm|mov|ogg)$/i) || postData.image.includes('video'))) ? 'video' : 'photo',
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
        
        setScheduledPosts(prev => [newPost, ...prev]);

        setLastPlatform(postData.targetPlatforms?.instagram ? 'instagram' : 'facebook');
        
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 5000);


    } catch(err) {
        alert("Error programando post: " + err.message);
    } finally {
        setIsScheduling(false);
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
        alert("♻️ Post restaurado");
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
        alert("🗑️ Papelera vaciada");
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
      // alert(` Producto "${product.name}" cargado en el Estudio.`); 
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
              Ya puedes cerrar esta ventana despuí©s de copiar.
           </p>
        </div>
     );
  }

  return (
    <MainLayout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        user={user}
        onSignOut={signOut}
        onDownloadClick={() => setShowDownload(true)}
        pageName={metaPageName} 
    >
      {showDownload && <DownloadModal onClose={() => setShowDownload(false)} />}
      {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} platform={lastPlatform} />}
      {critique && <CritiqueModal critique={critique} onClose={() => setCritique(null)} />}

        {activeTab === 'create' && <CreateStudio 
            initialProduct={selectedProduct} 
            initialDate={selectedDateForCreate} // Pass date
            onPublish={handleSchedule} 
            onCancel={() => {
                setSelectedDateForCreate(null); // Clear date
                setActiveTab('dashboard');
            }}
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
            // onGenerateScript removed (it's internal to CreateStudio)
            setCurrentStrategy={setCurrentStrategy}
            onAnalyzeImage={handleAnalyzeImage}
            analyzingImage={analyzingImage}
        />}
        {activeTab === 'dashboard' && (
            <Dashboard 
                posts={scheduledPosts} 
                stats={pageStats}
                onNewPost={() => {
                    setSelectedProduct(null); // Reset selection
                    setActiveTab('create');
                }}
                onRelaunch={handleRelaunch}
                onDelete={handleSoftDelete}
                onRestore={handleRestore}
                onEmptyTrash={handleEmptyTrash}
            />
        )}
        {activeTab === 'calendar' && <CalendarView 
          posts={scheduledPosts} 
          onPostClick={handleRelaunch} // Allow editing/relaunching from calendar
          onAddClick={(date) => {
              setSelectedDateForCreate(date);
              setActiveTab('create');
          }}
        />}
        {activeTab === 'grid' && (
          <div className="max-w-[1200px] mx-auto p-6">
            <GridPreview 
                accessToken={metaPageAccessToken || metaAccessToken}
                instagramId={metaInstagramId}
                scheduledPosts={scheduledPosts}
            />
          </div>
        )}
        {activeTab === 'inbox' && <SocialInbox 
            pageId={metaPageId} 
            accessToken={metaPageAccessToken || metaAccessToken} 
            pageName={metaPageName}
            instagramId={metaInstagramId}
        />}
        {activeTab === 'listening' && <SocialListening pageId={metaPageId} accessToken={metaPageAccessToken || metaAccessToken} pageName={metaPageName} instagramId={metaInstagramId} setActiveTab={setActiveTab} />}
        {activeTab === 'training' && <BrandVoiceTrainer />}
        {activeTab === 'analytics' && <AnalyticsDashboard pageId={metaPageId} accessToken={metaPageAccessToken || metaAccessToken} pageName={metaPageName} instagramId={metaInstagramId} setActiveTab={setActiveTab} />}
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
          metaInstagramId={metaInstagramId} setMetaInstagramId={setMetaInstagramId}
          knowledgeBase={knowledgeBase} setKnowledgeBase={setKnowledgeBase}
          saveField={saveField}
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

        {/* Modals & Overlays */}
        {showSuccess && (
            <div className="fixed bottom-10 right-10 bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce z-50">
                <div className="p-2 bg-white/20 rounded-full">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <h4 className="font-bold text-lg">¡Publicado!</h4>
                    <p className="text-emerald-100 text-sm">Tu contenido está en el aire.</p>
                </div>
            </div>
        )}
        
        {/* Auth Redirect Modal */}
        {isAuthRedirect && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Key className="text-amber-500" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Conexión Manual Requerida</h3>
                    <p className="text-slate-400 mb-6">
                        Detectamos un token, pero faltan las credenciales de la App (ID/Secret). 
                        Por favor agrégalas en Configuración.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => { setIsAuthRedirect(false); setActiveTab('settings'); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold transition-all"
                        >
                            Ir a Configuración
                        </button>
                        <button 
                            onClick={() => setIsAuthRedirect(false)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-2 rounded-xl font-bold transition-all"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        )}

    </MainLayout>
  );
};


export default App;
