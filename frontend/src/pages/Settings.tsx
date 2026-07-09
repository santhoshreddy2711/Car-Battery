import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings as SettingsIcon, 
  Key, 
  Mail, 
  Phone, 
  MessageSquare,
  CheckCircle,
  X,
  Palette
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Shop Config fields
  const [config, setConfig] = useState({
    shopName: '',
    gstNumber: '',
    address: '',
    phone: '',
    email: '',
    invoiceFormat: 'Standard GST Invoice',
    whatsappApiKey: '',
    smtpConfig: { host: '', port: 587, user: '', pass: '' }
  });

  // Password fields
  const [passwords, setPasswords] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passError, setPassError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/settings');
      setConfig(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    try {
      await axios.put('/api/settings', config);
      setSuccessMsg('Shop settings updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error updating configuration');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setSuccessMsg('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    try {
      await axios.post('/api/auth/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      setSuccessMsg('Password updated successfully.');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setPassError(err.response?.data?.message || 'Password update failed');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">System Settings</h1>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-extrabold mt-1">Configure Company Profile, APIs & Security</p>
      </div>

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-4 py-3 rounded-2xl flex items-center space-x-2">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Shop Profile & APIs */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSaveConfig} className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-6">
            
            <h2 className="font-extrabold text-base flex items-center space-x-2 text-brand border-b border-zinc-200/40 dark:border-zinc-800/40 pb-3">
              <SettingsIcon size={18} />
              <span>Shop Profile Configurations</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Company / Dealership Name</label>
                <input
                  type="text"
                  required
                  value={config.shopName}
                  onChange={(e) => setConfig({ ...config, shopName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">GST Registration Code (GSTIN)</label>
                <input
                  type="text"
                  value={config.gstNumber || ''}
                  onChange={(e) => setConfig({ ...config, gstNumber: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Support Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Mail size={12} />
                  </span>
                  <input
                    type="email"
                    value={config.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Support Helpline</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                    <Phone size={12} />
                  </span>
                  <input
                    type="tel"
                    value={config.phone || ''}
                    onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl glass-input"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Primary Shop Address</label>
                <input
                  type="text"
                  value={config.address || ''}
                  onChange={(e) => setConfig({ ...config, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>
            </div>

            {/* WhatsApp Integration */}
            <h2 className="font-extrabold text-base flex items-center space-x-2 text-zinc-500 border-b border-zinc-200/40 dark:border-zinc-800/40 pt-4 pb-3">
              <MessageSquare size={18} className="text-emerald-500" />
              <span>WhatsApp Notification API Gateway</span>
            </h2>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">WhatsApp Cloud API Key / Token</label>
              <input
                type="password"
                placeholder="waba_token_..."
                value={config.whatsappApiKey || ''}
                onChange={(e) => setConfig({ ...config, whatsappApiKey: e.target.value })}
                className="w-full px-3 py-2.5 text-xs rounded-xl glass-input font-mono"
              />
              <span className="text-[9px] text-zinc-400 block mt-1 font-semibold">Used to dispatch automated PDF invoices and warranty reminders to clients.</span>
            </div>

            {/* SMTP Config */}
            <h2 className="font-extrabold text-base flex items-center space-x-2 text-zinc-500 border-b border-zinc-200/40 dark:border-zinc-800/40 pt-4 pb-3">
              <Mail size={18} className="text-sky-500" />
              <span>SMTP Email Dispatch Server</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">SMTP Server Host</label>
                <input
                  type="text"
                  placeholder="smtp.mailgun.org"
                  value={config.smtpConfig?.host || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    smtpConfig: { ...(config.smtpConfig || { host: '', port: 587, user: '', pass: '' }), host: e.target.value } 
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Port</label>
                <input
                  type="number"
                  placeholder="587"
                  value={config.smtpConfig?.port || 587}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    smtpConfig: { ...(config.smtpConfig || { host: '', port: 587, user: '', pass: '' }), port: Number(e.target.value) } 
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">SMTP Username</label>
                <input
                  type="text"
                  placeholder="user@relay.com"
                  value={config.smtpConfig?.user || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    smtpConfig: { ...(config.smtpConfig || { host: '', port: 587, user: '', pass: '' }), user: e.target.value } 
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">SMTP Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={config.smtpConfig?.pass || ''}
                  onChange={(e) => setConfig({ 
                    ...config, 
                    smtpConfig: { ...(config.smtpConfig || { host: '', port: 587, user: '', pass: '' }), pass: e.target.value } 
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl glass-input font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200/40 dark:border-zinc-800/40 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-glow-red"
              >
                Save Server Config
              </button>
            </div>

          </form>
        </div>

        {/* Right Side: Security Password Manager */}
        <div className="lg:col-span-4 space-y-6">
          <form onSubmit={handleChangePassword} className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-4">
            
            <h2 className="font-extrabold text-base flex items-center space-x-2 text-zinc-500 border-b border-zinc-200/40 dark:border-zinc-800/40 pb-3">
              <Key size={18} className="text-brand" />
              <span>Change Operator Password</span>
            </h2>

            {passError && (
              <div className="p-3 bg-red-100 text-brand text-xs font-bold rounded-xl flex items-center space-x-1">
                <X size={14} />
                <span>{passError}</span>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Update Security Credentials
            </button>

          </form>
          
          {/* Custom Theme customizer indicators */}
          <div className="glass-panel rounded-3xl p-6 shadow-premium dark:shadow-premium-dark space-y-4">
            <h2 className="font-extrabold text-base flex items-center space-x-2 text-zinc-500 border-b border-zinc-200/40 dark:border-zinc-800/40 pb-3">
              <Palette size={18} className="text-pink-500" />
              <span>Visual Theme Branding</span>
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-zinc-500">
              <div className="p-3 bg-brand/10 border border-brand/20 text-brand rounded-2xl text-center">
                <span>Crimson Red</span>
                <span className="block text-[9px] text-zinc-400 mt-1 uppercase font-extrabold">Active</span>
              </div>
              <div className="p-3 bg-zinc-100 dark:bg-zinc-950/20 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-center cursor-not-allowed opacity-50">
                <span>Cobalt Blue</span>
                <span className="block text-[9px] text-zinc-400 mt-1 uppercase font-extrabold">Enterprise Only</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
