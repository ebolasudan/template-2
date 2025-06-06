import { useCallback, useMemo } from 'react';
import { useOptimisticList } from './useOptimistic';
import { useAPIClient } from '@/lib/api/client';
import { Message } from '@/types/api';
import { useAuth } from './useAuth';

export interface ChatMessage extends Message {
  id: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

/**
 * Custom hook for managing AI chat interactions with optimistic updates
 * 
 * Provides real-time chat functionality with automatic retry, error handling,
 * and optimistic UI updates for smooth user experience.
 * 
 * @param provider - AI provider to use ('openai' | 'anthropic' | 'lmstudio')
 * @returns Chat state and actions for sending messages
 * 
 * @example
 * ```tsx
 * const { messages, sendMessage, clearMessages, isLoading } = useChat('openai');
 * 
 * const handleSend = async () => {
 *   try {
 *     await sendMessage('Hello, AI!');
 *   } catch (error) {
 *     console.error('Failed to send message:', error);
 *   }
 * };
 * ```
 */
export function useChat(provider: 'openai' | 'anthropic' | 'lmstudio' = 'openai') {
  const { user } = useAuth();
  const apiClient = useAPIClient();
  
  // Memoize the SWR key to prevent unnecessary re-renders
  const swrKey = useMemo(() => 
    user ? `/api/chat/${provider}` : null, 
    [user, provider]
  );
  
  // Memoize SWR options to prevent recreation on every render
  const swrOptions = useMemo(() => ({
    fallbackData: [],
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  }), []);
  
  const {
    data: messages,
    error,
    isLoading,
    addItem,
    updateItem,
    mutate,
  } = useOptimisticList<ChatMessage>(
    swrKey,
    null, // We'll manage messages locally
    swrOptions
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!user) throw new Error('User not authenticated');

      // Create user message
      const userMessage: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content,
        timestamp: new Date(),
        status: 'sent',
      };

      // Create placeholder for assistant message
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: 'sending',
      };

      // Add user message optimistically
      await addItem(userMessage, async () => userMessage);

      // Add assistant placeholder
      await mutate(current => [...(current || []), assistantMessage], false);

      try {
        // Get streaming response
        let stream: ReadableStream;
        
        const chatMessages = [...(messages || []), userMessage].map(({ role, content }) => ({ role, content }));
        
        switch (provider) {
          case 'openai':
            stream = await apiClient.streamChatWithOpenAI({ messages: chatMessages });
            break;
          case 'anthropic':
            stream = await apiClient.streamChatWithAnthropic({ messages: chatMessages });
            break;
          case 'lmstudio':
            stream = await apiClient.streamChatWithLMStudio({ messages: chatMessages });
            break;
          default:
            throw new Error(`Unsupported provider: ${provider}`);
        }

        // Process stream
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          accumulatedContent += chunk;

          // Update assistant message with accumulated content
          await updateItem(
            assistantMessage.id,
            { content: accumulatedContent, status: 'sending' },
            async () => ({ ...assistantMessage, content: accumulatedContent })
          );
        }

        // Mark as sent
        await updateItem(
          assistantMessage.id,
          { status: 'sent' },
          async () => ({ ...assistantMessage, content: accumulatedContent, status: 'sent' })
        );

      } catch (error) {
        // Update assistant message to show error
        await updateItem(
          assistantMessage.id,
          { 
            content: 'Sorry, I encountered an error. Please try again.',
            status: 'error' 
          },
          async () => ({ 
            ...assistantMessage, 
            content: 'Sorry, I encountered an error. Please try again.',
            status: 'error' 
          })
        );
        
        throw error;
      }
    },
    [user, provider, messages, addItem, updateItem, mutate, apiClient]
  );

  const clearMessages = useCallback(async () => {
    await mutate([]);
  }, [mutate]);

  // Memoize the return object to prevent unnecessary re-renders of components using this hook
  return useMemo(() => ({
    messages: messages || [],
    error,
    isLoading,
    sendMessage,
    clearMessages,
  }), [messages, error, isLoading, sendMessage, clearMessages]);
}