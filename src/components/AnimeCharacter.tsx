import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, X } from 'lucide-react';

interface AnimeCharacterProps {
  message: string;
  level?: string | null;
  emotion?: 'happy' | 'thinking' | 'surprised' | 'sad';
  onClose?: () => void;
}

export function AnimeCharacter({ message, level, emotion = 'happy', onClose }: AnimeCharacterProps) {
  const isPrimary = level === 'Class 1-5';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false); // Default off to avoid annoyance

  useEffect(() => {
    if (message && speechEnabled) {
      speak(message);
    }
  }, [message, speechEnabled]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      // Select a voice based on character
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = isPrimary 
        ? voices.find(v => v.name.includes('Female') || v.name.includes('Google US English')) 
        : voices.find(v => v.name.includes('Male') || v.name.includes('Google UK English Male'));
      
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeechEnabled(false);
    } else {
      setSpeechEnabled(true);
      speak(message);
    }
  };

  // Mouth Path Logic based on Emotion/Speaking
  const getMouthPath = () => {
    if (isSpeaking) {
      // Animated mouth for speaking
      return isPrimary ? (
        <ellipse cx="100" cy="120" rx="15" ry="8" fill="#78350F">
          <animate attributeName="ry" values="2;10;2" dur="0.2s" repeatCount="indefinite" />
        </ellipse>
      ) : (
        <ellipse cx="100" cy="135" rx="10" ry="4" fill="#000">
          <animate attributeName="ry" values="1;5;1" dur="0.2s" repeatCount="indefinite" />
        </ellipse>
      );
    }

    if (isPrimary) {
      // Sunny's Expressions
      switch (emotion) {
        case 'happy':
          return <path d="M70,110 Q100,140 130,110" fill="none" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />;
        case 'thinking':
          return <path d="M80,120 Q100,120 120,120" fill="none" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />;
        case 'surprised':
          return <circle cx="100" cy="120" r="10" fill="none" stroke="#78350F" strokeWidth="4" />;
        case 'sad':
          return <path d="M70,130 Q100,100 130,130" fill="none" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />;
        default:
          return <path d="M70,110 Q100,140 130,110" fill="none" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />;
      }
    } else {
      // Alex's Expressions
      switch (emotion) {
        case 'happy':
          return <path d="M85,130 Q100,140 115,130" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />;
        case 'thinking':
          return <line x1="90" y1="135" x2="110" y2="135" stroke="#000" strokeWidth="3" strokeLinecap="round" />;
        case 'surprised':
          return <circle cx="100" cy="135" r="6" fill="none" stroke="#000" strokeWidth="3" />;
        case 'sad':
          return <path d="M85,140 Q100,125 115,140" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />;
        default:
          return <path d="M85,130 Q100,140 115,130" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />;
      }
    }
  };

  const STUDY_TIPS = [
    "Try the Pomodoro technique: 25 mins study, 5 mins break! ⏱️",
    "Explaining a concept to someone else is the best way to learn it. 🗣️",
    "Stay hydrated! Your brain needs water to function at its best. 💧",
    "Review your notes within 24 hours of writing them for better retention. 📝",
    "Break big tasks into smaller, manageable chunks. 🧩",
    "A good night's sleep is as important as a good study session. 😴",
    "Use mnemonic devices to remember complex lists or sequences. 🧠",
    "Find a quiet, well-lit space dedicated only to studying. 💡"
  ];

  const [currentTip, setCurrentTip] = useState(STUDY_TIPS[0]);
  const [tipColor, setTipColor] = useState('text-indigo-500');
  const [glowColor, setGlowColor] = useState('rgba(99, 102, 241, 0.15)');
  const [messageColor, setMessageColor] = useState('text-slate-800');

  useEffect(() => {
    const colors = ['text-indigo-500', 'text-emerald-500', 'text-amber-500', 'text-rose-500', 'text-violet-500'];
    const glows = ['rgba(99, 102, 241, 0.15)', 'rgba(16, 185, 129, 0.15)', 'rgba(245, 158, 11, 0.15)', 'rgba(244, 63, 94, 0.15)', 'rgba(139, 92, 246, 0.15)'];
    const messageColors = ['text-slate-800', 'text-indigo-900', 'text-emerald-900', 'text-amber-900', 'text-rose-900'];
    let colorIdx = 0;
    const interval = setInterval(() => {
      setCurrentTip(STUDY_TIPS[Math.floor(Math.random() * STUDY_TIPS.length)]);
      colorIdx = (colorIdx + 1) % colors.length;
      setTipColor(colors[colorIdx]);
      setGlowColor(glows[colorIdx]);
      setMessageColor(messageColors[colorIdx]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const STUDY_FACTS = [
    "Your brain is 73% water! Stay hydrated. 💧",
    "Writing by hand helps you remember better than typing. ✍️",
    "The 'Testing Effect' means quizzes help you learn more than just reading. 🧠",
    "Studying in different places can improve memory recall. 🌍",
    "Music with 60 beats per minute can help you focus. 🎵",
    "The brain processes images 60,000 times faster than text. 🖼️"
  ];

  const [currentFact, setCurrentFact] = useState(STUDY_FACTS[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFact(STUDY_FACTS[Math.floor(Math.random() * STUDY_FACTS.length)]);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none md:pointer-events-auto">
      <motion.div
        initial={{ x: 100, opacity: 0, rotate: 10 }}
        animate={{ x: 0, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.5 }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="w-20 h-20 md:w-24 md:h-24 relative filter drop-shadow-lg cursor-pointer"
          onClick={toggleSpeech}
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.9 }}
        >
          {isPrimary ? (
          // Class 1-5: "Sunny" - Cute, round, cheerful
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="90" fill="#FEF3C7" /> {/* Light Yellow BG */}
            <path d="M50,180 Q100,230 150,180" fill="#F59E0B" /> {/* Shirt */}
            <circle cx="100" cy="100" r="60" fill="#FDE68A" /> {/* Face */}
            
            {/* Dynamic Mouth */}
            {getMouthPath()}
            
            {/* Eyes with Blink Animation */}
            <g>
              <ellipse cx="80" cy="90" rx="8" ry="10" fill="#000">
                <animate attributeName="ry" values="10;1;10" dur="4s" repeatCount="indefinite" begin="0s" />
              </ellipse>
              <ellipse cx="120" cy="90" rx="8" ry="10" fill="#000">
                <animate attributeName="ry" values="10;1;10" dur="4s" repeatCount="indefinite" begin="0s" />
              </ellipse>
            </g>

            <circle cx="75" cy="85" r="3" fill="#FFF" /> {/* Eye Shine L */}
            <circle cx="115" cy="85" r="3" fill="#FFF" /> {/* Eye Shine R */}
            <path d="M50,70 Q100,10 150,70" fill="#D97706" /> {/* Hair Top */}
            <path d="M40,100 Q30,90 40,80" fill="none" stroke="#D97706" strokeWidth="4" /> {/* Ear L */}
            <path d="M160,100 Q170,90 160,80" fill="none" stroke="#D97706" strokeWidth="4" /> {/* Ear R */}
            <circle cx="60" cy="120" r="10" fill="#FCA5A5" opacity="0.6" /> {/* Blush L */}
            <circle cx="140" cy="120" r="10" fill="#FCA5A5" opacity="0.6" /> {/* Blush R */}
          </svg>
        ) : (
          // Class 6-10: "Alex" - Smart, glasses, blue theme
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="90" fill="#E0E7FF" /> {/* Light Blue BG */}
            <path d="M60,190 Q100,240 140,190" fill="#4338CA" /> {/* Shirt */}
            <circle cx="100" cy="95" r="55" fill="#FFedd5" /> {/* Face */}
            
            {/* Dynamic Mouth */}
            {getMouthPath()}
            
            {/* Glasses */}
            <circle cx="80" cy="95" r="15" fill="none" stroke="#1E1B4B" strokeWidth="2" />
            <circle cx="120" cy="95" r="15" fill="none" stroke="#1E1B4B" strokeWidth="2" />
            <line x1="95" y1="95" x2="105" y2="95" stroke="#1E1B4B" strokeWidth="2" />
            
            {/* Eyes with Blink Animation */}
            <g>
              <circle cx="80" cy="95" r="4" fill="#000">
                 <animate attributeName="r" values="4;0.5;4" dur="5s" repeatCount="indefinite" begin="1s" />
              </circle>
              <circle cx="120" cy="95" r="4" fill="#000">
                 <animate attributeName="r" values="4;0.5;4" dur="5s" repeatCount="indefinite" begin="1s" />
              </circle>
            </g>
            
            <path d="M60,60 Q100,20 140,50 L140,80 Q100,60 60,80 Z" fill="#1E1B4B" /> {/* Hair */}
          </svg>
        )}
        </motion.div>
      </motion.div>
    </div>
  );
}
