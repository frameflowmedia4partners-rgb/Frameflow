"""
Backend API tests for FrameFlow - Authentication and Core APIs
Tests: Auth (login, signup, me, onboarding), Brands, Projects, Templates, Stats
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "testcafe@example.com"
TEST_PASSWORD = "test123456"

class TestHealth:
    """Basic API connectivity tests"""
    
    def test_templates_endpoint_accessible(self):
        """Templates is a public endpoint - verify API is up"""
        response = requests.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ Templates endpoint accessible, returned {len(data)} templates")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        print(f"✓ Login successful for {TEST_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword123"
        })
        assert response.status_code == 401
        print("✓ Login correctly rejects invalid credentials")
    
    def test_login_nonexistent_user(self):
        """Test login with non-existent email"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("✓ Login correctly rejects non-existent user")
    
    def test_signup_duplicate_email(self):
        """Test signup with already registered email"""
        response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": TEST_EMAIL,
            "password": "newpassword123",
            "full_name": "Test User"
        })
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data.get("detail", "").lower() or "email" in data.get("detail", "").lower()
        print("✓ Signup correctly rejects duplicate email")
    
    def test_me_endpoint_with_valid_token(self):
        """Test /auth/me with valid token"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Test /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == TEST_EMAIL
        assert "id" in data
        print(f"✓ /auth/me returns user data correctly")
    
    def test_me_endpoint_without_token(self):
        """Test /auth/me without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]
        print("✓ /auth/me correctly rejects unauthenticated request")


class TestBrands:
    """Brand management endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token for tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_get_brands(self):
        """Test getting user's brands"""
        response = requests.get(f"{BASE_URL}/api/brands", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get brands returned {len(data)} brands")
    
    def test_create_and_get_brand(self):
        """Test creating a brand and verifying persistence"""
        # Create brand
        brand_data = {
            "name": f"TEST_Brand_{uuid.uuid4().hex[:8]}",
            "tone": "professional",
            "industry": "café",
            "colors": ["#FF6B6B", "#4ECDC4"]
        }
        create_response = requests.post(f"{BASE_URL}/api/brands", 
            json=brand_data, headers=self.headers)
        assert create_response.status_code == 200
        created = create_response.json()
        assert created["name"] == brand_data["name"]
        assert "id" in created
        brand_id = created["id"]
        print(f"✓ Created brand: {created['name']}")
        
        # Get brand to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/brands/{brand_id}", 
            headers=self.headers)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == brand_data["name"]
        assert fetched["tone"] == brand_data["tone"]
        print(f"✓ GET verified brand persistence")
    
    def test_update_brand(self):
        """Test updating a brand"""
        # Create brand first
        create_response = requests.post(f"{BASE_URL}/api/brands", 
            json={"name": f"TEST_Update_{uuid.uuid4().hex[:8]}", "tone": "casual"},
            headers=self.headers)
        brand_id = create_response.json()["id"]
        
        # Update brand
        update_response = requests.put(f"{BASE_URL}/api/brands/{brand_id}",
            json={"name": "Updated Café Name", "tone": "professional"},
            headers=self.headers)
        assert update_response.status_code == 200
        print(f"✓ Brand update successful")
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/brands/{brand_id}", 
            headers=self.headers)
        fetched = get_response.json()
        assert fetched["name"] == "Updated Café Name"
        print(f"✓ Brand update verified")


class TestProjects:
    """Project management endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token and create test brand"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Create or get a brand for project tests
        brands = requests.get(f"{BASE_URL}/api/brands", headers=self.headers).json()
        if brands:
            self.brand_id = brands[0]["id"]
        else:
            create_brand = requests.post(f"{BASE_URL}/api/brands",
                json={"name": "Test Brand for Projects", "industry": "café"},
                headers=self.headers)
            self.brand_id = create_brand.json()["id"]
    
    def test_get_projects(self):
        """Test getting projects"""
        response = requests.get(f"{BASE_URL}/api/projects", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get projects returned {len(data)} projects")
    
    def test_create_project(self):
        """Test creating a project"""
        project_data = {
            "brand_id": self.brand_id,
            "name": f"TEST_Project_{uuid.uuid4().hex[:8]}",
            "type": "image"
        }
        response = requests.post(f"{BASE_URL}/api/projects",
            json=project_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == project_data["name"]
        assert "id" in data
        print(f"✓ Created project: {data['name']}")
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/projects/{data['id']}", 
            headers=self.headers)
        assert get_response.status_code == 200
        print(f"✓ Project persistence verified")


class TestTemplates:
    """Templates endpoint tests"""
    
    def test_get_templates(self):
        """Test getting all templates"""
        response = requests.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify template structure
        template = data[0]
        assert "id" in template
        assert "name" in template
        assert "description" in template
        assert "type" in template
        assert "category" in template
        assert "prompt" in template
        print(f"✓ Templates endpoint returns {len(data)} templates with correct structure")


class TestStats:
    """Stats endpoint tests"""
    
    def test_get_stats(self):
        """Test getting user stats"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["token"]
        
        response = requests.get(f"{BASE_URL}/api/stats", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "brands" in data
        assert "projects" in data
        assert "contents_generated" in data
        print(f"✓ Stats: {data['brands']} brands, {data['projects']} projects")


class TestIdeas:
    """Ideas endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Get a brand
        brands = requests.get(f"{BASE_URL}/api/brands", headers=self.headers).json()
        if brands:
            self.brand_id = brands[0]["id"]
        else:
            create_brand = requests.post(f"{BASE_URL}/api/brands",
                json={"name": "Test Brand", "industry": "café"},
                headers=self.headers)
            self.brand_id = create_brand.json()["id"]
    
    def test_get_ideas(self):
        """Test getting ideas"""
        response = requests.get(f"{BASE_URL}/api/ideas", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get ideas returned {len(data)} ideas")


class TestAdCampaigns:
    """Ad campaign endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_get_campaigns(self):
        """Test getting ad campaigns"""
        response = requests.get(f"{BASE_URL}/api/ads/campaigns", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Get campaigns returned {len(data)} campaigns")


class TestProtectedEndpoints:
    """Test authentication is required for protected endpoints"""
    
    def test_brands_requires_auth(self):
        """Test brands endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/brands")
        assert response.status_code in [401, 403]
        print("✓ /api/brands correctly requires authentication")
    
    def test_projects_requires_auth(self):
        """Test projects endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code in [401, 403]
        print("✓ /api/projects correctly requires authentication")
    
    def test_stats_requires_auth(self):
        """Test stats endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code in [401, 403]
        print("✓ /api/stats correctly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
