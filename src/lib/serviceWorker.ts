// Service Worker registration and management utilities
// Privacy-focused implementation - no tracking, only performance and offline features

let swRegistration: ServiceWorkerRegistration | null = null;

export interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  active: boolean;
  installing: boolean;
  waiting: boolean;
  controller: ServiceWorker | null;
}

export interface CacheStatus {
  [cacheName: string]: number;
}

// Register service worker
export async function registerServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration = registration;

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available
            console.log('New version of Local Events is available!');
            // Could show a notification to user here
            showUpdateAvailable();
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type) {
        handleServiceWorkerMessage(event.data);
      }
    });

    // Register for background sync when online
    if ('sync' in registration) {
      // Request background sync when connection is restored
      window.addEventListener('online', () => {
        (registration as any).sync?.register('refresh-events')?.catch?.(console.error);
      });
    }

    console.log('Service Worker registered successfully');
    return true;
  } catch (error) {
    console.warn('Service Worker registration failed:', error);
    return false;
  }
}

// Unregister service worker
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!swRegistration) {
    return false;
  }

  try {
    const result = await swRegistration.unregister();
    swRegistration = null;
    console.log('Service Worker unregistered');
    return result;
  } catch (error) {
    console.warn('Service Worker unregistration failed:', error);
    return false;
  }
}

// Get service worker status
export function getServiceWorkerStatus(): ServiceWorkerStatus {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return {
      supported: false,
      registered: false,
      active: false,
      installing: false,
      waiting: false,
      controller: null,
    };
  }

  const registration = swRegistration;
  
  return {
    supported: true,
    registered: !!registration,
    active: !!registration?.active,
    installing: !!registration?.installing,
    waiting: !!registration?.waiting,
    controller: navigator.serviceWorker.controller,
  };
}

// Update service worker
export async function updateServiceWorker(): Promise<void> {
  if (!swRegistration) {
    console.warn('No service worker registration found');
    return;
  }

  try {
    await swRegistration.update();
    console.log('Service Worker update check completed');
  } catch (error) {
    console.warn('Service Worker update failed:', error);
  }
}

// Skip waiting and activate new service worker
export function skipWaitingAndReload(): void {
  if (!swRegistration?.waiting) {
    return;
  }

  swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });

  // Reload page when new service worker takes control
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Clear all caches
export async function clearCaches(): Promise<void> {
  if (!navigator.serviceWorker.controller) {
    // Fallback: clear using Cache API directly
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    return;
  }

  navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
}

// Get cache status
export async function getCacheStatus(): Promise<CacheStatus> {
  return new Promise((resolve) => {
    if (!navigator.serviceWorker.controller) {
      resolve({});
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === 'CACHE_STATUS') {
        resolve(event.data.data);
      }
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_STATUS' }, 
      [messageChannel.port2]
    );

    // Timeout after 5 seconds
    setTimeout(() => resolve({}), 5000);
  });
}

// Handle network status changes
export function handleNetworkStatus(): void {
  if (typeof window === 'undefined') return;

  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    
    // Store status in sessionStorage for components to use
    sessionStorage.setItem('isOnline', JSON.stringify(isOnline));
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('networkstatus', { 
      detail: { isOnline } 
    }));

    if (isOnline && swRegistration) {
      // Try to sync data when back online
      (swRegistration as any).sync?.register('refresh-events')?.catch?.(console.error);
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check
  updateOnlineStatus();
}

// Show update available notification
function showUpdateAvailable(): void {
  // Create a custom event that components can listen for
  window.dispatchEvent(new CustomEvent('swupdateavailable', {
    detail: {
      message: 'A new version is available. Refresh to update.',
      action: skipWaitingAndReload,
    }
  }));
}

// Handle messages from service worker
function handleServiceWorkerMessage(data: any): void {
  switch (data.type) {
    case 'CACHE_UPDATED':
      console.log('Service Worker: Cache updated');
      break;
    case 'OFFLINE_READY':
      console.log('Service Worker: App is ready for offline use');
      break;
    default:
      console.log('Service Worker message:', data);
  }
}

// Check if app is running in standalone mode (PWA)
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// Get network information (if available)
export function getNetworkInfo(): { effectiveType?: string; downlink?: number; rtt?: number } {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return {};
  }

  const connection = (navigator as any).connection;
  return {
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
  };
}
