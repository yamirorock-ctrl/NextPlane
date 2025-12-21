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

// ... (existing imports and MOCK Data)

const AnalyticsDashboard = ({ pageId, accessToken, pageName }) => {
  const [data, setData] = React.useState(engagementData);
  const [metrics, setMetrics] = React.useState({
      reach: "125.4K",
      reachChange: "+12.5%",
      engagement: "8.2%",
      engagementChange: "+3.1%",
      fans: "45.2K",
      fansChange: "+850"
  });
  const [loading, setLoading] = React.useState(false);
  const [isRealData, setIsRealData] = React.useState(false);

  // Fetch Real Insights with HEAVY Debugging
  React.useEffect(() => {
      console.log("ANALYTICS: Checking Credentials...", { pageId, accessToken });

      if(pageId && accessToken) {
          console.log("ANALYTICS: Credentials found. Switching to Real Data.");
          setLoading(true);
          setIsRealData(true); 
          
          facebookService.getPageInsights(pageId, accessToken)
            .then(res => {
                console.log("ANALYTICS: Data fetched:", res);
                if(res && res.chartData) {
                    setData(res.chartData);
                    setMetrics(prev => ({
                        ...prev,
                        reach: res.chartData.reduce((acc, curr) => acc + curr.views, 0).toLocaleString(),
                        reachChange: "+0%", 
                        fans: res.totalFans.toLocaleString(),
                        fansChange: "+0"
                    }));
                }
            })
            .catch(err => {
                console.error("Analytics Error:", err);
                // Handle Token Expiry (#190) specifically
                if (err.message.includes("190") || err.message.includes("Session is invalid")) {
                    alert("⚠️ Tu sesión de Facebook caducó. Por favor reconecta en Configuración.");
                    // User requested to stay in Real Data mode to debug
                    console.error("Analytics API failed:", err);
                    setMetrics(prev => ({ ...prev, error: err.message })); // Store error
                    setIsRealData(true);
                }
            })
            .finally(() => setLoading(false));
      } else {
         console.log("ANALYTICS: Missing Credentials. Staying in Simulation Mode.");
         setIsRealData(false);
      }
  }, [pageId, accessToken]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      {/* Status Banner */}
      {!isRealData && !loading && (
          <div className="absolute -top-4 left-0 w-full text-center py-1 z-50">
             <span className="bg-amber-500/10 text-amber-300 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/20">
                MODO SIMULACIÓN — Conecta tu cuenta en Configuración para ver datos reales.
             </span>
          </div>
      )}

      {metrics.error && (
          <div className="absolute -top-4 left-0 w-full text-center py-1 z-50 flex items-center justify-center gap-4">
             <span className="bg-red-500/10 text-red-300 text-[10px] font-bold px-3 py-1 rounded-full border border-red-500/20 flex items-center gap-2">
                ERROR API: {metrics.error}
             </span>
             {metrics.error.includes("Session has expired") && (
                 <button 
                    onClick={() => facebookService.login(import.meta.env.VITE_FACEBOOK_APP_ID)}
                    className="bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full transition-colors"
                 >
                    Reconectar Ahora
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
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative min-w-0">
          {loading && <div className="absolute inset-0 bg-slate-900/80 z-10 flex items-center justify-center text-indigo-400 font-bold">Cargando Insights...</div>}
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-500"/>
            Rendimiento Semanal
          </h3>
          <div className="h-[300px] w-full">
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
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
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
