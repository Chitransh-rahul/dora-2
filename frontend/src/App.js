import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { saveTripPreferencesDemo, checkHealth } from './api';

// Foundation Components (from Checkpoint 1)
const GlobalLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
};

const Container = ({ children, className = "" }) => {
  return (
    <div className={`container-component ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
};

const Card = ({ 
  children, 
  className = "", 
  hover = false 
}) => {
  const baseClasses = "bg-white rounded-xl shadow-md p-6 sm:p-8";
  const hoverClasses = hover ? "hover:shadow-lg transition-shadow duration-200" : "";
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

// New Components for Checkpoint 2

// 4. Progress Stepper Component
const ProgressStepper = ({ currentStep = 1, steps = [] }) => {
  const defaultSteps = [
    { number: 1, label: "Trip" },
    { number: 2, label: "Preferences" },
    { number: 3, label: "Review" }
  ];
  
  const stepsToUse = steps.length > 0 ? steps : defaultSteps;
  
  const getStepState = (stepNumber) => {
    if (stepNumber < currentStep) return "complete";
    if (stepNumber === currentStep) return "active";
    return "upcoming";
  };
  
  const getStepClasses = (state) => {
    switch (state) {
      case "complete":
        return "w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center";
      case "active":
        return "w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center";
      case "upcoming":
        return "w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center";
      default:
        return "w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center";
    }
  };
  
  const getLabelClasses = (state) => {
    switch (state) {
      case "complete":
        return "absolute top-full left-1/2 -translate-x-1/2 mt-2 text-sm font-medium text-blue-600";
      case "active":
        return "absolute top-full left-1/2 -translate-x-1/2 mt-2 text-sm font-medium text-blue-600";
      case "upcoming":
        return "absolute top-full left-1/2 -translate-x-1/2 mt-2 text-sm font-medium text-slate-500";
      default:
        return "absolute top-full left-1/2 -translate-x-1/2 mt-2 text-sm font-medium text-slate-500";
    }
  };
  
  return (
    <div className="flex justify-between mb-8 relative">
      {/* Connector Line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2" aria-hidden="true"></div>
      
      {stepsToUse.map((step) => {
        const state = getStepState(step.number);
        return (
          <div key={step.number} className="relative z-10">
            <div className={getStepClasses(state)}>
              {state === "complete" ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <span className={`font-medium text-sm ${state === "active" ? "text-white" : "text-slate-500"}`}>
                  {step.number}
                </span>
              )}
            </div>
            <span className={getLabelClasses(state)}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// 5. Form Input Field Component
const FormInput = ({ 
  label, 
  id, 
  name, 
  type = "text", 
  placeholder, 
  required = false, 
  error = null, 
  value = "", 
  onChange = () => {},
  className = ""
}) => {
  const inputClasses = `block w-full rounded-md shadow-sm py-2 px-3 border transition-colors duration-200 ${
    error 
      ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
  } ${className}`;
  
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        required={required}
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p className="text-sm text-red-600" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

// 6. Autocomplete Input Component
const AutocompleteInput = ({ 
  label, 
  id, 
  name, 
  placeholder, 
  required = false, 
  error = null, 
  value = "", 
  onChange = () => {},
  suggestions = []
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(e);
    
    if (inputValue) {
      const filtered = suggestions.filter(item =>
        item.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };
  
  const handleSuggestionClick = (suggestion) => {
    onChange({ target: { name, value: suggestion } });
    setShowSuggestions(false);
  };
  
  const inputClasses = `block w-full rounded-md shadow-sm py-2 px-3 border transition-colors duration-200 ${
    error 
      ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
      : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
  }`;
  
  return (
    <div className="space-y-2 relative">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        id={id}
        name={name}
        required={required}
        className={inputClasses}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      
      {/* Autocomplete Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white shadow-lg rounded-md max-h-60 overflow-auto border border-slate-200">
          {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
};

// 7. Date Range Picker Component
const DateRangePicker = ({ 
  label = "Travel Dates", 
  startDate = "", 
  endDate = "", 
  onStartDateChange = () => {}, 
  onEndDateChange = () => {},
  error = null 
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
        <span className="text-red-500 ml-1">*</span>
      </label>
      <div className="flex space-x-4">
        <div className="flex-1">
          <input
            type="date"
            id="start_date"
            name="start_date"
            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
            value={startDate}
            onChange={onStartDateChange}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <span className="self-center text-slate-500">to</span>
        <div className="flex-1">
          <input
            type="date"
            id="end_date"
            name="end_date"
            className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2 px-3 border"
            value={endDate}
            onChange={onEndDateChange}
            min={startDate || new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

// 8. Button Component
const Button = ({ 
  children, 
  variant = "primary", 
  type = "button", 
  disabled = false, 
  loading = false, 
  onClick = () => {},
  className = ""
}) => {
  const baseClasses = "font-medium py-2 px-4 rounded-md shadow-sm transition-all duration-200 inline-flex items-center justify-center";
  
  const variants = {
    primary: `bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white ${baseClasses}`,
    secondary: `bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 ${baseClasses}`
  };
  
  return (
    <button
      type={type}
      className={`${variants[variant]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

// Main Multi-Step Form Component
const App = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    userName: "",
    origin: "",
    destination: "",
    startDate: "",
    endDate: "",
    budget: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const citySuggestions = [
    "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ",
    "London, UK", "Paris, France", "Tokyo, Japan", "Rome, Italy", "Barcelona, Spain",
    "Amsterdam, Netherlands", "Berlin, Germany", "Prague, Czech Republic", "Vienna, Austria",
    "Sydney, Australia", "Melbourne, Australia", "Bangkok, Thailand", "Singapore", "Dubai, UAE"
  ];
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.userName.trim()) newErrors.userName = "Name is required";
      if (!formData.origin.trim()) newErrors.origin = "Origin city is required";
      if (!formData.destination.trim()) newErrors.destination = "Destination city is required";
    }
    
    if (step === 2) {
      if (!formData.startDate) newErrors.startDate = "Start date is required";
      if (!formData.endDate) newErrors.endDate = "End date is required";
      if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
        newErrors.dateRange = "End date must be after start date";
      }
      if (!formData.budget) newErrors.budget = "Budget is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setIsLoading(true);
      // Simulate API call delay
      setTimeout(() => {
        setIsLoading(false);
        if (currentStep < 3) {
          setCurrentStep(currentStep + 1);
        }
      }, 1000);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Save trip preferences via API
      const result = await saveTripPreferencesDemo({
        user_name: formData.userName,
        origin: formData.origin,
        destination: formData.destination,
        start_date: formData.startDate,
        end_date: formData.endDate,
        budget: formData.budget
      });
      
      console.log('Trip preferences saved:', result);
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setErrors({ submit: "Failed to save preferences. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (submitSuccess) {
    return (
      <GlobalLayout>
        <Container className="py-8">
          <Card className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Trip Preferences Saved! 🎉
            </h1>
            <p className="text-slate-600 mb-6">
              Your travel preferences have been saved successfully. We'll use this information to create your perfect itinerary.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2 mb-6">
              <p><strong>Traveler:</strong> {formData.userName}</p>
              <p><strong>From:</strong> {formData.origin}</p>
              <p><strong>To:</strong> {formData.destination}</p>
              <p><strong>Dates:</strong> {formData.startDate} to {formData.endDate}</p>
              <p><strong>Budget:</strong> ${formData.budget} per person</p>
            </div>
            <Button onClick={() => {
              setSubmitSuccess(false);
              setCurrentStep(1);
              setFormData({
                userName: "",
                origin: "",
                destination: "",
                startDate: "",
                endDate: "",
                budget: ""
              });
            }}>
              Plan Another Trip
            </Button>
          </Card>
        </Container>
      </GlobalLayout>
    );
  }
  
  return (
    <GlobalLayout>
      <Container className="py-8">
        <Card className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 text-center mb-2">
              Plan Your Perfect Trip
            </h1>
            <p className="text-slate-600 text-center">
              Tell us about your travel preferences and we'll create a personalized itinerary
            </p>
          </div>
          
          <ProgressStepper currentStep={currentStep} />
          
          <form className="space-y-6">
            {currentStep === 1 && (
              <>
                <FormInput
                  label="Your Name"
                  id="userName"
                  name="userName"
                  placeholder="Enter your name"
                  required
                  value={formData.userName}
                  onChange={handleInputChange}
                  error={errors.userName}
                />
                
                <AutocompleteInput
                  label="Origin City"
                  id="origin"
                  name="origin"
                  placeholder="Where are you traveling from?"
                  required
                  value={formData.origin}
                  onChange={handleInputChange}
                  suggestions={citySuggestions}
                  error={errors.origin}
                />
                
                <AutocompleteInput
                  label="Destination City"
                  id="destination"
                  name="destination"
                  placeholder="Where would you like to go?"
                  required
                  value={formData.destination}
                  onChange={handleInputChange}
                  suggestions={citySuggestions}
                  error={errors.destination}
                />
              </>
            )}
            
            {currentStep === 2 && (
              <>
                <DateRangePicker
                  startDate={formData.startDate}
                  endDate={formData.endDate}
                  onStartDateChange={handleInputChange}
                  onEndDateChange={handleInputChange}
                  error={errors.dateRange}
                />
                
                <FormInput
                  label="Budget per Person"
                  id="budget"
                  name="budget"
                  type="number"
                  placeholder="Enter budget in USD"
                  required
                  value={formData.budget}
                  onChange={handleInputChange}
                  error={errors.budget}
                />
              </>
            )}
            
            {currentStep === 3 && (
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Review Your Trip Details
                </h2>
                <div className="bg-slate-50 rounded-lg p-6 text-left space-y-2">
                  <p><strong>Traveler:</strong> {formData.userName}</p>
                  <p><strong>From:</strong> {formData.origin}</p>
                  <p><strong>To:</strong> {formData.destination}</p>
                  <p><strong>Dates:</strong> {formData.startDate} to {formData.endDate}</p>
                  <p><strong>Budget:</strong> ${formData.budget} per person</p>
                </div>
                {errors.submit && (
                  <p className="text-red-600 text-sm mt-4">{errors.submit}</p>
                )}
              </div>
            )}
            
            <div className="flex justify-between pt-6">
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                Back
              </Button>
              
              <Button
                variant="primary"
                onClick={currentStep === 3 ? handleSubmit : handleNext}
                loading={isLoading}
              >
                {currentStep === 3 ? "Save Preferences" : "Next Step"}
              </Button>
            </div>
          </form>

          {/* Checkpoint Status */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center text-sm text-slate-500">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              Checkpoint 2: Multi-step form system with validation and backend integration
            </div>
          </div>
        </Card>
      </Container>
    </GlobalLayout>
  );
};

export default App;