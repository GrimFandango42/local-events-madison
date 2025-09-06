// Home page for Local Events platform
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Search, Plus, Settings, BarChart3, Clock } from 'lucide-react';
import type { EventWithDetails, DashboardStats } from '@/lib/types';

export default function HomePage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

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
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Madison events...</p>
        </div>
      </div>
    );
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
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalSources}</p>
                <p className="text-sm text-gray-600">Event Sources</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEvents}</p>
                <p className="text-sm text-gray-600">Total Events</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.eventsLast7Days}</p>
                <p className="text-sm text-gray-600">This Week</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-lg mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.activeSources}</p>
                <p className="text-sm text-gray-600">Active Sources</p>
              </div>
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
              {recentEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <span className="badge badge-info">{event.category}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(event.startDateTime).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {event.title}
                  </h4>
                  
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">
                        {event.venue?.name || event.customLocation || 'TBD'}
                      </span>
                    </div>
                    
                    {event.priceMin !== null && (
                      <span className="text-green-600 font-medium">
                        {event.priceMin === 0 ? 'Free' : `$${(event.priceMin / 100).toFixed(0)}+`}
                      </span>
                    )}
                  </div>
                </div>
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