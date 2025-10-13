from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.get("/glucose-readings", response_model=List[schemas.GlucoseReading])
def read_glucose_readings(
    pet_id: str = Query(..., description="Pet ID"),
    limit: int = Query(30, description="Maximum number of records"),
    sort: Optional[str] = Query(None, description="Sort order"),
    db: Session = Depends(get_db)
):
    glucose_readings = crud.get_glucose_readings(db, pet_id=pet_id, limit=limit, sort=sort)
    return glucose_readings


@router.post("/glucose-readings", response_model=schemas.GlucoseReading)
def create_glucose_reading(
    glucose_reading: schemas.GlucoseReadingCreate, 
    pet_id: str = Query(..., description="Pet ID"),
    db: Session = Depends(get_db)
):
    # Verify pet exists
    pet = crud.get_pet(db, pet_id=pet_id)
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return crud.create_glucose_reading(db=db, glucose_reading=glucose_reading, pet_id=pet_id)


@router.patch("/glucose-readings/{glucose_reading_id}", response_model=schemas.GlucoseReading)
def update_glucose_reading(
    glucose_reading_id: str,
    updates: schemas.GlucoseReadingUpdate,
    db: Session = Depends(get_db)
):
    db_glucose_reading = crud.update_glucose_reading(db, glucose_reading_id=glucose_reading_id, updates=updates)
    if db_glucose_reading is None:
        raise HTTPException(status_code=404, detail="Glucose reading not found")
    return db_glucose_reading


@router.delete("/glucose-readings/{glucose_reading_id}")
def delete_glucose_reading(glucose_reading_id: str, db: Session = Depends(get_db)):
    db_glucose_reading = crud.delete_glucose_reading(db, glucose_reading_id=glucose_reading_id)
    if db_glucose_reading is None:
        raise HTTPException(status_code=404, detail="Glucose reading not found")
    return {"message": "Glucose reading deleted successfully"}
