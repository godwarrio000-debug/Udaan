import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, BookOpen, Calendar, ArrowRight, History, Trash2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { generateWithRetry } from '@/lib/gemini';

interface SavedPlan {
  id: string;
  topic: string;
  goal: string;
  content: string;
  date: string;
}

export function Plan() {
  const { setAnimeMessage, setAnimeEmotion } = useUser();
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [step, setStep] = useState<'setup' | 'loading' | 'plan'>('setup');
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [planContent, setPlanContent] = useState('');
  const [recentPlans, setRecentPlans] = useState<SavedPlan[]>([]);

  useEffect(() => {
    setAnimeMessage("Need a study plan? I can help!");
    setAnimeEmotion('happy');
  }, [setAnimeMessage, setAnimeEmotion]);

  useEffect(() => {
    const saved = localStorage.getItem('recent_plans');
    if (saved) {
      setRecentPlans(JSON.parse(saved));
    }
  }, []);

  const savePlan = (newPlan: SavedPlan) => {
    const updated = [newPlan, ...recentPlans.filter(p => p.topic !== newPlan.topic)].slice(0, 10);
    setRecentPlans(updated);
    localStorage.setItem('recent_plans', JSON.stringify(updated));
  };

  const deletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentPlans.filter(p => p.id !== id);
    setRecentPlans(updated);
    localStorage.setItem('recent_plans', JSON.stringify(updated));
  };

  const loadPlan = (plan: SavedPlan) => {
    setTopic(plan.topic);
    setGoal(plan.goal);
    setPlanContent(plan.content);
    setStep('plan');
    setAnimeMessage(`Loading your plan for ${plan.topic}!`);
    setAnimeEmotion('happy');
  };

  const generatePlan = async () => {
    if (!topic.trim()) return;
    setStep('loading');
    setAnimeMessage(`Creating a study plan for ${topic}...`);
    setAnimeEmotion('thinking');

    try {
      const prompt = `Create a detailed study plan for "${topic}".
      Goal: "${goal || 'Master the basics'}".
      
      Format the response using Markdown.
      Structure it with:
      - **Overview**: Brief summary.
      - **Modules**: Break down into 3-5 key modules.
      - **Timeline**: Suggested timeline (e.g., Week 1, Week 2).
      - **Resources**: Suggested types of resources (books, videos, practice).
      
      Make it encouraging and structured.`;

      const result = await generateWithRetry({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const text = result.text;
      if (text) {
        setPlanContent(text);
        const newPlan: SavedPlan = {
          id: Date.now().toString(),
          topic,
          goal,
          content: text,
          date: new Date().toLocaleDateString()
        };
        savePlan(newPlan);
        setStep('plan');
        setAnimeMessage("Here is your personalized study plan!");
        setAnimeEmotion('happy');
      } else {
        throw new Error("No data returned");
      }
    } catch (error: any) {
      console.error("Error generating plan:", error);
      setStep('setup');
      const isQuotaExceeded = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      setAnimeMessage(isQuotaExceeded ? "I'm a bit overwhelmed with plan requests! Try again in a moment." : "Oops! Failed to create plan.");
      setAnimeEmotion(isQuotaExceeded ? 'surprised' : 'sad');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      {step === 'setup' && (
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('new')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'new' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <BookOpen size={16} /> New Plan
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                activeTab === 'history' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <History size={16} /> History
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'setup' && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {activeTab === 'new' ? (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Sparkles className="text-indigo-500" /> Create Study Plan
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">What do you want to learn?</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Python Programming, French History"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">What is your specific goal? (Optional)</label>
                    <input
                      type="text"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g., Prepare for an exam in 2 weeks"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>

                  <button
                    onClick={generatePlan}
                    disabled={!topic.trim()}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2"
                  >
                    Generate Plan <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {recentPlans.length > 0 ? (
                  recentPlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      onClick={() => loadPlan(plan)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer relative"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                          <BookOpen size={20} />
                        </div>
                        <button
                          onClick={(e) => deletePlan(plan.id, e)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2 line-clamp-1">{plan.topic}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4">{plan.goal || 'No specific goal set'}</p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{plan.date}</span>
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                          Revisit <ArrowRight size={12} />
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <History size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-medium">No saved plans yet. Create your first one!</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Crafting your personalized study plan...</p>
          </motion.div>
        )}

        {step === 'plan' && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 lg:p-12 rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{topic}</h1>
                <p className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Personalized Study Roadmap
                </p>
              </div>
              <button
                onClick={() => setStep('setup')}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Create New Plan
              </button>
            </div>

            <div className="prose prose-lg max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600 prose-strong:text-slate-900 text-slate-600">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold mb-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="space-y-2 my-4 list-disc pl-5" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                }}
              >
                {planContent}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
