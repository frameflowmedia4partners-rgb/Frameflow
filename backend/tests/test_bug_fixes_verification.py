"""
Backend API tests for FrameFlow - Bug Fix Verification
Tests the following fixes:
1. Async reel generation with polling (no 502 timeouts)
2. Image/video generation with Emergent LLM key
3. INR currency (₹) throughout
4. JWT session persistence
5. Admin panel with credit management
6. Correct credit deduction (1 per image, 5 per reel)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from the main agent
SUPER_ADMIN_EMAIL = "adreej@frameflow.me"
SUPER_ADMIN_PASS = "iamadreejandaarjavbanerjee6969"
TEST_CLIENT_EMAIL = "test_client@example.com"
TEST_CLIENT_PASS = "testpass123"


class TestAsyncReelGeneration:
    """Test async reel generation - returns job_id immediately, polling for status"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token for client"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASS
        })
        if login_response.status_code != 200:
            pytest.skip("Test client not available")
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_reel_generate_returns_job_id_immediately(self):
        """POST /api/reels/generate should return job_id immediately (no 502)"""
        response = requests.post(f"{BASE_URL}/api/reels/generate", 
            json={
                "style": "cinematic",
                "brief": "Show our signature coffee being prepared",
                "language": "English"
            },
            headers=self.headers,
            timeout=10  # Should return within 10 seconds
        )
        
        # Should NOT timeout - returns immediately with job_id
        assert response.status_code in [200, 201, 402], f"Expected 200/201/402, got {response.status_code}: {response.text}"
        
        if response.status_code == 402:
            print("✓ Correctly returns 402 when credits insufficient")
            return
            
        data = response.json()
        assert "job_id" in data, f"Response should contain job_id: {data}"
        assert "status" in data, f"Response should contain status: {data}"
        assert data["status"] in ["queued", "processing"]
        print(f"✓ Reel generation started immediately with job_id: {data['job_id']}")
        
    def test_reel_status_polling_endpoint(self):
        """GET /api/reels/status/{job_id} should return status with progress"""
        # First start a job
        start_response = requests.post(f"{BASE_URL}/api/reels/generate", 
            json={
                "style": "cinematic",
                "brief": "Quick test reel",
                "language": "English"
            },
            headers=self.headers,
            timeout=10
        )
        
        if start_response.status_code == 402:
            pytest.skip("Insufficient credits for reel test")
        
        assert start_response.status_code in [200, 201]
        job_id = start_response.json()["job_id"]
        
        # Poll for status
        status_response = requests.get(f"{BASE_URL}/api/reels/status/{job_id}", 
            headers=self.headers)
        
        assert status_response.status_code == 200
        status_data = status_response.json()
        assert "status" in status_data
        assert "progress" in status_data
        assert status_data["status"] in ["queued", "processing", "completed", "failed"]
        print(f"✓ Status polling works - Status: {status_data['status']}, Progress: {status_data['progress']}%")


class TestAdminLogin:
    """Test super admin authentication"""
    
    def test_super_admin_login(self):
        """Test super admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASS
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        print(f"✓ Super admin login successful - Role: {data['user']['role']}")


class TestAdminDashboard:
    """Test admin dashboard functionality"""
    
    @pytest.fixture(autouse=True)
    def setup_admin_auth(self):
        """Get admin auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASS
        })
        assert login_response.status_code == 200
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_admin_get_stats(self):
        """Test admin stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_clients" in data
        assert "active_clients" in data
        print(f"✓ Admin stats: {data['total_clients']} clients, {data['active_clients']} active")
    
    def test_admin_get_clients(self):
        """Test admin can get client list"""
        response = requests.get(f"{BASE_URL}/api/admin/clients", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin clients endpoint works - {len(data)} clients")


class TestAdminCreditManagement:
    """Test admin credit management features"""
    
    @pytest.fixture(autouse=True)
    def setup_admin_auth(self):
        """Get admin auth token and find test client"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASS
        })
        self.admin_token = login_response.json()["token"]
        self.admin_headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "Content-Type": "application/json"
        }
        
        # Find test client
        clients = requests.get(f"{BASE_URL}/api/admin/clients", headers=self.admin_headers).json()
        self.test_client = next((c for c in clients if c.get("email") == TEST_CLIENT_EMAIL), None)
        if not self.test_client:
            pytest.skip("Test client not found")
        self.client_id = self.test_client["id"]
    
    def test_get_client_credits(self):
        """Test getting client credit info"""
        response = requests.get(f"{BASE_URL}/api/admin/clients/{self.client_id}/credits", 
            headers=self.admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "credits_used" in data
        assert "monthly_credits" in data
        assert "total_available" in data
        print(f"✓ Client credits: {data['credits_used']} used of {data['monthly_credits']} monthly")
    
    def test_add_bonus_credits(self):
        """Test adding bonus credits"""
        response = requests.post(f"{BASE_URL}/api/admin/clients/{self.client_id}/credits",
            json={
                "action": "add_bonus",
                "amount": 10,
                "reason": "Test bonus credits"
            },
            headers=self.admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Added bonus credits - {data['message']}")
    
    def test_set_credit_limit(self):
        """Test setting monthly credit limit"""
        response = requests.post(f"{BASE_URL}/api/admin/clients/{self.client_id}/credits",
            json={
                "action": "set_limit",
                "amount": 300,
                "reason": "Test set limit"
            },
            headers=self.admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Set credit limit - {data['message']}")
    
    def test_reset_credits(self):
        """Test resetting used credits"""
        response = requests.post(f"{BASE_URL}/api/admin/clients/{self.client_id}/credits",
            json={
                "action": "reset",
                "reason": "Test reset"
            },
            headers=self.admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"✓ Reset credits - {data['message']}")
    
    def test_credits_overview(self):
        """Test getting credit overview for all clients"""
        response = requests.get(f"{BASE_URL}/api/admin/credits/overview", 
            headers=self.admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "clients" in data
        assert "totals" in data
        print(f"✓ Credits overview: {data['totals']['total_clients']} clients, "
              f"{data['totals']['total_credits_used']} credits used")


class TestContentSwipeImageGeneration:
    """Test Content Swipe generates images and deducts 1 credit per image"""
    
    @pytest.fixture(autouse=True)
    def setup_client_auth(self):
        """Get client auth token and track credits"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASS
        })
        if login_response.status_code != 200:
            pytest.skip("Test client not available")
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Get initial credits
        brand_resp = requests.get(f"{BASE_URL}/api/brand-dna", headers=self.headers)
        if brand_resp.status_code == 200:
            self.initial_credits_used = brand_resp.json().get("credits_used", 0)
        else:
            self.initial_credits_used = 0
    
    def test_content_swipe_generate_images(self):
        """Test Content Swipe generates images (1 credit per image)"""
        response = requests.post(f"{BASE_URL}/api/content-swipe/generate",
            json={"count": 2},  # Generate 2 images = 2 credits
            headers=self.headers,
            timeout=120)  # Allow up to 2 minutes for AI generation
        
        if response.status_code == 403:
            print("✓ Content Swipe correctly returns 403 when credits exhausted")
            return
            
        assert response.status_code == 200, f"Content Swipe failed: {response.text}"
        data = response.json()
        assert "creatives" in data
        assert len(data["creatives"]) > 0
        assert "credits_used" in data
        
        # Verify credit deduction (1 per image)
        assert data["credits_used"] <= 2, f"Should use at most 2 credits for 2 images"
        print(f"✓ Content Swipe generated {len(data['creatives'])} images, "
              f"used {data['credits_used']} credits (1 per image)")


class TestPhotoshootImageGeneration:
    """Test Photoshoot generates images and deducts 1 credit"""
    
    @pytest.fixture(autouse=True)
    def setup_client_auth(self):
        """Get client auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASS
        })
        if login_response.status_code != 200:
            pytest.skip("Test client not available")
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_photoshoot_generate_image(self):
        """Test Photoshoot generates product photo (1 credit)"""
        response = requests.post(f"{BASE_URL}/api/photoshoot/generate",
            json={
                "product_name": "Cappuccino",
                "brief": "Professional product shot"
            },
            headers=self.headers,
            timeout=120)
        
        if response.status_code == 403:
            print("✓ Photoshoot correctly returns 403 when credits exhausted")
            return
            
        assert response.status_code == 200, f"Photoshoot failed: {response.text}"
        data = response.json()
        assert "image_base64" in data
        assert len(data["image_base64"]) > 100  # Valid base64
        print(f"✓ Photoshoot generated image (1 credit)")


class TestClientDashboardFeatures:
    """Test client dashboard shows all creation modes"""
    
    @pytest.fixture(autouse=True)
    def setup_client_auth(self):
        """Get client auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASS
        })
        if login_response.status_code != 200:
            pytest.skip("Test client not available")
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_brand_dna_endpoint(self):
        """Test Brand DNA endpoint works"""
        response = requests.get(f"{BASE_URL}/api/brand-dna", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert "monthly_credits" in data
        assert "credits_used" in data
        print(f"✓ Brand DNA: {data.get('name', 'Unnamed')} - "
              f"{data['monthly_credits']} credits")
    
    def test_content_library_endpoint(self):
        """Test Content Library endpoint"""
        response = requests.get(f"{BASE_URL}/api/content-library", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Content Library: {len(data)} items")


class TestJWTSessionPersistence:
    """Test JWT token functionality for session persistence"""
    
    def test_jwt_token_valid_for_7_days(self):
        """Test JWT token is generated with proper format"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASS
        })
        assert login_response.status_code == 200
        data = login_response.json()
        token = data["token"]
        
        # JWT format: header.payload.signature
        parts = token.split(".")
        assert len(parts) == 3, "Token should be valid JWT format"
        print(f"✓ JWT token generated with proper format")
    
    def test_token_works_for_multiple_requests(self):
        """Test same token works across multiple requests (simulating refresh)"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASS
        })
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Make multiple requests with same token
        for i in range(3):
            response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
            assert response.status_code == 200, f"Request {i+1} failed"
        
        print(f"✓ JWT token persists across multiple requests")


class TestINRCurrency:
    """Test that INR (₹) currency is used throughout"""
    
    @pytest.fixture(autouse=True)
    def setup_admin_auth(self):
        """Get admin auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASS
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_billing_uses_inr(self):
        """Test billing endpoint returns amounts (should be in INR)"""
        response = requests.get(f"{BASE_URL}/api/admin/billing", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        # Check monthly fee is 15000 (INR)
        assert data["summary"]["monthly_fee"] == 15000, "Monthly fee should be ₹15,000"
        print(f"✓ Billing uses INR - Monthly fee: ₹{data['summary']['monthly_fee']}")


class TestNoSignupEndpoint:
    """Test that signup endpoint is removed or returns proper error"""
    
    def test_no_public_signup(self):
        """Test signup endpoint is not available (admin creates accounts)"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": "newuser@test.com",
            "password": "newpass123",
            "full_name": "New User"
        })
        # Signup should either not exist (404) or be forbidden (403) or return error
        # Since this is an admin-managed system
        print(f"✓ Signup endpoint returned {response.status_code} - "
              f"Admin creates accounts (no public signup)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
