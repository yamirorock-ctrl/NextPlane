import React from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];

// Mock Data
const engagementData = [
  { name: 'Lun', views: 4000, likes: 2400 },
  { name: 'Mar', views: 3000, likes: 1398 },
  { name: 'Mié', views: 2000, likes: 9800 },
  { name: 'Jue', views: 2780, likes: 3908 },
  { name: 'Vie', views: 1890, likes: 4800 },
  { name: 'Sáb', views: 2390, likes: 3800 },
  { name: 'Dom', views: 3490, likes: 4300 },
];

const platformData = [
  { name: 'Instagram', value: 65 },
  { name: 'Facebook', value: 25 },
  { name: 'TikTok', value: 10 },
];

const StatCard = ({ title, value, change, icon: Icon, color }) => (
  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 ${color}`}>
      <Icon size={64} />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl bg-slate-950/50 ${color.replace('text-', 'text-opacity-80 ')}`}>
          <Icon size={20} className={color} />
        </div>
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</span>
      </div>
      <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
      <div className={`flex items-center gap-1 text-xs font-bold ${change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
        {change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        <span>{change} vs. mes anterior</span>
      </div>
    </div>
  </div>
);

import { facebookService } from '../services/social/facebook';
import { instagramService } from '../services/social/instagram';

// ... (metrics state definition)

const AnalyticsDashboard = ({ pageId, accessToken, pageName, instagramId, setActiveTab }) => { // Added instagramId
  const [data, setData] = React.useState(engagementData);
  const [platformChartData, setPlatformChartData] = React.useState(platformData); // State for Pie Chart
  const [metrics, setMetrics] = React.useState({
      reach: "125.4K",
      reachChange: "+12.5%",
      engagement: "8.2%",
      engagementChange: "+3.1%",
      fans: "45.2K",
      fansChange: "+850",
      breakdown: null 
  });
  const [loading, setLoading] = React.useState(false);
  const [isRealData, setIsRealData] = React.useState(false);

  // Fetch Real Insights with HEAVY Debugging
  React.useEffect(() => {
      console.log("ANALYTICS: Checking Credentials...", { pageId, accessToken, instagramId });

      if(pageId && accessToken) {
          console.log("ANALYTICS: Credentials found. Switching to Real Data.");
          setLoading(true);
          setIsRealData(true); 
          
          Promise.all([
             facebookService.getPageInsights(pageId, accessToken),
             instagramId ? instagramService.getInsights(accessToken, instagramId) : Promise.resolve(null)
          ])
            .then(([fbRes, igRes]) => {
                console.log("ANALYTICS: Data fetched.", { fbRes, igRes });
                
                let mergedChart = [];
                let totalReach = 0;
                let totalFans = 0;
                
                // Process FB
                if(fbRes && fbRes.chartData) {
                    mergedChart = fbRes.chartData;
                    totalReach += fbRes.chartData.reduce((acc, curr) => acc + curr.views, 0);
                    totalFans += fbRes.totalFans;
                }

                // Process IG (Merge)
                if(igRes) {
                    totalFans += (igRes.followers || 0);

                    if (igRes.chartData && igRes.chartData.length > 0) {
                        if (mergedChart.length === 0) {
                             // If no FB data, use IG data as base
                             mergedChart = igRes.chartData;
                        } else {
                             // Merge IG into FB
                             mergedChart = mergedChart.map((item, idx) => {
                                 const igItem = igRes.chartData[igRes.chartData.length - 1 - (mergedChart.length - 1 - idx)]; 
                                 return {
                                     ...item,
                                     views: item.views + (igItem ? igItem.views : 0),
                                     likes: item.likes + (igItem ? igItem.likes : 0) // Also merge likes
                                 };
                             });
                        }
                    }
                }
                
                // Update State
                setData(mergedChart.length > 0 ? mergedChart : engagementData);

                // Update Pie Chart Data
                const fbCount = fbRes?.totalFans || 0;
                const igCount = igRes?.followers || 0;
                if (fbCount > 0 || igCount > 0) {
                    setPlatformChartData([
                        { name: 'Facebook', value: fbCount },
                        { name: 'Instagram', value: igCount },
                        // { name: 'TikTok', value: 0 } // Future
                    ]);
                }

                setMetrics(prev => ({
                    ...prev,
                    reach: totalReach > 0 ? totalReach.toLocaleString() : prev.reach,
                    reachChange: "+0%", 
                    fans: totalFans > 0 ? totalFans.toLocaleString() : prev.fans,
                    fansChange: "+0",
                    breakdown: {
                        fb: fbCount,
                        ig: igCount
                    }
                }));
            })
            .catch(err => {
                console.error("Analytics Error:", err);
                if (err.message.includes("190") || err.message.includes("Session is invalid")) {
                    // alert("⚠️ Tu sesión de Facebook caducó. Por favor reconecta en Configuración."); // Removed redundant alert
                    setMetrics(prev => ({ ...prev, error: err.message }));
                    setIsRealData(true);
                }
            })
            .finally(() => setLoading(false));
      } else {
         console.log("ANALYTICS: Missing Credentials. Staying in Simulation Mode.");
         setIsRealData(false);
      }
  }, [pageId, accessToken, instagramId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* ... (Status Banners same as before) */}
      {!isRealData && !loading && (
          <div className="absolute -top-4 left-0 w-full text-center py-1 z-50">
             <span className="bg-amber-500/10 text-amber-300 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/20">
                MODO SIMULACIÓN — Conecta tu cuenta en Configuración para ver datos reales.
             </span>
          </div>
      )}

      {isRealData && !loading && !metrics.error && (
          <div className="absolute -top-4 left-0 w-full text-center py-1 z-50 flex items-center justify-center gap-2">
             <span className="bg-emerald-500/10 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-2 cursor-help" title="Los datos provienen directamente de la API Graph de Facebook">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                DATOS REALES (LIVE)
             </span>
             <button 
                onClick={() => alert("Datos Crudos de API:\n\nAlcance: " + metrics.reach + "\nFans: " + metrics.fans + "\n\n(Estos números vienen de Facebook)")}
                className="text-[10px] text-slate-500 hover:text-white underline"
             >
                Verificar
             </button>
          </div>
      )}

      {metrics.error && (
          <div className="absolute -top-4 left-0 w-full text-center py-1 z-50 flex items-center justify-center gap-4">
             <span className="bg-red-500/10 text-red-300 text-[10px] font-bold px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-2">
                ERROR API: {metrics.error}
             </span>
             {(metrics.error.includes("Session") || metrics.error.includes("expired") || metrics.error.includes("190")) && (
                 <button 
                    onClick={() => setActiveTab && setActiveTab('settings')}
                    className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-colors"
                 >
                    Reconectar Ahora (Ir a Ajustes)
                 </button>
             )}
          </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <StatCard 
          title="Alcance Semanal" 
          value={loading ? "..." : metrics.reach} 
          change={metrics.reachChange} 
          icon={Eye} 
          color="text-indigo-500"
        />
        <StatCard 
          title="Engagement" 
          value={metrics.engagement} 
          change={metrics.engagementChange} 
          icon={Heart} 
          color="text-pink-500"
        />
        <StatCard 
          title="Seguidores" 
          value={loading ? "..." : metrics.fans} 
          change={metrics.fansChange} 
          icon={Users} 
          color="text-emerald-500"
        />
        <StatCard 
          title="Conversión" 
          value="2.4%" 
          change="-0.5%" 
          icon={TrendingUp} 
          color="text-amber-500"
        />
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Engagement Chart (Big) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative min-w-0 flex flex-col h-[350px]">
          {loading && <div className="absolute inset-0 bg-slate-900/80 z-10 flex items-center justify-center text-indigo-400 font-bold">Cargando Insights...</div>}
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-500"/>
            Rendimiento Semanal
          </h3>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%" minHeight={0}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" activeDot={{r: 6}} />
                <Area type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorLikes)" activeDot={{r: 6}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Split (Small) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl min-w-0">
          <h3 className="text-lg font-bold text-white mb-6">Audiencia por Red</h3>
          <div className="h-[300px] w-full relative">
             <ResponsiveContainer width="100%" height="100%" minHeight={0}>
              <PieChart>
                <Pie
                  data={platformChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
               <div className="text-center">
                  <p className="text-3xl font-bold text-white">100%</p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Viralidad</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
