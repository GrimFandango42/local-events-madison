'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'category' | 'venue';
  count?: number;
}

export default function SearchAutocomplete({
  value,
  onChange,
  onSearch,
  placeholder = "Search events by name, description, venue...",
  className = ""
}: SearchAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const debouncedValue = useDebounce(value, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to parse recent searches');
      }
    }
  }, []);

  // Generate suggestions based on input
  const generateSuggestions = useMemo(() => {
    if (!debouncedValue.trim()) {
      // Show recent searches and trending categories when no input
      const suggestions: Suggestion[] = [];
      
      // Recent searches
      recentSearches.slice(0, 3).forEach((search, index) => {
        suggestions.push({
          id: `recent-${index}`,
          text: search,
          type: 'recent'
        });
      });

      // Trending categories
      const trendingCategories = [
        { name: 'Music & Concerts', count: 12 },
        { name: 'Food & Dining', count: 8 },
        { name: 'Art & Culture', count: 5 }
      ];

      trendingCategories.forEach((cat, index) => {
        suggestions.push({
          id: `trending-${index}`,
          text: cat.name,
          type: 'trending',
          count: cat.count
        });
      });

      return suggestions;
    }

    // Filter suggestions based on input
    const query = debouncedValue.toLowerCase();
    const suggestions: Suggestion[] = [];

    // Category suggestions
    const categories = [
      'Music & Concerts',
      'Food & Dining',
      'Art & Culture', 
      'Community Events',
      'Theater & Shows',
      'Festivals',
      'Markets',
      'Nightlife',
      'Family Events',
      'Education'
    ];

    categories
      .filter(cat => cat.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach((cat, index) => {
        suggestions.push({
          id: `category-${index}`,
          text: cat,
          type: 'category'
        });
      });

    // Venue suggestions
    const venues = [
      'The Majestic Theatre',
      'Memorial Union Terrace',
      'Overture Center',
      'Madison Museum of Contemporary Art',
      'State Capitol Building',
      'University of Wisconsin-Madison'
    ];

    venues
      .filter(venue => venue.toLowerCase().includes(query))
      .slice(0, 3)
      .forEach((venue, index) => {
        suggestions.push({
          id: `venue-${index}`,
          text: venue,
          type: 'venue'
        });
      });

    return suggestions.slice(0, 6);
  }, [debouncedValue, recentSearches]);

  useEffect(() => {
    setSuggestions(generateSuggestions);
  }, [generateSuggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            selectSuggestion(suggestions[selectedIndex]);
          } else {
            handleSearch(value);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, suggestions, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToRecentSearches = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 2) return;

    const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    onChange(suggestion.text);
    setIsOpen(false);
    setSelectedIndex(-1);
    saveToRecentSearches(suggestion.text);
    onSearch(suggestion.text);
  };

  const handleSearch = (searchTerm: string) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    saveToRecentSearches(searchTerm);
    onSearch(searchTerm);
  };

  const clearRecentSearch = (searchToRemove: string) => {
    const updated = recentSearches.filter(s => s !== searchToRemove);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4 text-indigo-500" />;
      case 'category':
        return <Search className="w-4 h-4 text-purple-500" />;
      case 'venue':
        return <Search className="w-4 h-4 text-green-500" />;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(value);
            }
          }}
          className={`w-full pl-10 pr-4 py-3 min-h-[48px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${className}`}
          data-testid="search-input"
          autoComplete="off"
        />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto"
        >
          {!value.trim() && recentSearches.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Recent Searches
              </div>
            </div>
          )}
          
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => selectSuggestion(suggestion)}
              className={`
                w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors min-h-[48px] mobile-touch-target flex items-center justify-between group
                ${index === selectedIndex ? 'bg-blue-50 text-blue-700' : ''}
                ${index === suggestions.length - 1 ? '' : 'border-b border-gray-50'}
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                {getSuggestionIcon(suggestion.type)}
                <span className="text-sm truncate">{suggestion.text}</span>
                {suggestion.count && (
                  <span className="text-xs text-gray-400">
                    {suggestion.count} events
                  </span>
                )}
              </div>
              
              {suggestion.type === 'recent' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearRecentSearch(suggestion.text);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all mobile-touch-target"
                  title="Remove from recent searches"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}