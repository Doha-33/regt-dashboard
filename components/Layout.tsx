
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Menu, 
  Bell, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  CreditCard,
  Building2,
  Send,
  Settings,
  Sun,
  Moon,
  Globe,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const Layout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, isRTL } = useLanguage();

  const navItems = [
    { path: '/', label: t('dashboard'), icon: LayoutDashboard },
    { path: '/users', label: t('users'), icon: Users },
    { path: '/withdrawals', label: t('withdrawals'), icon: CreditCard },
    { path: '/companies', label: t('companies'), icon: Building2 },
    { path: '/ads', label: t('ads'), icon: Megaphone },
    { path: '/notifications', label: t('notifications'), icon: Send },
    { path: '/settings', label: t('settings'), icon: Settings },
  ];

  const notifications = [
    { id: 1, title: 'New Withdrawal Request', time: '2 min ago', unread: true },
    { id: 2, title: 'User Flagged: Suspicious Activity', time: '1 hour ago', unread: false },
  ];

  const getPageTitle = () => {
    const current = navItems.find(item => item.path === location.pathname);
    if (current) return current.label;
    if (location.pathname === '/profile') return t('profile');
    return t('dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const isPathActive = (path: string) => {
      if (path === '/') return location.pathname === '/';
      return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-sans transition-colors duration-200" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 z-40 transform transition-all duration-300 ease-in-out lg:static 
          ${isSidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')} 
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64 flex flex-col shadow-xl 
          ${isRTL ? 'border-l left-auto right-0' : 'border-r left-0'} 
          border-gray-200 dark:border-slate-800
          bg-white dark:bg-slate-900
        `}
      >
        <div className={`flex h-16 items-center border-b border-gray-100 dark:border-slate-800 ${isCollapsed ? 'justify-center' : 'justify-between px-4'}`}>
          {!isCollapsed && (
            <h1 className="text-xl font-bold tracking-wider">
              <span className="text-blue-600 dark:text-blue-400">Regt</span>
              <span className="text-gray-800 dark:text-white">Admin</span>
            </h1>
          )}
          {isCollapsed && <span className="text-xl font-bold text-blue-600 dark:text-blue-400">R</span>}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white transition-colors"
          >
            {isCollapsed ? (isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />) : (isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
          </button>
        </div>
        
        <nav className="mt-6 px-3 space-y-2 flex-1 custom-scrollbar overflow-y-auto">
          {navItems.map((item) => {
            const active = isPathActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                title={isCollapsed ? item.label : ''}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                    active 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`
                }
              >
                <item.icon size={22} className={isCollapsed ? '' : 'min-w-[22px]'} />
                {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-slate-800 space-y-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex w-full items-center gap-3 px-3 py-3 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? (theme === 'dark' ? t('light_mode') : t('dark_mode')) : ''}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {!isCollapsed && <span className="font-medium">{theme === 'dark' ? t('light_mode') : t('dark_mode')}</span>}
          </button>
          
           {/* Language Toggle */}
           <button
            onClick={toggleLanguage}
            className={`flex w-full items-center gap-3 px-3 py-3 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? (language === 'en' ? t('arabic') : t('english')) : ''}
          >
            <Globe size={20} />
            {!isCollapsed && <span className="font-medium">{language === 'en' ? t('arabic') : t('english')}</span>}
          </button>

          {/* Logout */}
          <button 
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 px-3 py-3 rounded-lg text-gray-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-500 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? t('logout') : ''}
          >
            <LogOut size={20} />
            {!isCollapsed && <span className="font-medium">{t('logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden w-full bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <header className="flex h-16 items-center justify-between bg-white dark:bg-slate-800 px-4 lg:px-6 shadow-sm border-b border-gray-200 dark:border-slate-700 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white truncate">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             
             {/* <div className="relative">
               <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
               >
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>
               </button>
               
               {showNotifications && (
                 <div className={`absolute top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden ${isRTL ? 'left-0' : 'right-0'}`}>
                   <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                     <h3 className="font-semibold text-gray-900 dark:text-white">{t('notifications')}</h3>
                   </div>
                   <div className="max-h-80 overflow-y-auto">
                     {notifications.map(notif => (
                       <div key={notif.id} className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-0 ${notif.unread ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                         <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{notif.title}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notif.time}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div> */}

             <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm"
                >
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </button>

                {showProfileMenu && (
                  <div className={`absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden ${isRTL ? 'left-0' : 'right-0'}`}>
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => { setShowProfileMenu(false); navigate('/profile'); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                      >
                        <UserCircle size={16} /> {t('profile')}
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg mt-1"
                      >
                        <LogOut size={16} /> {t('logout')}
                      </button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </header>

        <main 
          className="flex-1 overflow-y-auto p-4 lg:p-8 relative"
          onClick={() => {
            setShowNotifications(false);
            setShowProfileMenu(false);
          }}
        >
           {children}
        </main>
      </div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default Layout;
