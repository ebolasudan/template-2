import { useState, useCallback } from 'react';
import { useDeepgram } from '../contexts/DeepgramContext';
import { addDocument } from '../firebase/firebaseUtils';

export interface VoiceRecordingOptions {
  onSaveNote?: (transcript: string) => Promise<void>;
  autoSave?: boolean;
}

export function useVoiceRecording(options: VoiceRecordingOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    connectToDeepgram, 
    disconnectFromDeepgram, 
    connectionState, 
    realtimeTranscript 
  } = useDeepgram();

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      await connectToDeepgram();
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecording(false);
    }
  }, [connectToDeepgram]);

  const stopRecording = useCallback(async () => {
    try {
      disconnectFromDeepgram();
      setIsRecording(false);
      
      // Save the note if there's a transcript
      if (realtimeTranscript && (options.autoSave ?? true)) {
        setIsSaving(true);
        
        if (options.onSaveNote) {
          await options.onSaveNote(realtimeTranscript);
        } else {
          // Default save to Firebase
          await addDocument('notes', {
            text: realtimeTranscript,
            timestamp: new Date().toISOString(),
          });
        }
        
        setIsSaving(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save recording');
      setIsSaving(false);
    }
  }, [disconnectFromDeepgram, realtimeTranscript, options]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    // State
    isRecording,
    isSaving,
    error,
    connectionState,
    transcript: realtimeTranscript,
    
    // Actions
    startRecording,
    stopRecording,
    toggleRecording,
  };
}