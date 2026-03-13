import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser, StudentLevel, UserRole } from '@/context/UserContext';
import { GraduationCap, Briefcase, School, BookOpen, Microscope, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OnboardingModal() {
  const { level, setLevel, role, setRole, name, setName } = useUser();
  const [step, setStep] = React.useState<'name' | 'role' | 'level' | 'completed'>(level ? 'completed' : 'name');
  const [tempName, setTempName] = React.useState(name || '');

  // If level is already set, don't show modal
  if (level && step === 'completed') return null;

  const levels: { id: StudentLevel; icon: any; label: string; desc: string }[] = [
    { id: 'Class 1-5', icon: School, label: 'Class 1-5', desc: 'Primary Education' },
    { id: 'Class 6-10', icon: BookOpen, label: 'Class 6-10', desc: 'Secondary Education' },
    { id: 'Class 11-12', icon: GraduationCap, label: 'Class 11-12', desc: 'Higher Secondary' },
    { id: 'Engineering (B.Tech)', icon: Briefcase, label: 'Engineering', desc: 'B.Tech / B.E.' },
    { id: 'Postgraduate / PhD', icon: Microscope, label: 'Postgraduate', desc: 'Masters / PhD' },
    { id: 'Competitive Exams', icon: Trophy, label: 'Competitive Exams', desc: 'UPSC, MPSC, Banking' },
  ];

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setName(tempName.trim());
      setStep('role');
    }
  };

  const handleRoleSelect = (r: UserRole) => {
    setRole(r);
    setStep('level');
  };

  const handleLevelSelect = (l: StudentLevel) => {
    setLevel(l);
    setStep('completed');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        >
          <div className="p-8">
            {step === 'name' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900">Welcome to LearnAI</h2>
                  <p className="text-slate-500 mt-2">Let's start by getting to know you.</p>
                </div>
                <form onSubmit={handleNameSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">What is your name?</label>
                    <input
                      type="text"
                      autoFocus
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!tempName.trim()}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-100"
                  >
                    Continue
                  </button>
                </form>
              </div>
            )}

            {step === 'role' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900">Hi {name}!</h2>
                  <p className="text-slate-500 mt-2">Tell us who you are to personalize your experience.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRoleSelect('student')}
                    className="flex flex-col items-center p-6 border-2 border-slate-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                  >
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">I am a Student</h3>
                    <p className="text-sm text-slate-500 text-center mt-1">I want to learn, practice, and track my progress.</p>
                  </button>

                  <button
                    onClick={() => handleRoleSelect('teacher')}
                    className="flex flex-col items-center p-6 border-2 border-slate-100 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Briefcase className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">I am a Teacher</h3>
                    <p className="text-sm text-slate-500 text-center mt-1">I want to create quizzes and manage assignments.</p>
                  </button>
                </div>
                <button 
                  onClick={() => setStep('name')}
                  className="text-sm text-slate-400 hover:text-slate-600 w-full text-center"
                >
                  Back to Name
                </button>
              </div>
            )}

            {step === 'level' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-slate-900">Select Your Level</h2>
                  <p className="text-slate-500 mt-2">We'll adjust the difficulty of explanations based on this.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
                  {levels.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => handleLevelSelect(lvl.id)}
                      className="flex flex-col items-start p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
                    >
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <lvl.icon className="w-5 h-5 text-slate-600 group-hover:text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 text-sm">{lvl.label}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{lvl.desc}</p>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setStep('role')}
                  className="text-sm text-slate-400 hover:text-slate-600 w-full text-center"
                >
                  Back to Role Selection
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
