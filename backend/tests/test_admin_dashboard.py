"""
Backend API tests for FrameFlow - Admin Dashboard P1 Features
Tests: Admin login, get users, create user, activate/deactivate, reset password, delete user, admin stats
Regular users cannot access admin endpoints, deactivated users cannot login
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_EMAIL = "admin@frameflow.cafe"
ADMIN_PASSWORD = "FrameflowAdmin2026"

# Regular user credentials
REGULAR_USER_EMAIL = "testcafe@example.com"
REGULAR_USER_PASSWORD = "test123456"


class TestAdminLogin:
    """Admin login functionality tests"""
    
    def test_admin_login_success(self):
        """Test admin can login and gets admin role"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Admin login successful, role={data['user']['role']}")
    
    def test_admin_login_wrong_password(self):
        """Test admin login fails with wrong password"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Admin login correctly rejects wrong password")


class TestAdminStats:
    """Admin stats endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get admin token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_get_admin_stats(self):
        """Test admin can get platform stats"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected stat fields are present
        assert "total_users" in data
        assert "active_users" in data
        assert "inactive_users" in data
        assert "total_brands" in data
        assert "total_projects" in data
        assert "total_contents" in data
        
        # Verify data types
        assert isinstance(data["total_users"], int)
        assert isinstance(data["active_users"], int)
        
        print(f"✓ Admin stats: {data['total_users']} users, {data['active_users']} active, {data['total_projects']} campaigns")


class TestAdminGetUsers:
    """Admin get users endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get admin token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_get_all_users(self):
        """Test admin can get list of all users"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Admin retrieved {len(data)} users")
        
        # Verify user structure if there are users
        if len(data) > 0:
            user = data[0]
            assert "id" in user
            assert "email" in user
            assert "full_name" in user
            # Admin users should not be in the list
            for u in data:
                assert u.get("role") != "admin", "Admin users should not be in the list"
            print("✓ User structure verified, admin users excluded from list")


class TestAdminCreateUser:
    """Admin create café user tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get admin token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_create_cafe_user(self):
        """Test admin can create a new café user"""
        unique_email = f"TEST_cafe_{uuid.uuid4().hex[:8]}@example.com"
        user_data = {
            "email": unique_email,
            "password": "testpassword123",
            "cafe_name": "Test Café Admin Created"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/users", 
            json=user_data, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["full_name"] == user_data["cafe_name"]
        assert data["user"]["is_active"] == True
        assert "brand_id" in data
        
        # Store user_id for cleanup
        self.created_user_id = data["user"]["id"]
        print(f"✓ Created café user: {unique_email}")
        
        # Verify user can login with the created credentials
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": user_data["password"]
        })
        assert login_response.status_code == 200
        print("✓ New café user can login with created credentials")
        
        # Cleanup - delete the test user
        requests.delete(f"{BASE_URL}/api/admin/users/{self.created_user_id}", 
            headers=self.headers)
    
    def test_create_duplicate_email_fails(self):
        """Test creating user with existing email fails"""
        # Try to create user with existing email
        response = requests.post(f"{BASE_URL}/api/admin/users", json={
            "email": REGULAR_USER_EMAIL,
            "password": "password123",
            "cafe_name": "Duplicate Test"
        }, headers=self.headers)
        assert response.status_code == 400
        assert "already registered" in response.json().get("detail", "").lower()
        print("✓ Duplicate email correctly rejected")


class TestAdminUpdateUser:
    """Admin update user (activate/deactivate) tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get admin token and create a test user"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Create a test user for update tests
        self.test_email = f"TEST_update_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/admin/users", json={
            "email": self.test_email,
            "password": "testpass123",
            "cafe_name": "Test Update Café"
        }, headers=self.headers)
        
        if create_response.status_code == 200:
            self.test_user_id = create_response.json()["user"]["id"]
        else:
            pytest.skip("Failed to create test user for update tests")
        
        yield
        
        # Cleanup - delete the test user
        requests.delete(f"{BASE_URL}/api/admin/users/{self.test_user_id}", 
            headers=self.headers)
    
    def test_deactivate_user(self):
        """Test admin can deactivate a user"""
        response = requests.put(f"{BASE_URL}/api/admin/users/{self.test_user_id}", 
            json={"is_active": False}, headers=self.headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["user"]["is_active"] == False
        print("✓ User deactivated successfully")
        
        # Verify via GET
        get_response = requests.get(f"{BASE_URL}/api/admin/users/{self.test_user_id}", 
            headers=self.headers)
        assert get_response.json()["is_active"] == False
        print("✓ Deactivation verified via GET")
    
    def test_activate_user(self):
        """Test admin can activate a deactivated user"""
        # First deactivate
        requests.put(f"{BASE_URL}/api/admin/users/{self.test_user_id}", 
            json={"is_active": False}, headers=self.headers)
        
        # Then activate
        response = requests.put(f"{BASE_URL}/api/admin/users/{self.test_user_id}", 
            json={"is_active": True}, headers=self.headers)
        assert response.status_code == 200
        assert response.json()["user"]["is_active"] == True
        print("✓ User activated successfully")
    
    def test_update_cafe_name(self):
        """Test admin can update café name"""
        new_name = "Updated Café Name"
        response = requests.put(f"{BASE_URL}/api/admin/users/{self.test_user_id}", 
            json={"cafe_name": new_name}, headers=self.headers)
        assert response.status_code == 200
        assert response.json()["user"]["full_name"] == new_name
        print(f"✓ Café name updated to '{new_name}'")


class TestAdminResetPassword:
    """Admin reset password tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get admin token and create a test user"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Create a test user
        self.test_email = f"TEST_reset_{uuid.uuid4().hex[:8]}@example.com"
        self.original_password = "originalpass123"
        create_response = requests.post(f"{BASE_URL}/api/admin/users", json={
            "email": self.test_email,
            "password": self.original_password,
            "cafe_name": "Test Reset Café"
        }, headers=self.headers)
        
        if create_response.status_code == 200:
            self.test_user_id = create_response.json()["user"]["id"]
        else:
            pytest.skip("Failed to create test user for reset password tests")
        
        yield
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{self.test_user_id}", 
            headers=self.headers)
    
    def test_reset_password(self):
        """Test admin can reset user password"""
        new_password = "newpassword456"
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{self.test_user_id}/reset-password",
            json={"new_password": new_password},
            headers=self.headers
        )
        assert response.status_code == 200
        assert response.json()["success"] == True
        print("✓ Password reset successful")
        
        # Old password should not work
        old_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.original_password
        })
        assert old_login.status_code == 401
        print("✓ Old password no longer works")
        
        # New password should work
        new_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": new_password
        })
        assert new_login.status_code == 200
        print("✓ New password works correctly")


class TestAdminDeleteUser:
    """Admin delete user tests"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get admin token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_delete_user(self):
        """Test admin can delete a user"""
        # Create user to delete
        test_email = f"TEST_delete_{uuid.uuid4().hex[:8]}@example.com"
        create_response = requests.post(f"{BASE_URL}/api/admin/users", json={
            "email": test_email,
            "password": "deletetest123",
            "cafe_name": "Test Delete Café"
        }, headers=self.headers)
        
        user_id = create_response.json()["user"]["id"]
        
        # Delete the user
        delete_response = requests.delete(f"{BASE_URL}/api/admin/users/{user_id}", 
            headers=self.headers)
        assert delete_response.status_code == 200
        assert delete_response.json()["success"] == True
        print(f"✓ User {test_email} deleted")
        
        # Verify user cannot login anymore
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": "deletetest123"
        })
        assert login_response.status_code == 401
        print("✓ Deleted user cannot login")
        
        # Verify user not in admin list
        users_response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        users = users_response.json()
        user_ids = [u["id"] for u in users]
        assert user_id not in user_ids
        print("✓ Deleted user not in admin user list")
    
    def test_delete_nonexistent_user(self):
        """Test deleting non-existent user returns 404"""
        response = requests.delete(f"{BASE_URL}/api/admin/users/nonexistent-id-123", 
            headers=self.headers)
        assert response.status_code == 404
        print("✓ Delete non-existent user returns 404")


class TestDeactivatedUserCannotLogin:
    """Test deactivated users cannot login"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get admin token and create test user"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Create a test user
        self.test_email = f"TEST_deactivated_{uuid.uuid4().hex[:8]}@example.com"
        self.test_password = "testpass123"
        create_response = requests.post(f"{BASE_URL}/api/admin/users", json={
            "email": self.test_email,
            "password": self.test_password,
            "cafe_name": "Test Deactivated Café"
        }, headers=self.headers)
        
        if create_response.status_code == 200:
            self.test_user_id = create_response.json()["user"]["id"]
        else:
            pytest.skip("Failed to create test user")
        
        yield
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{self.test_user_id}", 
            headers=self.headers)
    
    def test_deactivated_user_cannot_login(self):
        """Test that deactivated users get 403 when trying to login"""
        # First verify user can login normally
        login1 = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        assert login1.status_code == 200
        print("✓ Active user can login")
        
        # Deactivate the user
        requests.put(f"{BASE_URL}/api/admin/users/{self.test_user_id}", 
            json={"is_active": False}, headers=self.headers)
        
        # Try to login - should get 403
        login2 = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.test_email,
            "password": self.test_password
        })
        assert login2.status_code == 403
        assert "deactivated" in login2.json().get("detail", "").lower()
        print("✓ Deactivated user cannot login (403)")


class TestRegularUserCannotAccessAdmin:
    """Test regular users cannot access admin endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get regular user token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": REGULAR_USER_EMAIL,
            "password": REGULAR_USER_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Could not login as regular user")
        
        self.token = login_response.json()["token"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_regular_user_cannot_get_admin_stats(self):
        """Test regular user cannot access /admin/stats"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=self.headers)
        assert response.status_code == 403
        print("✓ Regular user blocked from /admin/stats (403)")
    
    def test_regular_user_cannot_get_admin_users(self):
        """Test regular user cannot access /admin/users"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=self.headers)
        assert response.status_code == 403
        print("✓ Regular user blocked from /admin/users (403)")
    
    def test_regular_user_cannot_create_user(self):
        """Test regular user cannot create users via admin endpoint"""
        response = requests.post(f"{BASE_URL}/api/admin/users", json={
            "email": "test@test.com",
            "password": "test123",
            "cafe_name": "Test"
        }, headers=self.headers)
        assert response.status_code == 403
        print("✓ Regular user blocked from creating users (403)")
    
    def test_regular_user_cannot_delete_user(self):
        """Test regular user cannot delete users"""
        response = requests.delete(f"{BASE_URL}/api/admin/users/some-id", 
            headers=self.headers)
        assert response.status_code == 403
        print("✓ Regular user blocked from deleting users (403)")


class TestAdminCannotModifyOtherAdmins:
    """Test that admin cannot modify other admin accounts"""
    
    @pytest.fixture(autouse=True)
    def setup_auth(self):
        """Get admin token and find admin user id"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        self.token = login_response.json()["token"]
        self.admin_id = login_response.json()["user"]["id"]
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_cannot_delete_admin_user(self):
        """Test cannot delete admin user"""
        response = requests.delete(f"{BASE_URL}/api/admin/users/{self.admin_id}", 
            headers=self.headers)
        assert response.status_code == 403
        print("✓ Cannot delete admin user (403)")
    
    def test_cannot_deactivate_admin_user(self):
        """Test cannot deactivate admin user"""
        response = requests.put(f"{BASE_URL}/api/admin/users/{self.admin_id}", 
            json={"is_active": False}, headers=self.headers)
        assert response.status_code == 403
        print("✓ Cannot deactivate admin user (403)")
    
    def test_cannot_reset_admin_password_via_admin_endpoint(self):
        """Test cannot reset admin password via admin endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{self.admin_id}/reset-password",
            json={"new_password": "newpass123"},
            headers=self.headers
        )
        assert response.status_code == 403
        print("✓ Cannot reset admin password via admin endpoint (403)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
