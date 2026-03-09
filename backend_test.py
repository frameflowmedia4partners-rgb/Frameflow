import requests
import sys
import json
from datetime import datetime

class FrameFlowAPITester:
    def __init__(self, base_url="https://ai-studio-hub-31.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.brand_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            print(f"   Status: {response.status_code}")
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        error_data = response.json()
                        print(f"   Error: {error_data}")
                    except:
                        print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_signup(self, email, password, full_name):
        """Test user signup"""
        success, response = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            200,
            data={"email": email, "password": password, "full_name": full_name}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True, response
        return False, response

    def test_login(self, email, password):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True, response
        return False, response

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success, response

    def test_create_brand(self, name, tone=None, industry=None):
        """Test create brand"""
        success, response = self.run_test(
            "Create Brand",
            "POST",
            "brands",
            200,
            data={"name": name, "tone": tone, "industry": industry}
        )
        if success and 'id' in response:
            self.brand_id = response['id']
            return True, response
        return False, response

    def test_get_brands(self):
        """Test get brands"""
        success, response = self.run_test(
            "Get Brands",
            "GET",
            "brands",
            200
        )
        return success, response

    def test_get_brand(self, brand_id):
        """Test get single brand"""
        success, response = self.run_test(
            "Get Brand",
            "GET",
            f"brands/{brand_id}",
            200
        )
        return success, response

    def test_update_brand(self, brand_id, name, tone=None, industry=None):
        """Test update brand"""
        success, response = self.run_test(
            "Update Brand",
            "PUT",
            f"brands/{brand_id}",
            200,
            data={"name": name, "tone": tone, "industry": industry}
        )
        return success, response

    def test_complete_onboarding(self):
        """Test complete onboarding"""
        success, response = self.run_test(
            "Complete Onboarding",
            "PUT",
            "auth/complete-onboarding",
            200
        )
        return success, response

    def test_create_project(self, brand_id, name, project_type):
        """Test create project"""
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data={"brand_id": brand_id, "name": name, "type": project_type}
        )
        return success, response

    def test_get_projects(self):
        """Test get projects"""
        success, response = self.run_test(
            "Get Projects",
            "GET",
            "projects",
            200
        )
        return success, response

    def test_generate_caption(self, prompt, brand_id=None):
        """Test caption generation"""
        success, response = self.run_test(
            "Generate Caption",
            "POST",
            "generate/caption",
            200,
            data={"prompt": prompt, "brand_id": brand_id, "type": "caption", "platform": "instagram", "tone": "engaging"}
        )
        return success, response

    def test_get_stats(self):
        """Test get stats"""
        success, response = self.run_test(
            "Get Stats",
            "GET",
            "stats",
            200
        )
        return success, response

    def test_get_templates(self):
        """Test get templates"""
        success, response = self.run_test(
            "Get Templates",
            "GET",
            "templates",
            200
        )
        return success, response

def main():
    print("🚀 Starting FrameFlow Studio API Tests...\n")
    
    tester = FrameFlowAPITester()
    
    # Test data
    test_email = "testuser@frameflow.com"
    test_password = "testpass123"
    test_full_name = "Test User"
    
    # Test signup (create new user)
    success, signup_response = tester.test_signup(test_email, test_password, test_full_name)
    if not success:
        print("❌ Signup failed, trying login instead...")
        # If signup fails (user exists), try login
        success, login_response = tester.test_login(test_email, test_password)
        if not success:
            print("❌ Both signup and login failed, stopping tests")
            return 1
    
    # Test get current user
    tester.test_get_me()
    
    # Test create brand
    brand_success, brand_response = tester.test_create_brand(
        "Test Brand", 
        "Professional", 
        "Technology"
    )
    
    if brand_success:
        # Test get brands
        tester.test_get_brands()
        
        # Test get single brand
        tester.test_get_brand(tester.brand_id)
        
        # Test update brand
        tester.test_update_brand(
            tester.brand_id,
            "Updated Test Brand",
            "Friendly",
            "Marketing"
        )
        
        # Test complete onboarding
        tester.test_complete_onboarding()
        
        # Test create project
        project_success, project_response = tester.test_create_project(
            tester.brand_id,
            "Test Project",
            "caption"
        )
        
        # Test get projects
        tester.test_get_projects()
        
        # Test caption generation
        caption_success, caption_response = tester.test_generate_caption(
            "Create a social media post about a new product launch",
            tester.brand_id
        )
        
        if caption_success:
            print(f"✨ Generated caption preview: {caption_response.get('caption', '')[:100]}...")
    
    # Test stats
    tester.test_get_stats()
    
    # Test templates
    tester.test_get_templates()
    
    # Print final results
    print(f"\n{'='*50}")
    print(f"📊 API TESTS SUMMARY")
    print(f"{'='*50}")
    print(f"Total tests: {tester.tests_run}")
    print(f"Passed: {tester.tests_passed}")
    print(f"Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All API tests passed!")
        return 0
    else:
        print(f"⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())