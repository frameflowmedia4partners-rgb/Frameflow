"""
Test Admin Credit Management for Frameflow
- Credit overview (all clients)
- Get client credits
- Add bonus credits
- Set monthly limit
- Reset credits
- Deduct credits
- Credit history tracking
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Super admin credentials
ADMIN_EMAIL = "adreej@frameflow.me"
ADMIN_PASS = "iamadreejandaarjavbanerjee6969"

# Test client (existing)
TEST_CLIENT_EMAIL = "test_client@example.com"
TEST_CLIENT_ID = "221220c5-6245-4628-a89b-152f57cba948"


class TestAdminCreditOverview:
    """Test admin credit overview endpoint"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS
        })
        return response.json()["token"]
    
    def test_get_credits_overview(self, admin_token):
        """Test admin can view credits overview for all clients"""
        response = requests.get(
            f"{BASE_URL}/api/admin/credits/overview",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check totals structure
        assert "totals" in data
        assert "total_clients" in data["totals"]
        assert "total_credits_used" in data["totals"]
        assert "total_credits_available" in data["totals"]
        assert "average_usage_percent" in data["totals"]
        
        # Check clients list structure
        assert "clients" in data
        assert isinstance(data["clients"], list)
        
        if len(data["clients"]) > 0:
            client = data["clients"][0]
            assert "client_id" in client
            assert "client_name" in client
            assert "email" in client
            assert "credits_used" in client
            assert "monthly_credits" in client
            assert "bonus_credits" in client
            assert "total_limit" in client
            assert "remaining" in client
            assert "usage_percent" in client
    
    def test_credits_overview_unauthorized(self):
        """Test credits overview requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/credits/overview")
        # Returns 401 (no token) or 403 (forbidden)
        assert response.status_code in [401, 403]


class TestClientCreditDetails:
    """Test getting credit details for specific client"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS
        })
        return response.json()["token"]
    
    def test_get_client_credits(self, admin_token):
        """Test admin can view detailed credit info for a client"""
        response = requests.get(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check response structure
        assert data["client_id"] == TEST_CLIENT_ID
        assert "client_name" in data
        assert "email" in data
        assert "credits_used" in data
        assert "monthly_credits" in data
        assert "bonus_credits" in data
        assert "total_available" in data
        assert "credit_history" in data
        
        # Verify credit_history is a list
        assert isinstance(data["credit_history"], list)
    
    def test_get_nonexistent_client_credits(self, admin_token):
        """Test getting credits for nonexistent client returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/admin/clients/nonexistent-id/credits",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestAddBonusCredits:
    """Test adding bonus credits to client"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS
        })
        return response.json()["token"]
    
    def test_add_bonus_credits(self, admin_token):
        """Test admin can add bonus credits"""
        # Get current state
        before = requests.get(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"}
        ).json()
        
        bonus_amount = 25
        response = requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "add_bonus",
                "amount": bonus_amount,
                "reason": "Test bonus via pytest"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "message" in data
        assert f"Added {bonus_amount} bonus credits" in data["message"]
        assert "current_state" in data
        assert data["current_state"]["bonus_credits"] == before["bonus_credits"] + bonus_amount
    
    def test_add_bonus_without_amount_fails(self, admin_token):
        """Test adding bonus without amount fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "add_bonus",
                "reason": "No amount"
            }
        )
        assert response.status_code == 400
    
    def test_add_negative_bonus_fails(self, admin_token):
        """Test adding negative bonus amount fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "add_bonus",
                "amount": -50,
                "reason": "Negative test"
            }
        )
        assert response.status_code == 400


class TestSetCreditLimit:
    """Test setting monthly credit limit"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS
        })
        return response.json()["token"]
    
    def test_set_credit_limit(self, admin_token):
        """Test admin can set monthly credit limit"""
        new_limit = 600
        response = requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "set_limit",
                "amount": new_limit,
                "reason": "Updated plan via pytest"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert f"Monthly credit limit set to {new_limit}" in data["message"]
        assert data["current_state"]["monthly_credits"] == new_limit
    
    def test_set_limit_to_zero(self, admin_token):
        """Test admin can set limit to zero (pause credits)"""
        response = requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "set_limit",
                "amount": 0,
                "reason": "Pausing credits for testing"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["current_state"]["monthly_credits"] == 0
        
        # Restore to normal limit
        requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "set_limit",
                "amount": 500,
                "reason": "Restoring after test"
            }
        )


class TestResetCredits:
    """Test resetting client credits"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS
        })
        return response.json()["token"]
    
    def test_reset_credits(self, admin_token):
        """Test admin can reset credits used to zero"""
        # First deduct some credits to have something to reset
        requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "deduct",
                "amount": 5,
                "reason": "Pre-reset deduction"
            }
        )
        
        # Now reset
        response = requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "reset",
                "reason": "Monthly reset via pytest"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "Credits reset to 0" in data["message"]
        assert data["current_state"]["credits_used"] == 0


class TestDeductCredits:
    """Test deducting credits from client"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS
        })
        return response.json()["token"]
    
    def test_deduct_credits(self, admin_token):
        """Test admin can deduct credits"""
        # Get current state
        before = requests.get(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"}
        ).json()
        
        deduct_amount = 15
        response = requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "deduct",
                "amount": deduct_amount,
                "reason": "Test deduction via pytest"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert f"Deducted {deduct_amount} credits" in data["message"]
        assert data["current_state"]["credits_used"] == before["credits_used"] + deduct_amount
    
    def test_deduct_without_amount_fails(self, admin_token):
        """Test deducting without amount fails"""
        response = requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "deduct",
                "reason": "No amount"
            }
        )
        assert response.status_code == 400


class TestCreditHistory:
    """Test credit history tracking"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS
        })
        return response.json()["token"]
    
    def test_credit_history_recorded(self, admin_token):
        """Test that credit operations are recorded in history"""
        # Perform an action
        reason = f"History test {os.urandom(4).hex()}"
        requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "add_bonus",
                "amount": 5,
                "reason": reason
            }
        )
        
        # Check history
        response = requests.get(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Find our entry in history
        found = False
        for entry in data["credit_history"]:
            if entry["reason"] == reason:
                found = True
                assert entry["action"] == "add_bonus"
                assert entry["amount"] == 5
                assert "before_state" in entry
                assert "after_state" in entry
                assert "admin_email" in entry
                assert "timestamp" in entry
                break
        
        assert found, "Credit history entry not found"


class TestInvalidActions:
    """Test invalid credit management actions"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASS
        })
        return response.json()["token"]
    
    def test_invalid_action_rejected(self, admin_token):
        """Test invalid action is rejected"""
        response = requests.post(
            f"{BASE_URL}/api/admin/clients/{TEST_CLIENT_ID}/credits",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "action": "invalid_action",
                "amount": 10,
                "reason": "Should fail"
            }
        )
        assert response.status_code == 400
        assert "Invalid action" in response.json()["detail"]


class TestClientUserCannotAccessAdminCredits:
    """Test that client users cannot access admin credit management"""
    
    def test_client_cannot_access_credits_overview(self):
        """Test client user cannot access credit overview"""
        # Login as client
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": "testpass123"
        })
        
        if login_resp.status_code == 200:
            client_token = login_resp.json()["token"]
            
            response = requests.get(
                f"{BASE_URL}/api/admin/credits/overview",
                headers={"Authorization": f"Bearer {client_token}"}
            )
            # Should be forbidden for non-admin
            assert response.status_code == 403


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
