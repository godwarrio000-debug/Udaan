import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Tutor } from './pages/Tutor';
import { Quiz } from './pages/Quiz';
import { Plan } from './pages/Plan';
import { Notes } from './pages/Notes';
import { Competitive } from './pages/Competitive';
import { Teacher } from './pages/Teacher';
import { Library } from './pages/Library';
import { Profile } from './pages/Profile';
import { Resources } from './pages/Resources';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/tutor" element={<Tutor />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/competitive" element={<Competitive />} />
            <Route path="/teacher" element={<Teacher />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/resources" element={<Resources />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </UserProvider>
  );
}
