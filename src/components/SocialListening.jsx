import React, { useState, useEffect } from 'react';
import { generateReply, analyzeSentiment } from '../services/ai';
import { facebookService } from '../services/social/facebook';
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
  Cell
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

const TREND_DATA = [
  { time: '10:00', mentions: 12 },
  { time: '11:00', mentions: 19 },
  { time: '12:00', mentions: 45 }, // Viral spike
  { time: '13:00', mentions: 30 },
  { time: '14:00', mentions: 22 },
  { time: '15:00', mentions: 28 },
];

const SocialListening = ({ pageId, accessToken, pageName }) => {
  const [keywords, setKeywords] = useState(() => JSON.parse(localStorage.getItem('listening_keywords')) || ['Next Plane', 'Ecommerce', 'Viral']);
  const [mentions, setMentions] = useState([]); // This will hold REAL mentions now
  const [loadingReal, setLoadingReal] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  
  // Computed Sentiment Data
  const sentimentData = React.useMemo(() => {
     if(mentions.length === 0) return SENTIMENT_DATA_DEFAULT;
     
     const counts = { positive: 0, neutral: 0, negative: 0 };
     mentions.forEach(m => {
         // Default to neutral if undefined
         const s = m.sentiment || 'neutral';
         if(counts[s] !== undefined) counts[s]++;
         else counts.neutral++;
     });
     
     return [
        { name: 'Positivo', value: counts.positive, color: SENTIMENT_COLORS.positive },
        { name: 'Neutral', value: counts.neutral, color: SENTIMENT_COLORS.neutral },
        { name: 'Negativo', value: counts.negative, color: SENTIMENT_COLORS.negative },
     ];
  }, [mentions]);

  // Reply State
  const [openReplyId, setOpenReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [generatingReply, setGeneratingReply] = useState(false);

  // Load Real Data
  useEffect(() => {
     if (pageId && accessToken) {
        setLoadingReal(true);
        facebookService.getPageComments(pageId, accessToken)
          .then(async comments => {
             // Initial Load: set comments with default 'neutral' (from service)
             setMentions(comments);
             
             // OPTIONAL: Auto-analyze specifically if list is small?
             // For now, let user click "Actualizar Radar" to behave as "Analyze AI"
          })
          .catch(err => console.error("Error loading comments", err))
          .finally(() => setLoadingReal(false));
     }
  }, [pageId, accessToken]);


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
    
    // Process in parallel but limited to avoid rate limits? 
    // Gemini Flash is fast. Let's do parallel.
    try {
        const analyzedPromise = mentions.map(async (mention) => {
            // Skip if already analyzed (optimization) unless forced? 
            // Let's re-analyze to be safe or if 'neutral' is suspicious.
            // Actually, keep it simple: Analyze all currently visible.
            const sentiment = await analyzeSentiment(mention.text);
            return { ...mention, sentiment };
        });
        
        const analyzedMentions = await Promise.all(analyzedPromise);
        setMentions(analyzedMentions);
        
    } catch(e) {
        console.error("Batch Analysis Failed:", e);
        alert("Error analizando sentimientos. Verifica API Key.");
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

  const handleSend = () => {
      // Future: Connect to facebookService.sendReply
      alert(`Respuesta enviada (Simulado): "${replyText}"`);
      // Optimistic Update?
      setOpenReplyId(null);
      setReplyText('');
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
               <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%" minHeight={0}>
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

         {/* 2. Mentions Feed & Charts */}
         <div className="lg:col-span-2 space-y-6">
            
            {/* Trend Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 h-[250px] relative overflow-hidden">
               <div className="flex justify-between items-center mb-4 relative z-10">
                  <h3 className="font-bold text-white flex items-center gap-2"><BarChart2 className="text-indigo-400"/> Volumen de Menciones</h3>
                  <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded font-bold">+12% hoy</span>
               </div>
               <div className="absolute inset-x-0 bottom-0 h-[200px] w-full">
                 <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                   <AreaChart data={TREND_DATA}>
                     <defs>
                       <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                        itemStyle={{ color: '#818cf8' }}
                     />
                     <Area type="monotone" dataKey="mentions" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMentions)" />
                   </AreaChart>
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
                 {mentions.length === 0 && !loadingReal && (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        <MessageCircle size={32} className="mx-auto mb-2 opacity-50"/>
                        <p>No hay comentarios recientes.</p>
                    </div>
                 )}
                 {mentions.map((mention) => (
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
                           <p className="text-slate-300 text-sm leading-snug">{mention.text}</p>
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

      </div>
    </div>
  );
};

export default SocialListening;
