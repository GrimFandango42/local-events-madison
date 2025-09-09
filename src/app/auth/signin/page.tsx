'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Calendar, Heart, ArrowRight, CheckCircle, Lock, Eye } from 'lucide-react';

export default function SignInPage() {
  const [providers, setProviders] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await getProviders();
      setProviders(res);
    })();
  }, []);

  const handleSignIn = async (providerId: string) => {
    setIsLoading(true);
    await signIn(providerId, { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-600 rounded-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to Madison Events
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Save your favorite events and add them to your Google Calendar
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-200 sm:rounded-lg sm:px-10">
          
          {/* Privacy Promise */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-green-800">Privacy Promise</h3>
                <p className="text-xs text-green-700 mt-1">
                  We only store your name, email, and event preferences. 
                  No tracking, no selling data, no surveillance.
                </p>
              </div>
            </div>
          </div>

          {/* Sign In Button */}
          {providers && (
            <div className="space-y-4">
              {Object.values(providers).map((provider: any) => (
                <button
                  key={provider.name}
                  onClick={() => handleSignIn(provider.id)}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  Sign in with Google
                </button>
              ))}
            </div>
          )}

          {/* What you get */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">What you get:</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Add events directly to your Google Calendar
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Heart className="w-4 h-4 text-red-500" />
                Save your favorite events and venues
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="w-4 h-4 text-indigo-500" />
                Complete data privacy and control
              </div>
            </div>
          </div>

          {/* Data transparency */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Eye className="w-4 h-4 text-gray-500 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">What we collect:</p>
                <p>• Your name and email (from Google)</p>
                <p>• Events you save as favorites</p>
                <p>• Calendar access (only to add events you choose)</p>
                <p className="mt-2 font-medium">What we DON'T collect:</p>
                <p>• Your browsing history or location</p>
                <p>• Your existing calendar events</p>
                <p>• Any personal data for ads or tracking</p>
              </div>
            </div>
          </div>

          {/* Continue without signing in */}
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-1"
            >
              Continue browsing without signing in
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our privacy-first approach to event discovery.
          <br />
          <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500">
            Read our Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}