// Enhanced AddSourceModal - Best of both implementations with neighborhood support
import React, { useState, useEffect } from 'react';
import { X, Plus, Globe, MapPin, Calendar, AlertCircle, Check, Loader2, Info } from 'lucide-react';

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
  neighborhood?: string;
}

interface Neighborhood {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

const sourceTypes = [
  { 
    value: 'venue', 
    label: '🎵 Music Venue', 
    description: 'Concert halls, clubs, theaters',
    examples: 'The Sylvee, Majestic Theatre'
  },
  { 
    value: 'restaurant', 
    label: '🍽️ Restaurant', 
    description: 'Restaurants with events/live music',
    examples: 'Graze, The Old Fashioned'
  },
  { 
    value: 'brewery', 
    label: '🍺 Brewery/Bar', 
    description: 'Breweries, bars with events',
    examples: 'New Glarus Brewing, Ale Asylum'
  },
  { 
    value: 'cultural', 
    label: '🎨 Cultural Site', 
    description: 'Museums, galleries, cultural centers',
    examples: 'Chazen Museum, Madison Museum'
  },
  { 
    value: 'community', 
    label: '🏢 Community Org', 
    description: 'Community centers, nonprofits',
    examples: 'Memorial Union, Community Centers'
  },
  { 
    value: 'local_media', 
    label: '📰 Local Media', 
    description: 'News sites, event calendars',
    examples: 'Isthmus, Wisconsin State Journal'
  },
  { 
    value: 'government', 
    label: '🏛️ Government', 
    description: 'City, county, state organizations',
    examples: 'City of Madison, Dane County'
  },
  { 
    value: 'university', 
    label: '🎓 University', 
    description: 'UW-Madison departments and venues',
    examples: 'UW Events, Student Organizations'
  },
  { 
    value: 'custom', 
    label: '🔗 Other', 
    description: 'Other event source',
    examples: 'Festivals, Sports venues, etc.'
  },
];

const eventTypeOptions = [
  { value: 'food', label: 'Food & Dining', description: 'Food festivals, restaurant events' },
  { value: 'music', label: 'Music', description: 'Concerts, live music, DJ sets' },
  { value: 'culture', label: 'Culture', description: 'Cultural celebrations, heritage events' },
  { value: 'art', label: 'Art', description: 'Gallery openings, art shows, workshops' },
  { value: 'theater', label: 'Theater', description: 'Plays, musicals, performance art' },
  { value: 'festival', label: 'Festivals', description: 'Large community celebrations' },
  { value: 'market', label: 'Markets', description: 'Farmers markets, craft fairs' },
  { value: 'nightlife', label: 'Nightlife', description: 'Bars, clubs, late-night events' },
  { value: 'education', label: 'Education', description: 'Workshops, lectures, classes' },
  { value: 'community', label: 'Community', description: 'Neighborhood events, meetups' },
  { value: 'family', label: 'Family', description: 'Kid-friendly events, family activities' },
  { value: 'sports', label: 'Sports', description: 'Sporting events, recreation' },
  { value: 'business', label: 'Business', description: 'Networking, professional events' },
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

  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [urlValidation, setUrlValidation] = useState({
    isValid: true,
    message: '',
    isChecking: false,
  });
  const [step, setStep] = useState<'basic' | 'details' | 'review'>('basic');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Fetch neighborhoods when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNeighborhoods();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fetchNeighborhoods = async () => {
    try {
      const response = await fetch('/api/neighborhoods');
      const data = await response.json();
      if (data.success) {
        setNeighborhoods(data.data || []);
      }
    } catch (error) {
      console.warn('Failed to fetch neighborhoods:', error);
      // Fallback to basic neighborhoods
      setNeighborhoods([
        { id: '1', name: 'Downtown', slug: 'downtown' },
        { id: '2', name: 'East Side', slug: 'east-side' },
        { id: '3', name: 'West Side', slug: 'west-side' },
      ]);
    }
  };

  const validateUrl = async (url: string) => {
    if (!url) {
      setUrlValidation({ isValid: false, message: 'URL is required', isChecking: false });
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setUrlValidation({ isValid: false, message: 'URL must start with http:// or https://', isChecking: false });
      return;
    }

    try {
      new URL(url);
      setUrlValidation({ isValid: true, message: 'Checking URL...', isChecking: true });
      
      // Simulate URL validation
      setTimeout(() => {
        setUrlValidation({ isValid: true, message: '✅ URL format is valid', isChecking: false });
      }, 1000);
    } catch {
      setUrlValidation({ isValid: false, message: 'Invalid URL format', isChecking: false });
    }
  };

  const handleEventTypeToggle = (eventType: string) => {
    setFormData((prev) => ({
      ...prev,
      expectedEventTypes: prev.expectedEventTypes.includes(eventType)
        ? prev.expectedEventTypes.filter((t) => t !== eventType)
        : [...prev.expectedEventTypes, eventType],
    }));
  };

  const handleSubmit = async () => {
    setSubmitLoading(true);
    try {
      await onSubmit(formData);
      
      // Reset form
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
      setUrlValidation({ isValid: true, message: '', isChecking: false });
      onClose();
    } catch (error) {
      console.error('Failed to submit source:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleClose = () => {
    if (!submitLoading) {
      onClose();
    }
  };

  const canProceedToDetails = () => {
    return formData.suggestedName.trim() && 
           formData.url.trim() && 
           urlValidation.isValid && 
           !urlValidation.isChecking;
  };

  const canProceedToReview = () => {
    return formData.expectedEventTypes.length > 0 && 
           formData.submissionReason.trim().length >= 10;
  };

  const getSelectedSourceType = () => {
    return sourceTypes.find(type => type.value === formData.sourceType);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Add Event Source</h2>
            <p className="text-sm text-gray-600 mt-1">Help grow Madison's event discovery platform</p>
          </div>
          <button 
            onClick={handleClose} 
            disabled={submitLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress indicators */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-b">
          <div className={`flex items-center gap-3 ${step === 'basic' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              step === 'basic' ? 'bg-blue-600 text-white' : 
              (step === 'details' || step === 'review') ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
            }`}>1</div>
            <span>Basic Info</span>
          </div>
          <div className={`w-16 h-0.5 ${
            step === 'details' || step === 'review' ? 'bg-blue-600' : 'bg-gray-200'
          }`}></div>
          <div className={`flex items-center gap-3 ${step === 'details' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              step === 'details' ? 'bg-blue-600 text-white' : 
              step === 'review' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
            }`}>2</div>
            <span>Details</span>
          </div>
          <div className={`w-16 h-0.5 ${step === 'review' ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center gap-3 ${step === 'review' ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              step === 'review' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>3</div>
            <span>Review</span>
          </div>
        </div>

        {/* Step content */}
        <div className="p-6">
          {step === 'basic' && (
            <div className="space-y-6">
              
              {/* Source Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Source Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.suggestedName}
                  onChange={(e) => setFormData({ ...formData, suggestedName: e.target.value })}
                  placeholder="e.g., The Sylvee, Graze Restaurant"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">The name of the venue, organization, or website</p>
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Website URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => {
                    setFormData({ ...formData, url: e.target.value });
                    if (e.target.value.length > 10) {
                      validateUrl(e.target.value);
                    }
                  }}
                  placeholder="https://example.com/events"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    urlValidation.isValid ? 'border-gray-300' : 'border-red-300'
                  }`}
                />
                {urlValidation.message && (
                  <div className={`flex items-center gap-2 mt-2 text-xs ${
                    urlValidation.isValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {urlValidation.isChecking ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : urlValidation.isValid ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    <span>{urlValidation.message}</span>
                  </div>
                )}
              </div>

              {/* Source Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Source Type <span className="text-red-500">*</span>
                </label>
                <div className="grid gap-3">
                  {sourceTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, sourceType: type.value })}
                      className={`p-4 text-left border rounded-lg hover:bg-gray-50 transition-all ${
                        formData.sourceType === type.value 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{type.label}</div>
                          <div className="text-sm text-gray-600 mt-1">{type.description}</div>
                          <div className="text-xs text-gray-500 mt-1">Examples: {type.examples}</div>
                        </div>
                        {formData.sourceType === type.value && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Venue Name (conditional) */}
              {(formData.sourceType === 'venue' || formData.sourceType === 'restaurant' || formData.sourceType === 'brewery') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Business/Venue Name
                  </label>
                  <input
                    type="text"
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    placeholder="Official business name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Official name if different from source name</p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-end pt-4">
                <button
                  disabled={!canProceedToDetails()}
                  onClick={() => setStep('details')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    canProceedToDetails()
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Continue to Details
                </button>
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6">
              
              {/* Expected Event Types */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Expected Event Types <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-4">Select all types of events this source might host or promote</p>
                <div className="grid grid-cols-2 gap-3">
                  {eventTypeOptions.map((eventType) => (
                    <button
                      key={eventType.value}
                      type="button"
                      onClick={() => handleEventTypeToggle(eventType.value)}
                      className={`p-3 text-left border rounded-lg text-sm transition-all hover:bg-gray-50 ${
                        formData.expectedEventTypes.includes(eventType.value)
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      <div className="font-medium">{eventType.label}</div>
                      <div className={`text-xs mt-1 ${
                        formData.expectedEventTypes.includes(eventType.value) ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {eventType.description}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {formData.expectedEventTypes.length} type{formData.expectedEventTypes.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Neighborhood */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Neighborhood <span className="text-gray-500">(optional)</span>
                </label>
                <select
                  value={formData.neighborhood || ''}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value || undefined })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="">Select neighborhood</option>
                  {neighborhoods.map((neighborhood) => (
                    <option key={neighborhood.id} value={neighborhood.name}>
                      {neighborhood.name}
                      {neighborhood.description && ` - ${neighborhood.description}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Help users find events in their preferred area</p>
              </div>

              {/* Submission Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Why should we add this source? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.submissionReason}
                  onChange={(e) => setFormData({ ...formData, submissionReason: e.target.value })}
                  rows={4}
                  placeholder="Describe what makes this source valuable for Madison's event community. What types of events do they host? How popular are they? Any other relevant details..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">Minimum 10 characters</p>
                  <p className={`text-xs ${formData.submissionReason.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                    {formData.submissionReason.length}/500
                  </p>
                </div>
              </div>

              {/* Optional Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Email <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.userEmail}
                  onChange={(e) => setFormData({ ...formData, userEmail: e.target.value })}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="flex items-start gap-2 mt-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-500">
                    We'll only use your email to contact you about this submission or ask follow-up questions. Your email will not be shared or used for marketing.
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep('basic')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  disabled={!canProceedToReview()}
                  onClick={() => setStep('review')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    canProceedToReview()
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Review Submission
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              
              {/* Review Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Submission Summary</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Source Name</div>
                    <div className="text-gray-900">{formData.suggestedName}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700">Website</div>
                    <a 
                      href={formData.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline break-all"
                    >
                      {formData.url}
                    </a>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700">Source Type</div>
                    <div className="text-gray-900">{getSelectedSourceType()?.label}</div>
                  </div>

                  {formData.venueName && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Business Name</div>
                      <div className="text-gray-900">{formData.venueName}</div>
                    </div>
                  )}

                  {formData.neighborhood && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Neighborhood</div>
                      <div className="text-gray-900">{formData.neighborhood}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm font-medium text-gray-700">Expected Event Types</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.expectedEventTypes.map((type) => {
                        const eventType = eventTypeOptions.find(et => et.value === type);
                        return (
                          <span key={type} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {eventType?.label || type}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-gray-700">Reason for Addition</div>
                    <div className="text-gray-900 mt-1 whitespace-pre-wrap">{formData.submissionReason}</div>
                  </div>

                  {formData.userEmail && (
                    <div>
                      <div className="text-sm font-medium text-gray-700">Contact Email</div>
                      <div className="text-gray-900">{formData.userEmail}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submission Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">What happens next?</p>
                    <ul className="space-y-1 text-sm">
                      <li>• Your submission will be reviewed by our team</li>
                      <li>• We'll verify the source and test event data extraction</li>
                      <li>• If approved, the source will be added to our scraping system</li>
                      <li>• You'll be notified of the decision within 3-5 business days</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep('details')}
                  disabled={submitLoading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Submit Source
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}