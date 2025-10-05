from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.get("/routine-items", response_model=List[schemas.RoutineItem])
def read_routine_items(
    pet_id: str = Query(..., description="Pet ID"),
    date_filter: Optional[str] = Query(None, alias="date", description="Date in YYYY-MM-DD format"),
    sort: Optional[str] = Query(None, description="Sort field"),
    db: Session = Depends(get_db)
):
    # Set default date if not provided
    if date_filter is None:
        date_filter = str(date.today())
    
    routine_items = crud.get_routine_items(db, pet_id=pet_id, date_filter=date_filter, sort=sort)
    return routine_items


@router.post("/routine-items", response_model=schemas.RoutineItem)
def create_routine_item(
    routine_item: schemas.RoutineItemCreate, 
    pet_id: str = Query(..., description="Pet ID"),
    db: Session = Depends(get_db)
):
    # Verify pet exists
    pet = crud.get_pet(db, pet_id=pet_id)
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return crud.create_routine_item(db=db, routine_item=routine_item, pet_id=pet_id)


@router.patch("/routine-items/{routine_item_id}", response_model=schemas.RoutineItem)
def update_routine_item(
    routine_item_id: str, 
    routine_item_update: schemas.RoutineItemUpdate, 
    db: Session = Depends(get_db)
):
    db_routine_item = crud.update_routine_item(db, routine_item_id=routine_item_id, routine_item_update=routine_item_update)
    if db_routine_item is None:
        raise HTTPException(status_code=404, detail="Routine item not found")
    return db_routine_item


@router.delete("/routine-items/{routine_item_id}")
def delete_routine_item(routine_item_id: str, db: Session = Depends(get_db)):
    db_routine_item = crud.delete_routine_item(db, routine_item_id=routine_item_id)
    if db_routine_item is None:
        raise HTTPException(status_code=404, detail="Routine item not found")
    return {"message": "Routine item deleted successfully"}
