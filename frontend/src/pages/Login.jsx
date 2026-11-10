import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, Eye, ArrowRight, Lock, Mail, Navigation, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/common/Toast';
import { Logo } from '../components/common/Logo';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to authenticate. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background Atmospheric Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Engineering Grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />

        {/* Ambient Glowing Orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Perspective Highway Horizon Lines */}
        <div
          className="absolute bottom-0 inset-x-0 h-64 opacity-25"
          style={{
            background: 'linear-gradient(to top, rgba(56, 189, 248, 0.2) 0%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 20%, transparent 100%)',
          }}
        />
      </div>

      {/* Main Login Container */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/80 shadow-2xl backdrop-blur-md">
            <Logo size="lg" variant="dark" showTagline={false} />
          </div>
          <p className="mt-3 text-center text-xs font-bold tracking-widest text-blue-400 uppercase">
            Smart Truck Loading & Delivery Optimization System
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl shadow-blue-950/50 rounded-3xl border border-white/40">
          {error && (
            <div className="mb-5">
              <Toast type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@loadopt.io"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 font-medium placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-slate-900 font-medium placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          {/* Quick-Fill Demonstration Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 text-center uppercase tracking-wider mb-2.5">
              One-Click Evaluator Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@loadopt.io', 'Admin@123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-900 transition-colors text-center cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 mb-0.5" />
                <span className="text-xs font-black">Admin</span>
                <span className="text-[9px] text-purple-700/80">Full Control</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('manager@loadopt.io', 'Manager@123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-900 transition-colors text-center cursor-pointer shadow-xs"
              >
                <Truck className="w-4 h-4 text-blue-600 mb-0.5" />
                <span className="text-xs font-black">Manager</span>
                <span className="text-[9px] text-blue-700/80">Operations</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('viewer@loadopt.io', 'Viewer@123')}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-100/70 hover:bg-slate-200 text-slate-800 transition-colors text-center cursor-pointer shadow-xs"
              >
                <Eye className="w-4 h-4 text-slate-600 mb-0.5" />
                <span className="text-xs font-black">Viewer</span>
                <span className="text-[9px] text-slate-600">Track Portal</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400 font-mono">
          LoadOpt System Design Evaluation Demo &bull; DP-900 Ready
        </div>
      </div>
    </div>
  );
};
