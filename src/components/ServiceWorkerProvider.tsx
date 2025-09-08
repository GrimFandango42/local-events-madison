'use client';

import React, { useEffect, useState } from 'react';
import { 
  registerServiceWorker, 
  handleNetworkStatus,
  getServiceWorkerStatus,
  type ServiceWorkerStatus 
} from '@/lib/serviceWorker';

interface ServiceWorkerContextType {
  status: ServiceWorkerStatus;
  isOnline: boolean;
  updateAvailable: boolean;
}

const ServiceWorkerContext = React.createContext<ServiceWorkerContextType | null>(null);

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    supported: false,
    registered: false,
    active: false,
    installing: false,
    waiting: false,
    controller: null,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Initialize service worker
    registerServiceWorker().then(() => {
      setStatus(getServiceWorkerStatus());
    });

    // Handle network status
    handleNetworkStatus();

    // Listen for network status changes
    const handleNetworkChange = (event: CustomEvent<{ isOnline: boolean }>) => {
      setIsOnline(event.detail.isOnline);
    };

    // Listen for service worker updates
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('networkstatus', handleNetworkChange as EventListener);
    window.addEventListener('swupdateavailable', handleUpdateAvailable);

    // Initial online status
    setIsOnline(navigator.onLine);

    // Cleanup
    return () => {
      window.removeEventListener('networkstatus', handleNetworkChange as EventListener);
      window.removeEventListener('swupdateavailable', handleUpdateAvailable);
    };
  }, []);

  return (
    <ServiceWorkerContext.Provider value={{ status, isOnline, updateAvailable }}>
      {children}
      <NetworkStatusIndicator isOnline={isOnline} />
      <UpdateNotification 
        updateAvailable={updateAvailable} 
        onDismiss={() => setUpdateAvailable(false)} 
      />
    </ServiceWorkerContext.Provider>
  );
}

// Network status indicator
function NetworkStatusIndicator({ isOnline }: { isOnline: boolean }) {
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
    } else {
      // Hide after a delay when back online
      const timer = setTimeout(() => setShowOfflineMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOfflineMessage) return null;

  return (
    <div
      className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-yellow-900'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {isOnline ? (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Back online
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            You're offline
          </>
        )}
      </div>
    </div>
  );
}

// Update notification
function UpdateNotification({ 
  updateAvailable, 
  onDismiss 
}: { 
  updateAvailable: boolean;
  onDismiss: () => void; 
}) {
  if (!updateAvailable) return null;

  const handleUpdate = () => {
    // This will be handled by the service worker utility
    window.dispatchEvent(new CustomEvent('swupdaterequest'));
    onDismiss();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <h4 className="font-semibold">Update Available</h4>
          <p className="text-sm text-blue-100 mt-1">
            A new version of Local Events is ready.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleUpdate}
              className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              Update Now
            </button>
            <button
              onClick={onDismiss}
              className="text-blue-100 px-3 py-1 rounded text-sm hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-blue-200 hover:text-white transition-colors"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Hook to use service worker context
export function useServiceWorker() {
  const context = React.useContext(ServiceWorkerContext);
  if (!context) {
    throw new Error('useServiceWorker must be used within ServiceWorkerProvider');
  }
  return context;
}

export default ServiceWorkerProvider;