import React from 'react';
import { Voice, Emotion, VOICES, EMOTIONS } from '../lib/gemini';
import { Settings2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  voice: Voice;
  emotion: Emotion;
  onVoiceChange: (voice: Voice) => void;
  onEmotionChange: (emotion: Emotion) => void;
}

export function SettingsPanel({
  isOpen,
  onClose,
  voice,
  emotion,
  onVoiceChange,
  onEmotionChange
}: SettingsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 p-6 max-w-2xl mx-auto border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Audio Settings</h3>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Voice Style
                </label>
                <div className="flex flex-wrap gap-2">
                  {VOICES.map((v) => (
                    <button
                      key={v}
                      onClick={() => onVoiceChange(v)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        voice === v
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Emotion
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => onEmotionChange(e)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        emotion === e
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <button 
                onClick={onClose}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
