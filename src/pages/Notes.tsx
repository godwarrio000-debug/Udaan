import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, FileText, Upload, Copy, Check, ArrowRight, BookOpen, PlayCircle, History, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { generateWithRetry } from '@/lib/gemini';

interface SavedNote {
  id: string;
  topic: string;
  subject: string;
  content: string;
  date: string;
}

// Mock Data for Pre-loaded Notes
const SUBJECTS: Record<string, string[]> = {
  'Class 1-5': ['Mathematics', 'Science', 'English', 'Social Studies'],
  'Class 6-10': ['Mathematics', 'Science', 'English', 'History', 'Geography'],
  'Class 11-12': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English'],
  'Engineering': ['Computer Science', 'Electronics', 'Mechanical', 'Civil'],
  'Competitive': ['General Knowledge', 'Aptitude', 'Reasoning', 'Current Affairs']
};

export function Notes() {
  const { level, setAnimeMessage, setAnimeEmotion } = useUser();
  const [mode, setMode] = useState<'upload' | 'browse'>('browse');
  const [step, setStep] = useState<'select' | 'processing' | 'result' | 'lecture'>('select');
  const [inputText, setInputText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [result, setResult] = useState('');
  const [lecturePoints, setLecturePoints] = useState<string[]>([]);
  const [currentLecturePoint, setCurrentLecturePoint] = useState(0);
  const [copied, setCopied] = useState(false);
  const [recentNotes, setRecentNotes] = useState<SavedNote[]>([]);

  useEffect(() => {
    setAnimeMessage("Hi! I'm ready to help you create smart notes.");
    setAnimeEmotion('happy');
  }, [setAnimeMessage, setAnimeEmotion]);

  useEffect(() => {
    const saved = localStorage.getItem('recent_notes');
    if (saved) {
      setRecentNotes(JSON.parse(saved));
    }
  }, []);

  const saveNote = (newNote: SavedNote) => {
    const updated = [newNote, ...recentNotes.filter(n => n.topic !== newNote.topic)].slice(0, 5);
    setRecentNotes(updated);
    localStorage.setItem('recent_notes', JSON.stringify(updated));
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentNotes.filter(n => n.id !== id);
    setRecentNotes(updated);
    localStorage.setItem('recent_notes', JSON.stringify(updated));
  };

  const loadNote = (note: SavedNote) => {
    setSelectedTopic(note.topic);
    setSelectedSubject(note.subject);
    setResult(note.content);
    
    // Extract key points for lecture mode
    const summaryMatch = note.content.match(/## 📝 Summary([\s\S]*?)(?=##|$)/);
    const pointsMatch = note.content.match(/## 🔑 Key Points([\s\S]*?)(?=##|$)/);
    const lectureText = (summaryMatch ? summaryMatch[1] : '') + (pointsMatch ? pointsMatch[1] : '');
    const points = lectureText.split('.').filter(p => p.trim().length > 10).map(p => p.trim());
    setLecturePoints(points);
    
    setStep('result');
    setAnimeMessage(`Loading your notes for ${note.topic}!`);
    setAnimeEmotion('happy');
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setInputText(reader.result as string);
        setMode('upload');
      };
      reader.readAsText(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/plain': ['.txt', '.md'],
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  const generateNotes = async () => {
    const { goal } = useUser(); // Get goal from context
    const contentToProcess = mode === 'upload' ? inputText : `Subject: ${selectedSubject}, Topic: ${selectedTopic}`;
    
    if (!contentToProcess.trim()) return;
    setStep('processing');
    setAnimeMessage("I'm analyzing the content and creating your notes...");
    setAnimeEmotion('thinking');

    try {
      const prompt = `Analyze the following content (Topic: ${selectedTopic || 'Provided Text'}) and generate smart study notes for a student at **${level}** level.
      The student's career goal is: **${goal || 'General Learning'}**. Tailor the examples and "Important Exam Questions" to be relevant to this level and goal where possible.
      
      Structure the output as:
      ## 📝 Summary
      (A concise summary of the content)

      ## 🔑 Key Points
      (Bulleted list of most important concepts)

      ## 🧠 Flashcards
      (3-5 Q&A pairs for revision)

      ## ❓ Important Exam Questions
      (Potential questions that could be asked)

      Input Content:
      ${contentToProcess.substring(0, 10000)}
      `;

      const result = await generateWithRetry({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      const text = result.text || "Failed to generate notes.";
      setResult(text);
      
      const newNote: SavedNote = {
        id: Date.now().toString(),
        topic: selectedTopic || 'Uploaded Note',
        subject: selectedSubject || 'General',
        content: text,
        date: new Date().toLocaleDateString()
      };
      saveNote(newNote);

      // Extract key points for lecture mode
      const summaryMatch = text.match(/## 📝 Summary([\s\S]*?)(?=##|$)/);
      const pointsMatch = text.match(/## 🔑 Key Points([\s\S]*?)(?=##|$)/);
      
      const lectureText = (summaryMatch ? summaryMatch[1] : '') + (pointsMatch ? pointsMatch[1] : '');
      const points = lectureText.split('.').filter(p => p.trim().length > 10).map(p => p.trim());
      setLecturePoints(points);
      
      setStep('result');
      setAnimeMessage("Done! Here are your smart notes. You can also start a lecture!");
      setAnimeEmotion('happy');
    } catch (error: any) {
      console.error("Error generating notes:", error);
      const isQuotaExceeded = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      setAnimeMessage(isQuotaExceeded ? "I'm a bit overwhelmed with note requests! Try again in a moment." : "Oops! Something went wrong.");
      setAnimeEmotion(isQuotaExceeded ? 'surprised' : 'sad');
      setStep('select');
    }
  };

  const startLecture = () => {
    setStep('lecture');
    setCurrentLecturePoint(0);
    setAnimeMessage(lecturePoints[0] || "Let's start the lecture!");
    setAnimeEmotion('happy');
  };

  const nextLecturePoint = () => {
    if (currentLecturePoint < lecturePoints.length - 1) {
      const next = currentLecturePoint + 1;
      setCurrentLecturePoint(next);
      setAnimeMessage(lecturePoints[next]);
      setAnimeEmotion('happy');
    } else {
      setStep('result');
      setAnimeMessage("That concludes our lecture! Great job!");
      setAnimeEmotion('happy');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setAnimeMessage("Copied to clipboard!");
    setAnimeEmotion('happy');
    setTimeout(() => setCopied(false), 2000);
  };

  const subjects = SUBJECTS[level as string] || SUBJECTS['Class 6-10'];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      <AnimatePresence mode="wait">
        {step === 'select' && (
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="md:col-span-2 space-y-8"
            >
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <FileText className="text-indigo-500" /> Smart Notes Generator
                </h2>

                {/* Mode Selection */}
                <div className="flex gap-4 mb-8">
                  <button
                    onClick={() => setMode('browse')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2",
                      mode === 'browse' ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <BookOpen size={20} /> Browse Curriculum
                  </button>
                  <button
                    onClick={() => setMode('upload')}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2",
                      mode === 'upload' ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Upload size={20} /> Upload / Paste
                  </button>
                </div>
                
                {mode === 'browse' ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Subject</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {subjects.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => setSelectedSubject(sub)}
                            className={cn(
                              "p-3 rounded-lg border text-sm font-medium transition-all text-left",
                              selectedSubject === sub ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedSubject && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Topic / Chapter Name</label>
                        <input
                          type="text"
                          value={selectedTopic}
                          onChange={(e) => setSelectedTopic(e.target.value)}
                          placeholder="e.g., Photosynthesis, Algebra, World War II"
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </motion.div>
                    )}

                    <button
                      onClick={generateNotes}
                      disabled={!selectedSubject || !selectedTopic}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
                    >
                      Generate Notes <ArrowRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div 
                      {...getRootProps()} 
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                        isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
                      )}
                    >
                      <input {...getInputProps()} />
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-600 font-medium">Drag & drop a text file here</p>
                      <p className="text-xs text-slate-400 mt-1">Supports .txt, .md</p>
                    </div>

                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Or paste your notes here..."
                      className="w-full h-32 px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    />

                    <button
                      onClick={generateNotes}
                      disabled={!inputText.trim()}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2"
                    >
                      Generate Notes <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-500" /> Recent Notes
                </h3>
                {recentNotes.length > 0 ? (
                  <div className="space-y-3">
                    {recentNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => loadNote(note)}
                        className="group p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer relative"
                      >
                        <p className="font-bold text-sm text-slate-800 truncate pr-6">{note.topic}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{note.subject} • {note.date}</p>
                        <button
                          onClick={(e) => deleteNote(note.id, e)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4 italic">No recent notes yet.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {step === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-600 font-medium">Analyzing content...</p>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 lg:p-12 rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="flex justify-between items-start mb-8 border-b border-slate-100 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Smart Notes</h1>
                <p className="text-slate-500 text-sm">Generated for {level}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={startLecture}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
                >
                  <PlayCircle size={16} /> Start Lecture
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => {
                    setStep('select');
                    setInputText('');
                    setAnimeMessage("Ready for the next topic!");
                  }}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:underline px-2"
                >
                  New Note
                </button>
              </div>
            </div>

            <div className="prose prose-lg max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600 prose-strong:text-slate-900 text-slate-600">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {step === 'lecture' && (
          <motion.div
            key="lecture"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10 px-4 text-center h-[60vh]"
          >
            <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 shadow-lg max-w-2xl w-full relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full font-bold shadow-md">
                Lecture Mode
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-6 mt-4">
                Point {currentLecturePoint + 1} of {lecturePoints.length}
              </h3>
              
              <p className="text-xl text-slate-700 leading-relaxed min-h-[100px]">
                {lecturePoints[currentLecturePoint]}
              </p>

              <div className="mt-8 flex justify-center gap-4">
                <button
                  onClick={() => {
                    if (currentLecturePoint > 0) {
                      setCurrentLecturePoint(prev => prev - 1);
                      setAnimeMessage(lecturePoints[currentLecturePoint - 1]);
                    }
                  }}
                  disabled={currentLecturePoint === 0}
                  className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={nextLecturePoint}
                  className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95"
                >
                  {currentLecturePoint < lecturePoints.length - 1 ? 'Next Point' : 'Finish Lecture'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
