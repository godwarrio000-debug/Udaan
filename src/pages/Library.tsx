import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { BookOpen, ChevronRight, Play, FileText, HelpCircle, Image as ImageIcon, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Mock Library Structure
const LIBRARY_DATA: Record<string, Record<string, string[]>> = {
  'Class 1-5': {
    'Science': ['Living and Non-living', 'Plants', 'Animals', 'Human Body', 'Solar System'],
    'Math': ['Numbers', 'Addition & Subtraction', 'Shapes', 'Measurements', 'Time'],
    'English': ['Nouns', 'Verbs', 'Adjectives', 'Story Writing', 'Reading Comprehension']
  },
  'Class 6-10': {
    'Science': ['Photosynthesis', 'Force and Motion', 'Electricity', 'Acids and Bases', 'Reproduction'],
    'Math': ['Algebra', 'Geometry', 'Trigonometry', 'Statistics', 'Probability'],
    'Social Science': ['History of India', 'Democracy', 'Resources', 'Geography of World', 'Economics']
  },
  'Class 11-12': {
    'Physics': ['Kinematics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Modern Physics'],
    'Chemistry': ['Atomic Structure', 'Chemical Bonding', 'Organic Chemistry', 'Electrochemistry', 'Solutions'],
    'Biology': ['Cell Structure', 'Genetics', 'Evolution', 'Ecology', 'Biotechnology']
  },
  'Engineering (B.Tech)': {
    'Computer Science': ['Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks'],
    'Electronics': ['Circuits', 'Digital Logic', 'Signals & Systems', 'Microprocessors', 'Communication'],
    'Mechanical': ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Machine Design', 'Manufacturing']
  },
  'Competitive Exams': {
    'General Knowledge': ['History', 'Geography', 'Polity', 'Economy', 'Current Affairs'],
    'Aptitude': ['Number System', 'Percentage', 'Ratio & Proportion', 'Time & Work', 'Speed & Distance'],
    'Reasoning': ['Coding-Decoding', 'Blood Relations', 'Direction Sense', 'Puzzles', 'Series']
  }
};

export function Library() {
  const { level, setAnimeMessage, setAnimeEmotion } = useUser();
  const [subject, setSubject] = useState<string | null>(null);
  const [chapter, setChapter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'learn' | 'visuals' | 'quiz'>('learn');
  const [content, setContent] = useState<string>('');
  const [visualContent, setVisualContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAnimeMessage("Hi! I'm your AI Tutor. Pick a subject to start!");
    setAnimeEmotion('happy');
  }, [setAnimeMessage, setAnimeEmotion]);

  const generateContent = async (selectedChapter: string) => {
    setLoading(true);
    setChapter(selectedChapter);
    setAnimeMessage(`Let's learn about ${selectedChapter}! I'm preparing your notes...`);
    setAnimeEmotion('thinking');
    
    try {
      const prompt = `Create comprehensive study notes for the chapter "${selectedChapter}" in subject "${subject}" for a student at **${level}** level.
      
      Structure:
      1. **Simple Explanation**: Explain like I'm 5 (if level is low) or clearly.
      2. **Detailed Explanation**: In-depth concepts.
      3. **Key Points**: Bullet points.
      4. **Real-world Examples**: Practical applications.
      5. **Practice Questions**: 3 questions with answers hidden (or at end).
      
      Use Markdown. Make it engaging.`;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      setContent(result.text || "Failed to load content.");
      setAnimeMessage(`Here are your notes on ${selectedChapter}. Let me know if you have questions!`);
      setAnimeEmotion('happy');
    } catch (e) {
      console.error(e);
      setContent("Error loading content.");
      setAnimeMessage("Oops! I had trouble finding that. Try again?");
      setAnimeEmotion('sad');
    } finally {
      setLoading(false);
    }
  };

  const generateVisuals = async () => {
    if (!chapter) return;
    setLoading(true);
    setActiveTab('visuals');
    setAnimeMessage(`Drawing some diagrams for ${chapter}...`);
    setAnimeEmotion('thinking');

    try {
      // Since we can't generate real images easily in this text-based UI without an image model that returns URLs we can display directly (and we are restricted on external URLs), 
      // we will generate a detailed text description of a diagram and maybe use Mermaid.js or just text for now.
      // BUT, let's try to use the image model to generate a "description" that sounds like a visual aid.
      // Actually, let's use the text model to generate a Mermaid diagram code block!
      
      const prompt = `Create a Mermaid.js diagram code (graph TD or mindmap) to visualize the concepts of "${chapter}". 
      Also provide a text description of what an educational diagram for this topic would look like.`;

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      setVisualContent(result.text || "No visuals available.");
      setAnimeMessage("Check out these visual concepts!");
      setAnimeEmotion('surprised');
    } catch (e) {
      console.error(e);
      setVisualContent("Error generating visuals.");
      setAnimeEmotion('sad');
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    setChapter(null);
    setSubject(null);
    setContent('');
    setAnimeMessage("Pick a subject to start!");
    setAnimeEmotion('happy');
  };

  // Get subjects based on level (fallback to General if not found)
  const currentLevelData = LIBRARY_DATA[level as string] || LIBRARY_DATA['Class 6-10'];

  return (
    <div className="max-w-6xl mx-auto min-h-[80vh] relative pb-20">
      

      {!subject ? (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <BookOpen className="text-indigo-600 w-8 h-8" /> 
            Library <span className="text-slate-400 text-lg font-normal">/ {level}</span>
          </h1>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(currentLevelData).map((subj) => (
              <button
                key={subj}
                onClick={() => setSubject(subj)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left group"
              >
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2">{subj}</h3>
                <p className="text-slate-500 text-sm">{currentLevelData[subj].length} Chapters</p>
                <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View Chapters <ChevronRight size={16} />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      ) : !chapter ? (
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <button 
            onClick={() => setSubject(null)}
            className="flex items-center text-slate-500 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeft size={16} className="mr-1" /> Back to Subjects
          </button>

          <h1 className="text-3xl font-bold text-slate-900 mb-8">
            {subject} <span className="text-slate-400 text-lg font-normal">/ Chapters</span>
          </h1>

          <div className="grid md:grid-cols-1 gap-4">
            {currentLevelData[subject].map((chap, idx) => (
              <button
                key={chap}
                onClick={() => generateContent(chap)}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold group-hover:bg-indigo-200 group-hover:text-indigo-700">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-900 group-hover:text-indigo-900">{chap}</span>
                </div>
                <Play size={16} className="text-slate-300 group-hover:text-indigo-600" />
              </button>
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[60vh]"
        >
          {/* Chapter Header */}
          <div className="border-b border-slate-200 p-4 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setChapter(null)}
                className="p-2 hover:bg-white rounded-lg text-slate-500 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{chapter}</h2>
                <p className="text-xs text-slate-500">{subject} • {level}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('learn')}
                className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", activeTab === 'learn' ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-200")}
              >
                <FileText size={16} className="inline mr-1" /> Learn
              </button>
              <button 
                onClick={generateVisuals}
                className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", activeTab === 'visuals' ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-200")}
              >
                <ImageIcon size={16} className="inline mr-1" /> Visuals
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 animate-pulse">AI Tutor is preparing your lesson...</p>
              </div>
            ) : activeTab === 'learn' ? (
              <div className="prose prose-lg max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600 prose-strong:text-slate-900 text-slate-600">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <div className="prose prose-lg max-w-none">
                <h3 className="flex items-center gap-2 text-indigo-900">
                  <Sparkles className="text-amber-500" /> Visual Concepts
                </h3>
                <ReactMarkdown>{visualContent}</ReactMarkdown>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
