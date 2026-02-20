import { useState, useEffect, useCallback } from "react";

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for fetching data from API
 */
export function useApi<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = [],
  options?: UseApiOptions,
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await fetchFn();
      setState({ data: result, loading: false, error: null });
      options?.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ data: null, loading: false, error });
      options?.onError?.(error);
    }
  }, [fetchFn, options]);

  useEffect(() => {
    refetch();
  }, dependencies);

  return { ...state, refetch };
}

/**
 * Hook for mutations (POST, DELETE, PUT)
 */
export function useMutation<T, P>(
  mutationFn: (payload: P) => Promise<T>,
  options?: UseApiOptions,
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (payload: P) => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await mutationFn(payload);
        setState({ data: result, loading: false, error: null });
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });
        options?.onError?.(error);
        throw error;
      }
    },
    [mutationFn, options],
  );

  return { ...state, mutate };
}
