import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Gauge, Mail, Lock, ArrowRight, User, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, username: formData.username };
      
      const { data } = await api.post(endpoint, payload);
      
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blur Elements */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-4xl grid md:grid-cols-2 racing-card p-0 overflow-hidden border-white/10 shadow-2xl">
        {/* Visual Side */}
        <div className="hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-secondary relative group">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
           
           <div className="relative z-10">
             <div className="flex items-center gap-2 mb-8">
               <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                 <Gauge className="w-8 h-8 text-white" />
               </div>
               <span className="text-2xl font-black tracking-tighter uppercase text-white">NitroDash</span>
             </div>
             <h2 className="text-4xl font-black italic uppercase leading-none tracking-tighter text-white">
               The Circuit <br /> Is Waiting.
             </h2>
           </div>

           <div className="relative z-10 space-y-4 text-white/80">
             <p className="font-medium leading-relaxed">
               Join thousands of drivers in the ultimate decentralized racing circuit. Build your garage, dominate the track, and win big.
             </p>
           </div>
        </div>

        {/* Form Side */}
        <div className="p-8 md:p-12 bg-secondary/40 backdrop-blur-3xl flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
              {isLogin ? 'Welcome Back' : 'Join the Circuit'}
            </h1>
            <p className="text-gray-400 text-sm font-medium">
              {isLogin ? 'Enter your credentials to access your garage.' : 'Create an account to start your racing career.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-500 text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Username</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="racer_one"
                    className="w-full bg-black/40 border border-white/5 rounded-lg py-3 pl-11 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="driver@nitrodash.com"
                  className="w-full bg-black/40 border border-white/5 rounded-lg py-3 pl-11 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">Secret Key</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/5 rounded-lg py-3 pl-11 pr-4 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Access Garage' : 'Initialize Account'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 w-full"
            >
              {isLogin ? (
                <>New to NitroDash? <span className="text-primary uppercase tracking-widest ml-1">Create Profile</span></>
              ) : (
                <>Already a Driver? <span className="text-primary uppercase tracking-widest ml-1">Log In</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
