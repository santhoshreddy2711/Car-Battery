import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useNotifications } from '../context/NotificationContext.js';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Battery, 
  Receipt, 
  Users, 
  ShieldCheck, 
  Truck, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  GitFork,
  Bell,
  Menu,
  X,
  Store
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout, updateUserBranch } = useAuth();
  const { unreadCount, triggerScan } = useNotifications();
  const [darkMode, setDarkMode] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Load branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get('/api/branches');
        setBranches(res.data);
      } catch (err) {
        console.error('Failed to load branches', err);
      }
    };
    if (user) {
      fetchBranches();
    }
  }, [user]);

  // Load theme preference
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Battery },
    { id: 'billing', label: 'Billing / Invoice', icon: Receipt },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'warranty', label: 'Warranty Claims', icon: ShieldCheck },
    { id: 'purchases', label: 'Purchases PO', icon: Store },
    { id: 'suppliers', label: 'Suppliers Ledger', icon: Truck },
    { id: 'branches', label: 'Branch Transfer', icon: GitFork },
    { id: 'reports', label: 'Reports & P&L', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNav = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header Banner */}
      <div className="md:hidden w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-50 no-print">
        <div className="flex items-center space-x-2">
          <span className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white font-bold">B</span>
          <span className="font-bold text-lg text-brand tracking-wider">BATTERY ERP</span>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={toggleTheme} 
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-brand"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar Drawer Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-zinc-200/50 dark:border-zinc-800/50 p-6 flex flex-col justify-between 
        transform md:translate-x-0 transition-transform duration-300 ease-in-out no-print
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:relative'}
      `}>
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Logo area */}
            <div className="flex items-center space-x-3 mb-8">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-red-500 flex items-center justify-center text-white font-extrabold text-xl shadow-glow-red">
                B
              </span>
              <div>
                <span className="font-extrabold text-xl tracking-wider text-brand block">CAR BATTERY</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest">Enterprise ERP</span>
              </div>
            </div>

            {/* Branch Switcher */}
            {user && (
              <div className="mb-6 bg-white/50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-3 flex flex-col space-y-1">
                <span className="text-[9px] text-zinc-400 uppercase font-extrabold tracking-wider flex items-center">
                  <Store size={10} className="mr-1" /> Active Branch
                </span>
                <select 
                  value={user.branchId}
                  onChange={(e) => updateUserBranch(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer w-full text-zinc-700 dark:text-zinc-300"
                >
                  <option value="main" className="dark:bg-zinc-900">Main HQ</option>
                  {branches.filter(b => b.code !== 'main').map(b => (
                    <option key={b.code} value={b.code} className="dark:bg-zinc-900">{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Navigation Menu Links */}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200
                      ${isActive 
                        ? 'bg-brand text-white shadow-glow-red' 
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-850/40 hover:text-brand'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>

                    {/* Low stock alerts badge count */}
                    {item.id === 'inventory' && unreadCount > 0 && (
                      <span className="bg-white text-brand text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Profile Details */}
          <div className="pt-6 border-t border-zinc-200/50 dark:border-zinc-800/50 flex flex-col space-y-4">
            {/* Quick stock checker trigger */}
            <button 
              onClick={triggerScan}
              className="w-full py-2 bg-zinc-100 dark:bg-zinc-800/60 hover:bg-brand/10 hover:text-brand rounded-xl text-xs font-bold transition-all text-zinc-500 flex items-center justify-center space-x-1"
            >
              <Bell size={12} className="animate-bounce" />
              <span>Verify Low Stock Alerts</span>
            </button>

            {/* Theme Toggle & User Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-9 h-9 rounded-full bg-brand-light dark:bg-zinc-800 flex items-center justify-center text-brand font-bold text-sm">
                  {user?.name ? user.name[0] : 'U'}
                </div>
                <div className="overflow-hidden">
                  <span className="font-bold text-xs block text-ellipsis overflow-hidden whitespace-nowrap">{user?.name || 'Operator'}</span>
                  <span className="text-[10px] text-zinc-400 font-medium capitalize">{user?.role || 'Staff'}</span>
                </div>
              </div>
              <button 
                onClick={toggleTheme} 
                className="hidden md:block p-2 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 hover:text-brand transition-all"
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>

            {/* Logout control */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-red-50 dark:bg-red-950/20 hover:bg-brand text-brand hover:text-white rounded-xl text-sm font-bold transition-all duration-200"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backing Mask */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)} 
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
        />
      )}
    </>
  );
};
