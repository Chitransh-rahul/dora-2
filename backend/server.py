from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import os
import asyncio
import uuid
from dotenv import load_dotenv
import motor.motor_asyncio
from bson import ObjectId

# Emergent LLM Integration
from emergentintegrations.llm.chat import LlmChat, UserMessage

# Load environment variables
load_dotenv()

app = FastAPI(title="Dora Travel API", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
database = client.dora_travel

# LLM Configuration
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY")

# Pydantic models
class TravelForm(BaseModel):
    user_name: str
    origin_city: str
    destinations: List[str]  # Changed to support multiple destinations
    start_date: date
    end_date: date
    travel_theme: str
    party_size: int
    budget_per_person: float
    currency: str = "USD"

class FlightOption(BaseModel):
    airline: str
    price: float
    deep_link: str
    departure_time: str
    arrival_time: str
    duration: str
    stops: int

class HotelOption(BaseModel):
    name: str
    price_per_night: float
    deep_link: str
    star_rating: int
    amenities: List[str]
    image_url: str

class Activity(BaseModel):
    type: str
    description: str
    time: Optional[str] = None
    details: Optional[str] = None

class ItineraryDay(BaseModel):
    day: int
    date: str
    summary: str
    activities: List[Activity]

class DestinationInfo(BaseModel):
    introduction: str
    packing_tips: List[str]
    cultural_notes: List[str]

class UtilityLinks(BaseModel):
    visa_info: Optional[str] = None
    currency_exchange: Optional[str] = None
    sim_cards: Optional[str] = None
    transportation: Optional[str] = None

class TravelItinerary(BaseModel):
    user: Dict[str, Any]
    trip: Dict[str, Any]
    flights: List[FlightOption]
    accommodations: List[HotelOption]
    itinerary_days: List[ItineraryDay]
    destination_info: DestinationInfo
    utility_links: UtilityLinks

# AI Content Generation Service
class AIContentGenerator:
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
    
    async def generate_destination_info(self, destinations: List[str], theme: str, duration_days: int, party_size: int) -> DestinationInfo:
        """Generate personalized destination information using AI for multiple destinations"""
        try:
            # Create unique session ID for this request
            session_id = f"destination-{uuid.uuid4().hex[:8]}"
            
            # Initialize LLM chat
            chat = LlmChat(
                api_key=self.api_key,
                session_id=session_id,
                system_message=f"""You are a knowledgeable travel expert specializing in creating personalized destination guides for multi-city trips. 
                
                Generate travel information that is:
                - Accurate and helpful for multiple destinations
                - Tailored to the specific travel theme and group composition
                - Practical and actionable for multi-city travel
                - Culturally sensitive and respectful
                
                Focus on providing genuine value to travelers planning their multi-destination trip."""
            ).with_model("openai", "gpt-4o-mini")
            
            destinations_str = ", ".join(destinations)
            
            # Craft the prompt based on user preferences
            prompt = f"""Create personalized travel information for a multi-city trip to {destinations_str} for a {theme.lower()} trip.

Trip Details:
- Destinations: {destinations_str}
- Travel Theme: {theme}
- Duration: {duration_days} days
- Group Size: {party_size} people

Please provide:

1. INTRODUCTION (2-3 sentences): A welcoming introduction to this multi-city journey highlighting what makes these destinations special for {theme.lower()} travelers.

2. PACKING_TIPS (5 specific items): Essential packing recommendations tailored for multi-city travel to these destinations and {theme.lower()} travel style.

3. CULTURAL_NOTES (5 specific items): Important cultural etiquette, customs, and local tips for respectful travel across these destinations.

Format your response as valid JSON with this exact structure:
{{
    "introduction": "Your introduction text here",
    "packing_tips": [
        "Tip 1",
        "Tip 2", 
        "Tip 3",
        "Tip 4",
        "Tip 5"
    ],
    "cultural_notes": [
        "Note 1",
        "Note 2",
        "Note 3", 
        "Note 4",
        "Note 5"
    ]
}}

Only return the JSON, no additional text."""
            
            # Send message to AI
            user_message = UserMessage(text=prompt)
            response = await chat.send_message(user_message)
            
            # Parse AI response
            import json
            try:
                ai_data = json.loads(response)
                return DestinationInfo(
                    introduction=ai_data["introduction"],
                    packing_tips=ai_data["packing_tips"],
                    cultural_notes=ai_data["cultural_notes"]
                )
            except json.JSONDecodeError:
                # Fallback to enhanced mock data if JSON parsing fails
                return self._generate_enhanced_mock_destination_info(destinations, theme)
                
        except Exception as e:
            print(f"AI generation error: {str(e)}")
            # Fallback to enhanced mock data
            return self._generate_enhanced_mock_destination_info(destinations, theme)
    
    def _generate_enhanced_mock_destination_info(self, destinations: List[str], theme: str) -> DestinationInfo:
        """Enhanced fallback destination info with theme-specific content for multiple destinations"""
        destinations_str = ", ".join(destinations)
        
        theme_specific_content = {
            "Family": {
                "intro": f"Welcome to your multi-city family adventure across {destinations_str}! These destinations offer the perfect blend of fun activities for all ages, safe environments, and educational experiences that will create lasting memories for your entire family across multiple amazing locations.",
                "packing": [
                    "Child-friendly snacks and entertainment for multi-city travel",
                    "First aid kit with child-specific medications",
                    "Comfortable strollers or carrier for young children",
                    "Sun protection items for different climates (hats, sunscreen, UV clothing)",
                    "Portable chargers and extra batteries for devices"
                ],
                "culture": [
                    "Research family-friendly restaurants and meal times in each destination",
                    "Learn basic phrases in each local language to help children interact",
                    "Understand local customs regarding children in public spaces",
                    "Be aware of local emergency numbers and hospitals in each city",
                    "Respect quiet hours and local family traditions across destinations"
                ]
            },
            "Business": {
                "intro": f"Welcome to your multi-city business journey across {destinations_str}! These dynamic business hubs offer excellent networking opportunities, world-class conference facilities, and efficient infrastructure perfect for productive business travel across multiple markets.",
                "packing": [
                    "Professional attire suitable for different business cultures",
                    "Reliable laptop with international adapters for all destinations",
                    "Business cards and networking materials",
                    "Multiple backup chargers for extended travel",
                    "Comfortable dress shoes for long days across cities"
                ],
                "culture": [
                    "Research local business etiquette and meeting customs for each destination",
                    "Understand appropriate greeting styles and gift-giving across cultures",
                    "Learn about punctuality expectations in different business environments",
                    "Respect local business hours and holiday schedules in each location",
                    "Be aware of dining customs for business meals across destinations"
                ]
            },
            "Luxury": {
                "intro": f"Welcome to your luxury multi-city journey across {destinations_str}! These sophisticated destinations offer world-class luxury experiences, from premium accommodations to exclusive cultural encounters, perfect for discerning travelers seeking the finest experiences across multiple incredible locations.",
                "packing": [
                    "Elegant evening wear suitable for fine dining across destinations",
                    "High-quality comfortable walking shoes for luxury exploration",
                    "Premium skincare for different climate conditions",
                    "Sophisticated accessories for upscale venues in each city",
                    "Quality camera to capture memorable moments across locations"
                ],
                "culture": [
                    "Learn about local luxury customs and etiquette in each destination",
                    "Understand tipping expectations at high-end establishments across cities",
                    "Research dress codes for exclusive venues in different locations",
                    "Respect local traditions while enjoying premium experiences",
                    "Be mindful of photography policies at luxury locations"
                ]
            }
        }
        
        default_content = {
            "intro": f"Welcome to your incredible multi-city journey across {destinations_str}! These vibrant destinations offer the perfect blend of culture, history, and modern attractions. Whether you're seeking adventure, relaxation, or cultural enrichment, this multi-city adventure has something special for every traveler.",
            "packing": [
                "Comfortable walking shoes for exploring multiple cities",
                "Weather-appropriate clothing layers for different climates",
                "Universal travel adapter for your devices",
                "Portable charger and multiple power banks for extended travel",
                "Basic first aid and personal medications for multi-city travel"
            ],
            "culture": [
                "Learn a few basic local phrases for each destination",
                "Respect local customs and dress codes across locations",
                "Research local dining etiquette and tipping in each city",
                "Be mindful of cultural and religious sites in all destinations",
                "Keep important documents secure during multi-city travel"
            ]
        }
        
        content = theme_specific_content.get(theme, default_content)
        
        return DestinationInfo(
            introduction=content["intro"],
            packing_tips=content["packing"],
            cultural_notes=content["culture"]
        )

# Initialize AI service
ai_generator = AIContentGenerator()

# Mock data generators (keeping existing flight and hotel generators)
def generate_mock_flights(origin: str, destinations: List[str], theme: str, budget: float) -> List[FlightOption]:
    """Generate mock flight data based on user preferences for multiple destinations"""
    # For multi-city trips, show flights to the first destination
    primary_destination = destinations[0] if destinations else "Multiple Cities"
    base_price = min(budget * 0.4, 800)  # Flight shouldn't exceed 40% of budget or $800
    
    # Adjust price for multi-city complexity
    if len(destinations) > 1:
        base_price *= 1.2  # Increase price for multi-city trips
    
    flights = [
        FlightOption(
            airline="Delta Airlines",
            price=base_price,
            deep_link="https://skyscanner.com/mock-link-1",
            departure_time="08:00",
            arrival_time="14:30",
            duration="6h 30m",
            stops=0
        ),
        FlightOption(
            airline="United Airlines", 
            price=base_price - 50,
            deep_link="https://skyscanner.com/mock-link-2",
            departure_time="14:15",
            arrival_time="22:45",
            duration="8h 30m",
            stops=1
        ),
        FlightOption(
            airline="American Airlines",
            price=base_price + 100,
            deep_link="https://skyscanner.com/mock-link-3",
            departure_time="10:30",
            arrival_time="16:15",
            duration="5h 45m",
            stops=0
        )
    ]
    
    return flights[:3]  # Return top 3 options

def generate_mock_hotels(destinations: List[str], theme: str, budget: float, party_size: int) -> List[HotelOption]:
    """Generate mock hotel data based on user preferences for multiple destinations"""
    primary_destination = destinations[0] if destinations else "Multi-City"
    price_per_night = min(budget * 0.3 / party_size, 300)  # Hotel shouldn't exceed 30% of budget per person
    
    theme_amenities = {
        "Family": ["Pool", "Kids Club", "Playground", "Family Rooms"],
        "Business": ["Business Center", "Conference Rooms", "Fast WiFi", "Airport Shuttle"],
        "Luxury": ["Spa", "Concierge", "Fine Dining", "Butler Service"],
        "Adventure": ["Fitness Center", "Bike Rental", "Tour Desk", "Outdoor Activities"],
        "Budget": ["Free WiFi", "Continental Breakfast", "24hr Reception"],
        "Honeymoon": ["Spa", "Room Service", "Romantic Dining", "Couples Massage"]
    }
    
    base_amenities = ["Free WiFi", "Air Conditioning", "Room Service"]
    specific_amenities = theme_amenities.get(theme, ["Pool", "Restaurant"])
    
    hotels = [
        HotelOption(
            name=f"Grand {primary_destination} Resort",
            price_per_night=price_per_night,
            deep_link="https://booking.com/mock-link-1",
            star_rating=4,
            amenities=base_amenities + specific_amenities[:3],
            image_url="https://images.unsplash.com/photo-1566073771259-6a8506099945"
        ),
        HotelOption(
            name=f"{primary_destination} City Center Hotel",
            price_per_night=price_per_night - 30,
            deep_link="https://booking.com/mock-link-2", 
            star_rating=3,
            amenities=base_amenities + specific_amenities[:2],
            image_url="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa"
        ),
        HotelOption(
            name=f"Luxury {primary_destination} Suites",
            price_per_night=price_per_night + 80,
            deep_link="https://booking.com/mock-link-3",
            star_rating=5,
            amenities=base_amenities + specific_amenities,
            image_url="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
        )
    ]
    
    return hotels[:3]

def generate_mock_itinerary_days(start_date: date, end_date: date, destinations: List[str], theme: str) -> List[ItineraryDay]:
    """Generate mock daily itinerary based on multiple destinations and theme"""
    days = []
    current_date = start_date
    day_num = 1
    
    # Calculate days per destination
    total_days = (end_date - start_date).days + 1
    destinations_count = len(destinations)
    
    if destinations_count == 0:
        destinations = ["Your Destination"]
        destinations_count = 1
    
    days_per_destination = max(1, total_days // destinations_count)
    
    # Theme-specific activities
    theme_activities = {
        "Family": [
            "Visit local zoo or aquarium",
            "Family-friendly museum tour", 
            "Playground and park time",
            "Kid-friendly restaurant dinner"
        ],
        "Business": [
            "Business district tour",
            "Networking lunch at upscale restaurant",
            "Visit to trade centers",
            "Professional conference or meeting"
        ],
        "Luxury": [
            "Private city tour with guide",
            "Fine dining experience",
            "Spa and wellness treatment",
            "Exclusive shopping district visit"
        ],
        "Adventure": [
            "Hiking or outdoor exploration",
            "Adventure sports activity",
            "Local market and street food tour",
            "Sunset viewing at scenic spot"
        ],
        "Budget": [
            "Free walking tour of city center",
            "Visit free museums and galleries",
            "Local market exploration",
            "Picnic in public park"
        ],
        "Honeymoon": [
            "Romantic sunset dinner",
            "Couples spa treatment",
            "Private beach or scenic walk",
            "Wine tasting experience"
        ]
    }
    
    activities = theme_activities.get(theme, [
        "City center exploration",
        "Local cuisine tasting",
        "Cultural site visit",
        "Evening entertainment"
    ])
    
    destination_index = 0
    days_in_current_destination = 0
    
    while current_date <= end_date:
        current_destination = destinations[destination_index] if destination_index < len(destinations) else destinations[-1]
        
        if day_num == 1:
            # Arrival day
            day_activities = [
                Activity(
                    type="Travel",
                    description=f"Arrival in {current_destination}",
                    time="Morning",
                    details="Flight arrival and hotel check-in"
                ),
                Activity(
                    type="Leisure",
                    description="Explore nearby area",
                    time="Afternoon",
                    details=f"Get oriented with {current_destination}"
                )
            ]
        elif current_date == end_date:
            # Departure day
            day_activities = [
                Activity(
                    type="Leisure", 
                    description="Final exploration and shopping",
                    time="Morning",
                    details="Last-minute sightseeing and souvenir shopping"
                ),
                Activity(
                    type="Travel",
                    description="Check-out and departure",
                    time="Afternoon", 
                    details="Hotel check-out and airport transfer"
                )
            ]
        elif days_in_current_destination == days_per_destination - 1 and destination_index < len(destinations) - 1:
            # Travel to next destination
            next_destination = destinations[destination_index + 1]
            day_activities = [
                Activity(
                    type="Leisure",
                    description=f"Morning in {current_destination}",
                    time="Morning",
                    details=f"Final exploration of {current_destination}"
                ),
                Activity(
                    type="Travel",
                    description=f"Travel to {next_destination}",
                    time="Afternoon",
                    details=f"Check-out and travel from {current_destination} to {next_destination}"
                )
            ]
            destination_index += 1
            days_in_current_destination = 0
        else:
            # Full day in current destination
            day_activities = [
                Activity(
                    type="Sightseeing",
                    description=activities[(day_num - 2) % len(activities)],
                    time="Morning",
                    details=f"Explore the best of {current_destination}"
                ),
                Activity(
                    type="Dining",
                    description="Local cuisine experience",
                    time="Lunch",
                    details="Try authentic local dishes"
                ),
                Activity(
                    type="Culture",
                    description=activities[(day_num - 1) % len(activities)],
                    time="Afternoon",
                    details=f"Immerse in {current_destination} culture and traditions"
                )
            ]
        
        days.append(ItineraryDay(
            day=day_num,
            date=current_date.strftime("%Y-%m-%d"),
            summary=f"Day {day_num} in {current_destination}",
            activities=day_activities
        ))
        
        # Move to next day
        from datetime import timedelta
        current_date = current_date + timedelta(days=1)
        day_num += 1
        days_in_current_destination += 1
    
    return days

def generate_mock_utility_links(destinations: List[str]) -> UtilityLinks:
    """Generate mock utility links for multiple destinations"""
    return UtilityLinks(
        visa_info="https://dora-travel.com/visa-info",
        currency_exchange="https://wise.com/currency-converter",
        sim_cards="https://airalo.com/travel-sim",
        transportation="https://uber.com/cities"
    )

@app.get("/")
async def root():
    return {"message": "Dora Travel API v2.0 is running with AI-powered content generation!"}

@app.post("/api/generate-itinerary", response_model=TravelItinerary)
async def generate_itinerary(form_data: TravelForm):
    """Generate a travel itinerary with AI-powered destination information for multiple destinations"""
    try:
        duration_days = (form_data.end_date - form_data.start_date).days + 1
        
        # Generate data in parallel for better performance
        async def generate_all_data():
            # Start AI generation (this takes the longest)
            ai_destination_task = ai_generator.generate_destination_info(
                form_data.destinations,
                form_data.travel_theme,
                duration_days,
                form_data.party_size
            )
            
            # Generate mock data (these are fast)
            flights = generate_mock_flights(
                form_data.origin_city, 
                form_data.destinations, 
                form_data.travel_theme, 
                form_data.budget_per_person
            )
            
            hotels = generate_mock_hotels(
                form_data.destinations,
                form_data.travel_theme,
                form_data.budget_per_person,
                form_data.party_size
            )
            
            itinerary_days = generate_mock_itinerary_days(
                form_data.start_date,
                form_data.end_date,
                form_data.destinations,
                form_data.travel_theme
            )
            
            utility_links = generate_mock_utility_links(form_data.destinations)
            
            # Wait for AI generation to complete
            destination_info = await ai_destination_task
            
            return flights, hotels, itinerary_days, destination_info, utility_links
        
        # Generate all data
        flights, hotels, itinerary_days, destination_info, utility_links = await generate_all_data()
        
        # Compile the complete itinerary
        itinerary = TravelItinerary(
            user={
                "name": form_data.user_name,
                "budget": form_data.budget_per_person,
                "currency": form_data.currency,
                "theme": form_data.travel_theme,
                "party_size": form_data.party_size
            },
            trip={
                "origin": form_data.origin_city,
                "destination": ", ".join(form_data.destinations),
                "destinations": form_data.destinations,
                "start_date": form_data.start_date.strftime("%Y-%m-%d"),
                "end_date": form_data.end_date.strftime("%Y-%m-%d"),
                "duration_days": duration_days
            },
            flights=flights,
            accommodations=hotels,
            itinerary_days=itinerary_days,
            destination_info=destination_info,
            utility_links=utility_links
        )
        
        return itinerary
        
    except Exception as e:
        print(f"Error generating itinerary: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating itinerary: {str(e)}")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Dora Travel API v2.0", "ai_enabled": bool(EMERGENT_LLM_KEY)}

@app.get("/api/ai-test")
async def test_ai_integration():
    """Test endpoint to verify AI integration is working"""
    try:
        test_info = await ai_generator.generate_destination_info("Paris, France", "Luxury", 5, 2)
        return {
            "status": "success",
            "ai_working": True,
            "sample_content": {
                "introduction": test_info.introduction[:100] + "...",
                "packing_tips_count": len(test_info.packing_tips),
                "cultural_notes_count": len(test_info.cultural_notes)
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "ai_working": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)