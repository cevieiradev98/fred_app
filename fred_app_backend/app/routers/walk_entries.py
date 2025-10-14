from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.get("/walk-entries", response_model=List[schemas.WalkEntry])
def read_walk_entries(
    pet_id: str = Query(..., description="Pet ID"),
    limit: int = Query(30, description="Número máximo de registros"),
    sort: Optional[str] = Query("start_time:desc", description="Ordenação desejada"),
    start_date: Optional[str] = Query(None, description="Filtra passeios a partir desta data (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filtra passeios até esta data (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
):
    return crud.get_walk_entries(
        db,
        pet_id=pet_id,
        limit=limit,
        sort=sort,
        start_date=start_date,
        end_date=end_date,
    )


@router.post("/walk-entries", response_model=schemas.WalkEntry)
def create_walk_entry(
    walk_entry: schemas.WalkEntryCreate,
    pet_id: str = Query(..., description="Pet ID"),
    db: Session = Depends(get_db),
):
    pet = crud.get_pet(db, pet_id=pet_id)
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")

    return crud.create_walk_entry(db=db, walk_entry=walk_entry, pet_id=pet_id)


@router.patch("/walk-entries/{walk_entry_id}", response_model=schemas.WalkEntry)
def update_walk_entry(
    walk_entry_id: str,
    updates: schemas.WalkEntryUpdate,
    db: Session = Depends(get_db),
):
    db_walk_entry = crud.update_walk_entry(db, walk_entry_id=walk_entry_id, updates=updates)
    if db_walk_entry is None:
        raise HTTPException(status_code=404, detail="Walk entry not found")
    return db_walk_entry


@router.delete("/walk-entries/{walk_entry_id}")
def delete_walk_entry(
    walk_entry_id: str,
    db: Session = Depends(get_db),
):
    db_walk_entry = crud.delete_walk_entry(db, walk_entry_id=walk_entry_id)
    if db_walk_entry is None:
        raise HTTPException(status_code=404, detail="Walk entry not found")
    return {"message": "Walk entry deleted successfully"}
