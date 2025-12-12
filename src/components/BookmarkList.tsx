import React from 'react';
import { Bookmark as BookmarkIcon, Trash2, Clock, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export interface Bookmark {
  id: string;
  chapterIndex: number;
  timestamp: number;
  note: string;
  createdAt: number;
}

interface BookmarkListProps {
  bookmarks: Bookmark[];
  currentChapterIndex: number;
  onJumpToBookmark: (bookmark: Bookmark) => void;
  onDeleteBookmark: (id: string) => void;
}

export function BookmarkList({
  bookmarks,
  currentChapterIndex,
  onJumpToBookmark,
  onDeleteBookmark
}: BookmarkListProps) {
  // Filter bookmarks for the current chapter
  const chapterBookmarks = bookmarks.filter(b => b.chapterIndex === currentChapterIndex);

  // Sort by timestamp
  chapterBookmarks.sort((a, b) => a.timestamp - b.timestamp);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (chapterBookmarks.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="flex items-center gap-2 mb-4 px-2">
        <BookmarkIcon className="w-4 h-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Bookmarks & Notes
        </h3>
      </div>
      
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {chapterBookmarks.map((bookmark) => (
            <motion.div
              key={bookmark.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onJumpToBookmark(bookmark)}
                  className="mt-1 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-colors shrink-0"
                  title="Jump to timestamp"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-indigo-600 flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      {formatTime(bookmark.timestamp)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(bookmark.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed break-words">
                    {bookmark.note}
                  </p>
                </div>

                <button
                  onClick={() => onDeleteBookmark(bookmark.id)}
                  className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
