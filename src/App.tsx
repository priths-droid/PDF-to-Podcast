import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ChapterList } from './components/ChapterList';
import { PlayerControls } from './components/PlayerControls';
import { SettingsPanel } from './components/SettingsPanel';
import { BookmarkList, Bookmark } from './components/BookmarkList';
import { NoteModal } from './components/NoteModal';
import { extractTextFromPdf } from './lib/pdf';
import { generatePodcastScript, generateAudio, PodcastScript, Voice, Emotion } from './lib/gemini';
import { Headphones, Settings2, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

function App() {
  const [script, setScript] = useState<PodcastScript | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const [voice, setVoice] = useState<Voice>('Puck');
  const [emotion, setEmotion] = useState<Emotion>('Neutral');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Bookmarking State
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [tempTimestamp, setTempTimestamp] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());

  // Handle file upload and processing
  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await extractTextFromPdf(file);
      const generatedScript = await generatePodcastScript(text);
      setScript(generatedScript);
      setCurrentChapterIndex(0);
      setBookmarks([]); // Reset bookmarks for new file
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process PDF. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate and play audio for current chapter
  const loadAndPlayAudio = async (index: number, autoPlay = true) => {
    if (!script) return;

    const chapter = script.chapters[index];
    const cacheKey = `${index}-${voice}-${emotion}`;

    setIsLoadingAudio(true);
    
    // Pause current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      let src = audioCache.current.get(cacheKey);

      if (!src) {
        src = await generateAudio(chapter.content, voice, emotion);
        audioCache.current.set(cacheKey, src);
      }

      if (audioRef.current) {
        audioRef.current.src = src;
        audioRef.current.playbackRate = playbackRate;
        if (autoPlay) {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("Error generating audio:", error);
      alert("Failed to generate audio. Please try again.");
      setIsPlaying(false);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Effect to reload audio when voice/emotion changes if we are already playing/ready
  useEffect(() => {
    if (script && !isLoadingAudio) {
      if (audioRef.current && audioRef.current.src) {
         const wasPlaying = !audioRef.current.paused;
         loadAndPlayAudio(currentChapterIndex, wasPlaying);
      }
    }
  }, [voice, emotion]);

  // Handle chapter selection
  const handleChapterSelect = (index: number) => {
    setCurrentChapterIndex(index);
    loadAndPlayAudio(index, true);
  };

  // Audio controls
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (!audioRef.current.src && script) {
        loadAndPlayAudio(currentChapterIndex, true);
      } else {
        audioRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const changePlaybackRate = () => {
    const rates = [0.75, 1, 1.25, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleAudioEnded = () => {
    if (script && currentChapterIndex < script.chapters.length - 1) {
      const nextIndex = currentChapterIndex + 1;
      setCurrentChapterIndex(nextIndex);
      loadAndPlayAudio(nextIndex, true);
    } else {
      setIsPlaying(false);
    }
  };

  // Bookmark Handlers
  const handleAddBookmark = () => {
    if (audioRef.current) {
      setTempTimestamp(audioRef.current.currentTime);
      setIsNoteModalOpen(true);
      // Optional: Pause while taking note
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSaveNote = (note: string) => {
    const newBookmark: Bookmark = {
      id: crypto.randomUUID(),
      chapterIndex: currentChapterIndex,
      timestamp: tempTimestamp,
      note,
      createdAt: Date.now(),
    };
    setBookmarks([...bookmarks, newBookmark]);
    // Optional: Resume playing
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleJumpToBookmark = (bookmark: Bookmark) => {
    if (bookmark.chapterIndex !== currentChapterIndex) {
      // Change chapter first, then seek (might need a way to wait for load)
      // For simplicity, just switch chapter and let user know or try to seek after load.
      // A robust solution requires waiting for audio load.
      // Let's just switch chapter for now and maybe seek if cached.
      setCurrentChapterIndex(bookmark.chapterIndex);
      loadAndPlayAudio(bookmark.chapterIndex, true).then(() => {
         if (audioRef.current) {
           audioRef.current.currentTime = bookmark.timestamp;
         }
      });
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = bookmark.timestamp;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-gray-900 font-sans selection:bg-indigo-100">
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onError={(e) => {
          const error = e.currentTarget.error;
          console.error("Audio playback error:", error ? `${error.code}: ${error.message}` : "Unknown error");
          setIsPlaying(false);
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Headphones className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">PodPDF</h1>
          </div>
          
          {script && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors relative group"
            >
              <Settings2 className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-32">
        {!script ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-12 max-w-lg">
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                Turn any PDF into a <span className="text-indigo-600">Podcast</span>
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed">
                Upload your documents and listen to them on the go. 
                AI-powered summaries, natural voices, and customizable emotions.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
            
            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 w-full max-w-3xl">
              {[
                { icon: Sparkles, title: "AI Summaries", desc: "Smart chapter breakdown" },
                { icon: Headphones, title: "Natural Voices", desc: "5+ lifelike speakers" },
                { icon: Settings2, title: "Custom Style", desc: "Adjust speed & emotion" },
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                  <feature.icon className="w-8 h-8 text-indigo-500 mb-3" />
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Global Summary Section */}
            {script.summary && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Summary</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {script.summary}
                </p>
              </motion.div>
            )}

            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold tracking-wide uppercase mb-3">
                Now Playing
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{script.title}</h2>
              <p className="text-gray-500">{script.chapters.length} Episodes • AI Generated</p>
            </div>

            {/* Sticky Player Controls */}
            <div className="sticky top-20 z-20 bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-indigo-100/50 border border-white p-6 mb-8">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-gray-900 truncate">
                  {script.chapters[currentChapterIndex].title}
                </h3>
                <p className="text-sm text-gray-500">
                  Episode {currentChapterIndex + 1} of {script.chapters.length}
                </p>
              </div>
              
              <PlayerControls
                isPlaying={isPlaying}
                onPlayPause={togglePlayPause}
                onSkipForward={() => skip(15)}
                onSkipBack={() => skip(-15)}
                playbackRate={playbackRate}
                onPlaybackRateChange={changePlaybackRate}
                isLoadingAudio={isLoadingAudio}
                onBookmark={handleAddBookmark}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <ChapterList
                  chapters={script.chapters}
                  currentChapterIndex={currentChapterIndex}
                  onChapterSelect={handleChapterSelect}
                  isPlaying={isPlaying}
                />
              </div>
              <div>
                <BookmarkList
                  bookmarks={bookmarks}
                  currentChapterIndex={currentChapterIndex}
                  onJumpToBookmark={handleJumpToBookmark}
                  onDeleteBookmark={handleDeleteBookmark}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        voice={voice}
        emotion={emotion}
        onVoiceChange={setVoice}
        onEmotionChange={setEmotion}
      />

      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        timestamp={tempTimestamp}
      />
    </div>
  );
}

export default App;
