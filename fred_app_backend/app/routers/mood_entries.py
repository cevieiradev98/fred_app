from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.get("/mood-entries", response_model=List[schemas.MoodEntry])
def read_mood_entries(
    pet_id: str = Query(..., description="Pet ID"),
    limit: int = Query(30, description="Maximum number of records"),
    sort: Optional[str] = Query(None, description="Sort order"),
    db: Session = Depends(get_db)
):
    mood_entries = crud.get_mood_entries(db, pet_id=pet_id, limit=limit, sort=sort)
    return mood_entries


@router.post("/mood-entries", response_model=schemas.MoodEntry)
def create_mood_entry(
    mood_entry: schemas.MoodEntryCreate, 
    pet_id: str = Query(..., description="Pet ID"),
    db: Session = Depends(get_db)
):
    # Verify pet exists
    pet = crud.get_pet(db, pet_id=pet_id)
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return crud.create_mood_entry(db=db, mood_entry=mood_entry, pet_id=pet_id)


@router.delete("/mood-entries/{mood_entry_id}")
def delete_mood_entry(mood_entry_id: str, db: Session = Depends(get_db)):
    db_mood_entry = crud.delete_mood_entry(db, mood_entry_id=mood_entry_id)
    if db_mood_entry is None:
        raise HTTPException(status_code=404, detail="Mood entry not found")
    return {"message": "Mood entry deleted successfully"}
