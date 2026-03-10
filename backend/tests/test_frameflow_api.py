"""
Frameflow API Tests
Tests all key endpoints for the café SaaS platform
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-studio-hub-31.preview.emergentagent.com')

# Test credentials
SUPER_ADMIN_EMAIL = "adreej@frameflow.me"
SUPER_ADMIN_PASS = "iamadreejandaarjavbanerjee6969"
CLIENT_EMAIL = "test_client@example.com"
CLIENT_PASS = "testpass123"


class TestAuthEndpoints:
    """Authentication tests"""
    
    def test_super_admin_login(self):
        """Test super admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASS
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "super_admin"
        print(f"✅ Super admin login successful, role: {data['user']['role']}")
        return data["token"]
    
    def test_client_user_login(self):
        """Test client user login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASS
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "client_user"
        print(f"✅ Client user login successful, role: {data['user']['role']}")
        return data["token"]
    
    def test_invalid_login(self):
        """Test invalid login returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Invalid login correctly returns 401")


class TestAdminEndpoints:
    """Admin panel tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASS
        })
        return response.json()["token"]
    
    def test_admin_get_clients(self, admin_token):
        """Test admin can get clients list"""
        response = requests.get(f"{BASE_URL}/api/admin/clients", 
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ Admin clients endpoint works, found {len(response.json())} clients")
    
    def test_admin_billing(self, admin_token):
        """Test admin billing overview"""
        response = requests.get(f"{BASE_URL}/api/admin/billing",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "records" in data
        # Check for INR currency in summary
        assert "monthly_fee" in data["summary"]
        print(f"✅ Admin billing works, monthly fee: ₹{data['summary']['monthly_fee']}")
    
    def test_admin_stats(self, admin_token):
        """Test admin stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "total_clients" in data
        print(f"✅ Admin stats works, total clients: {data['total_clients']}")


class TestClientEndpoints:
    """Client user tests"""
    
    @pytest.fixture
    def client_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": CLIENT_EMAIL,
            "password": CLIENT_PASS
        })
        return response.json()["token"]
    
    def test_brand_profile(self, client_token):
        """Test brand profile endpoint"""
        response = requests.get(f"{BASE_URL}/api/brand",
            headers={"Authorization": f"Bearer {client_token}"})
        assert response.status_code == 200
        print("✅ Brand profile endpoint works")
    
    def test_integration_status(self, client_token):
        """Test integration status endpoint"""
        response = requests.get(f"{BASE_URL}/api/integrations/status",
            headers={"Authorization": f"Bearer {client_token}"})
        assert response.status_code == 200
        data = response.json()
        assert "instagram" in data
        assert "facebook" in data
        print(f"✅ Integration status works, Instagram connected: {data['instagram']['connected']}")
    
    def test_analytics(self, client_token):
        """Test analytics endpoint"""
        response = requests.get(f"{BASE_URL}/api/analytics?days=7",
            headers={"Authorization": f"Bearer {client_token}"})
        assert response.status_code == 200
        print("✅ Analytics endpoint works")
    
    def test_campaigns_list(self, client_token):
        """Test campaigns list endpoint"""
        response = requests.get(f"{BASE_URL}/api/campaigns",
            headers={"Authorization": f"Bearer {client_token}"})
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ Campaigns list works, found {len(response.json())} campaigns")
    
    def test_scheduled_posts(self, client_token):
        """Test scheduled posts endpoint"""
        response = requests.get(f"{BASE_URL}/api/scheduled-posts",
            headers={"Authorization": f"Bearer {client_token}"})
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ Scheduled posts works, found {len(response.json())} posts")
    
    def test_ideas_list(self, client_token):
        """Test ideas endpoint"""
        response = requests.get(f"{BASE_URL}/api/ideas",
            headers={"Authorization": f"Bearer {client_token}"})
        assert response.status_code == 200
        print("✅ Ideas endpoint works")
    
    def test_content_library(self, client_token):
        """Test content library endpoint"""
        response = requests.get(f"{BASE_URL}/api/content-library",
            headers={"Authorization": f"Bearer {client_token}"})
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print(f"✅ Content library works, found {len(response.json())} items")


class TestPublicEndpoints:
    """Public endpoints (no auth required)"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api")
        # Could be 404 if no root endpoint, but server should respond
        assert response.status_code in [200, 404]
        print("✅ Server is responding")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
