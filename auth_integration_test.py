#!/usr/bin/env python3
"""
Comprehensive Authentication Integration Test
Tests the complete authentication workflow with real Auth0 integration
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://travel-wizard-3.preview.emergentagent.com/api"
AUTH0_DOMAIN = "dev-01mtujmmqt4lkn8h.us.auth0.com"
AUTH0_AUDIENCE = "https://api.travel-itinerary.com"

def test_auth0_integration():
    """Test Auth0 integration and backend authentication readiness"""
    print("🔐 Testing Auth0 Integration and Backend Authentication Readiness")
    print("=" * 70)
    
    results = {
        "auth0_jwks_accessible": False,
        "backend_auth_validation": False,
        "convert_endpoint_protected": False,
        "my_itineraries_protected": False,
        "prepare_auth_working": False,
        "session_id": None
    }
    
    # Test 1: Auth0 JWKS endpoint
    print("\n1. Testing Auth0 JWKS endpoint...")
    try:
        jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
        response = requests.get(jwks_url, timeout=30)
        
        if response.status_code == 200:
            jwks_data = response.json()
            if "keys" in jwks_data and len(jwks_data["keys"]) > 0:
                results["auth0_jwks_accessible"] = True
                print(f"   ✅ JWKS accessible with {len(jwks_data['keys'])} keys")
            else:
                print("   ❌ Invalid JWKS structure")
        else:
            print(f"   ❌ JWKS not accessible: HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ JWKS error: {str(e)}")
    
    # Test 2: Create session for testing
    print("\n2. Creating test session...")
    try:
        test_data = {
            "user_name": "Emma Wilson",
            "origin_city": "San Francisco, CA",
            "destinations": ["Barcelona, Spain", "Madrid, Spain"],
            "start_date": "2024-12-20",
            "end_date": "2024-12-27",
            "travel_theme": "Cultural",
            "party_size": 2,
            "budget_per_person": 2000,
            "currency": "USD"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/generate-itinerary",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            if "session_id" in data:
                results["session_id"] = data["session_id"]
                print(f"   ✅ Session created: {results['session_id']}")
            else:
                print("   ❌ No session_id in response")
        else:
            print(f"   ❌ Session creation failed: HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ Session creation error: {str(e)}")
    
    # Test 3: Test prepare-auth endpoint
    if results["session_id"]:
        print("\n3. Testing prepare-auth endpoint...")
        try:
            response = requests.post(
                f"{BACKEND_URL}/prepare-auth/{results['session_id']}",
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    results["prepare_auth_working"] = True
                    print("   ✅ Prepare-auth working correctly")
                else:
                    print("   ❌ Prepare-auth returned unexpected response")
            else:
                print(f"   ❌ Prepare-auth failed: HTTP {response.status_code}")
        except Exception as e:
            print(f"   ❌ Prepare-auth error: {str(e)}")
    
    # Test 4: Test authentication protection on convert-itinerary
    print("\n4. Testing convert-itinerary authentication protection...")
    try:
        if results["session_id"]:
            conversion_data = {"session_id": results["session_id"]}
            response = requests.post(
                f"{BACKEND_URL}/convert-itinerary",
                json=conversion_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 401:
                results["convert_endpoint_protected"] = True
                print("   ✅ Convert-itinerary properly protected (401 without auth)")
            else:
                print(f"   ❌ Convert-itinerary not protected: HTTP {response.status_code}")
        else:
            print("   ❌ No session_id available for testing")
    except Exception as e:
        print(f"   ❌ Convert-itinerary test error: {str(e)}")
    
    # Test 5: Test authentication protection on my-itineraries
    print("\n5. Testing my-itineraries authentication protection...")
    try:
        response = requests.get(
            f"{BACKEND_URL}/my-itineraries",
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 401:
            results["my_itineraries_protected"] = True
            print("   ✅ My-itineraries properly protected (401 without auth)")
        else:
            print(f"   ❌ My-itineraries not protected: HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ My-itineraries test error: {str(e)}")
    
    # Test 6: Test JWT validation with malformed token
    print("\n6. Testing JWT validation with malformed token...")
    try:
        malformed_token = "invalid.jwt.token"
        response = requests.get(
            f"{BACKEND_URL}/my-itineraries",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {malformed_token}"
            },
            timeout=30
        )
        
        if response.status_code == 401:
            data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            error_detail = data.get("detail", "").lower()
            if "token" in error_detail or "authentication" in error_detail or "invalid" in error_detail:
                results["backend_auth_validation"] = True
                print("   ✅ Backend properly validates JWT tokens")
            else:
                print(f"   ❌ Unexpected error response: {data}")
        else:
            print(f"   ❌ Expected 401 for malformed token: HTTP {response.status_code}")
    except Exception as e:
        print(f"   ❌ JWT validation test error: {str(e)}")
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 AUTHENTICATION INTEGRATION TEST SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(results.values() if isinstance(v, bool) else 0 for v in results.values())
    total_tests = len([v for v in results.values() if isinstance(v, bool)])
    
    print(f"✅ Auth0 JWKS Accessible: {'YES' if results['auth0_jwks_accessible'] else 'NO'}")
    print(f"✅ Backend JWT Validation: {'YES' if results['backend_auth_validation'] else 'NO'}")
    print(f"✅ Convert Endpoint Protected: {'YES' if results['convert_endpoint_protected'] else 'NO'}")
    print(f"✅ My-Itineraries Protected: {'YES' if results['my_itineraries_protected'] else 'NO'}")
    print(f"✅ Prepare-Auth Working: {'YES' if results['prepare_auth_working'] else 'NO'}")
    
    print(f"\n📈 Overall Score: {passed_tests}/{total_tests} ({(passed_tests/total_tests)*100:.1f}%)")
    
    if passed_tests == total_tests:
        print("🎉 AUTHENTICATION FULLY READY! Backend can receive authenticated requests from frontend.")
    elif passed_tests >= total_tests * 0.8:
        print("✅ AUTHENTICATION MOSTLY READY! Minor issues may exist but core functionality works.")
    else:
        print("⚠️  AUTHENTICATION ISSUES! Backend may not be ready for authenticated requests.")
    
    # Save results
    with open('/app/auth_integration_results.json', 'w') as f:
        json.dump({
            "summary": {
                "passed": passed_tests,
                "total": total_tests,
                "success_rate": f"{(passed_tests/total_tests)*100:.1f}%",
                "timestamp": datetime.now().isoformat()
            },
            "results": results,
            "auth_config": {
                "auth0_domain": AUTH0_DOMAIN,
                "auth0_audience": AUTH0_AUDIENCE,
                "backend_url": BACKEND_URL
            }
        }, f, indent=2)
    
    return passed_tests, total_tests, results

if __name__ == "__main__":
    passed, total, results = test_auth0_integration()
    exit(0 if passed == total else 1)