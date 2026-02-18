import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Facebook, 
  Instagram 
} from 'lucide-react';
import { facebookService } from '../services/social/facebook';

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
  metaInstagramId, setMetaInstagramId, // New prop for IG
  knowledgeBase, setKnowledgeBase, // New prop for AI
  saveField, // New prop for DB saving
  debugModels // passed from App if needed, or imported?
}) => {
  // Local state for found pages list
  const [foundPages, setFoundPages] = useState([]);

  // State to track if we have already validated the current token to prevent loops
  const validatedTokenRef = useRef(null);
  const [validationError, setValidationError] = useState(null);

  // Auto-Validate if token exists (Magic UX) - Prevent Loops
  useEffect(() => {
    // Only run if we have a token, we haven't found pages yet, AND we haven't already validated THIS specific token
    if (metaAccessToken && foundPages.length === 0 && validatedTokenRef.current !== metaAccessToken) {
        console.log("Auto-validating pages with existing token...");
        validatedTokenRef.current = metaAccessToken; // Mark as attempted
        setValidationError(null);

        facebookService.getPages(metaAccessToken, true)
            .then(pages => {
                if (pages.length > 0) {
                    setFoundPages(pages);
                }
            })
            .catch(err => {
                console.error("Auto-validation failed:", err);
                // If critical auth error, let user know vaguely but don't spam alerts
                if (err.message.includes("190") || err.message.includes("Session") || err.message.includes("signature")) {
                   setValidationError("⚠️ Tu sesión ha expirado o la configuración es inválida. Por favor, revisa el App Secret y reconecta.");
                }
            }); 
    }
  }, [metaAccessToken, foundPages.length]);

  return (
  <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
     {/* Validation Error Banner */}
     {validationError && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-2xl flex items-center gap-3 text-red-200 animate-pulse">
            <AlertCircle className="text-red-500" size={24} />
            <p className="text-sm font-bold">{validationError}</p>
        </div>
     )}
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
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" /> Cerebro IA (Knowledge Base)
            </h3>
            <div className="flex items-center gap-2">
                 <button
                    onClick={async () => {
                        if(!metaPageId || (!metaPageAccessToken && !metaAccessToken)) {
                            return alert("Primero conecta una Página de Facebook arriba.");
                        }
                        const btn = document.getElementById('import-fb-btn');
                        if(btn) btn.innerText = "⏳ Leyendo...";
                        
                        try {
                            const token = metaPageAccessToken || metaAccessToken;
                            const details = await facebookService.getPageDetails(metaPageId, token);
                            
                            // Format Data
                            let text = `Nombre: ${details.name}\n`;
                            if(details.about) text += `Sobre nosotros: ${details.about}\n`;
                            if(details.bio) text += `Bio: ${details.bio}\n`;
                            if(details.description) text += `Descripción: ${details.description}\n`;
                            if(details.location) text += `Ubicación: ${details.location.city}, ${details.location.country} (${details.location.street || ''})\n`;
                            if(details.website) text += `Web: ${details.website}\n`;
                            if(details.phone) text += `Tel: ${details.phone}\n`;
                            if(details.emails) text += `Email: ${details.emails[0]}\n`;
                            
                            if(details.hours) {
                                text += `Horarios: ${JSON.stringify(details.hours)}\n`; // Simplify later if needed
                            }

                            const newKb = (knowledgeBase ? knowledgeBase + "\n\n" : "") + "--- IMPORTADO DE FACEBOOK ---\n" + text;
                            
                            setKnowledgeBase(newKb);
                            saveField('ai_knowledge_base', newKb);
                            alert("✅ ¡Información importada con éxito!");

                        } catch(e) {
                            console.error(e);
                            alert("Error importando: " + e.message);
                        } finally {
                             if(btn) btn.innerText = "✨ Importar de FB";
                        }
                    }}
                    id="import-fb-btn"
                    className="text-[10px] font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                 >
                    <Facebook size={12} /> ✨ Importar Info
                 </button>
                 <span className="text-[10px] uppercase font-bold text-emerald-500 animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Guardado
                 </span>
            </div>
         </div>
         <p className="text-xs text-slate-400 mb-4">
            Escribe aquí TODA la información que la IA necesita saber para responder a tus clientes (precios, horarios, políticas, envíos).
         </p>
         <textarea 
            value={knowledgeBase}
            onChange={(e) => {
                setKnowledgeBase(e.target.value);
                saveField('ai_knowledge_base', e.target.value);
            }}
            placeholder="Ej: Somos Next Plane. Enviamos gratis. Aceptamos Efectivo..."
            className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/50 outline-none resize-none custom-scrollbar transition-all"
         />
     </div>
      
     {/* Google Gemini */}
     <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <div className="flex justify-between items-center mb-3">
             <label className="text-sm font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
                 <Sparkles size={16} className="text-amber-400" /> Google Gemini API Key
             </label>
             <span className="text-[10px] uppercase font-bold text-emerald-500 animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Guardado
             </span>
        </div>
         <div className="flex gap-2">
            <input 
                 type="password" 
                 value={apiKey} 
                 onChange={(e) => {
                     setApiKey(e.target.value);
                     saveField('gemini_api_key', e.target.value);
                 }}
                 placeholder="sk-..." 
                 className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-amber-400 transition-all font-mono text-sm"
             />
             <button 
                onClick={async () => {
                   if(!apiKey) return alert("Pega una API Key primero");
                   try {
                       // We need debugModels to be passed as a prop or imported!
                       const { debugModels } = await import('../services/ai');
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
         <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="flex -space-x-2">
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] border border-slate-900">f</div>
                    <div className="w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center text-[10px] border border-slate-900">In</div>
                </div>
                Meta Graph API (Facebook & Instagram)
            </h3>
            <span className="text-[10px] uppercase font-bold text-emerald-500 animate-pulse bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Guardado
            </span>
         </div>
         
         <div className="space-y-4">
             <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">App ID</label>
                 <input 
                     type="text" 
                     value={metaAppId}
                     onChange={(e) => {
                         setMetaAppId(e.target.value);
                         saveField('meta_app_id', e.target.value);
                     }}
                     placeholder="123456789..." 
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                 />
             </div>
             <div>
                 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">App Secret</label>
                 <input 
                     type="password" 
                     value={metaAppSecret}
                     onChange={(e) => {
                         setMetaAppSecret(e.target.value);
                         saveField('meta_app_secret', e.target.value);
                     }}
                     placeholder="................" 
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                 />
                 <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">Requerido para generar token de 60 días (permanente).</p>
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
                                    if(metaAppSecret) {
                                      alert("⏳ Canjeando por token de larga duración... Espere un momento.");
                                      try {
                                        const longToken = await facebookService.exchangeForLongLivedToken(val, metaAppId, metaAppSecret);
                                        alert("✅ ¡Token 'Eterno' Generado y Guardado! (60 días)");
                                        val = longToken;
                                      } catch(e) {
                                        console.error(e);
                                        alert("⚠️ Error generando Token Eterno:\n" + e.message + "\n\nSe usará el token corto (1 hora).");
                                      }
                                    } else {
                                        alert("⚠️ Advertencia: No has ingresado el 'App Secret'.\n\nEl token que pegaste caducará en 1 hora. Para obtener 60 días, ingresa el Secret arriba.");
                                    }
                                }
                            }
                            setMetaAccessToken(val);
                            saveField('meta_access_token', val);
                        }}
                        placeholder="Pega el Token (o la URL completa del login)" 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 transition-all font-mono text-xs truncate"
                    />
                    <button 
                        onClick={async () => {
                            if(!metaAccessToken) return alert("Pega un token primero");
                            
                            const btn = document.getElementById('validate-btn');
                            if(btn) {
                                btn.innerText = "⏳ mejorando token...";
                                btn.disabled = true;
                            }

                            let currentToken = metaAccessToken;

                            // 1. Attempt to Upgrade Token (User Short -> User Long)
                            // This is CRITICAL: Getting pages with a Long User Token results in Permanent Page Tokens.
                            if(metaAppId && metaAppSecret) {
                                try {
                                    const longToken = await facebookService.exchangeForLongLivedToken(currentToken, metaAppId, metaAppSecret);
                                    console.log("✅ Token Upgraded successfully before validation.");
                                    currentToken = longToken;
                                    setMetaAccessToken(currentToken);
                                    saveField('meta_access_token', currentToken);
                                } catch(e) {
                                    console.warn("Token Upgrade Skipped/Failed:", e.message);
                                    alert("⚠️ Falló el canje de token de 60 días: " + e.message + "\n\nSe usará el token de 1 hora.");
                                }
                            } else {
                                alert("⚠️ Falta App Secret. Tu token solo durará 1 HORA.\n\nPara obtener un token de 60 días (permanente), debes llenar el campo 'App Secret' arriba antes de validar.");
                            }

                            console.log("Validating token:", currentToken.substring(0, 10) + "...");

                            // 2. Fetch Pages
                            facebookService.getPages(currentToken)
                                .then(pages => {
                                    console.log("Pages found:", pages);
                                    if(pages.length > 0) {
                                        setFoundPages(pages); 
                                        alert(`✅ ¡Token de 60 días verificado!\n\nSe encontraron ${pages.length} páginas.\nSelecciona tu página abajo para finalizar.`);
                                    } else {
                                        setFoundPages([]);
                                        alert("El token es válido pero NO encontré Fan Pages administradas por ti.");
                                    }
                                })
                                .catch(e => {
                                    console.error("Validation Error:", e);
                                    alert("Error validando: " + e.message + "\n\nRevisa que el token esté completo y verifiques App ID / Secret.");
                                })
                                .finally(() => {
                                    if(btn) {
                                        btn.innerText = "Validar";
                                        btn.disabled = false;
                                    }
                                });
                        }}
                        id="validate-btn"
                     >
                        Verificar y Guardar
                    </button>
                 </div>

                 {/* Instagram ID (Auto-filled but editable) */}
                 <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 uppercase flex items-center gap-2">
                        <Instagram size={12} className="text-pink-500"/> Instagram Business ID
                    </label>
                    <input 
                        type="text" 
                        value={metaInstagramId || ''}
                        onChange={(e) => {
                            setMetaInstagramId && setMetaInstagramId(e.target.value);
                            saveField && saveField('meta_instagram_id', e.target.value);
                        }}
                        placeholder="Detectado automáticamente al conectar página..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 focus:ring-2 focus:ring-pink-500 transition-all font-mono text-sm"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                        Si tu cuenta de Instagram es de empresa y está vinculada a la Fan Page, esto se llena solo.
                    </p>
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
                                // localStorage.setItem("meta_page_id", page.id);
                                saveField && saveField('meta_page_id', page.id);

                                // localStorage.setItem("meta_page_name", page.name);
                                saveField && saveField('meta_page_name', page.name);
                                setMetaPageName && setMetaPageName(page.name);
                                
                                // Save Page Access Token separately
                                if(setMetaPageAccessToken && page.access_token) {
                                    setMetaPageAccessToken(page.access_token);
                                    saveField && saveField('meta_page_access_token', page.access_token);
                                }

                                // Save Instagram ID if available
                                if(page.instagram_business_account && page.instagram_business_account.id) {
                                    // localStorage.setItem("meta_instagram_id", page.instagram_business_account.id);
                                    saveField && saveField('meta_instagram_id', page.instagram_business_account.id);
                                    alert(`¡Conectado a ${page.name}! 🚀\n\nTambién se vinculó Instagram (${page.instagram_business_account.id}).`);
                                } else {
                                    // localStorage.removeItem("meta_instagram_id");
                                    saveField && saveField('meta_instagram_id', null);
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
                        onChange={(e) => {
                            setMetaPageId(e.target.value);
                            saveField && saveField('meta_page_id', e.target.value);
                        }}
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
                   // localStorage.removeItem('meta_page_access_token');
                   saveField && saveField('meta_page_access_token', null);
                   setMetaPageAccessToken('');
                   await facebookService.login(metaAppId);
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
                    onChange={(e) => {
                        setTiktokKey(e.target.value);
                        saveField && saveField('tiktok_client_key', e.target.value);
                    }}
                    placeholder="Ej: aw345..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-pink-500 transition-all font-mono text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Client Secret</label>
                <input 
                    type="password" 
                    value={tiktokSecret}
                    onChange={(e) => {
                        setTiktokSecret(e.target.value);
                        saveField && saveField('tiktok_client_secret', e.target.value);
                    }}
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

export default SettingsView;
