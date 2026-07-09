import { useState } from 'react';
import { useAuth } from './context/AuthContext.js';
import { Sidebar } from './components/Sidebar.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { Inventory } from './pages/Inventory.js';
import { Billing } from './pages/Billing.js';
import { Customers } from './pages/Customers.js';
import { Warranty } from './pages/Warranty.js';
import { Purchases } from './pages/Purchases.js';
import { Suppliers } from './pages/Suppliers.js';
import { BranchManager } from './pages/BranchManager.js';
import { Reports } from './pages/Reports.js';
import { Settings } from './pages/Settings.js';

function App() {
  const { token, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auth Guard
  if (!token) {
    return <Login />;
  }

  // Render Page Component based on active sidebar tab
  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'billing':
        return <Billing />;
      case 'customers':
        return <Customers />;
      case 'warranty':
        return <Warranty />;
      case 'purchases':
        return <Purchases />;
      case 'suppliers':
        return <Suppliers />;
      case 'branches':
        return <BranchManager />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-50 transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Workspace viewport */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        {renderActivePage()}
      </main>

    </div>
  );
}

export default App;
