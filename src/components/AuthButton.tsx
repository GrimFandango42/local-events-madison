'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { User, LogIn, LogOut, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function AuthButton({ className = '' }: { className?: string }) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    await signIn('google', { callbackUrl: '/' });
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: '/' });
    setIsLoading(false);
  };

  // Loading state during auth check
  if (status === 'loading') {
    return (
      <div className={`flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  // User is signed in
  if (session?.user) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* User Info */}
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">
            {session.user.name || session.user.email}
          </span>
        </div>
        
        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors rounded-lg disabled:opacity-50"
          title="Sign out"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          <span className="text-sm font-medium hidden sm:block">Sign Out</span>
        </button>
      </div>
    );
  }

  // User is not signed in
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors rounded-lg disabled:opacity-50 shadow-sm"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin" />
        ) : (
          <LogIn className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">Sign In</span>
      </button>
      
      {/* Privacy note for unauthenticated users */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
        <Calendar className="w-4 h-4" />
        <span className="text-xs">
          Sign in to save events & add to calendar
        </span>
      </div>
    </div>
  );
}