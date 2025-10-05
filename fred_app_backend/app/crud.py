from sqlalchemy.orm import Session
from sqlalchemy import desc, case
from typing import List, Optional
from datetime import datetime, date
import uuid

from app import models, schemas


# Pet CRUD operations
def get_pet(db: Session, pet_id: str):
    return db.query(models.Pet).filter(models.Pet.id == pet_id).first()


def get_pets(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Pet).offset(skip).limit(limit).all()


def create_pet(db: Session, pet: schemas.PetCreate):
    db_pet = models.Pet(
        id=str(uuid.uuid4()),
        name=pet.name,
        breed=pet.breed,
        age=pet.age
    )
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    return db_pet


def delete_pet(db: Session, pet_id: str):
    db_pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if db_pet:
        db.delete(db_pet)
        db.commit()
    return db_pet


# Routine Template CRUD operations
def get_routine_templates(db: Session, pet_id: str, active_only: bool = True):
    query = db.query(models.RoutineTemplate).filter(models.RoutineTemplate.pet_id == pet_id)
    
    if active_only:
        query = query.filter(models.RoutineTemplate.is_active == True)
    
    return query.all()


def create_routine_template(db: Session, template: schemas.RoutineTemplateCreate, pet_id: str):
    db_template = models.RoutineTemplate(
        id=str(uuid.uuid4()),
        pet_id=pet_id,
        period=template.period,
        task=template.task,
        is_active=True
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


def update_routine_template(db: Session, template_id: str, template_update: schemas.RoutineTemplateUpdate):
    db_template = db.query(models.RoutineTemplate).filter(models.RoutineTemplate.id == template_id).first()
    if db_template:
        if template_update.is_active is not None:
            db_template.is_active = template_update.is_active
        if template_update.period is not None:
            db_template.period = template_update.period
        if template_update.task is not None:
            db_template.task = template_update.task
        db.commit()
        db.refresh(db_template)
    return db_template


def delete_routine_template(db: Session, template_id: str):
    db_template = db.query(models.RoutineTemplate).filter(models.RoutineTemplate.id == template_id).first()
    if db_template:
        db.delete(db_template)
        db.commit()
    return db_template


def ensure_daily_tasks(db: Session, pet_id: str, target_date: str):
    """
    Ensure that routine items exist for the given date.
    If they don't exist, create them from active templates.
    """
    # Check if tasks already exist for this date
    existing_tasks = db.query(models.RoutineItem).filter(
        models.RoutineItem.pet_id == pet_id,
        models.RoutineItem.date == target_date
    ).all()
    
    if existing_tasks:
        return existing_tasks
    
    # Get active templates
    templates = get_routine_templates(db, pet_id, active_only=True)
    
    # Create routine items from templates
    created_items = []
    for template in templates:
        db_routine_item = models.RoutineItem(
            id=str(uuid.uuid4()),
            pet_id=pet_id,
            template_id=template.id,
            period=template.period,
            task=template.task,
            date=target_date,
            completed=False
        )
        db.add(db_routine_item)
        created_items.append(db_routine_item)
    
    if created_items:
        db.commit()
        for item in created_items:
            db.refresh(item)
    
    return created_items


# Routine Item CRUD operations
def get_routine_items(db: Session, pet_id: str, date_filter: Optional[str] = None, sort: Optional[str] = None):
    query = db.query(models.RoutineItem).filter(models.RoutineItem.pet_id == pet_id)
    
    if date_filter:
        query = query.filter(models.RoutineItem.date == date_filter)
    
    if sort == "period":
        # Custom ordering for periods
        query = query.order_by(
            case(
                (models.RoutineItem.period == "morning", 1),
                (models.RoutineItem.period == "afternoon", 2),
                (models.RoutineItem.period == "evening", 3),
                else_=4
            )
        )
    
    return query.all()


def create_routine_item(db: Session, routine_item: schemas.RoutineItemCreate, pet_id: str):
    # Set default date if not provided
    item_date = routine_item.date or str(date.today())
    
    db_routine_item = models.RoutineItem(
        id=str(uuid.uuid4()),
        pet_id=pet_id,
        template_id=routine_item.template_id,
        period=routine_item.period,
        task=routine_item.task,
        date=item_date
    )
    db.add(db_routine_item)
    db.commit()
    db.refresh(db_routine_item)
    return db_routine_item


def update_routine_item(db: Session, routine_item_id: str, routine_item_update: schemas.RoutineItemUpdate):
    db_routine_item = db.query(models.RoutineItem).filter(models.RoutineItem.id == routine_item_id).first()
    if db_routine_item:
        db_routine_item.completed = routine_item_update.completed
        if routine_item_update.completed_at is not None:
            if routine_item_update.completed_at:
                db_routine_item.completed_at = datetime.fromisoformat(routine_item_update.completed_at.replace('Z', '+00:00'))
            else:
                db_routine_item.completed_at = None
        db.commit()
        db.refresh(db_routine_item)
    return db_routine_item


def delete_routine_item(db: Session, routine_item_id: str):
    db_routine_item = db.query(models.RoutineItem).filter(models.RoutineItem.id == routine_item_id).first()
    if db_routine_item:
        db.delete(db_routine_item)
        db.commit()
    return db_routine_item


# Glucose Reading CRUD operations
def get_glucose_readings(db: Session, pet_id: str, limit: int = 30, sort: Optional[str] = None):
    query = db.query(models.GlucoseReading).filter(models.GlucoseReading.pet_id == pet_id)
    
    if sort == "created_at:desc":
        query = query.order_by(desc(models.GlucoseReading.created_at))
    
    return query.limit(limit).all()


def create_glucose_reading(db: Session, glucose_reading: schemas.GlucoseReadingCreate, pet_id: str):
    # Set default date if not provided
    reading_date = glucose_reading.date or str(date.today())
    
    db_glucose_reading = models.GlucoseReading(
        id=str(uuid.uuid4()),
        pet_id=pet_id,
        value=glucose_reading.value,
        time_of_day=glucose_reading.time_of_day,
        protocol=glucose_reading.protocol,
        notes=glucose_reading.notes,
        date=reading_date
    )
    db.add(db_glucose_reading)
    db.commit()
    db.refresh(db_glucose_reading)
    return db_glucose_reading


def delete_glucose_reading(db: Session, glucose_reading_id: str):
    db_glucose_reading = db.query(models.GlucoseReading).filter(models.GlucoseReading.id == glucose_reading_id).first()
    if db_glucose_reading:
        db.delete(db_glucose_reading)
        db.commit()
    return db_glucose_reading


# Mood Entry CRUD operations
def get_mood_entries(db: Session, pet_id: str, limit: int = 30, sort: Optional[str] = None):
    query = db.query(models.MoodEntry).filter(models.MoodEntry.pet_id == pet_id)
    
    if sort == "created_at:desc":
        query = query.order_by(desc(models.MoodEntry.created_at))
    
    return query.limit(limit).all()


def create_mood_entry(db: Session, mood_entry: schemas.MoodEntryCreate, pet_id: str):
    # Set default date if not provided
    entry_date = mood_entry.date or str(date.today())
    
    db_mood_entry = models.MoodEntry(
        id=str(uuid.uuid4()),
        pet_id=pet_id,
        energy_level=mood_entry.energy_level,
        general_mood=mood_entry.general_mood,
        appetite=mood_entry.appetite,
        walk=mood_entry.walk,
        notes=mood_entry.notes,
        date=entry_date
    )
    db.add(db_mood_entry)
    db.commit()
    db.refresh(db_mood_entry)
    return db_mood_entry


def delete_mood_entry(db: Session, mood_entry_id: str):
    db_mood_entry = db.query(models.MoodEntry).filter(models.MoodEntry.id == mood_entry_id).first()
    if db_mood_entry:
        db.delete(db_mood_entry)
        db.commit()
    return db_mood_entry
