from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# Pet schemas
class PetBase(BaseModel):
    name: str
    breed: Optional[str] = None
    age: Optional[int] = None


class PetCreate(PetBase):
    pass


class Pet(PetBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Routine Template schemas
class RoutineTemplateBase(BaseModel):
    period: str  # morning, afternoon, evening
    task: str


class RoutineTemplateCreate(RoutineTemplateBase):
    pass


class RoutineTemplateUpdate(BaseModel):
    is_active: Optional[bool] = None
    period: Optional[str] = None
    task: Optional[str] = None


class RoutineTemplate(RoutineTemplateBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Routine Item schemas
class RoutineItemBase(BaseModel):
    period: str  # morning, afternoon, evening
    task: str
    date: Optional[str] = None


class RoutineItemCreate(RoutineItemBase):
    template_id: Optional[str] = None


class RoutineItemUpdate(BaseModel):
    completed: bool
    completed_at: Optional[str] = None


class RoutineItem(RoutineItemBase):
    id: str
    template_id: Optional[str] = None
    completed: bool
    completed_at: Optional[datetime] = None
    date: str

    class Config:
        from_attributes = True


# Glucose Reading schemas
class GlucoseReadingBase(BaseModel):
    value: float
    time_of_day: str
    protocol: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None
    insulin_dose: Optional[float] = None


class GlucoseReadingCreate(BaseModel):
    value: float
    protocol: Optional[str] = None
    notes: Optional[str] = None
    date: Optional[str] = None
    insulin_dose: Optional[float] = None


class GlucoseReadingUpdate(BaseModel):
    insulin_dose: Optional[float] = None
    protocol: Optional[str] = None
    notes: Optional[str] = None


class GlucoseReading(GlucoseReadingBase):
    id: str
    date: str
    created_at: datetime

    class Config:
        from_attributes = True


# Mood Entry schemas
class MoodEntryBase(BaseModel):
    energy_level: str  # alta, media, baixa
    general_mood: List[str]
    appetite: str  # alto, normal, baixo, nao-comeu
    walk: str  # longo, curto, nao-passeou
    notes: Optional[str] = None
    date: Optional[str] = None


class MoodEntryCreate(MoodEntryBase):
    pass


class MoodEntry(MoodEntryBase):
    id: str
    date: str
    created_at: datetime

    class Config:
        from_attributes = True


class WalkPauseSegment(BaseModel):
    started_at: datetime
    ended_at: Optional[datetime] = None


class WalkEntryBase(BaseModel):
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    pause_events: Optional[List[WalkPauseSegment]] = None
    energy_level: Optional[str] = None  # very-low, low, moderate, high, very-high
    behavior: Optional[List[str]] = None
    completed_route: Optional[bool] = True
    pee_count: Optional[str] = None  # none, 1x, 2x, 3x-plus
    pee_volume: Optional[str] = None  # low, normal, high
    pee_color: Optional[str] = None  # normal, dark, blood
    poop_made: Optional[bool] = None
    poop_consistency: Optional[str] = None  # hard, normal, soft, diarrhea
    poop_blood: Optional[bool] = None
    poop_mucus: Optional[bool] = None
    poop_color: Optional[str] = None
    photos: Optional[List[str]] = None
    weather: Optional[str] = None
    temperature_celsius: Optional[float] = None
    route_distance_km: Optional[float] = None
    route_description: Optional[str] = None
    mobility_notes: Optional[str] = None
    disorientation: Optional[bool] = None
    excessive_panting: Optional[bool] = None
    cough: Optional[bool] = None
    notes: Optional[str] = None
    alerts: Optional[List[str]] = None
    date: Optional[str] = None


class WalkEntryCreate(WalkEntryBase):
    pass


class WalkEntryUpdate(BaseModel):
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    pause_events: Optional[List[WalkPauseSegment]] = None
    energy_level: Optional[str] = None
    behavior: Optional[List[str]] = None
    completed_route: Optional[bool] = None
    pee_count: Optional[str] = None
    pee_volume: Optional[str] = None
    pee_color: Optional[str] = None
    poop_made: Optional[bool] = None
    poop_consistency: Optional[str] = None
    poop_blood: Optional[bool] = None
    poop_mucus: Optional[bool] = None
    poop_color: Optional[str] = None
    photos: Optional[List[str]] = None
    weather: Optional[str] = None
    temperature_celsius: Optional[float] = None
    route_distance_km: Optional[float] = None
    route_description: Optional[str] = None
    mobility_notes: Optional[str] = None
    disorientation: Optional[bool] = None
    excessive_panting: Optional[bool] = None
    cough: Optional[bool] = None
    notes: Optional[str] = None
    alerts: Optional[List[str]] = None


class WalkEntry(WalkEntryBase):
    id: str
    date: str
    created_at: datetime

    class Config:
        from_attributes = True


# Error schema
class ErrorResponse(BaseModel):
    error: str
    message: str
    statusCode: int
