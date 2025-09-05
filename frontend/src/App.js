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
  Loader2,
  Globe,
  ArrowRight,
  Check
} from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Travel theme options with modern styling
const travelThemes = [
  { 
    value: 'Family', 
    label: 'Family', 
    icon: '👨‍👩‍👧‍👦',
    description: 'Kid-friendly activities and accommodations',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  { 
    value: 'Business', 
    label: 'Business', 
    icon: '💼',
    description: 'Professional amenities and central locations',
    gradient: 'from-gray-500/20 to-slate-500/20'
  },
  { 
    value: 'Luxury', 
    label: 'Luxury', 
    icon: '✨',
    description: 'Premium experiences and fine accommodations',
    gradient: 'from-yellow-500/20 to-amber-500/20'
  },
  { 
    value: 'Adventure', 
    label: 'Adventure', 
    icon: '🏃‍♂️',
    description: 'Outdoor activities and active experiences',
    gradient: 'from-green-500/20 to-emerald-500/20'
  },
  { 
    value: 'Budget', 
    label: 'Budget', 
    icon: '💰',
    description: 'Cost-effective options without compromising quality',
    gradient: 'from-orange-500/20 to-red-500/20'
  },
  { 
    value: 'Honeymoon', 
    label: 'Honeymoon', 
    icon: '💕',
    description: 'Romantic settings and couple experiences',
    gradient: 'from-pink-500/20 to-rose-500/20'
  }
];

// Currency options
const currencies = [
  { value: 'USD', label: '🇺🇸 USD' },
  { value: 'EUR', label: '🇪🇺 EUR' },
  { value: 'GBP', label: '🇬🇧 GBP' },
  { value: 'CAD', label: '🇨🇦 CAD' },
  { value: 'AUD', label: '🇦🇺 AUD' },
];

// Custom Select styles for dark theme
const selectStyles = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: '#1a1a1a',
    borderColor: state.isFocused ? '#ffffff' : '#262626',
    borderRadius: '12px',
    minHeight: '48px',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#ffffff'
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#1a1a1a',
    border: '1px solid #262626',
    borderRadius: '12px',
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#ffffff' : state.isFocused ? '#333333' : 'transparent',
    color: state.isSelected ? '#000000' : '#ffffff',
    '&:hover': {
      backgroundColor: '#333333',
      color: '#ffffff'
    }
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#ffffff'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#525252'
  }),
  input: (provided) => ({
    ...provided,
    color: '#ffffff'
  })
};

// Header Component
const Header = () => (
  <header className="fixed top-6 left-1/2 floating-header z-50">
    <div className="glass-card rounded-full px-8 py-4 shadow-glow border border-border/30 transition-all duration-300">
      <div className="flex items-center justify-center gap-8">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-foreground" />
          <span className="text-xl font-bold text-foreground">Dora</span>
        </div>
        <div className="w-px h-6 bg-border/50"></div>
        <button className="btn-ghost px-6 py-2 text-sm font-medium rounded-full">
          Sign In
        </button>
      </div>
    </div>
  </header>
);

// Hero Section
const HeroSection = ({ onStartPlanning }) => (
  <section className="section pt-32 pb-16 text-center">
    <div className="container">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="hero-text hero-gradient animate-fade-in">
          Plan Your Perfect
          <br />
          Travel Itinerary
        </h1>
        <p className="text-xl text-foreground-muted max-w-2xl mx-auto animate-slide-up">
          Create personalized travel itineraries with flights, hotels, and activities. 
          Get AI-powered recommendations and download beautiful PDF guides.
        </p>
        <button 
          onClick={onStartPlanning}
          className="btn-primary text-lg px-8 py-4 animate-scale-in"
        >
          Start Planning
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </div>
  </section>
);

// Single Page Form Component
const TravelForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    user_name: '',
    origin_city: '',
    destinations: [''], // Changed to array for multiple destinations
    start_date: null,
    end_date: null,
    travel_theme: '',
    party_size: 2,
    budget_per_person: 2000,
    currency: 'USD'
  });

  const [isFormValid, setIsFormValid] = useState(false);

  React.useEffect(() => {
    const hasValidDestinations = formData.destinations.length > 0 && 
                                formData.destinations.some(dest => dest.trim() !== '');
    const isValid = formData.user_name && 
                   formData.origin_city && 
                   hasValidDestinations && 
                   formData.start_date && 
                   formData.end_date && 
                   formData.travel_theme;
    setIsFormValid(isValid);
  }, [formData]);

  const addDestination = () => {
    setFormData({
      ...formData,
      destinations: [...formData.destinations, '']
    });
  };

  const removeDestination = (index) => {
    if (formData.destinations.length > 1) {
      const newDestinations = formData.destinations.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        destinations: newDestinations
      });
    }
  };

  const updateDestination = (index, value) => {
    const newDestinations = [...formData.destinations];
    newDestinations[index] = value;
    setFormData({
      ...formData,
      destinations: newDestinations
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      // Filter out empty destinations
      const cleanedFormData = {
        ...formData,
        destinations: formData.destinations.filter(dest => dest.trim() !== '')
      };
      onSubmit(cleanedFormData);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Tell us about your dream trip
            </h2>
            <p className="text-lg text-foreground-muted">
              Fill out the details below and we'll create your perfect itinerary
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Details */}
            <div className="card animate-slide-up">
              <h3 className="text-2xl font-semibold text-foreground mb-6">Personal Details</h3>
              <div className="grid-form">
                <div className="form-group">
                  <label className="form-label">
                    <Users className="inline w-4 h-4 mr-2" />
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
                
                <div className="form-group">
                  <label className="form-label">
                    <Users className="inline w-4 h-4 mr-2" />
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
              </div>
            </div>

            {/* Trip Details */}
            <div className="card animate-slide-up">
              <h3 className="text-2xl font-semibold text-foreground mb-6">Trip Details</h3>
              <div className="space-y-6">
                <div className="grid-form">
                  <div className="form-group">
                    <label className="form-label">
                      <MapPin className="inline w-4 h-4 mr-2" />
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
                  
                <div className="form-group col-span-full">
                  <label className="form-label">
                    <MapPin className="inline w-4 h-4 mr-2" />
                    Destinations
                  </label>
                  <div className="space-y-3">
                    {formData.destinations.map((destination, index) => (
                      <div key={index} className="flex gap-3">
                        <input
                          type="text"
                          className="input flex-1"
                          placeholder={`Destination ${index + 1} (e.g., Paris, France)`}
                          value={destination}
                          onChange={(e) => updateDestination(index, e.target.value)}
                          required={index === 0}
                        />
                        {formData.destinations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDestination(index)}
                            className="btn-secondary px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addDestination}
                      className="btn-secondary text-sm px-4 py-2 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border-purple-500/20"
                    >
                      + Add Another Destination
                    </button>
                  </div>
                </div>
                </div>
                
                <div className="grid-form">
                  <div className="form-group">
                    <label className="form-label">
                      <Calendar className="inline w-4 h-4 mr-2" />
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
                  
                  <div className="form-group">
                    <label className="form-label">
                      <Calendar className="inline w-4 h-4 mr-2" />
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
              </div>
            </div>

            {/* Travel Preferences */}
            <div className="card animate-slide-up">
              <h3 className="text-2xl font-semibold text-foreground mb-6">Travel Preferences</h3>
              
              <div className="form-group mb-6">
                <label className="form-label mb-4">Travel Theme</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {travelThemes.map((theme) => (
                    <div
                      key={theme.value}
                      className={`theme-card ${formData.travel_theme === theme.value ? 'selected' : ''}`}
                      onClick={() => setFormData({...formData, travel_theme: theme.value})}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-50`}></div>
                      <div className="relative">
                        <div className="text-3xl mb-2">{theme.icon}</div>
                        <div className="font-semibold text-lg text-foreground">{theme.label}</div>
                        <div className="text-sm text-foreground-muted mt-1">{theme.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid-form">
                <div className="form-group">
                  <label className="form-label">
                    <DollarSign className="inline w-4 h-4 mr-2" />
                    Budget per Person
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      className="input pr-16"
                      placeholder="2000"
                      min="100"
                      value={formData.budget_per_person}
                      onChange={(e) => setFormData({...formData, budget_per_person: parseFloat(e.target.value) || 1000})}
                      required
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-muted">
                      {formData.currency}
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <Select
                    options={currencies}
                    value={currencies.find(c => c.value === formData.currency)}
                    onChange={(option) => setFormData({...formData, currency: option.value})}
                    styles={selectStyles}
                    isSearchable={false}
                    className="react-select"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="btn-primary text-lg px-12 py-4 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Creating Your Itinerary...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 w-5 h-5" />
                    Generate My Itinerary
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

// Loading Component
const LoadingScreen = () => (
  <section className="section py-32">
    <div className="container">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <div className="animate-spin mx-auto">
          <Loader2 size={64} className="text-primary" />
        </div>
        <h3 className="text-3xl font-bold text-foreground">Creating your personalized itinerary</h3>
        <p className="text-lg text-foreground-muted">
          Our AI is finding the best flights, hotels, and activities for your trip...
        </p>
        <div className="space-y-4 max-w-md mx-auto">
          <div className="skeleton h-4 rounded"></div>
          <div className="skeleton h-4 rounded w-3/4 mx-auto"></div>
          <div className="skeleton h-4 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    </div>
  </section>
);

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
    <section className="section">
      <div className="container">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-bold text-foreground">Your Personalized Itinerary</h2>
            <p className="text-xl text-foreground-muted">
              {itinerary.trip.destination} • {itinerary.trip.duration_days} days • {itinerary.user.theme} theme
            </p>
          </div>

          {/* Flight Options */}
          <div className="card">
            <h3 className="text-2xl font-semibold mb-6 flex items-center text-foreground">
              <Plane className="mr-3 text-blue-400" />
              Flight Options
            </h3>
            <div className="space-y-6">
              {itinerary.flights.map((flight, index) => (
                <div key={index} className="option-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <div className="font-semibold text-xl text-foreground">{flight.airline}</div>
                      <div className="text-foreground-muted flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {flight.departure_time} - {flight.arrival_time} ({flight.duration})
                      </div>
                      <div className="text-sm text-foreground-subtle">
                        {flight.stops === 0 ? 'Direct flight' : `${flight.stops} stop(s)`}
                      </div>
                    </div>
                    <div className="text-right space-y-3">
                      <div className="price-tag">
                        {itinerary.user.currency} {flight.price.toLocaleString()}
                      </div>
                      <a
                        href={flight.deep_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-sm block"
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
          <div className="card">
            <h3 className="text-2xl font-semibold mb-6 flex items-center text-foreground">
              <Hotel className="mr-3 text-green-400" />
              Accommodation Options
            </h3>
            <div className="space-y-6">
              {itinerary.accommodations.map((hotel, index) => (
                <div key={index} className="option-card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-3">
                      <div className="font-semibold text-xl text-foreground">{hotel.name}</div>
                      <div className="flex items-center space-x-2">
                        {[...Array(hotel.star_rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                        ))}
                        <span className="text-sm text-foreground-muted ml-2">
                          {hotel.star_rating} star hotel
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hotel.amenities.slice(0, 4).map((amenity, i) => (
                          <span key={i} className="bg-surface-2 text-xs px-3 py-1 rounded-full text-foreground-muted">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right space-y-3">
                      <div className="price-tag">
                        {itinerary.user.currency} {hotel.price_per_night.toLocaleString()}/night
                      </div>
                      <a
                        href={hotel.deep_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary text-sm block"
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
          <div className="card">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">Daily Itinerary</h3>
            
            {/* Day Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 p-2 bg-surface-2 rounded-lg">
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
            
            {/* Active Day Content */}
            {itinerary.itinerary_days[activeDay] && (
              <div className="space-y-6">
                <h4 className="text-xl font-semibold text-foreground">
                  {itinerary.itinerary_days[activeDay].date} - {itinerary.itinerary_days[activeDay].summary}
                </h4>
                <div className="space-y-4">
                  {itinerary.itinerary_days[activeDay].activities.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <ActivityIcon type={activity.type} />
                      <div className="flex-1">
                        <div className="font-semibold text-foreground">{activity.description}</div>
                        {activity.time && (
                          <div className="text-sm text-foreground-muted">{activity.time}</div>
                        )}
                        {activity.details && (
                          <div className="text-sm text-foreground-subtle mt-1">{activity.details}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Destination Info */}
          <div className="card">
            <h3 className="text-2xl font-semibold mb-6 text-foreground">About {itinerary.trip.destination}</h3>
            <p className="text-foreground-muted mb-8 text-lg leading-relaxed">{itinerary.destination_info.introduction}</p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold mb-4 text-foreground text-lg">Packing Tips</h4>
                <ul className="space-y-3">
                  {itinerary.destination_info.packing_tips.map((tip, index) => (
                    <li key={index} className="text-foreground-muted flex items-start">
                      <span className="text-green-400 mr-3 mt-1">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-foreground text-lg">Cultural Notes</h4>
                <ul className="space-y-3">
                  {itinerary.destination_info.cultural_notes.map((note, index) => (
                    <li key={index} className="text-foreground-muted flex items-start">
                      <span className="text-blue-400 mr-3 mt-1">•</span>
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
              className="btn-primary text-xl px-12 py-4"
            >
              <Download className="mr-3 w-6 h-6" />
              Download Complete Itinerary as PDF
            </button>
            <p className="text-sm text-foreground-muted mt-4">
              Sign up to get your personalized PDF with all booking links
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('hero'); // 'hero', 'form', 'loading', 'itinerary'
  const [isLoading, setIsLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  
  const handleStartPlanning = () => {
    setCurrentView('form');
  };
  
  const handleFormSubmit = async (formData) => {
    setIsLoading(true);
    setCurrentView('loading');
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/generate-itinerary`, {
        ...formData,
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date.toISOString().split('T')[0]
      });
      
      setItinerary(response.data);
      setCurrentView('itinerary');
    } catch (error) {
      console.error('Error generating itinerary:', error);
      alert('Sorry, there was an error generating your itinerary. Please try again.');
      setCurrentView('form');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    alert('Authentication modal will be implemented in Phase 3! For now, enjoy your preview.');
  };
  
  return (
    <div className="min-h-screen relative">
      {/* Glowing Purple Neon Background */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-gradient-radial from-purple-600/30 via-purple-900/20 to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-[#6c3baa]/20 to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6c3baa]/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#6c3baa]/25 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#6c3baa]/15 to-transparent rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        <Header />
        
        {currentView === 'hero' && (
          <HeroSection onStartPlanning={handleStartPlanning} />
        )}
        
        {currentView === 'form' && (
          <div className="pt-20">
            <TravelForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
        )}
        
        {currentView === 'loading' && <LoadingScreen />}
        
        {currentView === 'itinerary' && itinerary && (
          <div className="pt-20">
            <ItineraryPreview itinerary={itinerary} onDownload={handleDownload} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;