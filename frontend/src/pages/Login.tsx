import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Canvas3D } from '../components/Canvas3D.js';
import { Mail, Lock, LogIn, ShieldAlert } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setEmail('admin@carbattery.com');
      setPassword('Admin@123');
    } else {
      setEmail('staff@carbattery.com');
      setPassword('Staff@123');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-stretch overflow-hidden bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 transition-colors duration-300">
      
      {/* Left Column: 3D Animation (Hidden on Mobile) */}
      <div className="hidden lg:flex w-7/12 bg-gradient-to-tr from-brand/10 to-red-600/5 relative items-center justify-center p-12 overflow-hidden border-r border-zinc-200/40 dark:border-zinc-800/40">
        <div className="absolute inset-0 z-0">
          <Canvas3D isHero={true} />
        </div>
        <div className="relative z-10 text-center max-w-lg mt-auto pb-12">
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-4">
            Next-Gen Battery ERP
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Manage your inventory, generate GST-compliant invoices, track warranties, and analyze sales performance with local AI business intelligence.
          </p>
        </div>
      </div>

      {/* Right Column: Glassmorphic Auth Card */}
      <div className="w-full lg:w-5/12 flex items-center justify-center p-8 relative">
        
        {/* Animated backdrop glow */}
        <div className="absolute w-72 h-72 rounded-full bg-brand/10 filter blur-3xl -top-24 -right-24 z-0 pointer-events-none" />
        <div className="absolute w-72 h-72 rounded-full bg-brand/5 filter blur-3xl -bottom-24 -left-24 z-0 pointer-events-none" />

        <div className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-premium dark:shadow-premium-dark relative z-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand to-red-500 items-center justify-center text-white font-extrabold text-2xl shadow-glow-red mb-3">
              B
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight">Access ERP System</h2>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold mt-1 uppercase tracking-widest">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/20 border border-brand/20 text-brand text-xs font-semibold px-4 py-3 rounded-xl flex items-center space-x-2">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@carbattery.com"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-400">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl glass-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-extrabold text-sm flex items-center justify-center space-x-2 shadow-glow-red active:scale-95 transition-all"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Credentials */}
          <div className="mt-8 pt-6 border-t border-zinc-200/50 dark:border-zinc-800/50 text-center">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest block mb-3">Quick-Fill Evaluation Logs</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
              >
                Admin Credentials
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('staff')}
                className="py-2.5 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700/50 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
              >
                Staff Credentials
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
