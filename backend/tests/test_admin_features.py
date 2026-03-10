"""
Test Admin Features for Frameflow
- Super admin login
- Client management (CRUD)
- Billing tracker
- Admin stats
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Super admin credentials
ADMIN1_EMAIL = "adreej@frameflow.me"
ADMIN1_PASS = "iamadreejandaarjavbanerjee6969"
ADMIN2_EMAIL = "deepesh@frameflow.me"
ADMIN2_PASS = "deepesh@2005"


class TestSuperAdminLogin:
    """Test super admin authentication"""
    
    def test_admin1_login_success(self):
        """Test first super admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN1_EMAIL,
            "password": ADMIN1_PASS
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        assert data["user"]["email"] == ADMIN1_EMAIL
    
    def test_admin2_login_success(self):
        """Test second super admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN2_EMAIL,
            "password": ADMIN2_PASS
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "super_admin"
        assert data["user"]["email"] == ADMIN2_EMAIL
    
    def test_invalid_login_rejected(self):
        """Test invalid credentials are rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data


class TestAdminClientManagement:
    """Test admin client management features"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN1_EMAIL,
            "password": ADMIN1_PASS
        })
        return response.json()["token"]
    
    def test_get_admin_stats(self, admin_token):
        """Test admin can view platform stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_clients" in data
        assert "active_clients" in data
        assert "meta_connected" in data
    
    def test_get_clients_list(self, admin_token):
        """Test admin can view clients list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/clients",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_create_client(self, admin_token):
        """Test admin can create a new client"""
        response = requests.post(
            f"{BASE_URL}/api/admin/clients",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "business_name": "TEST_New Cafe",
                "email": f"test_new_cafe_{os.urandom(4).hex()}@example.com",
                "password": "SecurePass123",
                "plan_start_date": "2026-01-15"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "user_id" in data
        return data["user_id"]
    
    def test_create_client_with_existing_email_rejected(self, admin_token):
        """Test creating client with existing email fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/clients",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "business_name": "Duplicate Cafe",
                "email": ADMIN1_EMAIL,  # Using admin email which already exists
                "password": "test123"
            }
        )
        assert response.status_code == 400


class TestAdminBilling:
    """Test admin billing tracker"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN1_EMAIL,
            "password": ADMIN1_PASS
        })
        return response.json()["token"]
    
    def test_get_billing_overview(self, admin_token):
        """Test admin can view billing overview"""
        response = requests.get(
            f"{BASE_URL}/api/admin/billing",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "records" in data
        assert "monthly_fee" in data["summary"]
        assert data["summary"]["monthly_fee"] == 15000  # ₹15,000


class TestPublicPages:
    """Test public pages accessible without auth"""
    
    def test_login_page_loads(self):
        """Test auth page loads"""
        response = requests.get(f"{BASE_URL.replace('/api', '')}/auth")
        # React routes return 200 as the SPA handles routing
        assert response.status_code == 200
    
    def test_privacy_policy_accessible(self):
        """Test privacy policy page is accessible"""
        response = requests.get(f"{BASE_URL.replace('/api', '')}/privacy-policy")
        assert response.status_code == 200
    
    def test_data_deletion_accessible(self):
        """Test data deletion page is accessible"""
        response = requests.get(f"{BASE_URL.replace('/api', '')}/data-deletion")
        assert response.status_code == 200


class TestClientLogin:
    """Test client user login flow"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token to create test client"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN1_EMAIL,
            "password": ADMIN1_PASS
        })
        return response.json()["token"]
    
    def test_client_login_success(self, admin_token):
        """Test created client can login"""
        # First create a client
        email = f"test_login_{os.urandom(4).hex()}@example.com"
        password = "ClientPass123"
        
        create_resp = requests.post(
            f"{BASE_URL}/api/admin/clients",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "business_name": "TEST_Login Cafe",
                "email": email,
                "password": password
            }
        )
        assert create_resp.status_code == 200
        
        # Now login as the client
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        assert login_resp.status_code == 200
        data = login_resp.json()
        assert data["user"]["role"] == "client_user"
        assert data["user"]["onboarding_complete"] == False


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
