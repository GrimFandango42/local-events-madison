// AddSourceModal.tsx - UI component for adding custom event sources
import React, { useState } from 'react';
import { X, Plus, Globe, MapPin, Calendar, AlertCircle, Check } from 'lucide-react';

interface AddSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sourceData: NewSourceSubmission) => void;
}

interface NewSourceSubmission {
  suggestedName: string;
  url: string;
  sourceType: string;
  venueName?: string;
  expectedEventTypes: string[];
  submissionReason: string;
  userEmail?: string;
  // NEW: optional neighborhood for the source
  neighborhood?: string;
}

const sourceTypes = [
  { value: 'venue', label: '🎵 Music Venue', description: 'Concert halls, clubs, theaters' },
  { value: 'restaurant', label: '🍽️ Restaurant', description: 'Restaurants with events/live music' },
  { value: 'brewery', label: '🍺 Brewery/Bar', description: 'Breweries, bars with events' },
  { value: 'cultural', label: '🎨 Cultural Site', description: 'Museums, galleries, cultural centers' },
  { value: 'community', label: '🏢 Community Org', description: 'Community centers, nonprofits' },
  { value: 'local_media', label: '📰 Local Media', description: 'News sites, event calendars' },
  { value: 'custom', label: '🔗 Other', description: 'Other event source' },
];

const eventTypeOptions = [
  'food',
  'music',
  'culture',
  'art',
  'theater',
  'festival',
  'market',
  'nightlife',
  'education',
  'community',
  'family',
];

export function AddSourceModal({ isOpen, onClose, onSubmit }: AddSourceModalProps) {
  const [formData, setFormData] = useState<NewSourceSubmission>({
    suggestedName: '',
    url: '',
    sourceType: 'venue',
    venueName: '',
    expectedEventTypes: [],
    submissionReason: '',
    userEmail: '',
    neighborhood: '',
  });
  const [urlValidation, setUrlValidation] = useState({
    isValid: true,
    message: '',
    isChecking: false,
  });
  const [step, setStep] = useState<'basic' | 'details' | 'review'>('basic');

  if (!isOpen) return null;

  // Simulate URL validation – in a real app this would call a service
  const validateUrl = async (url: string) => {
    if (!url.startsWith('http')) {
      setUrlValidation({ isValid: false, message: 'URL must start with http:// or https://', isChecking: false });
      return;
    }
    setUrlValidation({ isValid: true, message: 'Checking URL...', isChecking: true });
    setTimeout(() => {
      setUrlValidation({ isValid: true, message: '✅ URL is accessible', isChecking: false });
    }, 1500);
  };

  const handleEventTypeToggle = (eventType: string) => {
    setFormData((prev) => ({
      ...prev,
      expectedEventTypes: prev.expectedEventTypes.includes(eventType)
        ? prev.expectedEventTypes.filter((t) => t !== eventType)
        : [...prev.expectedEventTypes, eventType],
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    setFormData({
      suggestedName: '',
      url: '',
      sourceType: 'venue',
      venueName: '',
      expectedEventTypes: [],
      submissionReason: '',
      userEmail: '',
      neighborhood: '',
    });
    setStep('basic');
    onClose();
  };

  const canProceedToDetails = formData.suggestedName && formData.url && urlValidation.isValid;
  const canProceedToReview = formData.expectedEventTypes.length > 0 && formData.submissionReason;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Add Event Source</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        {/* Progress indicators */}
        <div className="flex items-center justify-between mb-6">
          <div className={`flex-1 text-center ${step === 'basic' ? 'font-semibold' : ''}`}>1. Basic</div>
          <div className={`flex-1 text-center ${step === 'details' ? 'font-semibold' : ''}`}>2. Details</div>
          <div className={`flex-1 text-center ${step === 'review' ? 'font-semibold' : ''}`}>3. Review</div>
        </div>
        {/* Step content */}
        {step === 'basic' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Source Name</label>
              <input
                type="text"
                value={formData.suggestedName}
                onChange={(e) => setFormData({ ...formData, suggestedName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website URL</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => {
                  setFormData({ ...formData, url: e.target.value });
                  if (e.target.value.length > 10) validateUrl(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {urlValidation.message && <p className="text-xs mt-1 text-gray-500">{urlValidation.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Source Type</label>
              <div className="space-y-2">
                {sourceTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, sourceType: type.value })}
                    className={`w-full p-3 text-left border rounded-lg hover:bg-gray-50 ${formData.sourceType === type.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>
            {(formData.sourceType === 'venue' || formData.sourceType === 'restaurant' || formData.sourceType === 'brewery') && (
              <div>
                <label className="block text-sm font-medium mb-1">Venue/Business Name</label>
                <input
                  type="text"
                  value={formData.venueName}
                  onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            <button
              disabled={!canProceedToDetails}
              onClick={() => setStep('details')}
              className={`w-full py-2 rounded-lg ${canProceedToDetails ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
              Continue
            </button>
          </div>
        )}
        {step === 'details' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Expected Event Types</label>
              <div className="grid grid-cols-2 gap-2">
                {eventTypeOptions.map((et) => (
                  <button
                    key={et}
                    type="button"
                    onClick={() => handleEventTypeToggle(et)}
                    className={`px-2 py-1 border rounded-lg text-sm ${formData.expectedEventTypes.includes(et) ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                  >
                    {et}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Why should we add this source?</label>
              <textarea
                value={formData.submissionReason}
                onChange={(e) => setFormData({ ...formData, submissionReason: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {/* NEW: neighbourhood field */}
            <div>
              <label className="block text-sm font-medium mb-1">Neighborhood (optional)</label>
              <input
                type="text"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                placeholder="e.g. East Side, Downtown"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              disabled={!canProceedToReview}
              onClick={() => setStep('review')}
              className={`w-full py-2 rounded-lg ${canProceedToReview ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
              Continue
            </button>
          </div>
        )}
        {step === 'review' && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm mb-1"><strong>Name:</strong> {formData.suggestedName}</p>
              <p className="text-sm mb-1"><strong>URL:</strong> {formData.url}</p>
              <p className="text-sm mb-1"><strong>Type:</strong> {formData.sourceType}</p>
              {formData.venueName && <p className="text-sm mb-1"><strong>Venue:</strong> {formData.venueName}</p>}
              {formData.neighborhood && <p className="text-sm mb-1"><strong>Neighborhood:</strong> {formData.neighborhood}</p>}
              <p className="text-sm mb-1"><strong>Events:</strong> {formData.expectedEventTypes.join(', ')}</p>
              <p className="text-sm"><strong>Reason:</strong> {formData.submissionReason}</p>
            </div>
            <button
              onClick={handleSubmit}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Source
            </button>
          </div>
        )}
      </div>
    </div>
  );
}