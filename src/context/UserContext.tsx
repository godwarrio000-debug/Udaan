import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'student' | 'teacher';
export type StudentLevel = 
  | 'Class 1-5' 
  | 'Class 6-10' 
  | 'Class 11-12' 
  | 'Engineering (B.Tech)' 
  | 'Postgraduate / PhD' 
  | 'Competitive Exams';

interface QuizResult {
  id: string;
  topic: string;
  score: number;
  total: number;
  date: string;
}

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  level: StudentLevel | null;
  setLevel: (level: StudentLevel) => void;
  name: string;
  setName: (name: string) => void;
  school: string;
  setSchool: (school: string) => void;
  bio: string;
  setBio: (bio: string) => void;
  goal: string;
  setGoal: (goal: string) => void;
  animeMessage: string;
  setAnimeMessage: (msg: string) => void;
  animeEmotion: 'happy' | 'thinking' | 'surprised' | 'sad';
  setAnimeEmotion: (emotion: 'happy' | 'thinking' | 'surprised' | 'sad') => void;
  quizResults: QuizResult[];
  addQuizResult: (result: QuizResult) => void;
  resetData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('userRole') as UserRole) || 'student';
  });
  
  const [level, setLevel] = useState<StudentLevel | null>(() => {
    return (localStorage.getItem('studentLevel') as StudentLevel) || null;
  });

  const [name, setName] = useState<string>(() => {
    return localStorage.getItem('userName') || 'Student';
  });

  const [school, setSchool] = useState<string>(() => {
    return localStorage.getItem('userSchool') || '';
  });

  const [bio, setBio] = useState<string>(() => {
    return localStorage.getItem('userBio') || '';
  });

  const [goal, setGoal] = useState<string>(() => {
    return localStorage.getItem('userGoal') || '';
  });

  const [animeMessage, setAnimeMessage] = useState("Hi! I'm your AI study companion.");
  const [animeEmotion, setAnimeEmotion] = useState<'happy' | 'thinking' | 'surprised' | 'sad'>('happy');

  const [quizResults, setQuizResults] = useState<QuizResult[]>(() => {
    const saved = localStorage.getItem('quizResults');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('userRole', role);
  }, [role]);

  useEffect(() => {
    if (level) localStorage.setItem('studentLevel', level);
  }, [level]);

  useEffect(() => {
    localStorage.setItem('userName', name);
  }, [name]);

  useEffect(() => {
    localStorage.setItem('userSchool', school);
  }, [school]);

  useEffect(() => {
    localStorage.setItem('userBio', bio);
  }, [bio]);

  useEffect(() => {
    localStorage.setItem('userGoal', goal);
  }, [goal]);

  useEffect(() => {
    localStorage.setItem('quizResults', JSON.stringify(quizResults));
  }, [quizResults]);

  const addQuizResult = (result: QuizResult) => {
    setQuizResults(prev => [result, ...prev]);
  };

  const resetData = () => {
    localStorage.clear();
    setRole('student');
    setLevel(null);
    setName('Student');
    setSchool('');
    setBio('');
    setGoal('');
    setQuizResults([]);
  };

  return (
    <UserContext.Provider value={{ 
      role, setRole, level, setLevel, name, setName, 
      school, setSchool, bio, setBio, goal, setGoal,
      animeMessage, setAnimeMessage, animeEmotion, setAnimeEmotion,
      quizResults, addQuizResult, resetData 
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
