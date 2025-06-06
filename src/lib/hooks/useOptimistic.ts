import { useState, useCallback, useRef } from 'react';
import useSWR, { mutate as globalMutate, SWRConfiguration } from 'swr';

export interface UseOptimisticOptions<T> extends SWRConfiguration<T> {
  onError?: (error: Error, rollbackData: T) => void;
  onSuccess?: (data: T) => void;
}

export interface OptimisticUpdate<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (
    updater: T | Promise<T> | ((current?: T) => T | Promise<T>),
    options?: {
      optimisticData?: T | ((current?: T) => T);
      rollbackOnError?: boolean;
      populateCache?: boolean;
      revalidate?: boolean;
    }
  ) => Promise<T | undefined>;
  optimisticUpdate: (
    updater: (current?: T) => T,
    asyncUpdate: () => Promise<T>
  ) => Promise<void>;
}

export function useOptimistic<T = any>(
  key: string | null,
  fetcher: (() => Promise<T>) | null,
  options: UseOptimisticOptions<T> = {}
): OptimisticUpdate<T> {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    key,
    fetcher,
    options
  );

  const [isOptimisticUpdate, setIsOptimisticUpdate] = useState(false);
  const rollbackDataRef = useRef<T | undefined>(undefined);

  const optimisticUpdate = useCallback(
    async (
      updater: (current?: T) => T,
      asyncUpdate: () => Promise<T>
    ) => {
      if (!key) return;

      // Store current data for potential rollback
      rollbackDataRef.current = data;
      setIsOptimisticUpdate(true);

      try {
        // Apply optimistic update immediately
        const optimisticData = updater(data);
        
        // Update the cache optimistically
        await mutate(
          async () => {
            try {
              // Perform the actual async update
              const result = await asyncUpdate();
              setIsOptimisticUpdate(false);
              options.onSuccess?.(result);
              return result;
            } catch (error) {
              // Rollback will be handled by SWR's rollbackOnError
              throw error;
            }
          },
          {
            optimisticData,
            rollbackOnError: true,
            populateCache: true,
            revalidate: false,
          }
        );
      } catch (error) {
        setIsOptimisticUpdate(false);
        
        // Call error handler with rollback data
        if (error instanceof Error && rollbackDataRef.current !== undefined) {
          options.onError?.(error, rollbackDataRef.current);
        }
        
        throw error;
      }
    },
    [key, data, mutate, options]
  );

  return {
    data,
    error,
    isLoading: isLoading || isOptimisticUpdate,
    isValidating,
    mutate,
    optimisticUpdate,
  };
}

// Utility function for mutating data globally with optimistic updates
export async function optimisticMutate<T>(
  key: string,
  updater: (current?: T) => T,
  asyncUpdate: () => Promise<T>,
  options?: {
    rollbackOnError?: boolean;
    onError?: (error: Error) => void;
    onSuccess?: (data: T) => void;
  }
) {
  try {
    await globalMutate<T>(
      key,
      async (currentData) => {
        try {
          const result = await asyncUpdate();
          options?.onSuccess?.(result);
          return result;
        } catch (error) {
          throw error;
        }
      },
      {
        optimisticData: (currentData) => updater(currentData),
        rollbackOnError: options?.rollbackOnError ?? true,
        populateCache: true,
        revalidate: false,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      options?.onError?.(error);
    }
    throw error;
  }
}

// Hook for list operations with optimistic updates
export function useOptimisticList<T extends { id: string | number }>(
  key: string | null,
  fetcher: (() => Promise<T[]>) | null,
  options: UseOptimisticOptions<T[]> = {}
) {
  const optimistic = useOptimistic<T[]>(key, fetcher, options);

  const addItem = useCallback(
    async (
      newItem: T,
      asyncAdd: (item: T) => Promise<T>
    ) => {
      return optimistic.optimisticUpdate(
        (current = []) => [...current, newItem],
        async () => {
          const addedItem = await asyncAdd(newItem);
          return optimistic.data ? [...optimistic.data.filter(item => item.id !== newItem.id), addedItem] : [addedItem];
        }
      );
    },
    [optimistic]
  );

  const updateItem = useCallback(
    async (
      itemId: string | number,
      updates: Partial<T>,
      asyncUpdate: (id: string | number, updates: Partial<T>) => Promise<T>
    ) => {
      return optimistic.optimisticUpdate(
        (current = []) => 
          current.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          ),
        async () => {
          const updatedItem = await asyncUpdate(itemId, updates);
          return optimistic.data ? 
            optimistic.data.map(item => 
              item.id === itemId ? updatedItem : item
            ) : [];
        }
      );
    },
    [optimistic]
  );

  const removeItem = useCallback(
    async (
      itemId: string | number,
      asyncRemove: (id: string | number) => Promise<void>
    ) => {
      return optimistic.optimisticUpdate(
        (current = []) => current.filter(item => item.id !== itemId),
        async () => {
          await asyncRemove(itemId);
          return optimistic.data ? 
            optimistic.data.filter(item => item.id !== itemId) : [];
        }
      );
    },
    [optimistic]
  );

  return {
    ...optimistic,
    addItem,
    updateItem,
    removeItem,
  };
}