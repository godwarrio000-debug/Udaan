import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, MessageSquare, LayoutDashboard, Menu, X, FileText, Briefcase, Trophy, User, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const location = useLocation();
  const { role, level, name, animeMessage, animeEmotion, setAnimeMessage } = useUser();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/library', label: 'Library', icon: BookOpen },
    { path: '/resources', label: 'Study Hub', icon: Video },
    { path: '/tutor', label: 'AI Tutor', icon: MessageSquare },
    { path: '/quiz', label: 'Quiz Generator', icon: GraduationCap },
    { path: '/plan', label: 'Study Plan', icon: BookOpen },
    { path: '/notes', label: 'Smart Notes', icon: FileText },
    { path: '/competitive', label: 'Competitive Prep', icon: Trophy },
    { path: '/profile', label: 'My Profile', icon: User },
  ];

  if (role === 'teacher') {
    navItems.push({ path: '/teacher', label: 'Teacher Tools', icon: Briefcase });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 blur-3xl animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[30%] rounded-full bg-purple-200/30 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] rounded-full bg-emerald-200/30 blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 shadow-xl lg:shadow-none flex flex-col",
          !isSidebarOpen && "-translate-x-full lg:translate-x-0"
        )}
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : undefined }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <GraduationCap className="w-8 h-8" />
            <span>LearnAI</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-slate-100 rounded-md"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-4 py-3 bg-slate-50/50 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Current Level</p>
          <p className="text-sm font-semibold text-indigo-700 truncate">{level || 'Not Selected'}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium relative overflow-hidden group",
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-indigo-50 rounded-xl z-0"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn("w-5 h-5 z-10 relative", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                <span className="z-10 relative">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-indigo-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-indigo-900 mb-1">Pro Tip</h4>
            <p className="text-xs text-indigo-700/80 leading-relaxed">
              Ask the AI Tutor to explain concepts "like I'm 5" for simpler answers.
            </p>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1" /> {/* Spacer */}
          <div className="flex items-center gap-4">
            <Link to="/profile" className="flex items-center gap-2 group">
              <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600 transition-colors hidden sm:block">{name}</span>
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm ring-2 ring-white shadow-sm group-hover:ring-indigo-200 transition-all">
                {name.charAt(0)}
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth">
          <div className="max-w-5xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
