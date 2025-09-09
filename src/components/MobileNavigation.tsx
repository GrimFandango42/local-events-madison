'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Calendar, Search, User, Home } from 'lucide-react';

interface MobileNavigationProps {
  currentPath?: string;
}

export default function MobileNavigation({ currentPath }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      current: currentPath === '/'
    },
    {
      name: 'All Events',
      href: '/events',
      icon: Calendar,
      current: currentPath === '/events'
    },
    {
      name: 'Find Events',
      href: '/events',
      icon: Search,
      current: false
    },
    {
      name: 'Add Venue',
      href: '/admin/sources',
      icon: User,
      current: currentPath === '/admin/sources'
    }
  ];

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden">
        <button
          onClick={toggleMenu}
          className="mobile-touch-target p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
          aria-expanded="false"
        >
          <span className="sr-only">Open main menu</span>
          {isOpen ? (
            <X className="block h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="block h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Desktop navigation */}
      <div className="hidden md:flex items-center gap-4">
        <Link 
          href="/events" 
          className="px-6 py-3 min-h-[48px] mobile-touch-target text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors rounded-lg"
        >
          All Events
        </Link>
        <Link 
          href="/events" 
          className="btn-primary min-h-[48px] mobile-touch-target"
        >
          Find Events
        </Link>
      </div>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Background overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm"
            onClick={toggleMenu}
          />
          
          {/* Menu panel */}
          <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-gray-900">Madison Events</span>
              </div>
              <button
                onClick={toggleMenu}
                className="mobile-touch-target p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <nav className="mt-6 px-4">
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={toggleMenu}
                      className={`
                        flex items-center gap-3 px-3 py-4 rounded-lg text-base font-medium transition-colors mobile-touch-target
                        ${item.current 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                          : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-center text-sm text-gray-500">
                <div>Privacy-focused</div>
                <div>No tracking • No ads</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MobileBottomNav({ currentPath }: MobileNavigationProps) {
  const quickActions = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
      current: currentPath === '/'
    },
    {
      name: 'Events',
      href: '/events',
      icon: Calendar,
      current: currentPath === '/events'
    },
    {
      name: 'Search',
      href: '/events',
      icon: Search,
      current: false
    },
    {
      name: 'Add Venue',
      href: '/admin/sources',
      icon: User,
      current: currentPath === '/admin/sources'
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden">
      <nav className="flex justify-around py-2">
        {quickActions.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors mobile-touch-target
              ${item.current 
                ? 'text-indigo-600' 
                : 'text-gray-500 hover:text-indigo-600'
              }
            `}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}