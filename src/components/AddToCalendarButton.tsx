'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface AddToCalendarButtonProps {
  eventId: string;
  eventTitle: string;
  className?: string;
}

export default function AddToCalendarButton({ eventId, eventTitle, className = '' }: AddToCalendarButtonProps) {
  const { data: session, status } = useSession();
  const [isAdding, setIsAdding] = useState(false);
  const [addStatus, setAddStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddToCalendar = async () => {
    if (!session) return;

    setIsAdding(true);
    setAddStatus('idle');

    try {
      const response = await fetch('/api/calendar/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId }),
      });

      const result = await response.json();

      if (response.ok) {
        setAddStatus('success');
        setTimeout(() => setAddStatus('idle'), 3000); // Reset after 3 seconds
      } else {
        setAddStatus('error');
        setErrorMessage(result.error || 'Failed to add to calendar');
        
        // If needs reauth, could trigger sign-in flow
        if (result.needsReauth) {
          setTimeout(() => {
            window.location.href = '/api/auth/signin';
          }, 2000);
        }
      }
    } catch (error) {
      setAddStatus('error');
      setErrorMessage('Network error. Please try again.');
      console.error('Calendar add error:', error);
    } finally {
      setIsAdding(false);
    }
  };

  // Loading state during auth check
  if (status === 'loading') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-500 rounded-lg ${className}`}>
        <Calendar className="w-4 h-4" />
        Loading...
      </div>
    );
  }

  // Not authenticated - show sign in prompt
  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors rounded-lg border border-indigo-200 ${className}`}
      >
        <Calendar className="w-4 h-4" />
        Sign in to add to calendar
      </Link>
    );
  }

  // Success state
  if (addStatus === 'success') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-50 text-green-700 rounded-lg border border-green-200 ${className}`}>
        <CheckCircle className="w-4 h-4" />
        Added to calendar!
      </div>
    );
  }

  // Error state
  if (addStatus === 'error') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg border border-red-200 ${className}`}>
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs">{errorMessage}</span>
      </div>
    );
  }

  // Default state - ready to add
  return (
    <button
      onClick={handleAddToCalendar}
      disabled={isAdding}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm bg-white text-gray-700 hover:bg-gray-50 transition-colors rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={`Add "${eventTitle}" to your Google Calendar`}
    >
      {isAdding ? (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      ) : (
        <Calendar className="w-4 h-4" />
      )}
      {isAdding ? 'Adding...' : 'Add to Calendar'}
    </button>
  );
}