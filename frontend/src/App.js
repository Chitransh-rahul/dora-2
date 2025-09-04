import React, { useState } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import Select from 'react-select';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Plane, 
  Hotel, 
  Clock,
  Star,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle
} from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Travel theme options
const travelThemes = [
  { value: 'Family', label: '👨‍👩‍👧‍👦 Family', description: 'Kid-friendly activities and accommodations' },
  { value: 'Business', label: '💼 Business', description: 'Professional amenities and central locations' },
  { value: 'Luxury', label: '✨ Luxury', description: 'Premium experiences and fine accommodations' },
  { value: 'Adventure', label: '🏃‍♂️ Adventure', description: 'Outdoor activities and active experiences' },
  { value: 'Budget', label: '💰 Budget', description: 'Cost-effective options without compromising quality' },
  { value: 'Honeymoon', label: '💕 Honeymoon', description: 'Romantic settings and couple experiences' }
];

// Currency options
const currencies = [
  { value: 'USD', label: '🇺🇸 USD - US Dollar' },
  { value: 'EUR', label: '🇪🇺 EUR - Euro' },
  { value: 'GBP', label: '🇬🇧 GBP - British Pound' },
  { value: 'CAD', label: '🇨🇦 CAD - Canadian Dollar' },
  { value: 'AUD', label: '🇦🇺 AUD - Australian Dollar' },
];

// Progress Stepper Component
const ProgressStepper = ({ currentStep, steps }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className={`progress-step ${index < currentStep ? 'completed' : index === currentStep ? 'active' : ''}`}>
            <div className="step-circle">
              {index < currentStep ? <CheckCircle size={16} /> : index + 1}
            </div>
            <div className="hidden sm:block ml-2 text-sm font-medium">
              {step.title}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`step-line mx-4 ${index < currentStep ? 'completed' : index === currentStep ? 'active' : ''}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Form Step 1: Trip Details
const TripDetailsStep = ({ formData, setFormData, onNext }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center mb-6">Tell us about your trip</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            Your Name
          </label>
          <input
            type="text"
            className="input"
            placeholder="Enter your name"
            value={formData.user_name}
            onChange={(e) => setFormData({...formData, user_name: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            From (Origin City)
          </label>
          <input
            type="text"
            className="input"
            placeholder="e.g., New York, NY"
            value={formData.origin_city}
            onChange={(e) => setFormData({...formData, origin_city: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          <MapPin className="inline w-4 h-4 mr-1" />
          Destination
        </label>
        <input
          type="text"
          className="input"
          placeholder="e.g., Paris, France"
          value={formData.destination}
          onChange={(e) => setFormData({...formData, destination: e.target.value})}
          required
        />
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Start Date
          </label>
          <DatePicker
            selected={formData.start_date}
            onChange={(date) => setFormData({...formData, start_date: date})}
            className="input w-full"
            placeholderText="Select start date"
            minDate={new Date()}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            End Date
          </label>
          <DatePicker
            selected={formData.end_date}
            onChange={(date) => setFormData({...formData, end_date: date})}
            className="input w-full"
            placeholderText="Select end date"
            minDate={formData.start_date || new Date()}
            required
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="btn-primary"
          disabled={!formData.user_name || !formData.origin_city || !formData.destination || !formData.start_date || !formData.end_date}
        >
          Next Step <ChevronRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Form Step 2: Preferences
const PreferencesStep = ({ formData, setFormData, onNext, onBack }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center mb-6">Customize your experience</h2>
      
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          Travel Theme
        </label>
        <div className="grid md:grid-cols-2 gap-3">
          {travelThemes.map((theme) => (
            <div
              key={theme.value}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                formData.travel_theme === theme.value
                  ? 'border-primary bg-blue-50'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setFormData({...formData, travel_theme: theme.value})}
            >
              <div className="font-medium">{theme.label}</div>
              <div className="text-sm text-muted mt-1">{theme.description}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            <Users className="inline w-4 h-4 mr-1" />
            Party Size
          </label>
          <input
            type="number"
            className="input"
            placeholder="Number of travelers"
            min="1"
            max="20"
            value={formData.party_size}
            onChange={(e) => setFormData({...formData, party_size: parseInt(e.target.value) || 1})}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-muted mb-2">
            Currency
          </label>
          <Select
            options={currencies}
            value={currencies.find(c => c.value === formData.currency)}
            onChange={(option) => setFormData({...formData, currency: option.value})}
            className="react-select"
            classNamePrefix="select"
            isSearchable={false}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-muted mb-2">
          <DollarSign className="inline w-4 h-4 mr-1" />
          Budget per Person ({formData.currency})
        </label>
        <input
          type="number"
          className="input"
          placeholder="e.g., 1500"
          min="100"
          value={formData.budget_per_person}
          onChange={(e) => setFormData({...formData, budget_per_person: parseFloat(e.target.value) || 1000})}
          required
        />
        <div className="text-sm text-muted mt-1">
          This includes flights, accommodation, and activities
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
        >
          <ChevronLeft className="mr-2 w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="btn-primary"
          disabled={!formData.travel_theme || !formData.party_size || !formData.budget_per_person}
        >
          Generate Itinerary <ChevronRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Loading Component
const LoadingScreen = () => {
  return (
    <div className="text-center py-12">
      <div className="animate-spin mx-auto mb-4">
        <Loader2 size={48} className="text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Creating your personalized itinerary</h3>
      <p className="text-muted">
        We're finding the best flights, hotels, and activities for your trip...
      </p>
      <div className="mt-6 space-y-3">
        <div className="h-4 bg-surface rounded animate-pulse"></div>
        <div className="h-4 bg-surface rounded animate-pulse w-3/4 mx-auto"></div>
        <div className="h-4 bg-surface rounded animate-pulse w-1/2 mx-auto"></div>
      </div>
    </div>
  );
};

// Activity Icon Component
const ActivityIcon = ({ type }) => {
  const getIcon = () => {
    switch (type.toLowerCase()) {
      case 'travel': return '✈️';
      case 'sightseeing': return '🏛️';
      case 'dining': return '🍽️';
      case 'culture': return '🎭';
      case 'leisure': return '🌴';
      default: return '📍';
    }
  };
  
  return (
    <div className={`activity-icon ${type.toLowerCase()}`}>
      {getIcon()}
    </div>
  );
};

// Itinerary Preview Component
const ItineraryPreview = ({ itinerary, onDownload }) => {
  const [activeDay, setActiveDay] = useState(0);
  
  if (!itinerary) return null;
  
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Your Personalized Itinerary</h2>
        <p className="text-muted text-lg">
          {itinerary.trip.destination} • {itinerary.trip.duration_days} days • {itinerary.user.theme} theme
        </p>
      </div>
      
      {/* Flight Options */}
      <div className="card mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Plane className="mr-2 text-primary" />
          Flight Options
        </h3>
        <div className="space-y-4">
          {itinerary.flights.map((flight, index) => (
            <div key={index} className="option-card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{flight.airline}</div>
                  <div className="text-muted flex items-center mt-1">
                    <Clock className="w-4 h-4 mr-1" />
                    {flight.departure_time} - {flight.arrival_time} ({flight.duration})
                  </div>
                  <div className="text-sm text-muted mt-1">
                    {flight.stops === 0 ? 'Direct flight' : `${flight.stops} stop(s)`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="price-tag mb-2">
                    {itinerary.user.currency} {flight.price.toLocaleString()}
                  </div>
                  <a
                    href={flight.deep_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm"
                  >
                    Book Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Hotel Options */}
      <div className="card mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Hotel className="mr-2 text-primary" />
          Accommodation Options
        </h3>
        <div className="space-y-4">
          {itinerary.accommodations.map((hotel, index) => (
            <div key={index} className="option-card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{hotel.name}</div>
                  <div className="flex items-center mt-1">
                    {[...Array(hotel.star_rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="ml-2 text-sm text-muted">
                      {hotel.star_rating} star hotel
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {hotel.amenities.slice(0, 4).map((amenity, i) => (
                        <span key={i} className="bg-surface text-xs px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="price-tag mb-2">
                    {itinerary.user.currency} {hotel.price_per_night.toLocaleString()}/night
                  </div>
                  <a
                    href={hotel.deep_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm"
                  >
                    Book Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Daily Itinerary */}
      <div className="card mb-8">
        <h3 className="text-xl font-semibold mb-4">Daily Itinerary</h3>
        
        {/* Day Tabs */}
        <div className="day-tabs mb-6">
          <div className="flex overflow-x-auto">
            {itinerary.itinerary_days.map((day, index) => (
              <button
                key={index}
                className={`day-tab ${activeDay === index ? 'active' : ''}`}
                onClick={() => setActiveDay(index)}
              >
                Day {day.day}
              </button>
            ))}
          </div>
        </div>
        
        {/* Active Day Content */}
        {itinerary.itinerary_days[activeDay] && (
          <div className="animate-slide-up">
            <h4 className="text-lg font-semibold mb-4">
              {itinerary.itinerary_days[activeDay].date} - {itinerary.itinerary_days[activeDay].summary}
            </h4>
            <div className="space-y-4">
              {itinerary.itinerary_days[activeDay].activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1">
                    <div className="font-medium">{activity.description}</div>
                    {activity.time && (
                      <div className="text-sm text-muted">{activity.time}</div>
                    )}
                    {activity.details && (
                      <div className="text-sm text-muted mt-1">{activity.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Destination Info */}
      <div className="card mb-8">
        <h3 className="text-xl font-semibold mb-4">About {itinerary.trip.destination}</h3>
        <p className="text-muted mb-4">{itinerary.destination_info.introduction}</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Packing Tips</h4>
            <ul className="space-y-1">
              {itinerary.destination_info.packing_tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted flex items-start">
                  <span className="mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Cultural Notes</h4>
            <ul className="space-y-1">
              {itinerary.destination_info.cultural_notes.map((note, index) => (
                <li key={index} className="text-sm text-muted flex items-start">
                  <span className="mr-2">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {/* Download CTA */}
      <div className="text-center">
        <button
          onClick={onDownload}
          className="btn-primary text-lg px-8 py-4"
        >
          <Download className="mr-2 w-5 h-5" />
          Download Complete Itinerary as PDF
        </button>
        <p className="text-sm text-muted mt-2">
          Sign up to get your personalized PDF with all booking links
        </p>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [formData, setFormData] = useState({
    user_name: '',
    origin_city: '',
    destination: '',
    start_date: null,
    end_date: null,
    travel_theme: '',
    party_size: 2,
    budget_per_person: 1500,
    currency: 'USD'
  });
  
  const steps = [
    { id: 'trip', title: 'Trip Details' },
    { id: 'preferences', title: 'Preferences' },
    { id: 'preview', title: 'Your Itinerary' }
  ];
  
  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };
  
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };
  
  const generateItinerary = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/generate-itinerary`, {
        ...formData,
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date.toISOString().split('T')[0]
      });
      
      setItinerary(response.data);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      alert('Sorry, there was an error generating your itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    // This will trigger the auth modal in the next phase
    alert('Authentication modal will be implemented in Phase 3! For now, enjoy your preview.');
  };
  
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            ✈️ Dora Travel
          </h1>
          <p className="text-xl text-muted max-w-2xl mx-auto">
            Generate personalized travel itineraries in minutes. Tell us your preferences, 
            and we'll create the perfect trip plan for you.
          </p>
        </div>
        
        <div className="form-container">
          <div className="card">
            <ProgressStepper currentStep={currentStep} steps={steps} />
            
            {isLoading ? (
              <LoadingScreen />
            ) : (
              <>
                {currentStep === 0 && (
                  <TripDetailsStep
                    formData={formData}
                    setFormData={setFormData}
                    onNext={handleNextStep}
                  />
                )}
                
                {currentStep === 1 && (
                  <PreferencesStep
                    formData={formData}
                    setFormData={setFormData}
                    onNext={generateItinerary}
                    onBack={handlePrevStep}
                  />
                )}
                
                {currentStep === 2 && itinerary && (
                  <ItineraryPreview
                    itinerary={itinerary}
                    onDownload={handleDownload}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;