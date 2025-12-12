import React from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward, Rewind, BookmarkPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface PlayerControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  playbackRate: number;
  onPlaybackRateChange: () => void;
  isLoadingAudio: boolean;
  onBookmark: () => void;
}

export function PlayerControls({
  isPlaying,
  onPlayPause,
  onSkipForward,
  onSkipBack,
  playbackRate,
  onPlaybackRateChange,
  isLoadingAudio,
  onBookmark
}: PlayerControlsProps) {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="flex items-center justify-center gap-8">
        <button
          onClick={onSkipBack}
          className="p-2 text-gray-500 hover:text-indigo-600 transition-colors hover:bg-indigo-50 rounded-full"
          title="-15s"
        >
          <div className="relative">
            <Rewind className="w-6 h-6" />
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium">15s</span>
          </div>
        </button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onPlayPause}
          disabled={isLoadingAudio}
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all",
            isLoadingAudio 
              ? "bg-gray-200 cursor-wait" 
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
          )}
        >
          {isLoadingAudio ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </motion.button>

        <button
          onClick={onSkipForward}
          className="p-2 text-gray-500 hover:text-indigo-600 transition-colors hover:bg-indigo-50 rounded-full"
          title="+15s"
        >
          <div className="relative">
            <FastForward className="w-6 h-6" />
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium">15s</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onPlaybackRateChange}
          className="px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
        >
          {playbackRate}x Speed
        </button>

        <button
          onClick={onBookmark}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
          title="Add Bookmark"
        >
          <BookmarkPlus className="w-3 h-3" />
          Note
        </button>
      </div>
    </div>
  );
}
