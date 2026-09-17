import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Customers from './components/Customers';
import Documents from './components/Documents';
import Parts from './components/Parts';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
import Calendar from './components/Calendar';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import LegalPage from './components/LegalPage';
import CommandPalette from './components/CommandPalette';
import { LogIn, Bike, ShieldAlert } from 'lucide-react';
import './App.css';

function MainApp() {
  const { user, loading, login, hasPermission, isRole } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Shortcuts & Modals
  const [openNewSale, setOpenNewSale] = useState(false);
  const [openNewBike, setOpenNewBike] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Global Ctrl+K hotkey for Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fallback to allowed tab if current tab becomes unauthorized on role switch
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'users' && !isRole('Admin')) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'parts' && !hasPermission('MANAGE_PARTS')) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'documents' && !hasPermission('MANAGE_DOCS')) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'inventory' && !hasPermission('MANAGE_BIKES') && !hasPermission('READ_SALES')) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'reports' && !hasPermission('VIEW_REPORTS') && !hasPermission('EXPORT_EXCEL')) {
      setActiveTab('dashboard');
    }
    if (activeTab === 'analytics' && !hasPermission('VIEW_REPORTS')) {
      setActiveTab('dashboard');
    }
  }, [user, activeTab, hasPermission, isRole]);

  if (loading) {
    return (
      <div className="full-screen-loader">
        <div className="spinner"></div>
        <h2>Loading AutoSuite</h2>
        <span className="text-muted text-xs">Checking your account and permissions</span>
      </div>
    );
  }

  // If logged out, render sleek login portal
  if (!user) {
    return <LoginPortal onLogin={login} />;
  }

  return (
    <div className="app-layout">
      {/* Mobile Drawer Overlay */}
      <div
        className={`sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="app-main-content">
        <Header
          activeTab={activeTab}
          onOpenMobile={() => setIsMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main className="module-container">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onOpenNewSale={() => {
                setActiveTab('sales');
                setOpenNewSale(true);
              }}
              onOpenNewBike={() => {
                setActiveTab('inventory');
                setOpenNewBike(true);
              }}
            />
          )}

          {activeTab === 'inventory' && (
            <Inventory
              isOpenAddModal={openNewBike}
              onCloseAddModal={() => setOpenNewBike(false)}
            />
          )}

          {activeTab === 'sales' && (
            <Sales
              isOpenNewSaleModal={openNewSale}
              onCloseNewSaleModal={() => setOpenNewSale(false)}
            />
          )}

          {activeTab === 'customers' && <Customers />}

          {activeTab === 'documents' && <Documents />}

          {activeTab === 'parts' && (
            hasPermission('MANAGE_PARTS') ? (
              <Parts />
            ) : (
              <UnauthorizedWarning
                module="Spare Parts Management (Manager / Admin Role Required)"
              />
            )
          )}

          {activeTab === 'calendar' && <Calendar />}

          {activeTab === 'analytics' && <Analytics />}

          {activeTab === 'reports' && <Reports />}

          {activeTab === 'settings' && <Settings />}

          {activeTab === 'legal' && <LegalPage />}

          {activeTab === 'users' && (
            isRole('Admin') ? (
              <UserManagement />
            ) : (
              <UnauthorizedWarning
                module="User & RBAC Administration (Admin Role Required)"
              />
            )
          )}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsCommandPaletteOpen(false);
        }}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
}

function UnauthorizedWarning({ module }) {
  return (
    <div className="unauthorized-card glass-panel">
      <ShieldAlert size={28} className="mb-3" />
      <h3>Access Restricted</h3>
      <p>{module}</p>
      <p className="text-muted text-xs mt-2">
        Your current account does not have permission to access this module. Please contact your system administrator if you require access.
      </p>
    </div>
  );
}

function LoginPortal({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-portal-bg">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="login-brand-icon">
            <Bike size={22} />
          </div>
          <h2>AutoSuite</h2>
          <p>Dealership inventory, sales and accounts</p>
        </div>

        {error && <div className="modal-error-banner mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input"
              placeholder="Enter your username"
            />
          </div>

          <div className="form-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block mt-3" disabled={submitting}>
            <LogIn size={16} /> {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <MainApp />
          </AuthProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}