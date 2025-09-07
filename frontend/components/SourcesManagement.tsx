// SourcesManagement.tsx - Main interface for managing event sources
import React, { useState, useEffect } from 'react';
import { Plus, Settings, BarChart3, RefreshCw, AlertTriangle, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { AddSourceModal } from './AddSourceModal';

interface EventSource {
  id: string;
  name: string;
  url: string;
  sourceType: string;
  status: 'active' | 'paused' | 'failed';
  lastScraped: string;
  nextScrapeDate: string;
  successRate: number;
  eventsFoundLast7Days: number;
  venueName?: string;
}

interface SourceStats {
  totalSources: number;
  activeSources: number;
  failedSources: number;
  totalEventsLast7Days: number;
  avgSuccessRate: number;
}

export function SourcesManagement() {
  const [sources, setSources] = useState<EventSource[]>([]);
  const [stats, setStats] = useState<SourceStats | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastScraped' | 'successRate'>('name');

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSources([
        {
          id: '1',
          name: 'Visit Madison Events',
          url: 'https://www.visitmadison.com/events/',
          sourceType: 'government',
          status: 'active',
          lastScraped: '2025-01-09T10:30:00Z',
          nextScrapeDate: '2025-01-09T16:30:00Z',
          successRate: 98.5,
          eventsFoundLast7Days: 23
        },
        {
          id: '2',
          name: 'Isthmus Calendar',
          url: 'https://isthmus.com/search/event/calendar-of-events/',
          sourceType: 'local_media',
          status: 'active',
          lastScraped: '2025-01-09T09:15:00Z',
          nextScrapeDate: '2025-01-09T15:15:00Z',
          successRate: 95.2,
          eventsFoundLast7Days: 31
        },
        {
          id: '3',
          name: 'The Sylvee Events',
          url: 'https://thesylvee.com/events/',
          sourceType: 'venue',
          status: 'active',
          lastScraped: '2025-01-09T08:00:00Z',
          nextScrapeDate: '2025-01-09T14:00:00Z',
          successRate: 100,
          eventsFoundLast7Days: 8,
          venueName: 'The Sylvee'
        },
        {
          id: '4',
          name: 'Great Dane Events',
          url: 'https://greatdanepub.com/events/',
          sourceType: 'brewery',
          status: 'failed',
          lastScraped: '2025-01-08T20:00:00Z',
          nextScrapeDate: '2025-01-09T14:00:00Z',
          successRate: 45.8,
          eventsFoundLast7Days: 0,
          venueName: 'Great Dane Pub'
        }
      ]);

      setStats({
        totalSources: 4,
        activeSources: 3,
        failedSources: 1,
        totalEventsLast7Days: 62,
        avgSuccessRate: 84.6
      });
      
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'paused':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getSourceTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      government: '🏛️ Government',
      local_media: '📰 Media',
      venue: '🎵 Venue',
      restaurant: '🍽️ Restaurant',
      brewery: '🍺 Brewery',
      cultural: '🎨 Cultural',
      community: '🏢 Community',
      custom: '🔗 Custom'
    };
    return types[type] || type;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const handleRunScrape = (sourceId: string) => {
    // Mock API call to trigger scrape
    console.log(`Triggering scrape for source ${sourceId}`);
  };

  const handleToggleStatus = (sourceId: string) => {
    setSources(prev => prev.map(source => 
      source.id === sourceId 
        ? { ...source, status: source.status === 'active' ? 'paused' : 'active' as any }
        : source
    ));
  };

  const filteredSources = sources.filter(source => 
    filterType === 'all' || source.sourceType === filterType
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event sources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Sources</h1>
          <p className="text-gray-600">Manage websites and feeds for event data collection</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Source
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="text-sm font-medium text-gray-700">Total Sources</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSources}</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-sm font-medium text-gray-700">Active</h3>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeSources}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-medium text-gray-700">Failed</h3>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.failedSources}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-medium text-gray-700">Events (7d)</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalEventsLast7Days}</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-medium text-gray-700">Avg Success</h3>
            </div>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.avgSuccessRate}%</p>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Types</option>
            <option value="government">Government</option>
            <option value="local_media">Media</option>
            <option value="venue">Venues</option>
            <option value="restaurant">Restaurants</option>
            <option value="brewery">Breweries</option>
            <option value="cultural">Cultural</option>
            <option value="community">Community</option>
            <option value="custom">Custom</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="lastScraped">Sort by Last Scraped</option>
            <option value="successRate">Sort by Success Rate</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-600">
          {filteredSources.length} sources
        </div>
      </div>

      {/* Sources Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Scraped
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Events (7d)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSources.map((source) => (
                <tr key={source.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {source.name}
                          </h3>
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {getSourceTypeDisplay(source.sourceType)}
                          </span>
                          {source.venueName && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">{source.venueName}</span>
                            </>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-1" title={source.url}>
                          {source.url}
                        </p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(source.status)}
                      <span className={`text-sm font-medium capitalize ${
                        source.status === 'active' ? 'text-green-700' :
                        source.status === 'failed' ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        {source.status}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {formatTimeAgo(source.lastScraped)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            source.successRate >= 90 ? 'bg-green-500' :
                            source.successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${source.successRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 min-w-0">
                        {source.successRate}%
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {source.eventsFoundLast7Days}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRunScrape(source.id)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Run scrape now"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(source.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title={source.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Source Modal */}
      <AddSourceModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => {
          console.log('New source submitted:', data);
          // Here you would typically send to API
        }}
      />
    </div>
  );
}