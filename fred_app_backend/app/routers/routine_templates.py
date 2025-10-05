from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app import crud, schemas
from app.database import get_db

router = APIRouter()


@router.get("/routine-templates", response_model=List[schemas.RoutineTemplate])
def read_routine_templates(
    pet_id: str = Query(..., description="Pet ID"),
    active_only: bool = Query(True, description="Return only active templates"),
    db: Session = Depends(get_db)
):
    templates = crud.get_routine_templates(db, pet_id=pet_id, active_only=active_only)
    return templates


@router.post("/routine-templates", response_model=schemas.RoutineTemplate)
def create_routine_template(
    template: schemas.RoutineTemplateCreate,
    pet_id: str = Query(..., description="Pet ID"),
    db: Session = Depends(get_db)
):
    # Verify pet exists
    pet = crud.get_pet(db, pet_id=pet_id)
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    return crud.create_routine_template(db=db, template=template, pet_id=pet_id)


@router.patch("/routine-templates/{template_id}", response_model=schemas.RoutineTemplate)
def update_routine_template(
    template_id: str,
    template_update: schemas.RoutineTemplateUpdate,
    db: Session = Depends(get_db)
):
    db_template = crud.update_routine_template(db, template_id=template_id, template_update=template_update)
    if db_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return db_template


@router.delete("/routine-templates/{template_id}")
def delete_routine_template(template_id: str, db: Session = Depends(get_db)):
    db_template = crud.delete_routine_template(db, template_id=template_id)
    if db_template is None:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"message": "Template deleted successfully"}


@router.post("/routine-items/ensure-daily", response_model=List[schemas.RoutineItem])
def ensure_daily_routine_items(
    pet_id: str = Query(..., description="Pet ID"),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    from datetime import date as date_class
    
    # Verify pet exists
    pet = crud.get_pet(db, pet_id=pet_id)
    if pet is None:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Set default date if not provided
    target_date = date or str(date_class.today())
    
    tasks = crud.ensure_daily_tasks(db, pet_id=pet_id, target_date=target_date)
    return tasks
