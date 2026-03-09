"""
Tests for Frameflow Café Features - P0-P5 Feature Testing
Tests: AI Content Generation, Reel Generation, Best Posting Times, Scheduled Posts CRUD
"""

import pytest
import requests
import os
import json
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Demo user credentials for testing
DEMO_LOGIN_ENDPOINT = "/api/demo/login"
ADMIN_EMAIL = "admin@frameflow.cafe"
ADMIN_PASSWORD = "FrameflowAdmin2026"

@pytest.fixture(scope="module")
def api_session():
    """Create a requests session for API calls"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def demo_token(api_session):
    """Get demo user token"""
    try:
        response = api_session.post(f"{BASE_URL}/api/demo/login")
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip(f"Demo login failed with status {response.status_code}")
    except Exception as e:
        pytest.skip(f"Demo login exception: {str(e)}")

@pytest.fixture(scope="module")
def admin_token(api_session):
    """Get admin user token"""
    try:
        response = api_session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        pytest.skip(f"Admin login failed with status {response.status_code}")
    except Exception as e:
        pytest.skip(f"Admin login exception: {str(e)}")

@pytest.fixture(scope="module")
def authenticated_session(api_session, demo_token):
    """Session with demo auth header"""
    api_session.headers.update({"Authorization": f"Bearer {demo_token}"})
    return api_session

@pytest.fixture(scope="module")
def demo_brand_id(authenticated_session):
    """Get demo brand ID"""
    response = authenticated_session.get(f"{BASE_URL}/api/brands")
    if response.status_code == 200:
        brands = response.json()
        if brands and len(brands) > 0:
            return brands[0]["id"]
    pytest.skip("No brands found for demo user")


class TestDemoLoginFlow:
    """Test demo login creates user and returns valid token"""
    
    def test_demo_login_returns_token(self, api_session):
        """Test /api/demo/login returns valid token"""
        response = api_session.post(f"{BASE_URL}/api/demo/login")
        
        assert response.status_code == 200, f"Demo login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token not in response"
        assert "user" in data, "User not in response"
        assert data["token"], "Token is empty"
        print(f"SUCCESS: Demo login returned token and user data")


class TestCafeContentGeneration:
    """Tests for /api/cafe/generate-content endpoint"""
    
    def test_generate_post_content(self, authenticated_session, demo_brand_id):
        """Test generating post content for café"""
        payload = {
            "brand_id": demo_brand_id,
            "content_type": "post",
            "topic": "New pumpkin spice latte launch",
            "promotion_details": "20% off this weekend"
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/cafe/generate-content", json=payload)
        
        assert response.status_code == 200, f"Content generation failed: {response.text}"
        data = response.json()
        assert "generated_content" in data, "No generated_content in response"
        assert "content_id" in data, "No content_id in response"
        assert len(data["generated_content"]) > 50, "Generated content too short"
        print(f"SUCCESS: Generated post content with ID: {data['content_id']}")
    
    def test_generate_story_content(self, authenticated_session, demo_brand_id):
        """Test generating story content"""
        payload = {
            "brand_id": demo_brand_id,
            "content_type": "story",
            "topic": "Morning coffee vibes"
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/cafe/generate-content", json=payload)
        
        assert response.status_code == 200, f"Story generation failed: {response.text}"
        data = response.json()
        assert "generated_content" in data
        print("SUCCESS: Generated story content")
    
    def test_generate_ad_content(self, authenticated_session, demo_brand_id):
        """Test generating ad content"""
        payload = {
            "brand_id": demo_brand_id,
            "content_type": "ad",
            "topic": "Weekend brunch promotion",
            "promotion_details": "Free coffee with any brunch order"
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/cafe/generate-content", json=payload)
        
        assert response.status_code == 200, f"Ad generation failed: {response.text}"
        data = response.json()
        assert "generated_content" in data
        print("SUCCESS: Generated ad content")


class TestReelGeneration:
    """Tests for /api/reels/generate-concept endpoint"""
    
    def test_generate_reel_concept(self, authenticated_session, demo_brand_id):
        """Test generating reel concept"""
        payload = {
            "brand_id": demo_brand_id,
            "theme": "Latte Art Pour",
            "clips_description": "Close-up of barista creating latte art",
            "duration_seconds": 30
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/reels/generate-concept", json=payload)
        
        assert response.status_code == 200, f"Reel generation failed: {response.text}"
        data = response.json()
        assert "concept" in data, "No concept in response"
        assert "reel_id" in data, "No reel_id in response"
        assert "theme" in data, "No theme in response"
        print(f"SUCCESS: Generated reel concept with ID: {data['reel_id']}")
    
    def test_get_trending_reel_formats(self, authenticated_session):
        """Test getting trending reel formats"""
        response = authenticated_session.get(f"{BASE_URL}/api/reels/trending-formats")
        
        assert response.status_code == 200, f"Trending formats failed: {response.text}"
        data = response.json()
        assert "trending_formats" in data, "No trending_formats in response"
        assert len(data["trending_formats"]) > 0, "Empty trending formats"
        assert "trending_audios" in data, "No trending_audios in response"
        print(f"SUCCESS: Got {len(data['trending_formats'])} trending reel formats")


class TestBestPostingTimes:
    """Tests for /api/analytics/best-posting-times endpoint"""
    
    def test_get_best_posting_times(self, authenticated_session):
        """Test getting AI-recommended posting times"""
        response = authenticated_session.get(f"{BASE_URL}/api/analytics/best-posting-times")
        
        assert response.status_code == 200, f"Best posting times failed: {response.text}"
        data = response.json()
        
        assert "best_times" in data, "No best_times in response"
        assert "today_recommendation" in data, "No today_recommendation in response"
        assert "content_type_times" in data, "No content_type_times in response"
        
        # Verify best times structure
        best_times = data["best_times"]
        assert len(best_times) > 0, "No posting times returned"
        
        first_time = best_times[0]
        assert "time" in first_time, "No time in recommendation"
        assert "engagement_score" in first_time, "No engagement_score"
        
        print(f"SUCCESS: Got {len(best_times)} recommended posting times")
        print(f"Today's best time: {data['today_recommendation']['time']}")


class TestScheduledPostsCRUD:
    """Tests for scheduled posts CRUD operations"""
    
    @pytest.fixture
    def scheduled_post_id(self, authenticated_session, demo_brand_id):
        """Create a scheduled post for testing"""
        future_date = datetime.utcnow() + timedelta(days=1)
        payload = {
            "content_type": "image",
            "caption": "TEST_scheduled_post_caption for testing",
            "scheduled_at": future_date.isoformat(),
            "platform": "instagram",
            "brand_id": demo_brand_id
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/scheduled-posts", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("id")
        return None
    
    def test_create_scheduled_post(self, authenticated_session, demo_brand_id):
        """Test creating a new scheduled post"""
        future_date = datetime.utcnow() + timedelta(days=2)
        payload = {
            "content_type": "image",
            "caption": "TEST_create_scheduled_post - Weekend special!",
            "scheduled_at": future_date.isoformat(),
            "platform": "instagram",
            "brand_id": demo_brand_id
        }
        
        response = authenticated_session.post(f"{BASE_URL}/api/scheduled-posts", json=payload)
        
        assert response.status_code == 200, f"Create scheduled post failed: {response.text}"
        data = response.json()
        assert "id" in data, "No id in response"
        assert data["caption"] == payload["caption"], "Caption mismatch"
        print(f"SUCCESS: Created scheduled post with ID: {data['id']}")
        
        # Cleanup - delete the created post
        delete_response = authenticated_session.delete(f"{BASE_URL}/api/scheduled-posts/{data['id']}")
        print(f"Cleanup: Deleted test post, status: {delete_response.status_code}")
    
    def test_get_scheduled_posts(self, authenticated_session):
        """Test getting list of scheduled posts"""
        response = authenticated_session.get(f"{BASE_URL}/api/scheduled-posts")
        
        assert response.status_code == 200, f"Get scheduled posts failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"SUCCESS: Retrieved {len(data)} scheduled posts")
    
    def test_update_scheduled_post(self, authenticated_session, demo_brand_id):
        """Test updating a scheduled post"""
        # First create a post
        future_date = datetime.utcnow() + timedelta(days=3)
        create_payload = {
            "content_type": "image",
            "caption": "TEST_original_caption",
            "scheduled_at": future_date.isoformat(),
            "platform": "instagram",
            "brand_id": demo_brand_id
        }
        
        create_response = authenticated_session.post(f"{BASE_URL}/api/scheduled-posts", json=create_payload)
        assert create_response.status_code == 200, f"Failed to create post for update test"
        post_id = create_response.json()["id"]
        
        # Update the post
        update_payload = {
            "caption": "TEST_updated_caption",
            "content_type": "image",
            "scheduled_at": future_date.isoformat(),
            "platform": "instagram"
        }
        
        update_response = authenticated_session.put(f"{BASE_URL}/api/scheduled-posts/{post_id}", json=update_payload)
        
        assert update_response.status_code == 200, f"Update scheduled post failed: {update_response.text}"
        updated_data = update_response.json()
        assert updated_data["caption"] == "TEST_updated_caption", "Caption not updated"
        print(f"SUCCESS: Updated scheduled post ID: {post_id}")
        
        # Cleanup
        authenticated_session.delete(f"{BASE_URL}/api/scheduled-posts/{post_id}")
    
    def test_delete_scheduled_post(self, authenticated_session, demo_brand_id):
        """Test deleting a scheduled post"""
        # First create a post
        future_date = datetime.utcnow() + timedelta(days=4)
        create_payload = {
            "content_type": "video",
            "caption": "TEST_post_to_delete",
            "scheduled_at": future_date.isoformat(),
            "platform": "instagram",
            "brand_id": demo_brand_id
        }
        
        create_response = authenticated_session.post(f"{BASE_URL}/api/scheduled-posts", json=create_payload)
        assert create_response.status_code == 200
        post_id = create_response.json()["id"]
        
        # Delete the post
        delete_response = authenticated_session.delete(f"{BASE_URL}/api/scheduled-posts/{post_id}")
        
        assert delete_response.status_code == 200, f"Delete scheduled post failed: {delete_response.text}"
        print(f"SUCCESS: Deleted scheduled post ID: {post_id}")
        
        # Verify it's gone
        get_response = authenticated_session.get(f"{BASE_URL}/api/scheduled-posts/{post_id}")
        assert get_response.status_code == 404, "Post should be deleted"


class TestAnalyticsDashboard:
    """Tests for analytics dashboard endpoints"""
    
    def test_get_instagram_analytics(self, authenticated_session):
        """Test getting Instagram analytics (demo data)"""
        response = authenticated_session.get(f"{BASE_URL}/api/analytics/instagram")
        
        assert response.status_code == 200, f"Instagram analytics failed: {response.text}"
        data = response.json()
        
        # Should return demo analytics since Instagram is not connected
        assert "account" in data, "No account in response"
        assert "overview" in data or "is_live_data" in data, "Missing expected fields"
        print(f"SUCCESS: Got Instagram analytics data (is_live_data: {data.get('is_live_data', False)})")


class TestIntegrationsStatus:
    """Tests for integrations status endpoint"""
    
    def test_get_integrations_status(self, authenticated_session):
        """Test getting integrations status"""
        response = authenticated_session.get(f"{BASE_URL}/api/integrations/status")
        
        assert response.status_code == 200, f"Integrations status failed: {response.text}"
        data = response.json()
        
        assert "instagram" in data, "No instagram in response"
        assert "meta_ads" in data, "No meta_ads in response"
        assert "connected" in data["instagram"], "Missing connected status for instagram"
        print(f"SUCCESS: Got integrations status - Instagram connected: {data['instagram']['connected']}")


class TestNavigationPages:
    """Test that navigation endpoints return valid responses"""
    
    def test_get_brands(self, authenticated_session):
        """Test getting brands list"""
        response = authenticated_session.get(f"{BASE_URL}/api/brands")
        assert response.status_code == 200, f"Get brands failed: {response.text}"
        print(f"SUCCESS: Retrieved brands list")
    
    def test_get_projects(self, authenticated_session):
        """Test getting projects list"""
        response = authenticated_session.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200, f"Get projects failed: {response.text}"
        print(f"SUCCESS: Retrieved projects list")
    
    def test_get_templates(self, authenticated_session):
        """Test getting templates list"""
        response = authenticated_session.get(f"{BASE_URL}/api/templates")
        assert response.status_code == 200, f"Get templates failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Templates should be a list"
        assert len(data) > 0, "Should have at least one template"
        print(f"SUCCESS: Retrieved {len(data)} templates")
    
    def test_get_ad_campaigns(self, authenticated_session):
        """Test getting ad campaigns list"""
        response = authenticated_session.get(f"{BASE_URL}/api/ads/campaigns")
        assert response.status_code == 200, f"Get ad campaigns failed: {response.text}"
        print(f"SUCCESS: Retrieved ad campaigns")


class TestAdminEndpoints:
    """Tests for admin-specific endpoints"""
    
    def test_admin_get_users(self, api_session, admin_token):
        """Test admin can get users list"""
        api_session.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_session.get(f"{BASE_URL}/api/admin/users")
        
        assert response.status_code == 200, f"Admin get users failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Users should be a list"
        print(f"SUCCESS: Admin retrieved {len(data)} users")
    
    def test_admin_get_stats(self, api_session, admin_token):
        """Test admin can get platform stats"""
        api_session.headers.update({"Authorization": f"Bearer {admin_token}"})
        response = api_session.get(f"{BASE_URL}/api/admin/stats")
        
        assert response.status_code == 200, f"Admin get stats failed: {response.text}"
        data = response.json()
        assert "total_users" in data, "Missing total_users in stats"
        assert "total_brands" in data, "Missing total_brands in stats"
        print(f"SUCCESS: Admin retrieved platform stats - {data['total_users']} users")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
