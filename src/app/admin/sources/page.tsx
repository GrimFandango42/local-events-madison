// Admin page for managing event sources
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Globe, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface EventSource {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  status: string;
  successRate: number;
  totalAttempts: number;
  venue?: {
    name: string;
  };
}

export default function AdminSourcesPage() {
  const [sources, setSources] = useState<EventSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/sources');
      const data = await response.json();
      if (data.success) {
        setSources(data.data || []);
      } else {
        setError(data.error || 'Failed to load sources');
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error);
      setError('Unable to load sources. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="glass border-b border-white/20 shadow-soft">
        <div className="max-w-7xl mx-auto mobile-padding py-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <h1 className="heading-lg">Event Sources Management</h1>
              <p className="text-subtle mt-3 text-lg">Manage and monitor your event data sources</p>
            </div>
            <button className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Source
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mobile-padding py-12">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4 fade-in">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-lg font-medium text-gray-700">Loading sources...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 slide-up">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 mb-1">Error Loading Sources</h4>
                <p className="text-red-600 text-sm leading-relaxed">{error}</p>
              </div>
              <button
                onClick={fetchSources}
                className="btn-small bg-red-600 text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : sources.length === 0 ? (
          <div className="text-center py-20 slide-up">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <Globe className="w-12 h-12 text-gray-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-gray-700">No Event Sources</h3>
                <p className="text-gray-500 leading-relaxed">
                  Start by adding your first event source to begin discovering Madison events.
                </p>
              </div>
              <button className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Source
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sources.map((source, index) => (
                <div key={source.id} className="card-hover fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{source.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{source.sourceType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {source.status === 'active' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        source.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {source.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">URL</p>
                      <p className="text-sm text-gray-600 break-all">{source.url}</p>
                    </div>
                    
                    {source.venue && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Venue</p>
                        <p className="text-sm text-gray-600">{source.venue.name}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-600">{Math.round(source.successRate)}%</p>
                        <p className="text-xs text-gray-600">Success Rate</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">{source.totalAttempts}</p>
                        <p className="text-xs text-gray-600">Total Attempts</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}