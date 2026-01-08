"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface LinkMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  readTime: number | null;
  siteName: string | null;
}

interface UseLinkMetadataOptions {
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
  /** Callback when metadata is successfully fetched */
  onSuccess?: (metadata: LinkMetadata) => void;
  /** Callback when fetch fails */
  onError?: (error: string) => void;
}

interface UseLinkMetadataReturn {
  /** Current metadata (null if not fetched or error) */
  metadata: LinkMetadata | null;
  /** Whether metadata is currently being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually trigger a fetch for the current URL */
  refetch: () => void;
  /** Clear metadata and error state */
  clear: () => void;
}

/**
 * Validate if a string is a valid HTTP/HTTPS URL
 */
function isValidUrl(url: string): boolean {
  if (!url || url.length < 10) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Hook for fetching metadata from a URL with debouncing
 */
export function useLinkMetadata(
  url: string,
  options: UseLinkMetadataOptions = {},
): UseLinkMetadataReturn {
  const { debounceMs = 500, onSuccess, onError } = options;

  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastFetchedUrlRef = useRef<string>("");

  const fetchMetadata = useCallback(
    async (targetUrl: string) => {
      // Skip if already fetched this URL
      if (targetUrl === lastFetchedUrlRef.current && metadata) {
        return;
      }

      // Cancel any in-progress fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Skip invalid URLs
      if (!isValidUrl(targetUrl)) {
        setMetadata(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/fetch-metadata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: targetUrl }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch metadata");
        }

        const data: LinkMetadata = await response.json();
        lastFetchedUrlRef.current = targetUrl;
        setMetadata(data);
        setError(null);
        onSuccess?.(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was aborted, ignore
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch metadata";
        setError(errorMessage);
        setMetadata(null);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [metadata, onSuccess, onError],
  );

  // Debounced effect for URL changes
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Skip empty or invalid URLs
    if (!url || !isValidUrl(url)) {
      // Clear state if URL is empty
      if (!url) {
        setMetadata(null);
        setError(null);
        lastFetchedUrlRef.current = "";
      }
      return;
    }

    // Debounce the fetch
    debounceTimerRef.current = setTimeout(() => {
      fetchMetadata(url);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [url, debounceMs, fetchMetadata]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(() => {
    if (url && isValidUrl(url)) {
      lastFetchedUrlRef.current = ""; // Force refetch
      fetchMetadata(url);
    }
  }, [url, fetchMetadata]);

  const clear = useCallback(() => {
    setMetadata(null);
    setError(null);
    lastFetchedUrlRef.current = "";
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    metadata,
    isLoading,
    error,
    refetch,
    clear,
  };
}
