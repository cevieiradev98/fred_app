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


class GlucoseReadingCreate(GlucoseReadingBase):
    pass


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


# Error schema
class ErrorResponse(BaseModel):
    error: str
    message: str
    statusCode: int
