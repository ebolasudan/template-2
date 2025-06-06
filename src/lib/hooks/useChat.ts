import { useCallback } from 'react';
import { useOptimisticList } from './useOptimistic';
import { useAPIClient } from '@/lib/api/client';
import { Message } from '@/types/api';
import { useAuth } from './useAuth';

export interface ChatMessage extends Message {
  id: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

export function useChat(provider: 'openai' | 'anthropic' = 'openai') {
  const { user } = useAuth();
  const apiClient = useAPIClient();
  
  const {
    data: messages,
    error,
    isLoading,
    addItem,
    updateItem,
    mutate,
  } = useOptimisticList<ChatMessage>(
    user ? `/api/chat/${provider}` : null,
    null, // We'll manage messages locally
    {
      fallbackData: [],
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
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
        const stream = provider === 'openai' 
          ? await apiClient.streamChatWithOpenAI({
              messages: [...(messages || []), userMessage].map(({ role, content }) => ({ role, content })),
            })
          : await apiClient.streamChatWithAnthropic({
              messages: [...(messages || []), userMessage].map(({ role, content }) => ({ role, content })),
            });

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

  return {
    messages: messages || [],
    error,
    isLoading,
    sendMessage,
    clearMessages,
  };
}