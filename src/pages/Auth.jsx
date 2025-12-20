import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, ArrowRight, Github, Facebook, Sparkles, CheckCircle2 } from 'lucide-react';

const AuthPage = () => {
  const [view, setView] = useState('sign_in'); // 'sign_in' or 'sign_up'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) throw error;
        alert("¡Registro exitoso! Revisa tu email para confirmar.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
     try {
         const { error } = await supabase.auth.signInWithOAuth({
             provider: provider,
             options: {
                 redirectTo: window.location.origin
             }
         });
         if(error) throw error;
     } catch(err) {
         setError(err.message);
     }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
        </div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-3xl p-8 shadow-2xl relative z-10 animate-in fade-in zoom-in duration-500">
        
         {/* Logo Header */}
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)] rotate-3 hover:rotate-0 transition-all duration-500">
               <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md"/>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {view === 'sign_in' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h1>
            <p className="text-slate-400 text-sm">
                {view === 'sign_in' ? 'Accede a tu estudio de viralidad con IA.' : 'Comienza a potenciar tu contenido hoy.'}
            </p>
        </div>

        {/* Error Message */}
        {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-in shake">
                 <div className="w-1 h-8 bg-red-500 rounded-full"></div>
                 {error}
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                    <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                </div>
            </div>

            <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Contraseña</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 text-slate-500" size={18} />
                    <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                        {view === 'sign_in' ? 'Ingresar' : 'Registrarse'} <ArrowRight size={18} />
                    </>
                )}
            </button>
        </form>

        <div className="my-6 flex items-center gap-4">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-slate-600 text-xs font-medium uppercase">O continúa con</span>
            <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        {/* Social Buttons */}
        <div className="flex gap-3">
            <button 
                type="button"
                onClick={() => handleSocialLogin('google')}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 font-medium text-sm"
            >
               <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"/></svg>
               Google
            </button>
            <button 
                type="button"
                onClick={() => handleSocialLogin('facebook')}
                 className="flex-1 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] py-2.5 rounded-xl border border-[#1877F2]/20 transition-all flex items-center justify-center gap-2 font-medium text-sm"
            >
               <Facebook size={18} />
               Facebook
            </button>
        </div>

        {/* Toggle View */}
        <div className="mt-8 text-center">
            <button 
                onClick={() => setView(view === 'sign_in' ? 'sign_up' : 'sign_in')}
                className="text-slate-400 hover:text-white text-sm transition-colors hover:underline underline-offset-4"
            >
                {view === 'sign_in' ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
        </div>
        
        {/* Footer Info */}
         <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-center gap-6 text-[10px] text-slate-600 font-medium tracking-wide uppercase">
            <span className="flex items-center gap-1"><Sparkles size={10} className="text-amber-500" /> AI Powered</span>
            <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> Secure</span>
         </div>

      </div>
    </div>
  );
};

export default AuthPage;
