// Home page for Local Events platform - Fast loading, mobile-optimized
'use client';

import { useState, memo } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Search, Plus, BarChart3, Clock } from 'lucide-react';
import type { EventWithDetails, DashboardStats } from '@/lib/types';
import StatsCard from '@/components/StatsCard';
import EventCard from '@/components/EventCard';

export default memo(function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data only when user requests it
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        setRecentEvents(data.data.recentEvents);
      } else {
        setError(data.error || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Unable to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const showingData = stats !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Local Events</h1>
                <p className="text-sm text-gray-600">Madison, Wisconsin</p>
              </div>
            </div>
            
            <nav className="flex items-center gap-4">
              <Link href="/events" className="text-gray-600 hover:text-gray-900 font-medium">
                Events
              </Link>
              <Link href="/admin/sources" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <Plus className="w-4 h-4" />
                Add Sources
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mx-4 mt-4">
          <p>{error}</p>
          <button
            onClick={fetchDashboardData}
            className="underline font-medium ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main content - loads instantly */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero section - always visible */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Local Events in Madison
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Privacy-focused, Facebook-free event discovery for Madison, Wisconsin
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/events" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
            >
              <Search className="w-5 h-5 mr-2" />
              Browse Events
            </Link>
            {!showingData && (
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 inline-flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 mr-2 animate-spin border-2 border-gray-500 border-t-transparent rounded-full"></div>
                    Loading Stats...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Load Platform Stats
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats section - only shown when loaded */}
        {showingData && stats && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Total Events"
                value={stats.totalEvents.toString()}
                icon={<Calendar className="w-8 h-8 text-blue-600" />}
                trend={`${stats.eventsLast7Days} this week`}
              />
              <StatsCard
                title="Active Sources"
                value={stats.activeSources.toString()}
                icon={<Plus className="w-8 h-8 text-green-600" />}
                trend={`${stats.totalSources} total`}
              />
              <StatsCard
                title="Success Rate"
                value={`${Math.round(stats.avgSuccessRate || 0)}%`}
                icon={<BarChart3 className="w-8 h-8 text-purple-600" />}
                trend="Average performance"
              />
              <StatsCard
                title="Recent Events"
                value={stats.recentEvents.length.toString()}
                icon={<Clock className="w-8 h-8 text-orange-600" />}
                trend="Last 7 days"
              />
            </div>
            
            {/* Recent events */}
            {stats.recentEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stats.recentEvents.slice(0, 6).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Simple call-to-action for when no data is loaded */}
        {!showingData && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Explore?</h2>
              <p className="text-gray-600 mb-6">
                Discover amazing local events happening in Madison right now.
              </p>
              <Link 
                href="/events" 
                className="inline-flex items-center bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Search className="w-5 h-5 mr-2" />
                Start Exploring Events
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-12 text-gray-500">
          <p>Privacy-focused event discovery for Madison, WI • No Facebook tracking</p>
        </div>
      </main>
    </div>
  );
});