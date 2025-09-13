// Consumer-focused home page for Local Events platform - RESPONSIVE WITH FAVORITES
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { EventWithDetails, DashboardStats } from '@/lib/types';
import HomePageNavigation from '@/components/HomePageNavigation';
import EventsSection from '@/components/EventsSection';
import MobileNavigation, { MobileBottomNav } from '@/components/MobileNavigation';
import CalendarIntegration from '@/components/CalendarIntegration';
import { ViewModeProvider } from '@/contexts/ViewModeContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import FavoritesSyncBridge from '@/components/FavoritesSyncBridge';
import { useFavorites } from '@/hooks/useFavorites';

export default function HomePage() {
  const [recentEvents, setRecentEvents] = useState<EventWithDetails[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showFavorites, setShowFavorites] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  
  // Use the favorites hook for consistent state management
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/api/dashboard', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'max-age=60'
        }
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        setRecentEvents(data.data.recentEvents || []);
        setFeaturedEvents(data.data.recentEvents?.slice(0, 3) || []);
      } else {
        setError(data.error || 'Failed to load events');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Dashboard API request timed out');
        setError('Loading is taking longer than expected. The page is still functional.');
      } else {
        console.error('Failed to fetch events:', error);
        setError('Unable to load events');
      }
    } finally {
      setLoading(false);
    }
  };


  // Memoized handlers for performance
  const handleToggleFavorite = useCallback(async (event: EventWithDetails) => {
    await toggleFavorite(event);
  }, [toggleFavorite]);

  const handleViewModeChange = useCallback((mode: 'desktop' | 'mobile') => {
    setViewMode(mode);
  }, []);

  const handleToggleFavorites = useCallback(() => {
    setShowFavorites(prev => !prev);
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 ${viewMode === 'mobile' ? 'max-w-md mx-auto' : ''} transition-all duration-300`}>

      {/* Navigation */}
      <HomePageNavigation
        viewMode={viewMode}
        showFavorites={showFavorites}
        onViewModeChange={handleViewModeChange}
        onToggleFavorites={handleToggleFavorites}
      />

      {/* Events Section */}
      <ErrorBoundary>
        <EventsSection
          featuredEvents={featuredEvents}
          recentEvents={recentEvents}
          favorites={favorites}
          loading={loading}
          error={error}
          viewMode={viewMode}
          showFavorites={showFavorites}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={isFavorite}
        />
      </ErrorBoundary>

      {/* Favorites Sync Bridge - syncs database favorites to personal tracker */}
      <FavoritesSyncBridge />

      {/* Calendar Integration */}
      <ErrorBoundary>
        <CalendarIntegration favorites={favorites} />
      </ErrorBoundary>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 mt-20">
        <div className={`${viewMode === 'mobile' ? 'max-w-md' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8`}>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>Built with ❤️ for the Madison community • Privacy-first • Open source</p>
          </div>
        </div>
      </footer>
      
      {/* Mobile Bottom Navigation - Responsive */}
      {viewMode === 'mobile' && (
        <div>
          <MobileBottomNav currentPath="/" />
        </div>
      )}
    </div>
  );
}
