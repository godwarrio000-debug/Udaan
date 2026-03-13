import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, GraduationCap, BookOpen, ArrowRight, Sparkles, FileText, Trophy, Briefcase, Search, X, Youtube, Globe, Lightbulb, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@/context/UserContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { generateWithRetry, FALLBACK_RESOURCES } from '@/lib/gemini';

const SUGGESTIONS = [
  "Trigonometry", "Triangle Equation", "Trigonal Matrix", "Calculus", "Algebra", 
  "Geometry", "Probability", "Statistics", "Matrix", "Determinants",
  "Mechanics", "Thermodynamics", "Optics", "Electromagnetism", "Quantum Physics", "Kinematics",
  "Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Periodic Table", "Chemical Bonding",
  "Genetics", "Evolution", "Human Anatomy", "Plant Physiology", "Cell Biology",
  "JEE Main", "NEET", "UPSC", "SSC", "MHT-CET", "KCET", "GUJCET", "WBJEE", "AP EAPCET", "TS EAPCET"
];

const POSITIVE_THOUGHTS = [
  "The only way to do great work is to love what you do. ✨",
  "Believe you can and you're halfway there. 🚀",
  "Your limitation—it's only your imagination. 🌈",
  "Push yourself, because no one else is going to do it for you. 💪",
  "Sometimes later becomes never. Do it now. ⏳",
  "Great things never come from comfort zones. 🏔️",
  "Dream it. Wish it. Do it. 🌟",
  "Success doesn’t just find you. You have to go out and get it. 🏃‍♂️",
  "The harder you work for something, the greater you’ll feel when you achieve it. 🏆",
  "Dream bigger. Do bigger. 🌌",
  "Don’t stop when you’re tired. Stop when you’re done. 🏁",
  "Wake up with determination. Go to bed with satisfaction. 🛌",
  "Do something today that your future self will thank you for. 🙏",
  "Little things make big days. 🌱",
  "It’s going to be hard, but hard does not mean impossible. 🧗‍♂️",
  "Don’t wait for opportunity. Create it. 🛠️",
  "Sometimes we’re tested not to show our weaknesses, but to discover our strengths. 💎",
  "The key to success is to focus on goals, not obstacles. 🎯",
  "Dream it. Believe it. Build it. 🏗️"
];

export function Dashboard() {
  const { role, level, quizResults, name, goal, setAnimeMessage, setAnimeEmotion } = useUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [resources, setResources] = useState<{title: string, url: string, type: 'youtube' | 'web'}[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnimeMessage(`Welcome back, ${name}! Ready to learn something new today?`);
    setAnimeEmotion('happy');
    fetchResources();
  }, [name, level, goal, setAnimeMessage, setAnimeEmotion]);

  const fetchResources = async () => {
    if (!level) return;
    setLoadingResources(true);
    try {
      const prompt = `Suggest 3 high-quality YouTube study video titles and 2 educational web resource names for a student in ${level} ${goal ? `aiming to become a ${goal}` : ''}. 
      Return ONLY a JSON array of objects with keys: title, url (use placeholder like https://youtube.com/results?search_query=...), type ('youtube' or 'web').`;
      
      const result = await generateWithRetry({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(result.text || '[]');
      setResources(data);
    } catch (e: any) {
      console.error("Failed to fetch resources", e);
      if (e?.message?.includes('429') || e?.message?.includes('RESOURCE_EXHAUSTED')) {
        setResources(FALLBACK_RESOURCES.slice(0, 5));
      }
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 0) {
      const filtered = SUGGESTIONS.filter(s => 
        s.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6);
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    // Navigate to tutor with the topic
    navigate(`/tutor?topic=${encodeURIComponent(suggestion)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tutor?topic=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleMouseEnter = (title: string) => {
    setAnimeEmotion('thinking');
    if (title.includes('Tutor')) {
        setAnimeMessage("Want to try AI Tutor? Let's go!");
    } else if (title.includes('Quiz')) {
        setAnimeMessage("Quiz time? Show me what you got!");
        setAnimeEmotion('surprised');
    } else if (title.includes('Plan')) {
        setAnimeMessage("Need a study plan? I can help!");
    } else if (title.includes('Notes')) {
        setAnimeMessage("Smart notes? Great choice!");
    } else if (title.includes('Competitive')) {
        setAnimeMessage("Exam prep? You can do this!");
        setAnimeEmotion('happy');
    } else {
        setAnimeMessage(`Want to try ${title}?`);
        setAnimeEmotion('happy');
    }
  };

  const handleMouseLeave = () => {
    setAnimeMessage("I'm here if you need me!");
    setAnimeEmotion('happy');
  };

  const features = [
    {
      title: "Study Hub",
      description: "Search for video lessons and web articles on any topic.",
      icon: Search,
      path: "/resources",
      color: "bg-rose-500",
      bg: "bg-rose-50",
      text: "text-rose-700"
    },
    {
      title: "AI Tutor",
      description: "Get instant answers and explanations for any topic.",
      icon: MessageSquare,
      path: "/tutor",
      color: "bg-indigo-500",
      bg: "bg-indigo-50",
      text: "text-indigo-700"
    },
    {
      title: "Quiz Generator",
      description: "Test your knowledge with AI-generated quizzes.",
      icon: GraduationCap,
      path: "/quiz",
      color: "bg-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-700"
    },
    {
      title: "Study Plan",
      description: "Create a personalized roadmap for your learning goals.",
      icon: BookOpen,
      path: "/plan",
      color: "bg-amber-500",
      bg: "bg-amber-50",
      text: "text-amber-700"
    },
    {
      title: "Smart Notes",
      description: "Generate summaries and flashcards from your notes.",
      icon: FileText,
      path: "/notes",
      color: "bg-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-700"
    },
    {
      title: "Competitive Prep",
      description: "Daily challenges for UPSC, MPSC, and more.",
      icon: Trophy,
      path: "/competitive",
      color: "bg-orange-500",
      bg: "bg-orange-50",
      text: "text-orange-700"
    }
  ];

  if (role === 'teacher') {
    features.push({
      title: "Teacher Tools",
      description: "Create quizzes and assignments for your class.",
      icon: Briefcase,
      path: "/teacher",
      color: "bg-purple-500",
      bg: "bg-purple-50",
      text: "text-purple-700"
    });
  }

  // Prepare data for chart
  const chartData = quizResults.slice(0, 5).map((r, i) => ({
    name: `Quiz ${i + 1}`,
    score: (r.score / r.total) * 100,
    topic: r.topic
  }));

  const [thoughtOfTheDay, setThoughtOfTheDay] = useState("");
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    // Pick thought based on date
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setThoughtOfTheDay(POSITIVE_THOUGHTS[dayOfYear % POSITIVE_THOUGHTS.length]);

    // Simulate unlocking a badge
    const timer = setTimeout(() => {
      setShowBadge(true);
      setTimeout(() => setShowBadge(false), 5000); // Hide after 5s
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Global Search Bar */}
      <div className="relative max-w-2xl mx-auto z-20" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
            placeholder="Search topics (e.g., Trigonometry, JEE Main, Physics)..."
            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-12 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xl transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
              className="absolute inset-y-0 right-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          )}
        </form>

        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
            >
              <div className="p-2">
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-indigo-50 flex items-center gap-3 group transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <Search size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-indigo-700">{suggestion}</p>
                      <p className="text-xs text-slate-500">Topic in AI Tutor</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Press Enter to search directly
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Thought of the Day Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Lightbulb size={120} className="text-amber-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Sparkles size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider text-xs">Thought of the Day</h3>
              </div>
              <p className="text-2xl font-bold text-slate-800 leading-relaxed italic">
                "{thoughtOfTheDay}"
              </p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                <Link 
                  to={feature.path}
                  className="block h-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group"
                  onMouseEnter={() => handleMouseEnter(feature.title)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.text} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Study Resources Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Video className="text-red-500" /> Recommended Study Resources
              </h3>
              <button 
                onClick={fetchResources}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
              >
                Refresh
              </button>
            </div>

            {loadingResources ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full"
                />
                <p className="text-sm text-slate-500 font-medium">Finding the best resources for you...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {resources.map((res, idx) => (
                  <Link 
                    key={idx}
                    to={`/resources?url=${encodeURIComponent(res.url)}&title=${encodeURIComponent(res.title)}&type=${res.type}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      res.type === 'youtube' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {res.type === 'youtube' ? <Youtube size={24} /> : <Globe size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate group-hover:text-indigo-700">
                        {res.title}
                      </h4>
                      <p className="text-xs text-slate-500 capitalize">{res.type} Resource</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Performance Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Recent Performance
            </h3>
            {chartData.length > 0 ? (
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center">
                Complete quizzes to see your progress graph here.
              </div>
            )}
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200"
          >
            <h3 className="text-xl font-bold mb-4">AI Notes Generator</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
              Missed a class? No problem. Generate comprehensive notes for any topic in your {level} curriculum instantly.
            </p>
            <Link 
              to="/notes"
              className="block w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all text-center"
            >
              Generate Now
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
