'use client';

import { motion } from 'framer-motion';
import { useVoiceRecording } from '@/lib/hooks/useVoiceRecording';
import { Mic, MicOff, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  onSaveNote?: (transcript: string) => Promise<void>;
  autoSave?: boolean;
  className?: string;
}

export default function VoiceRecorder({ 
  onSaveNote, 
  autoSave = true,
  className = ''
}: VoiceRecorderProps) {
  const {
    isRecording,
    isSaving,
    error,
    transcript,
    toggleRecording,
  } = useVoiceRecording({ onSaveNote, autoSave });

  return (
    <div className={`w-full max-w-md ${className}`}>
      <button
        onClick={toggleRecording}
        disabled={isSaving}
        className={`
          w-full py-3 px-6 rounded-full font-semibold text-white
          transition-all duration-200 transform hover:scale-105
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isRecording 
            ? 'bg-red-500 hover:bg-red-600 active:bg-red-700' 
            : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
          }
        `}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        <span className="flex items-center justify-center gap-2">
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : isRecording ? (
            <>
              <MicOff className="w-5 h-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Start Recording
            </>
          )}
        </span>
      </button>

      {/* Error display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Recording indicator and transcript */}
      {isRecording && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-center mb-3">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-3 h-3 bg-red-500 rounded-full"
            />
            <span className="ml-2 text-sm text-gray-600">Recording...</span>
          </div>
          
          {transcript && (
            <div className="mt-3 p-3 bg-white rounded border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* Saving indicator */}
      {isSaving && (
        <div className="mt-3 flex items-center justify-center text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Saving your note...
        </div>
      )}
    </div>
  );
}