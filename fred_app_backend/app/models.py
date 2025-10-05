from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Pet(Base):
    __tablename__ = "pets"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    breed = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    routine_templates = relationship("RoutineTemplate", back_populates="pet")
    routine_items = relationship("RoutineItem", back_populates="pet")
    glucose_readings = relationship("GlucoseReading", back_populates="pet")
    mood_entries = relationship("MoodEntry", back_populates="pet")


class RoutineTemplate(Base):
    __tablename__ = "routine_templates"

    id = Column(String, primary_key=True, index=True)
    pet_id = Column(String, ForeignKey("pets.id"), nullable=False)
    period = Column(String, nullable=False)  # morning, afternoon, evening
    task = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    pet = relationship("Pet", back_populates="routine_templates")
    routine_items = relationship("RoutineItem", back_populates="template")


class RoutineItem(Base):
    __tablename__ = "routine_items"

    id = Column(String, primary_key=True, index=True)
    pet_id = Column(String, ForeignKey("pets.id"), nullable=False)
    template_id = Column(String, ForeignKey("routine_templates.id"), nullable=True)
    period = Column(String, nullable=False)  # morning, afternoon, evening
    task = Column(String, nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    date = Column(String, nullable=False)  # YYYY-MM-DD format
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    pet = relationship("Pet", back_populates="routine_items")
    template = relationship("RoutineTemplate", back_populates="routine_items")


class GlucoseReading(Base):
    __tablename__ = "glucose_readings"

    id = Column(String, primary_key=True, index=True)
    pet_id = Column(String, ForeignKey("pets.id"), nullable=False)
    value = Column(Float, nullable=False)
    time_of_day = Column(String, nullable=False)
    protocol = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    date = Column(String, nullable=False)  # YYYY-MM-DD format
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    pet = relationship("Pet", back_populates="glucose_readings")


class MoodEntry(Base):
    __tablename__ = "mood_entries"

    id = Column(String, primary_key=True, index=True)
    pet_id = Column(String, ForeignKey("pets.id"), nullable=False)
    energy_level = Column(String, nullable=False)  # alta, media, baixa
    general_mood = Column(JSON, nullable=False)
    appetite = Column(String, nullable=False)  # alto, normal, baixo, nao-comeu
    walk = Column(String, nullable=False)  # longo, curto, nao-passeou
    notes = Column(Text, nullable=True)
    date = Column(String, nullable=False)  # YYYY-MM-DD format
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    pet = relationship("Pet", back_populates="mood_entries")
