import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Target, Trophy, ArrowRight, CheckCircle, XCircle, RefreshCw, Clock, LayoutGrid, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Question {
  id: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  section: string;
  status: 'unvisited' | 'answered' | 'marked' | 'visited';
  userAnswer?: string;
}

const EXAM_CONFIGS = [
  { 
    id: 'JEE', 
    name: 'JEE Main', 
    color: 'bg-red-50 text-red-700 border-red-200',
    duration: 180, // 3 hours
    sections: ['Physics', 'Chemistry', 'Mathematics'],
    questionsPerSection: 10, // Reduced from 30 for performance, but structure remains
  },
  { 
    id: 'NEET', 
    name: 'NEET', 
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    duration: 200, // 3h 20m
    sections: ['Physics', 'Chemistry', 'Biology'],
    questionsPerSection: 15,
  },
  { 
    id: 'UPSC', 
    name: 'UPSC Prelims (GS)', 
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    duration: 120,
    sections: ['History', 'Geography', 'Polity', 'Economy', 'Science & Tech'],
    questionsPerSection: 5,
  },
  { 
    id: 'SSC', 
    name: 'SSC CGL Tier I', 
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    duration: 60,
    sections: ['Reasoning', 'General Awareness', 'Quantitative Aptitude', 'English'],
    questionsPerSection: 5,
  },
  { 
    id: 'CET', 
    name: 'State CETs', 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    duration: 180,
    sections: [], // Will be populated based on group
    questionsPerSection: 10,
  },
];

const ExamTimer = ({ durationMinutes, onTimeUp }: { durationMinutes: number, onTimeUp: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeft < 300; // 5 minutes

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-lg border-2 transition-colors",
      isLowTime ? "bg-red-50 border-red-500 text-red-600 animate-pulse" : "bg-indigo-50 border-indigo-500 text-indigo-600"
    )}>
      <Clock size={20} />
      {formatTime(timeLeft)}
    </div>
  );
};

export function Competitive() {
  const { level, setAnimeMessage, setAnimeEmotion } = useUser();
  const [step, setStep] = useState<'select' | 'select-state' | 'select-group' | 'loading' | 'exam' | 'result'>('select');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    setAnimeMessage("Ready to ace your exams? Select a category!");
    setAnimeEmotion('happy');
  }, [setAnimeMessage, setAnimeEmotion]);

  const CET_STATES = [
    { id: 'MH', name: 'Maharashtra (MHT-CET)' },
    { id: 'KA', name: 'Karnataka (KCET)' },
    { id: 'GJ', name: 'Gujarat (GUJCET)' },
    { id: 'WB', name: 'West Bengal (WBJEE)' },
    { id: 'AP', name: 'Andhra Pradesh (AP EAPCET)' },
    { id: 'TS', name: 'Telangana (TS EAPCET)' },
  ];

  const SUBJECT_GROUPS = [
    { id: 'PCM', name: 'PCM (Physics, Chemistry, Maths)', sections: ['Physics', 'Chemistry', 'Mathematics'] },
    { id: 'PCB', name: 'PCB (Physics, Chemistry, Biology)', sections: ['Physics', 'Chemistry', 'Biology'] },
    { id: 'PCMB', name: 'PCMB (All Subjects)', sections: ['Physics', 'Chemistry', 'Mathematics', 'Biology'] },
  ];

  const currentExam = EXAM_CONFIGS.find(e => e.id === selectedExamId);
  const sectionQuestions = questions.filter(q => q.section === activeSection);
  const currentQuestion = questions[currentQuestionIdx];

  const startExamGeneration = (examId: string) => {
    setSelectedExamId(examId);
    if (examId === 'CET') {
      setStep('select-state');
      setAnimeMessage("Great choice! Which state's CET are you preparing for?");
    } else {
      generateExam(examId);
    }
  };

  const handleStateSelect = (stateId: string) => {
    setSelectedState(stateId);
    setStep('select-group');
    setAnimeMessage("Almost there! Select your subject group.");
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId);
    generateExam('CET', groupId);
  };

  const generateExam = async (examId: string, groupId?: string) => {
    const config = EXAM_CONFIGS.find(e => e.id === examId);
    if (!config) return;

    setStep('loading');
    
    let sections = config.sections;
    let examName = config.name;

    if (examId === 'CET' && groupId) {
      const group = SUBJECT_GROUPS.find(g => g.id === groupId);
      if (group) {
        sections = group.sections;
        const state = CET_STATES.find(s => s.id === selectedState);
        examName = `${state?.name || 'CET'} (${groupId})`;
      }
    }

    setAnimeMessage(`Preparing a full ${examName} mock test. Stay focused!`);
    setAnimeEmotion('thinking');

    try {
      const allQuestions: Question[] = [];
      
      // Generate questions for each section
      for (const section of sections) {
        const prompt = `Generate ${config.questionsPerSection} challenging multiple-choice questions for the **${examName}** exam, specifically for the **${section}** section.
        Focus on high-yield topics relevant to this exam.
        Difficulty: Hard/Competitive.
        
        Return a JSON object with this structure:
        {
          "questions": [
            {
              "question": "Question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "answer": "Correct Option Text",
              "explanation": "Detailed solution/explanation"
            }
          ]
        }`;

        const result = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const text = result.text;
        if (text) {
          const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
          const data = JSON.parse(cleanText);
          const formatted = data.questions.map((q: any, i: number) => ({
            ...q,
            id: `${section}-${i}`,
            section,
            status: 'unvisited'
          }));
          allQuestions.push(...formatted);
        }
      }

      setQuestions(allQuestions);
      setActiveSection(sections[0]);
      setCurrentQuestionIdx(0);
      setStep('exam');
      setAnimeMessage(`Exam started! Good luck with your ${examName} prep!`);
      setAnimeEmotion('happy');
    } catch (error) {
      console.error("Error generating exam:", error);
      setStep('select');
      setAnimeMessage("Oops! I couldn't generate the exam. Try again?");
      setAnimeEmotion('sad');
    }
  };

  const handleOptionSelect = (option: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIdx] = {
      ...currentQuestion,
      userAnswer: option,
      status: 'answered'
    };
    setQuestions(updatedQuestions);
  };

  const markForReview = () => {
    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIdx] = {
      ...currentQuestion,
      status: 'marked'
    };
    setQuestions(updatedQuestions);
  };

  const finishExam = useCallback(() => {
    let totalScore = 0;
    questions.forEach(q => {
      if (q.userAnswer === q.answer) totalScore += 4;
      else if (q.userAnswer) totalScore -= 2;
    });
    setScore(totalScore);
    setStep('result');
    setAnimeMessage("Exam completed! Let's review your performance.");
    setAnimeEmotion('happy');
  }, [questions]);

  const goToQuestion = (idx: number) => {
    setCurrentQuestionIdx(idx);
    setActiveSection(questions[idx].section);
    if (questions[idx].status === 'unvisited') {
      const updated = [...questions];
      updated[idx].status = 'visited';
      setQuestions(updated);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      
      <AnimatePresence mode="wait">
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-indigo-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-4">Competitive Exam Prep</h1>
              <p className="text-slate-500 mb-8 max-w-lg mx-auto">
                Full-length mock tests with real exam timers and section-wise patterns.
                <br />
                <span className="font-semibold text-red-500">Negative Marking: +4 / -2</span>
              </p>

              <div className="grid md:grid-cols-2 gap-4 text-left">
                {EXAM_CONFIGS.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => startExamGeneration(exam.id)}
                    className={cn(
                      "p-6 rounded-2xl border-2 transition-all hover:shadow-lg group text-left",
                      exam.color
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-xl">{exam.name}</span>
                      <ArrowRight className="opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" size={24} />
                    </div>
                    <div className="flex gap-3 text-sm opacity-80">
                      <span className="flex items-center gap-1"><Clock size={14} /> {exam.duration} mins</span>
                      <span className="flex items-center gap-1"><LayoutGrid size={14} /> {exam.id === 'CET' ? 'Multiple' : exam.sections.length} Sections</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 'select-state' && (
          <motion.div
            key="select-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Select Your State</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {CET_STATES.map((state) => (
                <button
                  key={state.id}
                  onClick={() => handleStateSelect(state.id)}
                  className="p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left font-bold text-slate-700"
                >
                  {state.name}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setStep('select')}
              className="mt-8 text-slate-500 font-bold hover:text-indigo-600 transition-colors w-full text-center"
            >
              ← Back to Exam Selection
            </button>
          </motion.div>
        )}

        {step === 'select-group' && (
          <motion.div
            key="select-group"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Select Subject Group</h2>
            <div className="grid gap-4">
              {SUBJECT_GROUPS.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleGroupSelect(group.id)}
                  className="p-6 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                >
                  <div className="font-bold text-xl text-slate-900 mb-1">{group.name}</div>
                  <div className="text-sm text-slate-500">Sections: {group.sections.join(', ')}</div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setStep('select-state')}
              className="mt-8 text-slate-500 font-bold hover:text-indigo-600 transition-colors w-full text-center"
            >
              ← Back to State Selection
            </button>
          </motion.div>
        )}

        {step === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200"
          >
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-xl font-bold text-slate-900 mb-2">Generating Mock Test...</p>
            <p className="text-slate-500">Creating balanced sections and high-yield questions.</p>
          </motion.div>
        )}

        {step === 'exam' && currentExam && (
          <motion.div
            key="exam"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-4 gap-6"
          >
            {/* Left Column: Question Area */}
            <div className="lg:col-span-3 space-y-6">
              {/* Header */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
                <div className="flex gap-2">
                  {currentExam.sections.map(section => (
                    <button
                      key={section}
                      onClick={() => {
                        setActiveSection(section);
                        const firstInSec = questions.findIndex(q => q.section === section);
                        setCurrentQuestionIdx(firstInSec);
                      }}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                        activeSection === section 
                          ? "bg-indigo-600 text-white shadow-md" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {section}
                    </button>
                  ))}
                </div>
                <ExamTimer durationMinutes={currentExam.duration} onTimeUp={finishExam} />
              </div>

              {/* Question Card */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                    {activeSection} - Question {questions.filter((q, i) => q.section === activeSection && i <= currentQuestionIdx).length}
                  </span>
                  <div className="flex gap-2">
                    <span className="text-xs font-bold text-emerald-600">+4</span>
                    <span className="text-xs font-bold text-red-600">-2</span>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
                  {currentQuestion.question}
                </h2>

                <div className="space-y-4 mb-auto">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 group",
                        currentQuestion.userAnswer === option
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-slate-100 hover:border-indigo-200 hover:bg-slate-50"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors",
                        currentQuestion.userAnswer === option ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="font-medium">{option}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-12 pt-6 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex gap-3">
                    <button
                      onClick={markForReview}
                      className="px-6 py-2 rounded-xl border-2 border-amber-200 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-all"
                    >
                      Mark for Review
                    </button>
                    <button
                      onClick={() => handleOptionSelect('')}
                      className="px-6 py-2 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                    >
                      Clear Response
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      disabled={currentQuestionIdx === 0}
                      onClick={() => goToQuestion(currentQuestionIdx - 1)}
                      className="p-2 rounded-xl border-2 border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-30"
                    >
                      <ChevronLeft />
                    </button>
                    <button
                      onClick={() => {
                        if (currentQuestionIdx < questions.length - 1) {
                          goToQuestion(currentQuestionIdx + 1);
                        } else {
                          if (confirm("Are you sure you want to submit the exam?")) {
                            finishExam();
                          }
                        }
                      }}
                      className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2"
                    >
                      {currentQuestionIdx < questions.length - 1 ? "Save & Next" : "Submit Exam"}
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Palette & Info */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <LayoutGrid size={18} /> Question Palette
                </h3>
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {questions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToQuestion(idx)}
                      className={cn(
                        "w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all border-2",
                        currentQuestionIdx === idx ? "ring-2 ring-indigo-600 ring-offset-2" : "",
                        q.status === 'answered' ? "bg-emerald-500 border-emerald-500 text-white" :
                        q.status === 'marked' ? "bg-purple-500 border-purple-500 text-white rounded-full" :
                        q.status === 'visited' ? "bg-red-500 border-red-500 text-white" :
                        "bg-slate-50 border-slate-200 text-slate-400"
                      )}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded" />
                    <span className="text-slate-600">Answered ({questions.filter(q => q.status === 'answered').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded" />
                    <span className="text-slate-600">Not Answered ({questions.filter(q => q.status === 'visited').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-slate-100 border border-slate-200 rounded" />
                    <span className="text-slate-600">Not Visited ({questions.filter(q => q.status === 'unvisited').length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded-full" />
                    <span className="text-slate-600">Marked for Review ({questions.filter(q => q.status === 'marked').length})</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm("Are you sure you want to end the exam?")) {
                    finishExam();
                  }
                }}
                className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold border-2 border-red-100 hover:bg-red-100 transition-all"
              >
                Submit Final Exam
              </button>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center max-w-2xl mx-auto"
          >
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-indigo-600" />
            </div>
            
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Mock Test Result</h2>
            <p className="text-slate-500 mb-8 text-lg">Detailed analysis of your performance</p>

            <div className="grid grid-cols-3 gap-4 mb-10">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <span className="block text-3xl font-black text-indigo-600 mb-1">{score}</span>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Score</span>
              </div>
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <span className="block text-3xl font-black text-emerald-600 mb-1">{questions.filter(q => q.userAnswer === q.answer).length}</span>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Correct</span>
              </div>
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                <span className="block text-3xl font-black text-red-600 mb-1">{questions.filter(q => q.userAnswer && q.userAnswer !== q.answer).length}</span>
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Incorrect</span>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              {currentExam?.sections.map(section => {
                const secQs = questions.filter(q => q.section === section);
                const correct = secQs.filter(q => q.userAnswer === q.answer).length;
                const total = secQs.length;
                const percentage = Math.round((correct / total) * 100);

                return (
                  <div key={section} className="text-left">
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-slate-700">{section}</span>
                      <span className="text-sm font-bold text-slate-500">{correct}/{total} Correct</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full bg-indigo-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep('select')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all mx-auto shadow-lg shadow-indigo-100"
            >
              <RefreshCw size={20} /> Take Another Mock Test
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
