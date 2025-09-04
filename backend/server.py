from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import os
from dotenv import load_dotenv
import motor.motor_asyncio
from bson import ObjectId

# Load environment variables
load_dotenv()

app = FastAPI(title="Dora Travel API", version="1.0.0")

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

# Pydantic models
class TravelForm(BaseModel):
    user_name: str
    origin_city: str
    destination: str
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

# Mock data generators
def generate_mock_flights(origin: str, destination: str, theme: str, budget: float) -> List[FlightOption]:
    """Generate mock flight data based on user preferences"""
    base_price = min(budget * 0.4, 800)  # Flight shouldn't exceed 40% of budget or $800
    
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

def generate_mock_hotels(destination: str, theme: str, budget: float, party_size: int) -> List[HotelOption]:
    """Generate mock hotel data based on user preferences"""
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
            name=f"Grand {destination} Resort",
            price_per_night=price_per_night,
            deep_link="https://booking.com/mock-link-1",
            star_rating=4,
            amenities=base_amenities + specific_amenities[:3],
            image_url="https://images.unsplash.com/photo-1566073771259-6a8506099945"
        ),
        HotelOption(
            name=f"{destination} City Center Hotel",
            price_per_night=price_per_night - 30,
            deep_link="https://booking.com/mock-link-2", 
            star_rating=3,
            amenities=base_amenities + specific_amenities[:2],
            image_url="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa"
        ),
        HotelOption(
            name=f"Luxury {destination} Suites",
            price_per_night=price_per_night + 80,
            deep_link="https://booking.com/mock-link-3",
            star_rating=5,
            amenities=base_amenities + specific_amenities,
            image_url="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"
        )
    ]
    
    return hotels[:3]

def generate_mock_itinerary_days(start_date: date, end_date: date, destination: str, theme: str) -> List[ItineraryDay]:
    """Generate mock daily itinerary based on destination and theme"""
    days = []
    current_date = start_date
    day_num = 1
    
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
    
    while current_date <= end_date:
        if day_num == 1:
            # Arrival day
            day_activities = [
                Activity(
                    type="Travel",
                    description="Arrival and check-in",
                    time="Morning",
                    details="Flight arrival and hotel check-in"
                ),
                Activity(
                    type="Leisure",
                    description="Explore nearby area",
                    time="Afternoon",
                    details="Get oriented with the local neighborhood"
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
        else:
            # Full day
            day_activities = [
                Activity(
                    type="Sightseeing",
                    description=activities[(day_num - 2) % len(activities)],
                    time="Morning",
                    details=f"Explore the best of {destination}"
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
                    details="Immerse in local culture and traditions"
                )
            ]
        
        days.append(ItineraryDay(
            day=day_num,
            date=current_date.strftime("%Y-%m-%d"),
            summary=f"Day {day_num} in {destination}",
            activities=day_activities
        ))
        
        current_date = current_date.replace(day=current_date.day + 1) if current_date.day < 28 else current_date.replace(month=current_date.month + 1, day=1)
        day_num += 1
    
    return days

def generate_mock_destination_info(destination: str, theme: str) -> DestinationInfo:
    """Generate mock destination information"""
    return DestinationInfo(
        introduction=f"Welcome to {destination}! This vibrant destination offers the perfect blend of culture, history, and modern attractions. Whether you're seeking adventure, relaxation, or cultural enrichment, {destination} has something special for every traveler.",
        packing_tips=[
            "Comfortable walking shoes for exploring",
            "Light layers for changing weather",
            "Portable charger for your devices",
            "Travel adapter for international outlets",
            "Sunscreen and sunglasses"
        ],
        cultural_notes=[
            "Learn a few basic local phrases",
            "Respect local customs and dress codes",
            "Try the local cuisine with an open mind",
            "Be mindful of tipping customs",
            "Keep important documents secure"
        ]
    )

def generate_mock_utility_links(destination: str) -> UtilityLinks:
    """Generate mock utility links"""
    return UtilityLinks(
        visa_info="https://dora-travel.com/visa-info",
        currency_exchange="https://wise.com/currency-converter",
        sim_cards="https://airalo.com/travel-sim",
        transportation="https://uber.com/cities"
    )

@app.get("/")
async def root():
    return {"message": "Dora Travel API is running!"}

@app.post("/api/generate-itinerary", response_model=TravelItinerary)
async def generate_itinerary(form_data: TravelForm):
    """Generate a travel itinerary based on user preferences"""
    try:
        # Generate mock data based on user preferences
        flights = generate_mock_flights(
            form_data.origin_city, 
            form_data.destination, 
            form_data.travel_theme, 
            form_data.budget_per_person
        )
        
        hotels = generate_mock_hotels(
            form_data.destination,
            form_data.travel_theme,
            form_data.budget_per_person,
            form_data.party_size
        )
        
        itinerary_days = generate_mock_itinerary_days(
            form_data.start_date,
            form_data.end_date,
            form_data.destination,
            form_data.travel_theme
        )
        
        destination_info = generate_mock_destination_info(
            form_data.destination,
            form_data.travel_theme
        )
        
        utility_links = generate_mock_utility_links(form_data.destination)
        
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
                "destination": form_data.destination,
                "start_date": form_data.start_date.strftime("%Y-%m-%d"),
                "end_date": form_data.end_date.strftime("%Y-%m-%d"),
                "duration_days": (form_data.end_date - form_data.start_date).days + 1
            },
            flights=flights,
            accommodations=hotels,
            itinerary_days=itinerary_days,
            destination_info=destination_info,
            utility_links=utility_links
        )
        
        return itinerary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating itinerary: {str(e)}")

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Dora Travel API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)