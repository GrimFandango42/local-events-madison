'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, HeartIcon } from 'lucide-react';
import Link from 'next/link';
import ApiErrorBoundary from './ApiErrorBoundary';

interface FavoriteButtonProps {
  eventId: string;
  eventTitle: string;
  className?: string;
  onFavoriteChanged?: (eventId: string, isFavorited: boolean) => void;
}

function FavoriteButtonComponent({ eventId, eventTitle, className = '', onFavoriteChanged }: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if event is favorited on mount and when session changes
  useEffect(() => {
    if (session?.user) {
      checkIfFavorited();
    }
  }, [session, eventId]);

  const checkIfFavorited = async () => {
    if (!session?.user) return;

    try {
      const response = await fetch(`/api/favorites/check?eventId=${eventId}`);
      const data = await response.json();
      setIsFavorited(data.isFavorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user || isLoading) return;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // IMMEDIATE visual update - no async, no delays
    const newState = !isFavorited;
    setIsFavorited(newState);
    setIsOptimistic(true);

    // Immediately call parent callback for instant UI updates
    onFavoriteChanged?.(eventId, newState);

    // Background API call (non-blocking)
    setIsLoading(true);

    try {
      const response = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      const data = await response.json();

      if (data.success) {
        // Confirm optimistic update was correct
        setIsFavorited(data.isFavorited);
        onFavoriteChanged?.(eventId, data.isFavorited);
      } else {
        // Revert immediately
        setIsFavorited(!newState);
        onFavoriteChanged?.(eventId, !newState);
        throw new Error(data.error || 'Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update immediately
      setIsFavorited(!newState);
      onFavoriteChanged?.(eventId, !newState);
    } finally {
      setIsLoading(false);
      setIsOptimistic(false);
    }
  }, [session?.user, isFavorited, isLoading, eventId, onFavoriteChanged]);

  // Loading state during auth check
  if (status === 'loading') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-500 rounded-lg ${className}`}>
        <Heart className="w-4 h-4" />
        <span className="hidden sm:inline">...</span>
      </div>
    );
  }

  // Not authenticated - show sign in prompt
  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm bg-pink-50 text-pink-700 hover:bg-pink-100 transition-colors rounded-lg border border-pink-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <Heart className="w-4 h-4" />
        <span className="hidden sm:inline">Sign in to favorite</span>
      </Link>
    );
  }

  // Authenticated - show favorite toggle
  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
        isFavorited
          ? 'bg-pink-100 text-pink-700 border border-pink-200 hover:bg-pink-200'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-pink-200 hover:text-pink-700'
      } ${className}`}
      title={isFavorited ? `Remove "${eventTitle}" from favorites` : `Add "${eventTitle}" to favorites`}
      data-testid="favorite-button"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-pink-600 rounded-full animate-spin" />
      ) : (
        <>
          {isFavorited ? (
            <HeartIcon className="w-4 h-4 fill-current" />
          ) : (
            <Heart className="w-4 h-4" />
          )}
        </>
      )}
      <span className="hidden sm:inline">
        {isLoading ? 'Saving...' : isFavorited ? 'Favorited' : 'Favorite'}
      </span>
    </button>
  );
}

export default function FavoriteButton(props: FavoriteButtonProps) {
  const retryFavoriteOperation = async () => {
    // Implement retry logic for favorite operations
    console.log('Retrying favorite operation for event:', props.eventId);
    // In a real implementation, you might refresh the component state
    // or re-trigger the API call
  };

  return (
    <ApiErrorBoundary
      apiEndpoint="/api/favorites"
      operation="manage favorites"
      onRetry={retryFavoriteOperation}
    >
      <FavoriteButtonComponent {...props} />
    </ApiErrorBoundary>
  );
}