// Mobile-optimized homepage - Lightweight for mobile devices
'use client';

import { useState } from 'react';
import Link from 'next/link';

// Simple, lightweight component without heavy dependencies
export default function HomePage() {
  const [showStats, setShowStats] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard');
      const data = await response.json();
      if (data.success) {
        setShowStats(true);
      } else {
        setError('Failed to load stats');
      }
    } catch (e) {
      setError('Unable to connect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
    }}>
      
      {/* Simple Header */}
      <header style={{ 
        background: 'rgba(255,255,255,0.1)', 
        backdropFilter: 'blur(10px)',
        padding: '1rem'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>📅 Local Events</h1>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Madison, Wisconsin</p>
          </div>
          <nav style={{ display: 'flex', gap: '1rem' }}>
            <Link 
              href="/events" 
              style={{ 
                color: 'white', 
                textDecoration: 'none', 
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              Events
            </Link>
          </nav>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.9)', 
          padding: '1rem', 
          margin: '1rem',
          borderRadius: '0.5rem',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0 }}>{error}</p>
          <button 
            onClick={loadStats}
            style={{ 
              marginTop: '0.5rem',
              background: 'transparent', 
              border: '1px solid white', 
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Content */}
      <main style={{ padding: '2rem 1rem', textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Hero Section */}
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            lineHeight: 1.2
          }}>
            Discover Madison Events
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            marginBottom: '2rem', 
            opacity: 0.9,
            lineHeight: 1.5
          }}>
            Privacy-focused, Facebook-free event discovery for Madison, Wisconsin
          </p>
          
          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '1rem', 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Link 
              href="/events" 
              style={{
                background: 'rgba(255,255,255,0.9)',
                color: '#4f46e5',
                padding: '1rem 2rem',
                borderRadius: '0.75rem',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1.1rem',
                display: 'inline-block',
                minWidth: '200px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              🔍 Browse Events
            </Link>
            
            {!showStats && (
              <button
                onClick={loadStats}
                disabled={loading}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '1rem 2rem',
                  borderRadius: '0.75rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  opacity: loading ? 0.7 : 1,
                  minWidth: '200px'
                }}
              >
                {loading ? '⏳ Loading...' : '📊 View Stats'}
              </button>
            )}
          </div>
        </div>

        {/* Simple Stats Display */}
        {showStats && (
          <div style={{ 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '1rem', 
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>📈 Platform Stats Loaded!</h2>
            <p style={{ opacity: 0.9 }}>Statistics are available via the dashboard API</p>
            <Link 
              href="/admin/sources" 
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                textDecoration: 'none'
              }}
            >
              ➕ Manage Event Sources
            </Link>
          </div>
        )}

        {/* Call to Action */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '1rem', 
          padding: '2rem',
          marginTop: '2rem'
        }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>🎉 Ready to Explore?</h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            Discover amazing local events happening in Madison right now - completely privacy-focused and Facebook-free.
          </p>
          <Link 
            href="/events" 
            style={{
              background: 'rgba(255,255,255,0.9)',
              color: '#4f46e5',
              padding: '1rem 2rem',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '1.1rem',
              display: 'inline-block'
            }}
          >
            🚀 Start Exploring Events
          </Link>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '3rem', opacity: 0.8, fontSize: '0.9rem' }}>
          <p>Privacy-focused event discovery for Madison, WI</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>No Facebook tracking • Community-driven</p>
        </div>

      </main>
    </div>
  );
}