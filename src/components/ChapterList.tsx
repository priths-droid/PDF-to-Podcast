import React from 'react';
import { Chapter } from '../lib/gemini';
import { PlayCircle, Clock, BarChart2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface ChapterListProps {
  chapters: Chapter[];
  currentChapterIndex: number;
  onChapterSelect: (index: number) => void;
  isPlaying: boolean;
}

export function ChapterList({
  chapters,
  currentChapterIndex,
  onChapterSelect,
  isPlaying
}: ChapterListProps) {
  return (
    <div className="space-y-3 w-full max-w-2xl mx-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 px-2">Episodes</h3>
      {chapters.map((chapter, index) => {
        const isActive = index === currentChapterIndex;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onChapterSelect(index)}
            className={cn(
              "group relative p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md",
              isActive 
                ? "bg-indigo-50 border-indigo-200 shadow-sm" 
                : "bg-white border-gray-100 hover:border-indigo-100"
            )}
          >
            <div className="flex items-start gap-4">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600"
              )}>
                {isActive && isPlaying ? (
                  <BarChart2 className="w-5 h-5 animate-pulse" />
                ) : (
                  <PlayCircle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={cn(
                    "font-medium truncate pr-2",
                    isActive ? "text-indigo-900" : "text-gray-900"
                  )}>
                    {index + 1}. {chapter.title}
                  </h4>
                  <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {chapter.durationEstimate}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                  {chapter.summary}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
