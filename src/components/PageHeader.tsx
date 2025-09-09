'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import AuthButton from './AuthButton';
import MobileNavigation from './MobileNavigation';

export default function PageHeader() {
  return (
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
            <AuthButton />
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <MobileNavigation currentPath="/" />
          </div>
        </div>
      </div>
    </nav>
  );
}