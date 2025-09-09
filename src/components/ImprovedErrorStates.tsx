import React from 'react';
import Link from 'next/link';
import { 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Search, 
  Calendar, 
  Server,
  ArrowRight,
  Home
} from 'lucide-react';

interface ErrorStateProps {
  type: 'network' | 'server' | 'notFound' | 'search' | 'generic';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  showHomeButton?: boolean;
}

export default function ImprovedErrorState({ 
  type, 
  title, 
  message, 
  actionLabel = 'Try Again', 
  onAction,
  showHomeButton = false 
}: ErrorStateProps) {
  const getErrorContent = () => {
    switch (type) {
      case 'network':
        return {
          icon: WifiOff,
          title: title || 'Connection Problem',
          message: message || 'Unable to connect to our servers. Please check your internet connection and try again.',
          suggestions: [
            'Check your internet connection',
            'Try refreshing the page',
            'If the problem persists, try again in a few minutes'
          ]
        };
      
      case 'server':
        return {
          icon: Server,
          title: title || 'Server Error',
          message: message || 'We\'re experiencing technical difficulties. Our team has been notified.',
          suggestions: [
            'Try refreshing the page',
            'Wait a few minutes and try again',
            'Check our status page for updates'
          ]
        };
      
      case 'notFound':
        return {
          icon: Search,
          title: title || 'No Events Found',
          message: message || 'We couldn\'t find any events matching your criteria.',
          suggestions: [
            'Try different search terms',
            'Clear some filters',
            'Check back later for new events'
          ]
        };
      
      case 'search':
        return {
          icon: Search,
          title: title || 'No Results',
          message: message || 'Your search didn\'t return any results.',
          suggestions: [
            'Check your spelling',
            'Try broader search terms',
            'Remove some filters'
          ]
        };
      
      default:
        return {
          icon: AlertCircle,
          title: title || 'Something went wrong',
          message: message || 'An unexpected error occurred. Please try again.',
          suggestions: [
            'Refresh the page',
            'Try again in a few minutes',
            'Contact support if the problem continues'
          ]
        };
    }
  };

  const { icon: Icon, title: errorTitle, message: errorMessage, suggestions } = getErrorContent();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4 py-8 text-center">
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
        <Icon className="w-8 h-8 text-red-500" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-3">
        {errorTitle}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md leading-relaxed">
        {errorMessage}
      </p>
      
      {suggestions && (
        <div className="mb-8 text-sm text-gray-500">
          <p className="font-medium mb-3">Try these suggestions:</p>
          <ul className="space-y-2 text-left">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-3">
        {onAction && (
          <button
            onClick={onAction}
            className="btn-primary min-h-[48px] mobile-touch-target flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
        
        {showHomeButton && (
          <Link
            href="/"
            className="btn-secondary min-h-[48px] mobile-touch-target flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        )}
      </div>
    </div>
  );
}

export function NetworkErrorBanner({ 
  show, 
  onRetry, 
  onDismiss 
}: { 
  show: boolean; 
  onRetry?: () => void; 
  onDismiss?: () => void; 
}) {
  if (!show) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Connection lost</p>
            <p className="text-xs text-red-600">Trying to reconnect...</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-medium text-red-600 hover:text-red-700 px-2 py-1 rounded transition-colors mobile-touch-target"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600 p-1 rounded transition-colors mobile-touch-target"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoadingError({ 
  onRetry, 
  title = "Failed to load", 
  compact = false 
}: { 
  onRetry: () => void; 
  title?: string; 
  compact?: boolean; 
}) {
  if (compact) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <div className="text-sm text-red-700 mb-3">{title}</div>
        <button
          onClick={onRetry}
          className="btn-small bg-red-600 text-white hover:bg-red-700 min-h-[40px] mobile-touch-target"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
      <p className="text-red-600 text-sm mb-4">
        Something went wrong while loading this content.
      </p>
      <button
        onClick={onRetry}
        className="btn-primary min-h-[48px] mobile-touch-target"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </button>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Calendar,
  title,
  description,
  actionLabel,
  onAction,
  actionHref
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}) {
  return (
    <div className="text-center py-12">
      <Icon className="w-16 h-16 text-gray-300 mx-auto mb-6" />
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {title}
      </h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      
      {(actionLabel && (onAction || actionHref)) && (
        actionHref ? (
          <Link
            href={actionHref}
            className="btn-primary min-h-[48px] mobile-touch-target inline-flex items-center gap-2"
          >
            {actionLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="btn-primary min-h-[48px] mobile-touch-target"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}