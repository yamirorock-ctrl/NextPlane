import React from 'react';
import { 
  LayoutDashboard, 
  Plane, 
  MessageCircle, 
  BarChart3, 
  Settings, 
  Zap, 
  ShoppingBag, 
  LogOut,
  Menu,
  X,
  Sparkles,
  Search,
  School,
  Activity
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`
      group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 relative overflow-hidden
      ${active 
        ? 'bg-indigo-600/20 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-indigo-500/30' 
        : 'text-slate-400 hover:bg-slate-800/40 hover:text-white hover:border hover:border-white/5'
      }
    `}
    title={collapsed ? label : ''}
  >
    {active && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-full shadow-[0_0_10px_#6366f1]" />
    )}
    <Icon size={22} className={`transition-transform duration-300 ${active ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110'}`} />
    {!collapsed && (
      <span className={`font-medium tracking-wide ${active ? 'text-indigo-100' : ''}`}>
        {label}
      </span>
    )}
  </button>
);

const MainLayout = ({ children, activeTab, setActiveTab, user, onSignOut }) => {
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Estudio Viral', icon: Zap },
    { id: 'calendar', label: 'Calendario', icon: Activity },
    { id: 'inbox', label: 'Mensajes', icon: MessageCircle },
    { id: 'listening', label: 'Listening', icon: Search },
    { id: 'products', label: 'Catálogo', icon: ShoppingBag },
    { id: 'analytics', label: 'Analítica', icon: BarChart3 },
    { id: 'training', label: 'Entrenador', icon: School },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-[#050b14] relative overflow-hidden font-sans text-slate-100 selection:bg-indigo-500/30">
        
      {/* Background Ambience effect */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar */}
      <aside 
        className={`
           relative z-20 flex flex-col h-full bg-slate-900/60 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out
           ${collapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo Area */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
           {!collapsed && (
               <div className="flex items-center gap-2">
                   <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                     <Sparkles size={20} className="text-white" />
                   </div>
                   <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                     Yaminator
                   </h1>
               </div>
           )}
           {collapsed && (
              <div className="w-full flex justify-center">
                 <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-lg shadow-lg">
                     <Sparkles size={20} className="text-white" />
                   </div>
              </div>
           )}
           
           <button 
             onClick={() => setCollapsed(!collapsed)}
             className="text-slate-500 hover:text-white transition-colors"
           >
             {collapsed ? <Menu size={20} /> : <div className="p-1 hover:bg-white/5 rounded-md"><Menu size={18}/></div>}
           </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2 custom-scrollbar">
            {menuItems.map(item => (
                <SidebarItem 
                    key={item.id}
                    {...item}
                    active={activeTab === item.id}
                    collapsed={collapsed}
                    onClick={() => setActiveTab(item.id)}
                />
            ))}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-black/20">
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="font-bold text-sm text-indigo-300">
                        {user?.email?.[0].toUpperCase() || 'U'}
                    </span>
                </div>
                {!collapsed && (
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{user?.email?.split('@')[0]}</p>
                        <button 
                            onClick={onSignOut}
                            className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors mt-0.5"
                        >
                            <LogOut size={10} /> Cerrar Sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative z-10 overflow-hidden flex flex-col">
          
          {/* Top Bar (Contextual) */}
          <header className="h-16 px-8 flex items-center justify-between border-b border-white/5 bg-slate-900/30 backdrop-blur-sm">
             <div>
                 <h2 className="text-lg font-semibold text-white/90">
                    {menuItems.find(m => m.id === activeTab)?.label || 'Dashboard'}
                 </h2>
                 <p className="text-xs text-slate-500">
                    {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                 </p>
             </div>
             
             <div className="flex items-center gap-4">
                 {/* Status Indicators could go here */}
                 <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                     Sistema Operativo
                 </div>
             </div>
          </header>

          {/* Scrollable Content Workspace */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
              <div className="max-w-7xl mx-auto h-full"> 
                  {/* Glass Container for the View */}
                  <div className="h-full animate-fade-in-up">
                      {children}
                  </div>
              </div>
          </div>

      </main>
    </div>
  );
};

export default MainLayout;
