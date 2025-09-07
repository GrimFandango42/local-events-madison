// Admin page for managing event sources
'use client';

import { SourcesManagement } from '@/frontend/components/SourcesManagement';

export default function AdminSourcesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <SourcesManagement />
      </div>
    </div>
  );
}