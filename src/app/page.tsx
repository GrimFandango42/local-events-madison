// Home page for Local Events platform
'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Search, Plus, Settings, BarChart3, Clock } from 'lucide-react';
import type { EventWithDetails, DashboardStats } from '@/lib/types';
import { DashboardSkeleton } from '@/components/LoadingSkeletons';
import StatsCard from '@/components/StatsCard';
import EventCard from '@/components/EventCard';

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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

  if (loading) {
    return <DashboardSkeleton />;
  }

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
                <Settings className="w-4 h-4" />
                Manage Sources
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => { setError(null); fetchDashboardData(); }}
              className="underline font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-balance">
            Discover Madison Events Without Facebook
          </h2>
          <p className="text-xl text-gray-600 mb-8 text-balance">
            Find food, music, and cultural events across Madison from local venues, restaurants, and community organizations—all privacy-focused and Facebook-free.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/events" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-lg">
              <Search className="w-5 h-5" />
              Browse Events
            </Link>
            <Link href="/admin/sources" className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-lg">
              <Plus className="w-5 h-5" />
              Add Event Source
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-12 bg-white/50">
          <div className="max-w-7xl mx-auto px-4">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
              Platform Statistics
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatsCard
                title="Event Sources"
                value={stats.totalSources}
                description="Event Sources"
                icon={BarChart3}
                iconColor="text-blue-600"
                bgColor="bg-blue-100"
              />
              <StatsCard
                title="Total Events"
                value={stats.totalEvents}
                description="Total Events"
                icon={Calendar}
                iconColor="text-green-600"
                bgColor="bg-green-100"
              />
              <StatsCard
                title="Events This Week"
                value={stats.eventsLast7Days}
                description="This Week"
                icon={Clock}
                iconColor="text-purple-600"
                bgColor="bg-purple-100"
              />
              <StatsCard
                title="Active Sources"
                value={stats.activeSources}
                description="Active Sources"
                icon={MapPin}
                iconColor="text-indigo-600"
                bgColor="bg-indigo-100"
              />
            </div>
          </div>
        </section>
      )}

      {/* Recent Events Preview */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Recent Events</h3>
            <Link href="/events" className="text-blue-600 hover:text-blue-700 font-medium">
              View all events →
            </Link>
          </div>
          
          {recentEvents.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentEvents.slice(0, 6).map((event, index) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  priority={index < 2} // Prioritize first 2 images for LCP
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">No Events Yet</h4>
              <p className="text-gray-500 mb-6">
                Start by adding event sources to begin discovering Madison events.
              </p>
              <Link href="/admin/sources" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Source
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl font-bold mb-4">Help Grow the Madison Event Community</h3>
          <p className="text-xl text-blue-100 mb-8">
            Know of a local venue, restaurant, or organization that hosts events? 
            Add it to our platform and help fellow Madisonians discover great events.
          </p>
          <Link href="/admin/sources" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Contribute Event Source
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-2">
            Local Events Platform - Privacy-focused event discovery for Madison, WI
          </p>
          <p className="text-sm text-gray-500">
            Built with ❤️ for the Madison community • No Facebook tracking • Open source
          </p>
        </div>
      </footer>
    </div>
  );
}
