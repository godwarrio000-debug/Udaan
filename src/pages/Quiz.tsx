import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle, XCircle, Trophy, ArrowRight, RefreshCw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { generateWithRetry } from '@/lib/gemini';

interface Question {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface QuizData {
  topic: string;
  questions: Question[];
}

const KBCTimer = ({ timeLeft, totalTime }: { timeLeft: number, totalTime: number }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / totalTime;
  const dashoffset = circumference - (progress * circumference);
  
  // Color logic
  let color = "#10b981"; // Emerald-500
  if (progress < 0.5) color = "#f59e0b"; // Amber-500
  if (progress < 0.2) color = "#ef4444"; // Red-500

  return (
    <div className="relative flex items-center justify-center w-16 h-16">
      {/* Background Circle */}
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="32"
          cy="32"
          r={radius}
          stroke="#e2e8f0"
          strokeWidth="4"
          fill="transparent"
        />
        {/* Progress Circle */}
        <motion.circle
          cx="32"
          cy="32"
          r={radius}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashoffset }}
          transition={{ duration: 1, ease: "linear" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-lg font-bold text-slate-700">
        {timeLeft}
      </div>
    </div>
  );
};

export function Quiz() {
  const { level, addQuizResult, setAnimeMessage, setAnimeEmotion } = useUser();
  const [step, setStep] = useState<'setup' | 'loading' | 'quiz' | 'result'>('setup');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [isMockMode, setIsMockMode] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(12);
  const [timerActive, setTimerActive] = useState(false);

  React.useEffect(() => {
    setAnimeMessage("Ready to test your knowledge?");
    setAnimeEmotion('happy');
  }, [setAnimeMessage, setAnimeEmotion]);

  // Timer Effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      // Time's up!
      setTimerActive(false);
      if (isMockMode) {
        // Auto-finish quiz in mock mode
        setStep('result');
        setAnimeMessage("Time's up! Let's see your final score.");
        setAnimeEmotion('surprised');
      } else if (!selectedOption) {
        setShowExplanation(true); // Show answer in normal mode
      }
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, selectedOption, isMockMode]);

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setStep('loading');
    setAnimeMessage(`Generating a ${difficulty} ${isMockMode ? 'Mock Test' : 'Quiz'} on ${topic}...`);
    setAnimeEmotion('thinking');

    try {
      const questionCount = isMockMode ? 10 : 5;
      const prompt = `Generate a quiz about "${topic}" with difficulty "${difficulty}" for a student at **${level || 'General'}** level.
      Return a JSON object with the following structure:
      {
        "topic": "${topic}",
        "questions": [
          {
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "answer": "Correct Option Text",
            "explanation": "Brief explanation of why this is correct"
          }
        ]
      }
      Generate ${questionCount} questions.`;

      const result = await generateWithRetry({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = result.text;
      if (text) {
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
        const data = JSON.parse(cleanText);
        setQuizData(data);
        setStep('quiz');
        setCurrentQuestion(0);
        setScore(0);
        setSelectedOption(null);
        setShowExplanation(false);
        
        if (isMockMode) {
          const mockTime = 600; // 10 minutes total
          setTotalTime(mockTime);
          setTimeLeft(mockTime);
        } else {
          const timePerQuestion = 15;
          setTotalTime(timePerQuestion);
          setTimeLeft(timePerQuestion);
        }
        
        setTimerActive(true);
        setAnimeMessage(isMockMode ? "Mock test started! 10 minutes on the clock." : "Quiz ready! Good luck!");
        setAnimeEmotion('happy');

      } else {
        throw new Error("No data returned");
      }
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      setStep('setup');
      const isQuotaExceeded = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      setAnimeMessage(isQuotaExceeded ? "I'm a bit tired from making so many quizzes! Try again in a minute." : "Oops! Failed to generate quiz.");
      setAnimeEmotion(isQuotaExceeded ? 'surprised' : 'sad');
    }
  };

  const handleOptionSelect = (option: string) => {
    if (selectedOption || timeLeft === 0) return;
    
    if (!isMockMode) {
      setTimerActive(false);
    }
    
    setSelectedOption(option);
    
    if (!isMockMode) {
      setShowExplanation(true);
    }

    if (option === quizData?.questions[currentQuestion].answer) {
      setScore(prev => prev + 1);
      if (!isMockMode) {
        setAnimeMessage("Correct! Well done!");
        setAnimeEmotion('happy');
      }
    } else {
      if (!isMockMode) {
        setAnimeMessage("Not quite. Check the explanation.");
        setAnimeEmotion('sad');
      }
    }

    // In mock mode, we automatically go to next question after a brief delay or just let user click next
  };

  const nextQuestion = () => {
    if (!quizData) return;
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      
      if (!isMockMode) {
        const timePerQuestion = 15;
        setTotalTime(timePerQuestion);
        setTimeLeft(timePerQuestion);
        setTimerActive(true);
      }
      
      setAnimeMessage(isMockMode ? "Keep going!" : "Next question coming up!");
      setAnimeEmotion('thinking');
    } else {
      setStep('result');
      setAnimeMessage("Quiz finished! Let's see your score.");
      setAnimeEmotion('happy');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto pb-20">
      <AnimatePresence mode="wait">
        {step === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Trophy className="text-amber-500" /> Quiz Generator
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis, World War II, Calculus"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Mock Test Mode</h4>
                  <p className="text-xs text-slate-500">10 questions, 10 minutes total timer</p>
                </div>
                <button
                  onClick={() => setIsMockMode(!isMockMode)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    isMockMode ? "bg-indigo-600" : "bg-slate-300"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    isMockMode ? "left-7" : "left-1"
                  )} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Easy', 'Medium', 'Hard'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={cn(
                        "py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                        difficulty === level
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateQuiz}
                disabled={!topic.trim()}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 active:scale-95"
              >
                Start {isMockMode ? 'Mock Test' : 'Quiz'}
              </button>
            </div>
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
            <p className="text-slate-600 font-medium">Generating your quiz...</p>
          </motion.div>
        )}

        {step === 'quiz' && quizData && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                  {isMockMode ? 'Mock Test' : 'Quick Quiz'}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  Question {currentQuestion + 1} of {quizData.questions.length}
                </span>
              </div>
              {isMockMode ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                  <Clock size={16} className="text-indigo-600" />
                  <span className="font-mono font-bold text-indigo-700">{formatTime(timeLeft)}</span>
                </div>
              ) : (
                <KBCTimer timeLeft={timeLeft} totalTime={totalTime} />
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-6 leading-relaxed">
              {quizData.questions[currentQuestion].question}
            </h2>

            <div className="space-y-3 mb-8">
              {quizData.questions[currentQuestion].options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrect = option === quizData.questions[currentQuestion].answer;
                const isWrong = isSelected && !isCorrect;
                const showCorrect = (showExplanation || (timeLeft === 0 && !isMockMode)) && isCorrect;

                let buttonClass = "border-slate-200 hover:bg-slate-50 hover:border-indigo-300";
                if (isSelected) buttonClass = "bg-indigo-50 border-indigo-500 text-indigo-700";
                if (isWrong) buttonClass = "bg-red-50 border-red-500 text-red-700";
                if (showCorrect) buttonClass = "bg-emerald-50 border-emerald-500 text-emerald-700";

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showExplanation || (timeLeft === 0 && !isMockMode)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group",
                      buttonClass
                    )}
                  >
                    <span className="font-medium">{option}</span>
                    {isWrong && <XCircle className="w-5 h-5 text-red-500" />}
                    {showCorrect && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                  </button>
                );
              })}
            </div>

            {(showExplanation || isMockMode || timeLeft === 0) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                {showExplanation && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
                    <h4 className="font-bold text-slate-900 mb-1">Explanation:</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {quizData.questions[currentQuestion].explanation}
                    </p>
                  </div>
                )}
                <button
                  onClick={nextQuestion}
                  disabled={isMockMode && !selectedOption}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50"
                >
                  {currentQuestion < quizData.questions.length - 1 ? (
                    <>Next Question <ArrowRight size={18} /></>
                  ) : (
                    <>Finish Quiz <Trophy size={18} /></>
                  )}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 text-center"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
              className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <Trophy className="w-12 h-12 text-amber-500" />
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-3xl font-bold text-slate-900 mb-2"
            >
              Quiz Completed!
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-slate-500 mb-8 text-xl"
            >
              You scored <span className="font-bold text-indigo-600 text-2xl">{score}</span> out of {quizData?.questions.length}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center gap-4"
            >
              <button
                onClick={() => setStep('setup')}
                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
              >
                <RefreshCw size={18} /> Try Another
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
