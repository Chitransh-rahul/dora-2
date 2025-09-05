#!/usr/bin/env python3
"""
Authentication Testing Suite for Dora Travel Itinerary Application
Tests the complete authentication workflow including JWT validation and Auth0 integration
"""

import requests
import json
import time
import jwt
from datetime import datetime, date
from typing import Dict, Any, Optional

# Configuration
BACKEND_URL = "https://travel-wizard-3.preview.emergentagent.com/api"
AUTH0_DOMAIN = "dev-01mtujmmqt4lkn8h.us.auth0.com"
AUTH0_AUDIENCE = "https://api.travel-itinerary.com"

# Test data for generating a session
TEST_FORM_DATA = {
    "user_name": "Sarah Johnson",
    "origin_city": "Los Angeles, CA", 
    "destinations": ["Tokyo, Japan", "Kyoto, Japan"],
    "start_date": "2024-12-15",
    "end_date": "2024-12-22",
    "travel_theme": "Adventure",
    "party_size": 2,
    "budget_per_person": 2500,
    "currency": "USD"
}

class DoraAuthTester:
    def __init__(self):
        self.session_id = None
        self.test_results = []
        self.headers = {"Content-Type": "application/json"}
        self.jwks_data = None
    
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
    
    def test_auth0_jwks_endpoint(self):
        """Test Auth0 JWKS endpoint accessibility"""
        try:
            jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
            response = requests.get(jwks_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify JWKS structure
                if "keys" in data and isinstance(data["keys"], list) and len(data["keys"]) > 0:
                    self.jwks_data = data
                    key_count = len(data["keys"])
                    self.log_test("Auth0 JWKS Endpoint", True, f"Successfully fetched JWKS with {key_count} keys")
                    return True
                else:
                    self.log_test("Auth0 JWKS Endpoint", False, "Invalid JWKS structure", data)
                    return False
            else:
                self.log_test("Auth0 JWKS Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Auth0 JWKS Endpoint", False, f"Connection error: {str(e)}")
            return False
    
    def test_auth0_domain_connectivity(self):
        """Test Auth0 domain connectivity"""
        try:
            # Test Auth0 well-known configuration endpoint
            config_url = f"https://{AUTH0_DOMAIN}/.well-known/openid_configuration"
            response = requests.get(config_url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify essential Auth0 configuration
                required_fields = ["issuer", "authorization_endpoint", "token_endpoint", "jwks_uri"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Auth0 Domain Connectivity", False, f"Missing config fields: {missing_fields}")
                    return False
                
                # Verify issuer matches expected domain
                expected_issuer = f"https://{AUTH0_DOMAIN}/"
                if data.get("issuer") != expected_issuer:
                    self.log_test("Auth0 Domain Connectivity", False, f"Issuer mismatch: expected {expected_issuer}, got {data.get('issuer')}")
                    return False
                
                self.log_test("Auth0 Domain Connectivity", True, f"Auth0 domain {AUTH0_DOMAIN} is accessible and properly configured")
                return True
            else:
                self.log_test("Auth0 Domain Connectivity", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Auth0 Domain Connectivity", False, f"Connection error: {str(e)}")
            return False
    
    def create_mock_jwt_token(self, valid: bool = True) -> str:
        """Create a mock JWT token for testing (this won't be valid for actual Auth0 verification)"""
        if valid:
            payload = {
                "sub": "auth0|test123456789",
                "email": "sarah.johnson@example.com",
                "name": "Sarah Johnson",
                "picture": "https://example.com/avatar.jpg",
                "email_verified": True,
                "iss": f"https://{AUTH0_DOMAIN}/",
                "aud": AUTH0_AUDIENCE,
                "exp": int(time.time()) + 3600,  # 1 hour from now
                "iat": int(time.time()),
                "azp": "test-client-id"
            }
        else:
            payload = {
                "sub": "invalid-user",
                "exp": int(time.time()) - 3600,  # Expired 1 hour ago
                "iat": int(time.time()) - 7200
            }
        
        # Create unsigned token (for testing purposes only)
        return jwt.encode(payload, "fake-secret", algorithm="HS256")
    
    def test_convert_itinerary_without_auth(self):
        """Test convert-itinerary endpoint without authentication (should fail)"""
        if not self.session_id:
            self.log_test("Convert Itinerary (No Auth)", False, "No session_id available")
            return False
        
        try:
            conversion_data = {"session_id": self.session_id}
            response = requests.post(
                f"{BACKEND_URL}/convert-itinerary",
                json=conversion_data,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 401:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                if "authentication" in data.get("detail", "").lower() or "authorization" in data.get("detail", "").lower():
                    self.log_test("Convert Itinerary (No Auth)", True, "Correctly rejected request without authentication")
                    return True
                else:
                    self.log_test("Convert Itinerary (No Auth)", False, f"Unexpected 401 response: {data}")
                    return False
            else:
                self.log_test("Convert Itinerary (No Auth)", False, f"Expected 401, got HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Convert Itinerary (No Auth)", False, f"Request error: {str(e)}")
            return False
    
    def test_convert_itinerary_with_invalid_auth(self):
        """Test convert-itinerary endpoint with invalid authentication"""
        if not self.session_id:
            self.log_test("Convert Itinerary (Invalid Auth)", False, "No session_id available")
            return False
        
        try:
            # Create invalid token
            invalid_token = self.create_mock_jwt_token(valid=False)
            auth_headers = {
                **self.headers,
                "Authorization": f"Bearer {invalid_token}"
            }
            
            conversion_data = {"session_id": self.session_id}
            response = requests.post(
                f"{BACKEND_URL}/convert-itinerary",
                json=conversion_data,
                headers=auth_headers,
                timeout=30
            )
            
            if response.status_code == 401:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                self.log_test("Convert Itinerary (Invalid Auth)", True, f"Correctly rejected invalid token: {data.get('detail', 'Authentication failed')}")
                return True
            else:
                self.log_test("Convert Itinerary (Invalid Auth)", False, f"Expected 401, got HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Convert Itinerary (Invalid Auth)", False, f"Request error: {str(e)}")
            return False
    
    def test_my_itineraries_without_auth(self):
        """Test my-itineraries endpoint without authentication"""
        try:
            response = requests.get(
                f"{BACKEND_URL}/my-itineraries",
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 401:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                self.log_test("My Itineraries (No Auth)", True, "Correctly rejected request without authentication")
                return True
            else:
                self.log_test("My Itineraries (No Auth)", False, f"Expected 401, got HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("My Itineraries (No Auth)", False, f"Request error: {str(e)}")
            return False
    
    def test_backend_auth_configuration(self):
        """Test backend Auth0 configuration by examining error responses"""
        try:
            # Test with a malformed token to see if backend properly validates
            malformed_token = "invalid.jwt.token"
            auth_headers = {
                **self.headers,
                "Authorization": f"Bearer {malformed_token}"
            }
            
            response = requests.get(
                f"{BACKEND_URL}/my-itineraries",
                headers=auth_headers,
                timeout=30
            )
            
            if response.status_code == 401:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {"detail": response.text}
                
                # Check if the error indicates proper JWT validation
                error_detail = data.get("detail", "").lower()
                if "token" in error_detail or "authentication" in error_detail or "invalid" in error_detail:
                    self.log_test("Backend Auth Configuration", True, "Backend properly validates JWT tokens and rejects malformed tokens")
                    return True
                else:
                    self.log_test("Backend Auth Configuration", False, f"Unexpected error response: {data}")
                    return False
            else:
                self.log_test("Backend Auth Configuration", False, f"Expected 401 for malformed token, got HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Backend Auth Configuration", False, f"Request error: {str(e)}")
            return False
    
    def test_cors_configuration(self):
        """Test CORS configuration for authentication endpoints"""
        try:
            # Test preflight request for convert-itinerary
            response = requests.options(
                f"{BACKEND_URL}/convert-itinerary",
                headers={
                    "Origin": "https://travel-wizard-3.preview.emergentagent.com",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Authorization, Content-Type"
                },
                timeout=30
            )
            
            if response.status_code in [200, 204]:
                # Check CORS headers
                cors_headers = {
                    "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
                    "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
                    "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
                    "Access-Control-Allow-Credentials": response.headers.get("Access-Control-Allow-Credentials")
                }
                
                # Check if Authorization header is allowed
                allowed_headers = cors_headers.get("Access-Control-Allow-Headers", "").lower()
                if "authorization" in allowed_headers or "*" in allowed_headers:
                    self.log_test("CORS Configuration", True, f"CORS properly configured for authentication: {cors_headers}")
                    return True
                else:
                    self.log_test("CORS Configuration", False, f"Authorization header not allowed in CORS: {cors_headers}")
                    return False
            else:
                self.log_test("CORS Configuration", False, f"CORS preflight failed: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("CORS Configuration", False, f"Request error: {str(e)}")
            return False
    
    def setup_session_for_auth_testing(self):
        """Generate a session_id for authentication testing"""
        try:
            response = requests.post(
                f"{BACKEND_URL}/generate-itinerary",
                json=TEST_FORM_DATA,
                headers=self.headers,
                timeout=60
            )
            
            if response.status_code == 200:
                data = response.json()
                if "session_id" in data:
                    self.session_id = data["session_id"]
                    self.log_test("Setup Session", True, f"Created session for auth testing: {self.session_id}")
                    return True
                else:
                    self.log_test("Setup Session", False, "No session_id in response")
                    return False
            else:
                self.log_test("Setup Session", False, f"Failed to create session: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Setup Session", False, f"Request error: {str(e)}")
            return False
    
    def test_prepare_auth_endpoint(self):
        """Test prepare-auth endpoint for extending expiry"""
        if not self.session_id:
            self.log_test("Prepare Auth Endpoint", False, "No session_id available")
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
                    self.log_test("Prepare Auth Endpoint", True, f"Successfully prepared auth: {data['message']}")
                    return True
                else:
                    self.log_test("Prepare Auth Endpoint", False, "Unexpected response format", data)
                    return False
                    
            elif response.status_code == 404:
                self.log_test("Prepare Auth Endpoint", False, "Session not found for auth preparation")
                return False
            else:
                self.log_test("Prepare Auth Endpoint", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Prepare Auth Endpoint", False, f"Request error: {str(e)}")
            return False
    
    def run_authentication_tests(self):
        """Run complete authentication test suite"""
        print("🔐 Starting Dora Travel Authentication Testing Suite")
        print(f"🎯 Testing against: {BACKEND_URL}")
        print(f"🔑 Auth0 Domain: {AUTH0_DOMAIN}")
        print(f"👥 Audience: {AUTH0_AUDIENCE}")
        print("=" * 70)
        
        # Test sequence
        tests = [
            ("Auth0 Domain Connectivity", self.test_auth0_domain_connectivity),
            ("Auth0 JWKS Endpoint", self.test_auth0_jwks_endpoint),
            ("Setup Session for Testing", self.setup_session_for_auth_testing),
            ("Prepare Auth Endpoint", self.test_prepare_auth_endpoint),
            ("Backend Auth Configuration", self.test_backend_auth_configuration),
            ("Convert Itinerary (No Auth)", self.test_convert_itinerary_without_auth),
            ("Convert Itinerary (Invalid Auth)", self.test_convert_itinerary_with_invalid_auth),
            ("My Itineraries (No Auth)", self.test_my_itineraries_without_auth),
            ("CORS Configuration", self.test_cors_configuration)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running: {test_name}")
            if test_func():
                passed += 1
            time.sleep(1)  # Brief pause between tests
        
        print("\n" + "=" * 70)
        print(f"📊 AUTHENTICATION TEST SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL AUTHENTICATION TESTS PASSED! Backend is ready for authenticated requests.")
        elif passed >= total * 0.8:  # 80% pass rate
            print("✅ AUTHENTICATION MOSTLY WORKING! Minor issues may need attention.")
        else:
            print("⚠️  AUTHENTICATION ISSUES DETECTED! Check the details above.")
        
        return passed, total, self.test_results

def main():
    """Main test execution"""
    tester = DoraAuthTester()
    passed, total, results = tester.run_authentication_tests()
    
    # Save detailed results
    with open('/app/backend_auth_test_results.json', 'w') as f:
        json.dump({
            "summary": {
                "passed": passed,
                "total": total,
                "success_rate": f"{(passed/total)*100:.1f}%",
                "timestamp": datetime.now().isoformat()
            },
            "auth_config": {
                "auth0_domain": AUTH0_DOMAIN,
                "auth0_audience": AUTH0_AUDIENCE,
                "backend_url": BACKEND_URL
            },
            "test_data_used": TEST_FORM_DATA,
            "detailed_results": results
        }, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_auth_test_results.json")
    
    return passed, total, results

if __name__ == "__main__":
    passed, total, results = main()
    exit(0 if passed == total else 1)