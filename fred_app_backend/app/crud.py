from sqlalchemy.orm import Session
from sqlalchemy import desc, case
from typing import List, Optional
from datetime import datetime, date
import uuid

from app import models, schemas
from app.utils import now_brasilia, to_brasilia


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
    existing_tasks = db.query(models.RoutineItem).filter(
        models.RoutineItem.pet_id == pet_id,
        models.RoutineItem.date == target_date
    ).all()

    # Get active templates
    templates = get_routine_templates(db, pet_id, active_only=True)

    # Track which templates already have items for this date
    existing_template_ids = {
        task.template_id for task in existing_tasks if task.template_id is not None
    }

    # Create routine items from templates that are missing
    created_items = []
    for template in templates:
        if template.id in existing_template_ids:
            continue

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

    return existing_tasks + created_items


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
                # Parse the datetime and convert to Brasília timezone
                dt = datetime.fromisoformat(routine_item_update.completed_at.replace('Z', '+00:00'))
                db_routine_item.completed_at = to_brasilia(dt)
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
    from app.utils import get_time_of_day_from_hour

    # Set default date if not provided
    reading_date = glucose_reading.date or str(date.today())

    # Calculate time_of_day based on current hour in Brasília timezone
    current_time = now_brasilia()
    time_of_day = get_time_of_day_from_hour(current_time.hour)

    db_glucose_reading = models.GlucoseReading(
        id=str(uuid.uuid4()),
        pet_id=pet_id,
        value=glucose_reading.value,
        time_of_day=time_of_day,
        protocol=glucose_reading.protocol,
        notes=glucose_reading.notes,
        insulin_dose=glucose_reading.insulin_dose,
        date=reading_date
    )
    db.add(db_glucose_reading)
    db.commit()
    db.refresh(db_glucose_reading)
    return db_glucose_reading


def update_glucose_reading(db: Session, glucose_reading_id: str, updates: schemas.GlucoseReadingUpdate):
    db_glucose_reading = (
        db.query(models.GlucoseReading).filter(models.GlucoseReading.id == glucose_reading_id).first()
    )

    if not db_glucose_reading:
        return None

    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_glucose_reading, field, value)

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


def _normalize_pause_events(pause_events):
    if not pause_events:
        return None

    normalized = []
    for pause in pause_events:
        started_raw = pause.started_at if isinstance(pause, schemas.WalkPauseSegment) else pause.get("started_at")
        ended_raw = pause.ended_at if isinstance(pause, schemas.WalkPauseSegment) else pause.get("ended_at")

        if isinstance(started_raw, str):
            started_raw = datetime.fromisoformat(started_raw.replace("Z", "+00:00"))
        if isinstance(ended_raw, str):
            ended_raw = datetime.fromisoformat(ended_raw.replace("Z", "+00:00"))

        started_at_brt = to_brasilia(started_raw) if started_raw else None
        ended_at_brt = to_brasilia(ended_raw) if ended_raw else None

        normalized.append({
            "started_at": started_at_brt.isoformat() if started_at_brt else None,
            "ended_at": ended_at_brt.isoformat() if ended_at_brt else None,
        })
    return normalized


# Walk Entry CRUD operations
def get_walk_entries(
    db: Session,
    pet_id: str,
    limit: int = 30,
    sort: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = db.query(models.WalkEntry).filter(models.WalkEntry.pet_id == pet_id)

    if start_date:
        query = query.filter(models.WalkEntry.date >= start_date)
    if end_date:
        query = query.filter(models.WalkEntry.date <= end_date)

    if sort == "start_time:asc":
        query = query.order_by(models.WalkEntry.start_time.asc())
    else:
        query = query.order_by(desc(models.WalkEntry.start_time))

    if limit:
        query = query.limit(limit)

    return query.all()


def create_walk_entry(db: Session, walk_entry: schemas.WalkEntryCreate, pet_id: str):
    start_time = to_brasilia(walk_entry.start_time)
    end_time = to_brasilia(walk_entry.end_time) if walk_entry.end_time else None

    # Calculate duration if not provided and we have end_time
    duration_seconds = walk_entry.duration_seconds
    if duration_seconds is None and end_time:
        duration_seconds = int((end_time - start_time).total_seconds())

    pause_events = _normalize_pause_events(walk_entry.pause_events)
    entry_date = walk_entry.date or start_time.date().isoformat()

    db_walk_entry = models.WalkEntry(
        id=str(uuid.uuid4()),
        pet_id=pet_id,
        date=entry_date,
        start_time=start_time,
        end_time=end_time,
        duration_seconds=duration_seconds,
        pause_events=pause_events,
        energy_level=walk_entry.energy_level,
        behavior=walk_entry.behavior,
        completed_route=walk_entry.completed_route if walk_entry.completed_route is not None else True,
        pee_count=walk_entry.pee_count,
        pee_volume=walk_entry.pee_volume,
        pee_color=walk_entry.pee_color,
        poop_made=walk_entry.poop_made if walk_entry.poop_made is not None else False,
        poop_consistency=walk_entry.poop_consistency,
        poop_blood=walk_entry.poop_blood,
        poop_mucus=walk_entry.poop_mucus,
        poop_color=walk_entry.poop_color,
        photos=walk_entry.photos,
        weather=walk_entry.weather,
        temperature_celsius=walk_entry.temperature_celsius,
        route_distance_km=walk_entry.route_distance_km,
        route_description=walk_entry.route_description,
        mobility_notes=walk_entry.mobility_notes,
        disorientation=walk_entry.disorientation,
        excessive_panting=walk_entry.excessive_panting,
        cough=walk_entry.cough,
        notes=walk_entry.notes,
        alerts=walk_entry.alerts,
    )
    db.add(db_walk_entry)
    db.commit()
    db.refresh(db_walk_entry)
    return db_walk_entry


def update_walk_entry(db: Session, walk_entry_id: str, updates: schemas.WalkEntryUpdate):
    db_walk_entry = db.query(models.WalkEntry).filter(models.WalkEntry.id == walk_entry_id).first()

    if not db_walk_entry:
        return None

    update_data = updates.model_dump(exclude_unset=True)

    if "pause_events" in update_data:
        update_data["pause_events"] = _normalize_pause_events(update_data["pause_events"])

    if "end_time" in update_data:
        end_time = update_data["end_time"]
        update_data["end_time"] = to_brasilia(end_time) if end_time else None

    for field, value in update_data.items():
        setattr(db_walk_entry, field, value)

    # Automatically recompute duration if end_time updated and duration not explicitly provided
    if "end_time" in update_data and "duration_seconds" not in update_data and db_walk_entry.end_time:
        db_walk_entry.duration_seconds = int((db_walk_entry.end_time - db_walk_entry.start_time).total_seconds())

    db.commit()
    db.refresh(db_walk_entry)
    return db_walk_entry


def delete_walk_entry(db: Session, walk_entry_id: str):
    db_walk_entry = db.query(models.WalkEntry).filter(models.WalkEntry.id == walk_entry_id).first()
    if db_walk_entry:
        db.delete(db_walk_entry)
        db.commit()
    return db_walk_entry
