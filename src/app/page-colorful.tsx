// Consumer-focused home page for Local Events platform - DESKTOP OPTIMIZED
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Search, Sparkles, Music, Utensils, Palette, Users, ArrowRight } from 'lucide-react';
import type { EventWithDetails, DashboardStats } from '@/lib/types';
import EventCard from '@/components/EventCard';
import { FeaturedEventsSkeleton, RecentEventsSkeleton } from '@/components/EventCardSkeleton';
import MobileNavigation, { MobileBottomNav } from '@/components/MobileNavigation';
import ImprovedErrorState, { EmptyState } from '@/components/ImprovedErrorStates';

export default function HomePage() {
  const [recentEvents, setRecentEvents] = useState<EventWithDetails[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<EventWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const categories = [
    { name: 'Music', icon: Music, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200', count: '12' },
    { name: 'Food', icon: Utensils, color: 'bg-orange-100 text-orange-700 hover:bg-orange-200', count: '8' },
    { name: 'Art', icon: Palette, color: 'bg-pink-100 text-pink-700 hover:bg-pink-200', count: '5' },
    { name: 'Community', icon: Users, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200', count: '15' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      
      {/* Desktop-First Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Madison Events
                </h1>
                <p className="text-xs text-gray-500">Facebook-free discovery</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <Link 
                href="/events" 
                className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors rounded-lg"
              >
                All Events
              </Link>
              <Link 
                href="/events" 
                className="px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Find Events
              </Link>
            </div>
            
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <MobileNavigation currentPath="/" />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-cyan-600/10"></div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm text-indigo-600 font-medium mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            Privacy-focused event discovery for Madison
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Find amazing
            <span className="bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent block">
              local events
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover concerts, festivals, food events, and community gatherings across Madison. 
            No Facebook account required, no tracking, just great local events.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/events" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Search className="w-5 h-5" />
              Explore Events
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#featured" 
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-md border border-indigo-200"
            >
              <Calendar className="w-5 h-5" />
              See What's On
            </a>
          </div>
          
          {/* Quick Category Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/events?category=${category.name.toLowerCase()}`}
                className={`flex items-center gap-3 p-4 min-h-[56px] rounded-xl transition-all ${category.color} group`}
                data-testid="category-link"
              >
                <category.icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">{category.name}</div>
                  <div className="text-xs opacity-70">{category.count} events</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      {!loading && featuredEvents.length > 0 && (
        <section id="featured" className="py-16 bg-white/50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Happening This Week
              </h2>
              <p className="text-lg text-gray-600">
                Don't miss these popular events around Madison
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {featuredEvents.map((event, index) => (
                <div key={event.id} className="transform hover:scale-105 transition-transform">
                  <EventCard 
                    event={event} 
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <Link 
                href="/events" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                View All Events
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recent Events */}
      {!loading && recentEvents.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Latest Events</h3>
                <p className="text-gray-600">Freshly added to our platform</p>
              </div>
              <Link 
                href="/events" 
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recentEvents.slice(0, 8).map((event, index) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  priority={false}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loading State for Events */}
      {loading && (
        <>
          <FeaturedEventsSkeleton />
          <RecentEventsSkeleton />
        </>
      )}
      
      {/* Empty State */}
      {!loading && recentEvents.length === 0 && !error && (
        <section className="py-20">
          <div className="max-w-2xl mx-auto px-4">
            <EmptyState
              icon={Calendar}
              title="Getting Ready to Launch"
              description="We're setting up connections with local venues and organizations to bring you the best Madison events. Check back soon for concerts, festivals, and community gatherings!"
              actionLabel="Help Add Local Venues"
              actionHref="/admin/sources"
            />
          </div>
        </section>
      )}

      {/* Error State */}
      {!loading && error && (
        <section className="py-20">
          <div className="max-w-2xl mx-auto px-4">
            <ImprovedErrorState
              type="server"
              title="Unable to Load Events"
              message={error}
              onAction={fetchEvents}
              showHomeButton={false}
            />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-semibold">Madison Events</span>
              </div>
              <p className="text-gray-400 text-sm">
                Privacy-focused event discovery for Wisconsin's capital. 
                Find local events without Facebook tracking.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Discover</h4>
              <div className="space-y-2 text-sm">
                <Link href="/events?category=music" className="block hover:text-white transition-colors py-2 px-3 rounded">
                  Music & Concerts
                </Link>
                <Link href="/events?category=food" className="block hover:text-white transition-colors py-2 px-3 rounded">
                  Food & Dining
                </Link>
                <Link href="/events?category=art" className="block hover:text-white transition-colors py-2 px-3 rounded">
                  Arts & Culture
                </Link>
                <Link href="/events?category=community" className="block hover:text-white transition-colors py-2 px-3 rounded">
                  Community Events
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">About</h4>
              <div className="space-y-2 text-sm">
                <Link href="/admin/sources" className="block hover:text-white transition-colors py-2 px-3 rounded">
                  Add Your Venue
                </Link>
                <div className="block text-gray-400">
                  Built for Madison community
                </div>
                <div className="block text-gray-400">
                  No tracking, no ads
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>Built with ❤️ for the Madison community • Privacy-first • Open source</p>
          </div>
        </div>
      </footer>
      
      {/* Mobile Bottom Navigation - ONLY show on mobile */}
      <div className="md:hidden">
        <MobileBottomNav currentPath="/" />
      </div>
    </div>
  );
}