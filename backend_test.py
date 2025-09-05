#!/usr/bin/env python3
"""
Backend Testing Suite for Dora Travel Itinerary Application
Tests the complete temporary storage workflow including session management
"""

import requests
import json
import time
from datetime import datetime, date
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://travel-wizard-3.preview.emergentagent.com/api"

# Test data as specified in the review request
TEST_FORM_DATA = {
    "user_name": "Test User",
    "origin_city": "New York, NY", 
    "destinations": ["Paris, France", "Rome, Italy"],
    "start_date": "2024-12-01",
    "end_date": "2024-12-08",
    "travel_theme": "Luxury",
    "party_size": 2,
    "budget_per_person": 3000,
    "currency": "USD"
}

class DoraBackendTester:
    def __init__(self):
        self.session_id = None
        self.test_results = []
        self.headers = {"Content-Type": "application/json"}
    
    def log_test(self, test_name: str, success: bool, details: str, response_data: Optional[Dict] = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_health_check(self):
        """Test basic health check endpoint"""
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, f"Service healthy: {data.get('service', 'Unknown')}")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected health status: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_generate_itinerary(self):
        """Test itinerary generation and temporary storage creation"""
        try:
            response = requests.post(
                f"{BACKEND_URL}/generate-itinerary",
                json=TEST_FORM_DATA,
                headers=self.headers,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify session_id is present
                if "session_id" not in data:
                    self.log_test("Generate Itinerary", False, "No session_id in response", data)
                    return False
                
                self.session_id = data["session_id"]
                
                # Verify required fields
                required_fields = ["user", "trip", "flights", "accommodations", "itinerary_days", "destination_info"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Generate Itinerary", False, f"Missing fields: {missing_fields}", data)
                    return False
                
                # Verify user data matches input
                user_data = data.get("user", {})
                if user_data.get("name") != TEST_FORM_DATA["user_name"]:
                    self.log_test("Generate Itinerary", False, "User name mismatch in response")
                    return False
                
                # Verify trip data
                trip_data = data.get("trip", {})
                if trip_data.get("origin") != TEST_FORM_DATA["origin_city"]:
                    self.log_test("Generate Itinerary", False, "Origin city mismatch in response")
                    return False
                
                # Verify destinations
                if trip_data.get("destinations") != TEST_FORM_DATA["destinations"]:
                    self.log_test("Generate Itinerary", False, "Destinations mismatch in response")
                    return False
                
                # Verify AI-generated content exists
                dest_info = data.get("destination_info", {})
                if not dest_info.get("introduction") or not dest_info.get("packing_tips"):
                    self.log_test("Generate Itinerary", False, "Missing AI-generated destination info")
                    return False
                
                self.log_test("Generate Itinerary", True, f"Successfully generated with session_id: {self.session_id}")
                return True
                
            else:
                self.log_test("Generate Itinerary", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Generate Itinerary", False, f"Request error: {str(e)}")
            return False
    
    def test_retrieve_by_session_id(self):
        """Test retrieval of itinerary by session_id - PRIMARY FOCUS"""
        if not self.session_id:
            self.log_test("Retrieve by Session ID", False, "No session_id available from previous test")
            return False
        
        try:
            response = requests.get(
                f"{BACKEND_URL}/itinerary/{self.session_id}",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify session_id matches
                if data.get("session_id") != self.session_id:
                    self.log_test("Retrieve by Session ID", False, "Session ID mismatch in retrieved data")
                    return False
                
                # Verify all required fields are present
                required_fields = ["session_id", "user", "trip", "flights", "accommodations", "itinerary_days", "destination_info"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Retrieve by Session ID", False, f"Missing fields in retrieved data: {missing_fields}")
                    return False
                
                # Verify data integrity - user name should match
                user_data = data.get("user", {})
                if user_data.get("name") != TEST_FORM_DATA["user_name"]:
                    self.log_test("Retrieve by Session ID", False, "User data integrity check failed")
                    return False
                
                # Verify destinations are preserved
                trip_data = data.get("trip", {})
                if trip_data.get("destinations") != TEST_FORM_DATA["destinations"]:
                    self.log_test("Retrieve by Session ID", False, "Destinations data integrity check failed")
                    return False
                
                self.log_test("Retrieve by Session ID", True, f"Successfully retrieved complete itinerary for session: {self.session_id}")
                return True
                
            elif response.status_code == 404:
                self.log_test("Retrieve by Session ID", False, "Itinerary not found - possible storage issue")
                return False
            else:
                self.log_test("Retrieve by Session ID", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Retrieve by Session ID", False, f"Request error: {str(e)}")
            return False
    
    def test_prepare_auth(self):
        """Test prepare-auth endpoint for extending expiry"""
        if not self.session_id:
            self.log_test("Prepare Auth", False, "No session_id available from previous test")
            return False
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/prepare-auth/{self.session_id}",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and "message" in data:
                    self.log_test("Prepare Auth", True, f"Successfully prepared auth: {data['message']}")
                    return True
                else:
                    self.log_test("Prepare Auth", False, "Unexpected response format", data)
                    return False
                    
            elif response.status_code == 404:
                self.log_test("Prepare Auth", False, "Itinerary not found for auth preparation")
                return False
            else:
                self.log_test("Prepare Auth", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Prepare Auth", False, f"Request error: {str(e)}")
            return False
    
    def test_invalid_session_id(self):
        """Test edge case: invalid session_id"""
        invalid_session_id = "invalid-session-id-12345"
        
        try:
            response = requests.get(
                f"{BACKEND_URL}/itinerary/{invalid_session_id}",
                timeout=30
            )
            
            if response.status_code == 404:
                self.log_test("Invalid Session ID", True, "Correctly returned 404 for invalid session_id")
                return True
            else:
                self.log_test("Invalid Session ID", False, f"Expected 404, got HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Invalid Session ID", False, f"Request error: {str(e)}")
            return False
    
    def test_prepare_auth_invalid_session(self):
        """Test edge case: prepare-auth with invalid session_id"""
        invalid_session_id = "invalid-session-id-67890"
        
        try:
            response = requests.post(
                f"{BACKEND_URL}/prepare-auth/{invalid_session_id}",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 404:
                self.log_test("Prepare Auth Invalid Session", True, "Correctly returned 404 for invalid session_id")
                return True
            else:
                self.log_test("Prepare Auth Invalid Session", False, f"Expected 404, got HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Prepare Auth Invalid Session", False, f"Request error: {str(e)}")
            return False
    
    def test_data_persistence_verification(self):
        """Verify data persistence by retrieving again after prepare-auth"""
        if not self.session_id:
            self.log_test("Data Persistence", False, "No session_id available")
            return False
        
        try:
            # Retrieve again to ensure data is still there after prepare-auth
            response = requests.get(
                f"{BACKEND_URL}/itinerary/{self.session_id}",
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify core data is still intact
                if (data.get("session_id") == self.session_id and 
                    data.get("user", {}).get("name") == TEST_FORM_DATA["user_name"]):
                    self.log_test("Data Persistence", True, "Data persisted correctly after prepare-auth")
                    return True
                else:
                    self.log_test("Data Persistence", False, "Data integrity lost after prepare-auth")
                    return False
            else:
                self.log_test("Data Persistence", False, f"Could not retrieve data after prepare-auth: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Data Persistence", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Dora Travel Backend Testing Suite")
        print(f"🎯 Testing against: {BACKEND_URL}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Generate Itinerary", self.test_generate_itinerary),
            ("Retrieve by Session ID", self.test_retrieve_by_session_id),
            ("Prepare Auth", self.test_prepare_auth),
            ("Data Persistence", self.test_data_persistence_verification),
            ("Invalid Session ID", self.test_invalid_session_id),
            ("Prepare Auth Invalid Session", self.test_prepare_auth_invalid_session)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running: {test_name}")
            if test_func():
                passed += 1
            time.sleep(1)  # Brief pause between tests
        
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Temporary storage workflow is working correctly.")
        else:
            print("⚠️  Some tests failed. Check the details above.")
        
        return passed, total, self.test_results

def main():
    """Main test execution"""
    tester = DoraBackendTester()
    passed, total, results = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "passed": passed,
                "total": total,
                "success_rate": f"{(passed/total)*100:.1f}%",
                "timestamp": datetime.now().isoformat()
            },
            "test_data_used": TEST_FORM_DATA,
            "backend_url": BACKEND_URL,
            "detailed_results": results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)