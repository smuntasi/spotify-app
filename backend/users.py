from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
import sqlalchemy
from sqlalchemy.exc import IntegrityError
from . import database as db, auth

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(auth.get_api_key)]
)

class UserCreate(BaseModel):
    display_name: str
    email: EmailStr
    country: str

class UserRead(UserCreate):
    user_id: int

@router.post("/create", response_model=UserRead)
def create_user(user: UserCreate):
    sql = """
    INSERT INTO users (display_name, email, country)
    VALUES (:display_name, :email, :country)
    RETURNING user_id, display_name, email, country
    """
    try:
        with db.engine.begin() as conn:
            row = conn.execute(sqlalchemy.text(sql), **user.model_dump()).fetchone()
            return dict(row)
    except IntegrityError as e:
        raise HTTPException(400, detail="Email already exists")

@router.get("/{user_id}", response_model=UserRead)
def get_user(user_id: int):
    sql = "SELECT user_id, display_name, email, country FROM users WHERE user_id = :user_id"
    with db.engine.begin() as conn:
        row = conn.execute(sqlalchemy.text(sql), {"user_id": user_id}).fetchone()
    if not row:
        raise HTTPException(404, detail="User not found")
    return dict(row)

@router.put("/{user_id}", response_model=UserRead)
def update_user(user_id: int, user: UserCreate):
    sql = """
    UPDATE users
       SET display_name = :display_name,
           email        = :email,
           country      = :country
     WHERE user_id     = :user_id
     RETURNING user_id, display_name, email, country
    """
    params = user.model_dump()
    params["user_id"] = user_id
    with db.engine.begin() as conn:
        row = conn.execute(sqlalchemy.text(sql), params).fetchone()
    if not row:
        raise HTTPException(404, detail="User not found")
    return dict(row)

@router.delete("/{user_id}")
def delete_user(user_id: int):
    sql = "DELETE FROM users WHERE user_id = :user_id"
    with db.engine.begin() as conn:
        result = conn.execute(sqlalchemy.text(sql), {"user_id": user_id})
    if result.rowcount == 0:
        raise HTTPException(404, detail="User not found")
    return {"detail": "User deleted"}
