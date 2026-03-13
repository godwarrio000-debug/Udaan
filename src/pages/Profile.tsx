import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Trophy, Star, Book, Target, Award, TrendingUp, Clock, Edit2, Save, X, School, GraduationCap, Info } from 'lucide-react';
import { useUser, StudentLevel } from '@/context/UserContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const PERFORMANCE_DATA = [
  { name: 'Quizzes', value: 85 },
  { name: 'Exams', value: 72 },
  { name: 'Notes', value: 94 },
  { name: 'Tutor', value: 68 },
];

const WEEKLY_PROGRESS = [
  { day: 'Mon', hours: 2.5 },
  { day: 'Tue', hours: 3.8 },
  { day: 'Wed', hours: 1.5 },
  { day: 'Thu', hours: 4.2 },
  { day: 'Fri', hours: 3.0 },
  { day: 'Sat', hours: 5.5 },
  { day: 'Sun', hours: 2.0 },
];

const LEVELS: StudentLevel[] = [
  'Class 1-5', 'Class 6-10', 'Class 11-12', 'Engineering (B.Tech)', 'Postgraduate / PhD', 'Competitive Exams'
];

export function Profile() {
  const { 
    name, setName, 
    level, setLevel, 
    school, setSchool, 
    bio, setBio, 
    goal, setGoal,
    setAnimeMessage, setAnimeEmotion 
  } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name,
    level: level || 'Class 6-10' as StudentLevel,
    school,
    bio,
    goal
  });

  React.useEffect(() => {
    setAnimeMessage(`Great progress, ${name}! You're doing amazing!`);
    setAnimeEmotion('happy');
  }, [name, setAnimeMessage, setAnimeEmotion]);

  const handleSave = () => {
    setName(editData.name);
    setLevel(editData.level);
    setSchool(editData.school);
    setBio(editData.bio);
    setGoal(editData.goal);
    setIsEditing(false);
    setAnimeMessage("Profile updated successfully! Looking good!");
    setAnimeEmotion('happy');
  };

  const stats = [
    { label: 'Study Hours', value: '22.5h', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Quizzes Done', value: '48', icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Notes Created', value: '124', icon: Book, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Achievements', value: '12', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const achievements = [
    { title: 'Early Bird', desc: 'Studied before 7 AM for 5 days', icon: Star, date: '2 days ago' },
    { title: 'Quiz Master', desc: 'Scored 100% in 10 quizzes', icon: Award, date: '1 week ago' },
    { title: 'Note Ninja', desc: 'Created 50+ smart notes', icon: Book, date: '3 days ago' },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-8"
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
            <User size={64} />
          </div>
          
          <div className="text-center md:text-left flex-1">
            {!isEditing ? (
              <>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{name}</h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium flex items-center gap-1">
                    <GraduationCap size={14} /> {level}
                  </span>
                  {school && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium flex items-center gap-1">
                      <School size={14} /> {school}
                    </span>
                  )}
                  {goal && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-sm font-medium flex items-center gap-1">
                      <Target size={14} /> Aiming for: {goal}
                    </span>
                  )}
                </div>
                {bio && (
                  <p className="text-slate-600 text-sm mb-4 max-w-2xl italic">
                    "{bio}"
                  </p>
                )}
                <div className="w-full max-w-md bg-slate-100 h-3 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-indigo-600"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">Level 12 • 750 / 1000 XP to next level</p>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Class / Level</label>
                  <select 
                    value={editData.level}
                    onChange={(e) => setEditData({...editData, level: e.target.value as StudentLevel})}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">School / College</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Stanford University"
                    value={editData.school}
                    onChange={(e) => setEditData({...editData, school: e.target.value})}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Career Goal</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Software Engineer"
                    value={editData.goal}
                    onChange={(e) => setEditData({...editData, goal: e.target.value})}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Bio / About Me</label>
                  <textarea 
                    rows={2}
                    placeholder="Tell us about yourself..."
                    value={editData.bio}
                    onChange={(e) => setEditData({...editData, bio: e.target.value})}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Edit2 size={18} /> Edit Profile
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  <Save size={18} /> Save Changes
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-semibold hover:bg-slate-200 transition-all"
                >
                  <X size={18} /> Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all"
          >
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="text-indigo-500" /> Weekly Study Activity
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_PROGRESS}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-6">Performance Mix</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PERFORMANCE_DATA}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {PERFORMANCE_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {PERFORMANCE_DATA.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-xs text-slate-500">{entry.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
            >
              <h3 className="text-lg font-bold text-slate-900 mb-6">Learning Streak</h3>
              <div className="flex items-center justify-center py-4">
                <div className="relative">
                  <svg className="w-32 h-32">
                    <circle
                      className="text-slate-100"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="58"
                      cx="64"
                      cy="64"
                    />
                    <circle
                      className="text-indigo-600"
                      strokeWidth="8"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 * (1 - 0.7)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="58"
                      cx="64"
                      cy="64"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900">7</span>
                    <span className="text-xs text-slate-500">Days</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-slate-500 mt-2">You're on fire! Keep it up!</p>
            </motion.div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Award className="text-amber-500" /> Recent Achievements
            </h3>
            <div className="space-y-6">
              {achievements.map((ach) => (
                <div key={ach.title} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
                    <ach.icon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{ach.title}</h4>
                    <p className="text-xs text-slate-500 mb-1">{ach.desc}</p>
                    <p className="text-[10px] text-slate-400">{ach.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 rounded-xl transition-all">
              View All Badges
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200"
          >
            <h3 className="text-xl font-bold mb-4">Pro Tip!</h3>
            <p className="text-indigo-100 text-sm mb-6">
              Users who create at least 3 smart notes a week retain 40% more information. Try creating one today!
            </p>
            <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all">
              Go to Notes
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
