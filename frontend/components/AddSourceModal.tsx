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
}

const sourceTypes = [
  { value: 'venue', label: '🎵 Music Venue', description: 'Concert halls, clubs, theaters' },
  { value: 'restaurant', label: '🍽️ Restaurant', description: 'Restaurants with events/live music' },
  { value: 'brewery', label: '🍺 Brewery/Bar', description: 'Breweries, bars with events' },
  { value: 'cultural', label: '🎨 Cultural Site', description: 'Museums, galleries, cultural centers' },
  { value: 'community', label: '🏢 Community Org', description: 'Community centers, nonprofits' },
  { value: 'local_media', label: '📰 Local Media', description: 'News sites, event calendars' },
  { value: 'custom', label: '🔗 Other', description: 'Other event source' }
];

const eventTypeOptions = [
  'food', 'music', 'culture', 'art', 'theater', 'festival', 
  'market', 'nightlife', 'education', 'community', 'family'
];

export function AddSourceModal({ isOpen, onClose, onSubmit }: AddSourceModalProps) {
  const [formData, setFormData] = useState<NewSourceSubmission>({
    suggestedName: '',
    url: '',
    sourceType: 'venue',
    venueName: '',
    expectedEventTypes: [],
    submissionReason: '',
    userEmail: ''
  });

  const [urlValidation, setUrlValidation] = useState<{
    isValid: boolean;
    message: string;
    isChecking: boolean;
  }>({ isValid: true, message: '', isChecking: false });

  const [step, setStep] = useState<'basic' | 'details' | 'review'>('basic');

  if (!isOpen) return null;

  const validateUrl = async (url: string) => {
    if (!url.startsWith('http')) {
      setUrlValidation({ isValid: false, message: 'URL must start with http:// or https://', isChecking: false });
      return;
    }

    setUrlValidation({ isValid: true, message: 'Checking URL...', isChecking: true });
    
    // Simulate URL validation - in real app, this would ping the URL
    setTimeout(() => {
      setUrlValidation({ 
        isValid: true, 
        message: '✅ URL is accessible', 
        isChecking: false 
      });
    }, 1500);
  };

  const handleEventTypeToggle = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      expectedEventTypes: prev.expectedEventTypes.includes(eventType)
        ? prev.expectedEventTypes.filter(t => t !== eventType)
        : [...prev.expectedEventTypes, eventType]
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
      userEmail: ''
    });
    setStep('basic');
    onClose();
  };

  const canProceedToDetails = formData.suggestedName && formData.url && urlValidation.isValid;
  const canProceedToReview = formData.expectedEventTypes.length > 0 && formData.submissionReason;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add Event Source</h2>
              <p className="text-sm text-gray-600">Help us discover more Madison events</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center p-4 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step === 'basic' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'basic' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Basic Info</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'details' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'details' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${step === 'review' ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'review' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-96">
          
          {/* Step 1: Basic Information */}
          {step === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Source Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., The Sylvee Events Page"
                  value={formData.suggestedName}
                  onChange={(e) => setFormData(prev => ({ ...prev, suggestedName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/events"
                  value={formData.url}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, url: e.target.value }));
                    if (e.target.value.length > 10) {
                      validateUrl(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {urlValidation.message && (
                  <p className={`mt-1 text-sm flex items-center gap-1 ${
                    urlValidation.isValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {urlValidation.isChecking ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : urlValidation.isValid ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {urlValidation.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Source Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {sourceTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sourceType: type.value }))}
                      className={`p-3 text-left border rounded-lg hover:bg-gray-50 ${
                        formData.sourceType === type.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="font-medium text-sm">{type.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {(formData.sourceType === 'venue' || formData.sourceType === 'restaurant' || formData.sourceType === 'brewery') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Venue/Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="Official business name"
                    value={formData.venueName}
                    onChange={(e) => setFormData(prev => ({ ...prev, venueName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Event Details */}
          {step === 'details' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  What types of events does this source typically have?
                </label>
                <div className="flex flex-wrap gap-2">
                  {eventTypeOptions.map((eventType) => (
                    <button
                      key={eventType}
                      type="button"
                      onClick={() => handleEventTypeToggle(eventType)}
                      className={`px-3 py-1 text-sm rounded-full border ${
                        formData.expectedEventTypes.includes(eventType)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {eventType}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Select all that apply. This helps us configure scraping for the right content.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why should we add this source?
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., This venue hosts great local music shows that aren't listed elsewhere..."
                  value={formData.submissionReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, submissionReason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.userEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, userEmail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-600 mt-1">
                  We'll notify you when your source is approved
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 'review' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Review Your Submission</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Source Name:</span>
                    <span className="font-medium">{formData.suggestedName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">URL:</span>
                    <span className="font-medium text-blue-600 truncate ml-4" title={formData.url}>
                      {formData.url}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">
                      {sourceTypes.find(t => t.value === formData.sourceType)?.label}
                    </span>
                  </div>
                  {formData.venueName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Venue:</span>
                      <span className="font-medium">{formData.venueName}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Event Types:</span>
                    <div className="flex flex-wrap gap-1 ml-4">
                      {formData.expectedEventTypes.map(type => (
                        <span key={type} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• We'll review your submission within 24 hours</li>
                  <li>• Our system will test if we can extract event data from the URL</li>
                  <li>• If approved, events from this source will appear in the app</li>
                  <li>• You'll get notified when new events are found (if email provided)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="flex items-center gap-2">
            {step !== 'basic' && (
              <button
                onClick={() => setStep(prev => 
                  prev === 'review' ? 'details' : 'basic'
                )}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            
            {step === 'basic' && (
              <button
                onClick={() => setStep('details')}
                disabled={!canProceedToDetails}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next
              </button>
            )}
            
            {step === 'details' && (
              <button
                onClick={() => setStep('review')}
                disabled={!canProceedToReview}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Review
              </button>
            )}
            
            {step === 'review' && (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Submit Source
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}