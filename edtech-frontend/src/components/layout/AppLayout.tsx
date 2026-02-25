import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Network, 
  PenTool, 
  ChartColumn, 
  Settings,
  LogOut,
  BookX,
  Trophy,
  Medal,
  Target,
  Users,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';

const MENU_ITEMS = [
  { path: '/app', label: '首页', icon: Home },
  { path: '/app/practice', label: '智能刷题', icon: PenTool },
  { path: '/app/wrong-questions', label: '错题本', icon: BookX },
  { path: '/app/report', label: '成长报告', icon: ChartColumn },
  { path: '/app/achievements', label: '成就殿堂', icon: Trophy },
  { path: '/app/leaderboard', label: '排行榜', icon: Medal },
  { path: '/app/daily-goals', label: '每日目标', icon: Target },
  { path: '/app/knowledge-graph', label: '知识图谱', icon: Network },
];

const MOBILE_TAB_ITEMS = [
  { path: '/app', label: '首页', icon: Home },
  { path: '/app/practice', label: '练习', icon: PenTool },
  { path: '/app/report', label: '报告', icon: ChartColumn },
  { path: '/app/settings', label: '我的', icon: Settings },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  useEffect(() => {
    const content = document.getElementById('app-scroll-container');
    const sidebar = document.getElementById('sidebar-scroll');
    if (!content || !sidebar) return;

    let ticking = false;

    const syncScroll = () => {
      const maxContent = content.scrollHeight - content.clientHeight;
      const maxSidebar = sidebar.scrollHeight - sidebar.clientHeight;
      if (maxContent <= 0 || maxSidebar <= 0) {
        ticking = false;
        return;
      }
      const ratio = content.scrollTop / maxContent;
      const target = ratio * maxSidebar;
      sidebar.scrollTo({ top: target, behavior: 'smooth' });
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(syncScroll);
      }
    };

    content.addEventListener('scroll', handleScroll);
    return () => {
      content.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Check if user is parent
  const isParent = localStorage.getItem('role') === 'PARENT';

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row md:p-4 gap-4 overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="hidden md:flex w-64 flex-shrink-0 flex-col bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl rounded-3xl p-6 z-10"
      >
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            E
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
            EdTech AI
          </h1>
        </div>

        <nav id="sidebar-scroll" className="flex-1 space-y-1.5 overflow-y-auto">
          {/* Parent Dashboard Link (if parent) */}
          {isParent && (
            <Link
              to="/app/parent"
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-200",
                location.pathname === '/app/parent'
                  ? "bg-violet-100 text-violet-600 font-medium"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Users size={20} />
              <span>家长监督</span>
            </Link>
          )}
          
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-200",
                  isActive ? "text-primary-600 font-medium" : "text-slate-500 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-menu-bg"
                    className="absolute inset-0 bg-primary-50 rounded-2xl"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </span>
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="pt-6 border-t border-slate-100 space-y-2">
          <Link
            to="/app/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all w-full",
              location.pathname === '/app/settings'
                ? "bg-primary-50 text-primary-600 font-medium"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Settings size={20} />
            <span>设置</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 w-full transition-all"
          >
            <LogOut size={20} />
            <span>退出</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
            E
          </div>
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600">
            EdTech AI
          </h1>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 z-40 pt-16"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-16 bottom-0 w-72 bg-white p-6 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <nav className="space-y-2">
                {MENU_ITEMS.map((item) => {
                  const isActive = location.pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                        isActive 
                          ? "bg-primary-50 text-primary-600 font-medium" 
                          : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <div className="pt-4 border-t border-slate-100">
                  <Link
                    to="/app/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50"
                  >
                    <Settings size={20} />
                    <span>设置</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 w-full"
                  >
                    <LogOut size={20} />
                    <span>退出</span>
                  </button>
                </div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 relative flex flex-col min-w-0 pb-20 md:pb-0">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          id="app-scroll-container"
          className="flex-1 bg-white/60 backdrop-blur-md md:border md:border-white/20 shadow-sm md:rounded-3xl p-4 md:p-8 overflow-y-auto"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile Bottom TabBar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-50">
        <div className="flex justify-around items-center h-16">
          {MOBILE_TAB_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 transition-colors",
                  isActive ? "text-primary-600" : "text-slate-400"
                )}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-tab-indicator"
                    className="absolute bottom-0 w-12 h-1 bg-primary-500 rounded-t-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
