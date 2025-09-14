'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { EventWithDetails } from '@/lib/types';

export interface FavoritesHook {
  favorites: EventWithDetails[];
  isFavorite: (eventId: string) => boolean;
  toggleFavorite: (event: EventWithDetails) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useFavorites(): FavoritesHook {
  const { data: session, status } = useSession();
  const [favorites, setFavorites] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load favorites when session is available
  useEffect(() => {
    if (session?.user) {
      loadFavorites();
    } else {
      // If no session, load from localStorage as fallback
      loadLocalFavorites();
    }
  }, [session]);

  const loadFavorites = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/favorites/list');
      const data = await response.json();
      
      if (data.success) {
        setFavorites(data.data || []);
        // Also sync to localStorage for offline access
        syncToLocalStorage(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to load favorites');
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      setError(error instanceof Error ? error.message : 'Failed to load favorites');
      // Fallback to localStorage
      loadLocalFavorites();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalFavorites = () => {
    try {
      const stored = localStorage.getItem('user-favorites');
      if (stored) {
        const parsedFavorites = JSON.parse(stored);
        setFavorites(parsedFavorites);
      }
    } catch (error) {
      console.error('Error loading local favorites:', error);
    }
  };

  const syncToLocalStorage = (favoritesToSync: EventWithDetails[]) => {
    try {
      localStorage.setItem('user-favorites', JSON.stringify(favoritesToSync));
    } catch (error) {
      console.error('Error syncing favorites to localStorage:', error);
    }
  };

  const isFavorite = (eventId: string): boolean => {
    return favorites.some(fav => fav.id === eventId);
  };

  const toggleFavorite = async (event: EventWithDetails): Promise<void> => {
    if (!session?.user) {
      // If not authenticated, use localStorage only
      toggleLocalFavorite(event);
      return;
    }

    // Immediate optimistic update for instant UI feedback
    const wasAlreadyFavorited = isFavorite(event.id);
    const newFavorites = wasAlreadyFavorited
      ? favorites.filter(fav => fav.id !== event.id)
      : [...favorites, event];

    // Update state immediately - no delays
    setFavorites(newFavorites);
    syncToLocalStorage(newFavorites);

    // Background API sync (don't block UI)
    try {
      const response = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id }),
      });

      const data = await response.json();

      if (!data.success) {
        // Only revert on actual failure, not loading states
        const revertedFavorites = wasAlreadyFavorited
          ? [...favorites, event]
          : favorites.filter(fav => fav.id !== event.id);

        setFavorites(revertedFavorites);
        syncToLocalStorage(revertedFavorites);
        setError(data.error || 'Failed to toggle favorite');
      }
    } catch (error) {
      // Revert on network/API errors
      const revertedFavorites = wasAlreadyFavorited
        ? [...favorites, event]
        : favorites.filter(fav => fav.id !== event.id);

      setFavorites(revertedFavorites);
      syncToLocalStorage(revertedFavorites);
      setError('Network error - please try again');
    }
  };

  const toggleLocalFavorite = (event: EventWithDetails) => {
    const currentFavorites = [...favorites];
    const existingIndex = currentFavorites.findIndex(fav => fav.id === event.id);
    
    if (existingIndex >= 0) {
      // Remove from favorites
      currentFavorites.splice(existingIndex, 1);
    } else {
      // Add to favorites
      currentFavorites.push(event);
    }
    
    setFavorites(currentFavorites);
    syncToLocalStorage(currentFavorites);
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    loading,
    error
  };
}