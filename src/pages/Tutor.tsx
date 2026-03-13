import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, User, Bot, Mic, Image as ImageIcon, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useUser } from '@/context/UserContext';
import { generateWithRetry } from '@/lib/gemini';

interface Message {
  role: 'user' | 'model';
  content: string;
  image?: string;
}

export function Tutor() {
  const { level, setAnimeMessage, setAnimeEmotion } = useUser();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: `Hi! I'm your AI Tutor. I see you are studying at the **${level || 'General'}** level. What topic would you like to learn about today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasAutoSearched = useRef(false);

  useEffect(() => {
    setAnimeMessage("Hi! I'm your AI Tutor. Ask me anything!");
    setAnimeEmotion('happy');
  }, [setAnimeMessage, setAnimeEmotion]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async (customMessage?: string) => {
    const userMessage = customMessage || input.trim();
    const userImage = selectedImage;
    
    if ((!userMessage && !userImage) || isLoading) return;

    setInput('');
    setSelectedImage(null);
    
    setMessages(prev => [...prev, { role: 'user', content: userMessage, image: userImage || undefined }]);
    setIsLoading(true);
    setAnimeMessage("Let me think about that...");
    setAnimeEmotion('thinking');

    try {
      let promptParts: any[] = [{ text: userMessage }];
      
      if (userImage) {
        const base64Data = userImage.split(',')[1];
        promptParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data
          }
        });
      }

      const systemInstruction = `You are a helpful, patient, and encouraging AI tutor. 
      The student is at the **${level}** level. Adjust your complexity accordingly.
      - For Class 1-5: Use simple words, analogies, and fun examples.
      - For Class 6-10: Be clear, structured, and use standard textbook definitions.
      - For Class 11-12: Be detailed, technical, and cover exam-oriented points.
      - For Engineering/PhD: Be rigorous, academic, and go deep into theory/implementation.
      - For Competitive Exams: Focus on tricks, shortcuts, key facts, and exam patterns.
      
      Use Markdown for formatting. Keep responses concise but informative.`;

      const result = await generateWithRetry({
        model: "gemini-2.0-flash",
        contents: {
          role: 'user',
          parts: promptParts
        },
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const responseText = result.text || "I'm sorry, I couldn't generate a response.";
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
      setAnimeMessage("Here's what I found!");
      setAnimeEmotion('happy');
    } catch (error: any) {
      console.error("Error sending message:", error);
      const isQuotaExceeded = error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED');
      const errorMessage = isQuotaExceeded 
        ? "I'm a bit overwhelmed with requests right now. Please wait a moment and try again!" 
        : "Sorry, I encountered an error. Please try again.";
      
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
      setAnimeMessage(isQuotaExceeded ? "I'm taking a quick breather!" : "Oops! I had trouble answering that.");
      setAnimeEmotion(isQuotaExceeded ? 'surprised' : 'sad');
    } finally {
      setIsLoading(false);
    }
  }, [input, selectedImage, isLoading, level]);

  useEffect(() => {
    const topic = searchParams.get('topic');
    if (topic && !hasAutoSearched.current) {
      hasAutoSearched.current = true;
      handleSend(`Tell me about ${topic}`);
    }
  }, [searchParams, handleSend]);

  // Voice Recognition Setup
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
      };

      recognition.start();
    } else {
      alert("Voice recognition is not supported in this browser.");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'user' ? "bg-indigo-600 text-white" : "bg-emerald-500 text-white"
            )}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
              msg.role === 'user' 
                ? "bg-indigo-600 text-white rounded-tr-none" 
                : "bg-slate-100 text-slate-800 rounded-tl-none"
            )}>
              {msg.image && (
                <img src={msg.image} alt="User upload" className="max-w-full h-auto rounded-lg mb-2 border border-white/20" />
              )}
              <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-50">
                <ReactMarkdown 
                  components={{
                    code({node, className, children, ...props}) {
                      return (
                        <code className={cn("bg-black/10 rounded px-1 py-0.5 font-mono text-xs", className)} {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 mr-auto max-w-[85%]"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-1">
              <motion.div
                className="w-2 h-2 bg-slate-400 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0 }}
              />
              <motion.div
                className="w-2 h-2 bg-slate-400 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
              />
              <motion.div
                className="w-2 h-2 bg-slate-400 rounded-full"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
              />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200">
        {selectedImage && (
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="relative">
              <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-300" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600"
              >
                <X size={12} />
              </button>
            </div>
            <span className="text-xs text-slate-500">Image attached</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white text-slate-500 rounded-xl border border-slate-300 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            title="Upload Image"
          >
            <ImageIcon size={20} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleImageSelect}
          />
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a doubt..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white shadow-sm transition-all"
            disabled={isLoading}
          />
          
          <button
            onClick={startListening}
            className={cn(
              "p-3 rounded-xl border transition-colors",
              isListening 
                ? "bg-red-100 text-red-600 border-red-200 animate-pulse" 
                : "bg-white text-slate-500 border-slate-300 hover:bg-slate-50 hover:text-indigo-600"
            )}
            title="Voice Input"
          >
            <Mic size={20} />
          </button>

          <button
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim() && !selectedImage)}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
