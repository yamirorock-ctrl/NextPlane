import React, { useState, useEffect } from 'react';
import { generateReply, analyzeSentiment } from '../services/ai';
import { facebookService } from '../services/social/facebook';
import { instagramService } from '../services/social/instagram';
import { 
  Search, 
  TrendingUp, 
  MessageCircle, 
  AlertCircle, 
  CheckCircle2, 
  Smile, 
  Meh, 
  Frown,
  RefreshCw,
  Filter,
  BarChart2,
  MessageSquarePlus,
  ArrowRight,
  Sparkles,
  Send,
  Copy
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral: '#6366f1',
  negative: '#ef4444'
};
const SENTIMENT_DATA_DEFAULT = [
  { name: 'Positivo', value: 0, color: SENTIMENT_COLORS.positive },
  { name: 'Neutral', value: 100, color: SENTIMENT_COLORS.neutral },
  { name: 'Negativo', value: 0, color: SENTIMENT_COLORS.negative },
];

const SocialListening = ({ pageId, accessToken, pageName, instagramId, setActiveTab }) => {
  const [keywords, setKeywords] = useState(() => JSON.parse(localStorage.getItem('listening_keywords')) || ['Next Plane', 'Ecommerce', 'Viral']);
  const [mentions, setMentions] = useState([]); 
  const [loadingReal, setLoadingReal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [filterActive, setFilterActive] = useState(false);

  // Filter Logic
  const filteredMentions = React.useMemo(() => {
     if(!filterActive || keywords.length === 0) return mentions;
     return mentions.filter(m => 
        keywords.some(k => m.text.toLowerCase().includes(k.toLowerCase()))
     );
  }, [mentions, filterActive, keywords]);
  
  // Computed Sentiment Data (Using Filtered or All? usually All provides context, but let's stick to visible)
  const sentimentData = React.useMemo(() => {
     const source = filterActive ? filteredMentions : mentions;
     if(source.length === 0) return SENTIMENT_DATA_DEFAULT;
     
     const counts = { positive: 0, neutral: 0, negative: 0 };
     source.forEach(m => {
         const s = m.sentiment || 'neutral';
         if(counts[s] !== undefined) counts[s]++;
         else counts.neutral++;
     });
     
     return [
        { name: 'Positivo', value: counts.positive, color: SENTIMENT_COLORS.positive },
        { name: 'Neutral', value: counts.neutral, color: SENTIMENT_COLORS.neutral },
        { name: 'Negativo', value: counts.negative, color: SENTIMENT_COLORS.negative },
     ];
  }, [mentions, filteredMentions, filterActive]);

  // Computed Trend Data (Real)
  const trendData = React.useMemo(() => {
      const source = filterActive ? filteredMentions : mentions;
      if(source.length === 0) return [];
      
      const hours = {};
      source.forEach(m => {
          if(!m.timestamp) return;
          const date = new Date(m.timestamp);
          // Group by hour
          const h = date.getHours().toString().padStart(2, '0');
          const hourKey = `${h}:00`;
          
          if(!hours[hourKey]) hours[hourKey] = { time: hourKey, fb: 0, ig: 0, total: 0 };
          
          if(m.platform === 'facebook') hours[hourKey].fb++;
          else if(m.platform === 'instagram') hours[hourKey].ig++;
          
          hours[hourKey].total++;
      });

      // Fill missing hours or just show active ones
      const sorted = Object.values(hours).sort((a,b) => a.time.localeCompare(b.time));
      
      return sorted.length > 0 ? sorted : [{time: 'Now', fb: 0, ig: 0, total: 0}];
  }, [mentions, filteredMentions, filterActive]);

  // Reply State
  const [openReplyId, setOpenReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [generatingReply, setGeneratingReply] = useState(false);

  // Auto-scroll to reply
  useEffect(() => {
    if(openReplyId) {
        // Optional: logic to scroll to element
    }
  }, [openReplyId]);

  // Load Real Data (FB + IG)
  useEffect(() => {
     const fetchData = async () => {
        if (!accessToken) return;
        setLoadingReal(true);
        setError(null);
        try {
            const promises = [];
            if(pageId) promises.push(facebookService.getPageComments(pageId, accessToken));
            if(instagramId) promises.push(instagramService.getComments(accessToken, instagramId));
            
            const results = await Promise.all(promises);
            const all = results.flat().sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            setMentions(all);
        } catch(err) {
            console.error("Error loading comments", err);
            const msg = err.message || (typeof err === 'string' ? err : 'Error desconocido');
            setError(msg);
        } finally {
            setLoadingReal(false);
        }
     };
     fetchData();
  }, [pageId, instagramId, accessToken]);


  useEffect(() => {
    localStorage.setItem('listening_keywords', JSON.stringify(keywords));
  }, [keywords]);

  const handleAddKeyword = (e) => {
    e.preventDefault();
    if (newKeyword.trim() && !keywords.includes(newKeyword)) {
      setKeywords([...keywords, newKeyword]);
      setNewKeyword('');
    }
  };

  const removeKeyword = (kw) => {
    setKeywords(keywords.filter(k => k !== kw));
  };
  
  // REAL AI ANALYSIS
  const runSentimentAnalysis = async () => {
    if(mentions.length === 0) return;
    setAnalyzing(true);
    setError(null);
    
    try {
        const analyzedPromise = mentions.map(async (mention) => {
            const sentiment = await analyzeSentiment(mention.text);
            return { ...mention, sentiment };
        });
        
        const analyzedMentions = await Promise.all(analyzedPromise);
        setMentions(analyzedMentions);
        
    } catch(e) {
        console.error("Batch Analysis Failed:", e);
        setError("Error analizando sentimientos. Verifica API Key.");
    } finally {
        setAnalyzing(false);
    }
  };

  const handleToggleReply = (id) => {
      if (openReplyId === id) {
          setOpenReplyId(null);
          setReplyText('');
      } else {
          setOpenReplyId(id);
          setReplyText('');
      }
  };

  const handleGenerateAI = async (mention) => {
      setGeneratingReply(true);
      try {
          const text = await generateReply(mention);
          setReplyText(text);
      } catch (e) {
          setReplyText("Error generando respuesta. Intenta manual.");
      } finally {
          setGeneratingReply(false);
      }
  };

  const handleSend = async () => {
      if(!openReplyId || !replyText) return;
      
      const mention = mentions.find(m => m.id === openReplyId);
      if(!mention) return;

      try {
          if(mention.platform === 'facebook') {
              await facebookService.replyToComment(mention.id, replyText, accessToken);
          } else if(mention.platform === 'instagram') {
              await instagramService.replyToComment(accessToken, mention.id, replyText);
          }
          alert("✅ Respuesta enviada con éxito!");
          setOpenReplyId(null);
          setReplyText('');
      } catch(e) {
          alert("Error enviando respuesta: " + e.message);
      }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-2 md:p-6 overflow-y-auto custom-scrollbar">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="text-pink-500" /> Social Listening
          </h2>
          <p className="text-slate-400 text-sm">Monitorización de marca y sentimiento en tiempo real.</p>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={() => setFilterActive(!filterActive)}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all border ${filterActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
           >
             <Filter size={18} className={filterActive ? "fill-current" : ""}/>
             <span>{filterActive ? "Filtro Activado" : "Filtrar por Keywords"}</span>
           </button>

           <button 
             onClick={runSentimentAnalysis}
             disabled={analyzing || mentions.length === 0}
             className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50"
           >
             {analyzing ? <RefreshCw className="animate-spin" size={18}/> : <Sparkles size={18}/>}
             <span>{analyzing ? "Analizando IA..." : "Analizar Sentimientos"}</span>
           </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* 1. Keyword Manager */}
         <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Search className="text-emerald-400" size={20} /> Palabras Clave
            </h3>
            
            <form onSubmit={handleAddKeyword} className="mb-4 relative">
               <input 
                 type="text" 
                 value={newKeyword}
                 onChange={(e) => setNewKeyword(e.target.value)}
                 placeholder="Agregar keyword..." 
                 className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 pl-4 pr-10 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
               />
               <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                 <CheckCircle2 size={18} />
               </button>
            </form>

            <div className="flex flex-wrap gap-2">
               {keywords.map(kw => (
                 <span key={kw} className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-sm border border-slate-700">
                    {kw}
                    <button onClick={() => removeKeyword(kw)} className="hover:text-red-400 transition-colors"><AlertCircle size={12} className="rotate-45" /></button>
                 </span>
               ))}
            </div>
            
            <div className="mt-8">
               <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-4">Sentimiento General</h4>
               <div className="h-[200px] w-full min-h-0 relative" style={{ height: 200, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex justify-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-1 text-emerald-400"><Smile size={14} /> {((sentimentData[0].value / mentions.length || 0)*100).toFixed(0)}%</div>
                  <div className="flex items-center gap-1 text-indigo-400"><Meh size={14} /> {((sentimentData[1].value / mentions.length || 0)*100).toFixed(0)}%</div>
                  <div className="flex items-center gap-1 text-red-400"><Frown size={14} /> {((sentimentData[2].value / mentions.length || 0)*100).toFixed(0)}%</div>
               </div>
            </div>
         </div>

         {/* 2. Mentions Feed & Charts (Handles Errors) */}
         {error && (error.includes("Session") || error.includes("expired") || error.includes("caducada")) ? (
              <div className="lg:col-span-2 bg-red-500/10 border border-red-500/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
                  <AlertCircle size={48} className="text-red-500 mb-4"/>
                  <h3 className="text-xl font-bold text-white mb-2">Sesión Caducada</h3>
                  <p className="text-slate-400 mb-6 max-w-md">Tu token de acceso ha expirado. Por favor, ve a Configuración y genera un nuevo token.</p>
                  <button 
                      onClick={() => setActiveTab && setActiveTab('settings')}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-red-500/20 flex items-center gap-2"
                  >
                      <RefreshCw size={18}/> Ir a Configuración
                  </button>
              </div>
          ) : (
             <div className="lg:col-span-2 space-y-6">
                
                {/* Trend Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-[350px] relative overflow-hidden flex flex-col">
                   <div className="flex justify-between items-center mb-4 relative z-10 shrink-0">
                      <h3 className="font-bold text-white flex items-center gap-2">
                          <BarChart2 className="text-indigo-400"/> 
                          Actividad Reciente <span className="text-xs text-slate-500 font-normal">(Comentarios por Hora)</span>
                      </h3>
                      <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded font-bold">+12% hoy</span>
                   </div>
                   <div className="flex-1 w-full min-h-0 relative" style={{ height: 300 }}>
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={trendData}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                         <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                         <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                         <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                         />
                         <Legend verticalAlign="top" height={36} iconType="circle" />
                         <Bar dataKey="fb" stackId="a" name="Facebook" fill="#3b82f6" barSize={40} />
                         <Bar dataKey="ig" stackId="a" name="Instagram" fill="#ec4899" barSize={40} radius={[4, 4, 0, 0]} />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </div>

                {/* Live Feed with REPLY Feature */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex-1 min-h-[400px]">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-white flex items-center gap-2">
                       <MessageCircle className="text-slate-400" /> Feed en Tiempo Real
                       {loadingReal && <RefreshCw className="animate-spin ml-2 text-slate-500" size={16}/>}
                     </h3>
                      {mentions.length > 0 && <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">● {mentions.length} Reales</span>}
                   </div>
                   
                     <div className="space-y-3">
                     {filteredMentions.length === 0 && !loadingReal && (
                        <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                            <MessageCircle size={32} className="mx-auto mb-2 opacity-50"/>
                            <p>{filterActive ? "No hay coincidencias con tus keywords." : "No hay comentarios recientes."}</p>
                        </div>
                     )}
                     {filteredMentions.map((mention) => (
                       <div key={mention.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col gap-3 animate-in slide-in-from-bottom-2 duration-300">
                          <div className="flex gap-4">
                            <div className={`w-2 h-auto rounded-full shrink-0 ${mention.sentiment === 'positive' ? 'bg-emerald-500' : mention.sentiment === 'negative' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                            <div className="flex-1">
                               <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-white text-sm">{mention.user}</span>
                                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${mention.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : mention.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                                    {mention.sentiment}
                                  </span>
                               </div>
                               <p className="text-slate-300 text-sm leading-snug">
                                 {/* Highlight keywords */}
                                 {mention.text.split(new RegExp(`(${keywords.join('|')})`, 'gi')).map((part, i) => 
                                    keywords.some(k => k.toLowerCase() === part.toLowerCase()) 
                                    ? <span key={i} className="bg-emerald-500/20 text-emerald-300 px-0.5 rounded">{part}</span> 
                                    : part
                                 )}
                               </p>
                               <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                  <div className="flex items-center gap-4">
                                    <span className="capitalize flex items-center gap-1">
                                       {mention.platform}
                                    </span>
                                    <span>{mention.time}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleToggleReply(mention.id)}
                                    className={`flex items-center gap-1 font-bold transition-colors ${openReplyId === mention.id ? 'text-indigo-400' : 'hover:text-white'}`}
                                  >
                                    {openReplyId === mention.id ? 'Cancelar' : 'Responder'} <MessageSquarePlus size={14} />
                                  </button>
                               </div>
                            </div>
                          </div>

                          {openReplyId === mention.id && (
                              <div className="ml-6 bg-slate-900/50 p-3 rounded-xl border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
                                  <textarea 
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      placeholder="Escribe una respuesta o usa la IA..."
                                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-2"
                                      rows={2}
                                  />
                                  <div className="flex justify-between items-center">
                                      <button 
                                         onClick={() => handleGenerateAI(mention)}
                                         disabled={generatingReply}
                                         className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 disabled:opacity-50"
                                      >
                                         <Sparkles size={14} className={generatingReply ? "animate-spin" : ""} /> 
                                         {generatingReply ? "Generando..." : "Draft con IA"}
                                      </button>
                                      <div className="flex gap-2">
                                          <button 
                                            onClick={() => {navigator.clipboard.writeText(replyText); alert("Copiado!");}}
                                            disabled={!replyText}
                                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                                            title="Copiar"
                                          >
                                              <Copy size={16} />
                                          </button>
                                          <button 
                                            onClick={handleSend}
                                            disabled={!replyText}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:bg-slate-800"
                                          >
                                              Enviar <Send size={12} />
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          )}
                       </div>
                     ))}
                   </div>
                </div>

             </div>
         )}

      </div>
    </div>
  );
};

export default SocialListening;
