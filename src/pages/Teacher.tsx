import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion } from 'motion/react';
import { Briefcase, FilePlus, CheckSquare, Users, Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function Teacher() {
  const { role, setAnimeMessage, setAnimeEmotion } = useUser();
  const [activeTab, setActiveTab] = useState<'quiz' | 'assignment'>('quiz');
  const [topic, setTopic] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (role === 'teacher') {
      setAnimeMessage("Welcome, Educator! Let's create some amazing content for your students.");
      setAnimeEmotion('happy');
    }
  }, [role, setAnimeMessage, setAnimeEmotion]);

  if (role !== 'teacher') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Briefcase className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Teacher Access Only</h2>
        <p className="text-slate-500 max-w-md">
          This section is reserved for educators to create content and manage classes. 
          Please switch your role to 'Teacher' in settings to access these tools.
        </p>
      </div>
    );
  }

  const generateContent = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      let prompt = "";
      if (activeTab === 'quiz') {
        prompt = `Generate a quiz for students on the topic: "${topic}".
        Include 5 Multiple Choice Questions with answers and explanations.
        Format as clear text suitable for copying into a document.`;
      } else {
        prompt = `Create a homework assignment for the topic: "${topic}".
        Include:
        1. Learning Objectives
        2. 3 Short Answer Questions
        3. 1 Practical/Research Task
        4. Grading Rubric`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
      });

      setResult(response.text || "Failed to generate.");
    } catch (e) {
      console.error(e);
      setResult("Error generating content.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Teacher Tools</h1>
          <p className="text-slate-500">Create curriculum content in seconds.</p>
        </div>
        <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('quiz')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'quiz' ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <CheckSquare size={16} /> Quiz Creator
          </button>
          <button
            onClick={() => setActiveTab('assignment')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'assignment' ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <FilePlus size={16} /> Assignment Gen
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            {activeTab === 'quiz' ? 'Create New Quiz' : 'Create Assignment'}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Topic / Subject</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Photosynthesis, World War II"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <button
              onClick={generateContent}
              disabled={loading || !topic.trim()}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Generate Content'}
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 min-h-[400px] overflow-y-auto">
          {result ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-slate-700">{result}</pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <FilePlus className="w-12 h-12 mb-2 opacity-20" />
              <p>Generated content will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
