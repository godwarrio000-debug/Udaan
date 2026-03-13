import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Youtube, Globe, ArrowRight, Video, Sparkles, Loader2, BookOpen, X, Play, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@/context/UserContext';
import { cn } from '@/lib/utils';
import { generateWithRetry, FALLBACK_RESOURCES } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';

interface Resource {
  title: string;
  url: string;
  type: 'youtube' | 'web';
  description?: string;
  videoId?: string;
}

export function Resources() {
  const { level, goal, setAnimeMessage, setAnimeEmotion } = useUser();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Resource | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [filter, setFilter] = useState<'all' | 'youtube' | 'web'>('all');

  const filteredResources = resources.filter(res => 
    filter === 'all' ? true : res.type === filter
  );

  useEffect(() => {
    const autoUrl = searchParams.get('url');
    const autoTitle = searchParams.get('title');
    const autoType = searchParams.get('type') as 'youtube' | 'web';

    if (autoUrl && autoTitle && autoType) {
      const res: Resource = {
        title: autoTitle,
        url: autoUrl,
        type: autoType,
        videoId: autoType === 'youtube' ? extractVideoId(autoUrl) : undefined,
        description: 'Recommended resource from your dashboard.'
      };
      setSelectedVideo(res);
      setAnimeMessage(`Opening your recommended resource: ${autoTitle}`);
      setAnimeEmotion('happy');
    } else {
      setAnimeMessage("Looking for study materials? Just tell me the topic!");
      setAnimeEmotion('happy');
    }
  }, [searchParams]);

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const fetchResources = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setSelectedVideo(null);
    setAiSummary(null);
    setAnimeMessage(`Searching for the best resources on "${searchQuery}"...`);
    setAnimeEmotion('thinking');

    try {
      const prompt = `Find 6 high-quality YouTube study video URLs and 4 educational web resource names for the topic: "${searchQuery}".
      The target audience is a student at the **${level}** level ${goal ? `with a career goal of ${goal}` : ''}.
      Return ONLY a JSON array of objects with keys: title, url (MUST be real YouTube URLs for videos, e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ), type ('youtube' or 'web'), and a short description (max 15 words).`;
      
      const result = await generateWithRetry({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(result.text || '[]').map((res: any) => ({
        ...res,
        videoId: res.type === 'youtube' ? extractVideoId(res.url) : null
      }));
      setResources(data);
      setAnimeMessage(`I found some great resources for ${searchQuery}! Click a video to watch it here.`);
      setAnimeEmotion('happy');
    } catch (e: any) {
      console.error("Failed to fetch resources", e);
      if (e?.message?.includes('429') || e?.message?.includes('RESOURCE_EXHAUSTED')) {
        setResources(FALLBACK_RESOURCES.map(r => ({ ...r, videoId: r.type === 'youtube' ? extractVideoId(r.url) : null })));
        setAnimeMessage("I've reached my search limit, but here are some top-tier general resources!");
        setAnimeEmotion('surprised');
      } else {
        setAnimeMessage("Oops! I couldn't find resources right now. Try again?");
        setAnimeEmotion('sad');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (resource: Resource) => {
    setLoadingSummary(true);
    setAiSummary(null);
    setAnimeMessage("Generating an AI summary of this lesson for you...");
    setAnimeEmotion('thinking');

    try {
      const prompt = `Act as an expert teacher. Provide a concise, high-impact study note summary for the topic: "${resource.title}".
      Context: This is for a student at the **${level}** level.
      Focus on the most important takeaways and keep it brief but informative.
      Use Markdown formatting. Include:
      - **Core Concepts** (Brief)
      - **Key Takeaways** (Bullet points)
      - **Quick Revision Summary** (1-2 sentences)`;

      const result = await generateWithRetry({
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      setAiSummary(result.text || "Failed to generate summary.");
      setAnimeMessage("I've prepared the notes for you! You can read them while watching.");
      setAnimeEmotion('happy');
    } catch (e) {
      console.error("Failed to generate summary", e);
      setAiSummary("Sorry, I couldn't generate a summary at this time.");
      setAnimeEmotion('sad');
    } finally {
      setLoadingSummary(false);
    }
  };

  const openResource = (res: Resource) => {
    if (res.type === 'youtube') {
      setSelectedVideo(res);
      setAiSummary(null);
      setAnimeMessage(`Playing: ${res.title}. Want an AI summary of this topic?`);
      setAnimeEmotion('happy');
    } else {
      // For web resources, we can still show the summary panel but without the video
      setSelectedVideo(res);
      setAiSummary(null);
      setAnimeMessage(`Viewing details for: ${res.title}. I can generate a summary of this topic for you!`);
      setAnimeEmotion('happy');
    }
  };

  const renderPlayer = () => {
    if (!selectedVideo) return null;

    return (
      <motion.div
        key="player"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedVideo(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
          >
            <ArrowRight className="rotate-180" size={18} /> Back to Search
          </button>
          <div className="flex gap-3">
            <button 
              onClick={() => generateSummary(selectedVideo)}
              disabled={loadingSummary}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 active:scale-95"
            >
              {loadingSummary ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
              AI Summary
            </button>
            <a 
              href={selectedVideo.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              {selectedVideo.type === 'youtube' ? <Youtube size={18} /> : <ExternalLink size={18} />}
              {selectedVideo.type === 'youtube' ? 'Open in YouTube' : 'Visit Website'}
            </a>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {selectedVideo.type === 'youtube' ? (
              <div className="aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border-4 border-white">
                {selectedVideo.videoId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                    title={selectedVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white p-8 text-center">
                    <p>This resource cannot be embedded. Please use the "Open in YouTube" button.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video rounded-3xl overflow-hidden bg-slate-100 shadow-inner border-4 border-white flex flex-col items-center justify-center p-12 text-center gap-6">
                <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Globe size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedVideo.title}</h3>
                  <p className="text-slate-500 mt-2 max-w-md">{selectedVideo.description}</p>
                </div>
                <a 
                  href={selectedVideo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Read Full Article
                </a>
              </div>
            )}
            <h2 className="text-2xl font-bold text-slate-900 mt-6">{selectedVideo.title}</h2>
            <p className="text-slate-500 mt-2">{selectedVideo.description}</p>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={18} />
                <h3 className="font-bold text-slate-900">AI Summary Notes</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                {loadingSummary ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                    <p className="text-sm text-slate-500 font-medium">Teacher is preparing your notes...</p>
                  </div>
                ) : aiSummary ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-indigo-900 prose-strong:text-slate-900 text-slate-600">
                    <ReactMarkdown>{aiSummary}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center text-slate-400">
                    <FileText size={48} className="opacity-20" />
                    <p className="text-sm">Click "AI Summary" to get teacher-style notes for this {selectedVideo.type === 'youtube' ? 'video' : 'article'}.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold uppercase tracking-wider"
        >
          <Sparkles size={16} /> AI Resource Finder
        </motion.div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Study Hub</h1>
        <p className="text-slate-500 max-w-lg mx-auto">
          Search for any topic and get curated YouTube videos and web articles tailored to your level.
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <form onSubmit={fetchResources} className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for YouTube lessons or articles (e.g., Calculus, Biology)..."
            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-32 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xl transition-all"
          />
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>
                <Youtube size={18} />
                <span>Search</span>
              </>
            )}
          </button>
        </form>
      </div>

      {hasSearched && !selectedVideo && !loading && (
        <div className="flex justify-center gap-2">
          {[
            { id: 'all', label: 'All Resources', icon: Sparkles },
            { id: 'youtube', label: 'Videos', icon: Youtube },
            { id: 'web', label: 'Articles', icon: Globe },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border",
                filter === t.id 
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              )}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedVideo ? (
          renderPlayer()
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-600 font-medium animate-pulse">Curating the best resources for you...</p>
          </motion.div>
        ) : hasSearched ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredResources.length > 0 ? (
              filteredResources.map((res, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col gap-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      res.type === 'youtube' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {res.type === 'youtube' ? <Youtube size={24} /> : <Globe size={24} />}
                    </div>
                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {res.type}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {res.title}
                    </h3>
                    {res.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 italic">
                        {res.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-auto pt-4 flex items-center gap-2">
                    <button 
                      onClick={() => openResource(res)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-xs transition-all",
                        res.type === 'youtube' ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      )}
                    >
                      {res.type === 'youtube' ? <Play size={14} /> : <FileText size={14} />}
                      {res.type === 'youtube' ? 'Watch Now' : 'Quick View'}
                    </button>
                    {res.type === 'web' && (
                      <a 
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 italic">No resources found for this topic. Try something else!</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { title: 'Video Lessons', icon: Video, desc: 'Top curated YouTube tutorials' },
              { title: 'Web Articles', icon: Globe, desc: 'In-depth reading materials' },
              { title: 'Curriculum Based', icon: BookOpen, desc: 'Tailored to your class level' }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center space-y-3">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mx-auto">
                  <item.icon size={24} />
                </div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
