from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid

def generate_uuid():
    return str(uuid.uuid4())

try:
    from database import Base
except ImportError:
    from sqlalchemy.orm import declarative_base
    Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255))
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    brands = relationship('Brand', back_populates='user', cascade='all, delete-orphan')

class Brand(Base):
    __tablename__ = 'brands'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    tone = Column(String(100))
    colors = Column(JSON)
    logo_url = Column(String(500))
    industry = Column(String(100))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship('User', back_populates='brands')
    projects = relationship('Project', back_populates='brand', cascade='all, delete-orphan')
    media_assets = relationship('MediaAsset', back_populates='brand', cascade='all, delete-orphan')

class Project(Base):
    __tablename__ = 'projects'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey('brands.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False, index=True)
    status = Column(String(50), default='draft', index=True)
    thumbnail_url = Column(String(500))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    brand = relationship('Brand', back_populates='projects')
    contents = relationship('GeneratedContent', back_populates='project', cascade='all, delete-orphan')

class MediaAsset(Base):
    __tablename__ = 'media_assets'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    brand_id = Column(String(36), ForeignKey('brands.id', ondelete='CASCADE'), nullable=False, index=True)
    url = Column(String(500), nullable=False)
    type = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    size = Column(Integer)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    brand = relationship('Brand', back_populates='media_assets')

class GeneratedContent(Base):
    __tablename__ = 'generated_contents'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)
    prompt = Column(Text)
    content_url = Column(String(500))
    content_text = Column(Text)
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    project = relationship('Project', back_populates='contents')