'use client';

import React from 'react';
import { Grid, List, LayoutGrid } from 'lucide-react';
import { useViewMode, type ViewMode } from '@/contexts/ViewModeContext';

interface ViewToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ViewToggle({ className = '', size = 'md' }: ViewToggleProps) {
  const { viewMode, setViewMode } = useViewMode();

  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className={`inline-flex rounded-lg bg-gray-100 ${sizeClasses[size]} ${className}`} data-testid="view-toggle">
      <button
        onClick={() => handleViewChange('grid')}
        className={`${sizeClasses[size]} rounded-md transition-all duration-200 ${
          viewMode === 'grid'
            ? 'bg-white text-primary-600 shadow-sm font-medium'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
        title="Grid View - Card layout"
        aria-label="Switch to grid view"
        data-testid="grid-view-button"
      >
        <LayoutGrid className={iconSizes[size]} />
      </button>
      
      <button
        onClick={() => handleViewChange('list')}
        className={`${sizeClasses[size]} rounded-md transition-all duration-200 ${
          viewMode === 'list'
            ? 'bg-white text-primary-600 shadow-sm font-medium'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
        title="List View - Compact horizontal layout"
        aria-label="Switch to list view"
        data-testid="list-view-button"
      >
        <List className={iconSizes[size]} />
      </button>
    </div>
  );
}