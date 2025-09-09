'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Clock, Database, Wifi, WifiOff, TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceMetrics {
  navigation?: PerformanceNavigationTiming;
  paint?: { [key: string]: number };
  resources?: PerformanceResourceTiming[];
  memory?: any;
  connection?: any;
}

interface APIMetrics {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  cached: boolean;
  timestamp: number;
}

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [apiMetrics, setApiMetrics] = useState<APIMetrics[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Collect performance metrics
  const collectMetrics = useCallback(() => {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint').reduce((acc, entry) => {
      acc[entry.name] = entry.startTime;
      return acc;
    }, {} as { [key: string]: number });

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    // Get memory info if available
    const memory = (performance as any).memory;
    
    // Get connection info if available
    const connection = (navigator as any).connection;

    setMetrics({
      navigation,
      paint,
      resources: resources.slice(-10), // Last 10 resources
      memory,
      connection,
    });
  }, []);

  // Monitor API calls (intercept fetch)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const start = performance.now();
      const url = args[0] as string;
      const options = args[1] || {};
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        
        // Only track API calls to our own endpoints
        if (url.includes('/api/')) {
          const cached = response.headers.get('cache-control')?.includes('max-age') || false;
          
          setApiMetrics(prev => [...prev.slice(-19), {
            endpoint: url.replace(window.location.origin, ''),
            method: options.method || 'GET',
            duration: Math.round(duration),
            status: response.status,
            cached,
            timestamp: Date.now(),
          }]);
        }
        
        return response;
      } catch (error) {
        const duration = performance.now() - start;
        
        if (url.includes('/api/')) {
          setApiMetrics(prev => [...prev.slice(-19), {
            endpoint: url.replace(window.location.origin, ''),
            method: options.method || 'GET',
            duration: Math.round(duration),
            status: 0,
            cached: false,
            timestamp: Date.now(),
          }]);
        }
        
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Collect metrics on mount and periodically
  useEffect(() => {
    collectMetrics();
    const interval = setInterval(collectMetrics, 5000);
    return () => clearInterval(interval);
  }, [collectMetrics]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const formatTime = (time: number) => `${time.toFixed(0)}ms`;
  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        title="Show Performance Monitor"
      >
        <Activity className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Performance Monitor
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>

      {/* Core Web Vitals */}
      {metrics.navigation && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Core Web Vitals
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">TTFB</div>
              <div className="font-mono">
                {formatTime(metrics.navigation.responseStart - metrics.navigation.requestStart)}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">DOM Load</div>
              <div className="font-mono">
                {formatTime(metrics.navigation.loadEventEnd - metrics.navigation.startTime)}
              </div>
            </div>
            {metrics.paint?.['first-paint'] && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600">FP</div>
                <div className="font-mono">{formatTime(metrics.paint['first-paint'])}</div>
              </div>
            )}
            {metrics.paint?.['first-contentful-paint'] && (
              <div className="bg-gray-50 p-2 rounded">
                <div className="text-gray-600">FCP</div>
                <div className="font-mono">{formatTime(metrics.paint['first-contentful-paint'])}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Memory Usage */}
      {metrics.memory && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Database className="w-3 h-3" />
            Memory Usage
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">Used</div>
              <div className="font-mono">{formatBytes(metrics.memory.usedJSHeapSize)}</div>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <div className="text-gray-600">Total</div>
              <div className="font-mono">{formatBytes(metrics.memory.totalJSHeapSize)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Info */}
      {metrics.connection && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Connection</h4>
          <div className="text-xs bg-gray-50 p-2 rounded">
            <div>Type: {metrics.connection.effectiveType || 'Unknown'}</div>
            {metrics.connection.downlink && (
              <div>Speed: {metrics.connection.downlink} Mbps</div>
            )}
          </div>
        </div>
      )}

      {/* API Calls */}
      {apiMetrics.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent API Calls</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {apiMetrics.slice(-5).map((api, index) => (
              <div key={index} className="text-xs bg-gray-50 p-2 rounded flex items-center justify-between">
                <div className="truncate flex-1">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    api.status >= 200 && api.status < 300 ? 'bg-green-400' :
                    api.status >= 400 ? 'bg-red-400' : 'bg-yellow-400'
                  }`} />
                  {api.endpoint}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {api.cached && <span className="text-blue-600">📦</span>}
                  <span className={`font-mono ${
                    api.duration < 200 ? 'text-green-600' :
                    api.duration < 500 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {api.duration}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={collectMetrics}
          className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          Refresh
        </button>
        <button
          onClick={() => setApiMetrics([])}
          className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Clear API
        </button>
        <button
          onClick={() => console.log('Performance Metrics:', { metrics, apiMetrics })}
          className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
        >
          Log Data
        </button>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
