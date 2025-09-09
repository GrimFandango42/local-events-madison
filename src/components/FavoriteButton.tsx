'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Heart, HeartIcon } from 'lucide-react';
import Link from 'next/link';

interface FavoriteButtonProps {
  eventId: string;
  eventTitle: string;
  className?: string;
}

export default function FavoriteButton({ eventId, eventTitle, className = '' }: FavoriteButtonProps) {
  const { data: session, status } = useSession();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session?.user) return;

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
        setIsFavorited(data.isFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
        isFavorited
          ? 'bg-pink-100 text-pink-700 border border-pink-200 hover:bg-pink-200'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-pink-200 hover:text-pink-700'
      } ${className}`}
      title={isFavorited ? `Remove "${eventTitle}" from favorites` : `Add "${eventTitle}" to favorites`}
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