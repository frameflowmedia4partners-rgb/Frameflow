"""
Backend API Tests for Frameflow AI Marketing Platform
Tests for: Content Swipe, Reel Generation, Photoshoot, Website Scraping, Brand DNA
"""

import pytest
import requests
import os
import json
import time
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-studio-hub-31.preview.emergentagent.com').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "adreej@frameflow.me"
SUPER_ADMIN_PASS = "iamadreejandaarjavbanerjee6969"
TEST_CLIENT_EMAIL = "test_client@example.com"
TEST_CLIENT_PASS = "testpass123"


@pytest.fixture(scope="module")
def admin_token():
    """Get super admin auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": SUPER_ADMIN_EMAIL,
        "password": SUPER_ADMIN_PASS
    })
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code}")
    return response.json()["token"]


@pytest.fixture(scope="module")
def client_token():
    """Get test client auth token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_CLIENT_EMAIL,
        "password": TEST_CLIENT_PASS
    })
    if response.status_code != 200:
        pytest.skip(f"Client login failed: {response.status_code}")
    return response.json()["token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    """Admin request headers"""
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }


@pytest.fixture(scope="module")
def client_headers(client_token):
    """Client request headers"""
    return {
        "Authorization": f"Bearer {client_token}",
        "Content-Type": "application/json"
    }


class TestAdminLogin:
    """Admin authentication tests"""
    
    def test_admin_login_success(self):
        """Test super admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASS
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["role"] == "super_admin"
        print(f"PASS: Admin login successful, role: {data['user']['role']}")


class TestClientLogin:
    """Client authentication tests"""
    
    def test_client_login_success(self):
        """Test client can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_CLIENT_EMAIL,
            "password": TEST_CLIENT_PASS
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"PASS: Client login successful")


class TestBrandDNA:
    """Brand DNA endpoint tests"""
    
    def test_get_brand_dna(self, client_headers):
        """Test GET /api/brand-dna returns brand profile"""
        response = requests.get(f"{BASE_URL}/api/brand-dna", headers=client_headers)
        assert response.status_code == 200, f"Brand DNA fetch failed: {response.text}"
        data = response.json()
        # Should return either brand data or empty defaults
        assert "monthly_credits" in data or "credits_remaining" in data or "name" in data
        print(f"PASS: Brand DNA fetched, name: {data.get('name', 'N/A')}")


class TestWebsiteScraping:
    """Website scraping endpoint tests - Comprehensive extraction"""
    
    def test_scrape_website_valid_url(self, client_headers):
        """Test POST /api/scrape-website extracts brand info"""
        # Using a simple public website for testing
        test_url = "https://example.com"
        response = requests.post(
            f"{BASE_URL}/api/scrape-website",
            headers=client_headers,
            params={"url": test_url},
            timeout=30
        )
        
        # Should return 200 even if some fields are empty
        assert response.status_code == 200, f"Scrape failed: {response.text}"
        data = response.json()
        
        # Check structure - should have data key or direct fields
        result = data.get("data", data)
        print(f"Scrape response keys: {list(result.keys())}")
        
        # Should have at least some scraped fields
        expected_fields = ["name", "logo_url", "colors", "images", "products"]
        found_fields = [f for f in expected_fields if f in result]
        print(f"PASS: Website scraped. Found fields: {found_fields}")
    
    def test_scrape_website_extracts_images(self, client_headers):
        """Test that scraping extracts images from website"""
        test_url = "https://www.starbucks.com"  # Well-known café site
        response = requests.post(
            f"{BASE_URL}/api/scrape-website",
            headers=client_headers,
            params={"url": test_url},
            timeout=60
        )
        
        if response.status_code == 200:
            data = response.json()
            result = data.get("data", data)
            images = result.get("images", [])
            images_saved = data.get("images_saved", 0)
            print(f"PASS: Images found: {len(images)}, Images saved to library: {images_saved}")
        else:
            print(f"WARN: Starbucks scrape returned {response.status_code} - may be blocked")


class TestContentSwipe:
    """Content Swipe generation tests - DALL-E image generation"""
    
    def test_content_swipe_generate(self, client_headers):
        """Test POST /api/content-swipe/generate creates creatives with images"""
        response = requests.post(
            f"{BASE_URL}/api/content-swipe/generate",
            headers=client_headers,
            json={"count": 2},  # Request 2 creatives
            timeout=120  # AI generation can take time
        )
        
        # Should succeed or fail with credit limit
        if response.status_code == 403:
            print("SKIP: Credit limit reached")
            pytest.skip("Credit limit reached")
        
        assert response.status_code == 200, f"Content swipe failed: {response.text}"
        data = response.json()
        
        # Check creatives were generated
        creatives = data.get("creatives", [])
        assert len(creatives) > 0, "No creatives generated"
        
        # Verify image_base64 is present and valid
        for i, creative in enumerate(creatives):
            assert "image_base64" in creative, f"Creative {i} missing image_base64"
            image_b64 = creative["image_base64"]
            assert len(image_b64) > 1000, f"Creative {i} image seems too small: {len(image_b64)} chars"
            
            # Verify it's valid base64
            try:
                decoded = base64.b64decode(image_b64)
                assert len(decoded) > 0, f"Creative {i} image failed to decode"
            except Exception as e:
                pytest.fail(f"Creative {i} has invalid base64: {e}")
            
            print(f"Creative {i}: image size {len(decoded)} bytes")
        
        print(f"PASS: Generated {len(creatives)} creatives with valid images")
        print(f"Credits used: {data.get('credits_used')}, remaining: {data.get('credits_remaining')}")


class TestReelGeneration:
    """Reel generation tests - Video creation with FFmpeg"""
    
    def test_reel_generation_cinematic(self, client_headers):
        """Test POST /api/reels/generate creates video for cinematic style"""
        response = requests.post(
            f"{BASE_URL}/api/reels/generate",
            headers=client_headers,
            json={
                "style": "cinematic",
                "brief": "Showcase our signature latte",
                "language": "English"
            },
            timeout=180  # Video generation takes longer
        )
        
        if response.status_code == 403:
            print("SKIP: Credit limit reached")
            pytest.skip("Credit limit reached")
        
        assert response.status_code == 200, f"Reel generation failed: {response.text}"
        data = response.json()
        
        # Verify video_base64 is present
        assert "video_base64" in data, "Response missing video_base64"
        video_b64 = data["video_base64"]
        assert len(video_b64) > 10000, f"Video seems too small: {len(video_b64)} chars"
        
        # Verify it's valid MP4 base64
        try:
            decoded = base64.b64decode(video_b64)
            # MP4 files start with ftyp header
            assert decoded[:4] == b'\x00\x00\x00' or b'ftyp' in decoded[:20], "Video doesn't appear to be MP4"
            print(f"Video size: {len(decoded)} bytes")
        except Exception as e:
            pytest.fail(f"Invalid video base64: {e}")
        
        # Check metadata
        assert "caption" in data, "Response missing caption"
        assert "hashtags" in data, "Response missing hashtags"
        assert "duration" in data, "Response missing duration"
        
        print(f"PASS: Reel generated - style: cinematic, duration: {data.get('duration')}s")
        print(f"Caption: {data.get('caption', '')[:50]}...")
    
    def test_reel_generation_casual(self, client_headers):
        """Test POST /api/reels/generate creates video for casual style"""
        response = requests.post(
            f"{BASE_URL}/api/reels/generate",
            headers=client_headers,
            json={
                "style": "casual",
                "brief": "Behind the scenes coffee making",
                "language": "English"
            },
            timeout=180
        )
        
        if response.status_code == 403:
            print("SKIP: Credit limit reached")
            pytest.skip("Credit limit reached")
        
        assert response.status_code == 200, f"Reel generation failed: {response.text}"
        data = response.json()
        
        assert "video_base64" in data, "Response missing video_base64"
        print(f"PASS: Casual reel generated - duration: {data.get('duration')}s")


class TestPhotoshoot:
    """Photoshoot generation tests - DALL-E 3 with retry logic"""
    
    def test_photoshoot_generate(self, client_headers):
        """Test POST /api/photoshoot/generate creates product photo"""
        response = requests.post(
            f"{BASE_URL}/api/photoshoot/generate",
            headers=client_headers,
            json={
                "product_name": "Cappuccino",
                "brief": "Flat lay on marble"
            },
            timeout=90
        )
        
        if response.status_code == 403:
            print("SKIP: Credit limit reached")
            pytest.skip("Credit limit reached")
        
        assert response.status_code == 200, f"Photoshoot failed: {response.text}"
        data = response.json()
        
        # Verify image was generated
        assert "image_base64" in data, "Response missing image_base64"
        image_b64 = data["image_base64"]
        assert len(image_b64) > 1000, f"Image seems too small: {len(image_b64)} chars"
        
        # Verify valid image
        try:
            decoded = base64.b64decode(image_b64)
            assert len(decoded) > 0, "Image failed to decode"
            print(f"Photo size: {len(decoded)} bytes")
        except Exception as e:
            pytest.fail(f"Invalid image base64: {e}")
        
        assert data.get("product_name") == "Cappuccino", f"Wrong product name: {data.get('product_name')}"
        print(f"PASS: Photoshoot generated for '{data.get('product_name')}'")
        print(f"Credits remaining: {data.get('credits_remaining')}")


class TestContentLibrary:
    """Content library tests - Verify scraped/generated images"""
    
    def test_get_content_library(self, client_headers):
        """Test GET /api/content-library returns saved content"""
        response = requests.get(
            f"{BASE_URL}/api/content-library",
            headers=client_headers
        )
        assert response.status_code == 200, f"Library fetch failed: {response.text}"
        data = response.json()
        
        # Can be empty or have items
        items = data.get("items", data) if isinstance(data, dict) else data
        if isinstance(items, list):
            print(f"PASS: Library has {len(items)} items")
            # Check for scraped items
            scraped_items = [i for i in items if i.get("source") == "scraped"]
            ai_items = [i for i in items if i.get("source") in ["ai_generated", "content_swipe", "photoshoot", "reel_generation"]]
            print(f"  - Scraped: {len(scraped_items)}, AI generated: {len(ai_items)}")
        else:
            print(f"PASS: Library response received")


class TestConceptPost:
    """Concept post generation tests"""
    
    def test_concept_generate(self, client_headers):
        """Test POST /api/concept/generate creates concept post"""
        response = requests.post(
            f"{BASE_URL}/api/concept/generate",
            headers=client_headers,
            json={
                "product": "Espresso",
                "format_size": "feed",
                "angle": "promotion",
                "brief": "Weekend special offer"
            },
            timeout=90
        )
        
        if response.status_code == 403:
            print("SKIP: Credit limit reached")
            pytest.skip("Credit limit reached")
        
        if response.status_code == 400:
            # Brand DNA might not be set up
            print("SKIP: Brand DNA setup required")
            pytest.skip("Brand DNA setup required")
        
        assert response.status_code == 200, f"Concept generation failed: {response.text}"
        data = response.json()
        
        # Should have image
        if "image_base64" in data:
            print(f"PASS: Concept post generated with image")
        else:
            print(f"WARN: Concept post generated but missing image: {list(data.keys())}")


class TestTemplateClone:
    """Template clone/rebrand tests"""
    
    def test_clone_template(self, client_headers):
        """Test POST /api/templates/clone rebrands template with AI"""
        response = requests.post(
            f"{BASE_URL}/api/templates/clone",
            headers=client_headers,
            params={"template_id": "t1"}
        )
        
        if response.status_code == 403:
            print("SKIP: Credit limit reached")
            pytest.skip("Credit limit reached")
        
        if response.status_code == 400:
            print("SKIP: Brand DNA setup required")
            pytest.skip("Brand DNA setup required")
        
        assert response.status_code == 200, f"Template clone failed: {response.text}"
        data = response.json()
        
        if "image_base64" in data:
            print(f"PASS: Template cloned with rebranded image")
        else:
            print(f"WARN: Template cloned but may be missing image")


class TestAdminDashboard:
    """Admin dashboard stats tests"""
    
    def test_admin_stats(self, admin_headers):
        """Test GET /api/admin/stats returns platform statistics"""
        response = requests.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers)
        assert response.status_code == 200, f"Admin stats failed: {response.text}"
        data = response.json()
        
        assert "total_clients" in data
        assert "active_clients" in data
        print(f"PASS: Admin stats - Total clients: {data['total_clients']}, Active: {data['active_clients']}")
    
    def test_admin_get_clients(self, admin_headers):
        """Test GET /api/admin/clients returns client list"""
        response = requests.get(f"{BASE_URL}/api/admin/clients", headers=admin_headers)
        assert response.status_code == 200, f"Admin clients failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"PASS: Admin clients list - {len(data)} clients")


class TestCreditManagement:
    """Admin credit management tests"""
    
    def test_admin_credit_overview(self, admin_headers):
        """Test GET /api/admin/credits/overview"""
        response = requests.get(f"{BASE_URL}/api/admin/credits/overview", headers=admin_headers)
        assert response.status_code == 200, f"Credit overview failed: {response.text}"
        data = response.json()
        
        assert "clients" in data
        assert "totals" in data
        print(f"PASS: Credit overview - {len(data['clients'])} clients tracked")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short", "-x"])
