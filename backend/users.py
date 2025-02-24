from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import sqlalchemy
from . import database as db, auth

router = APIRouter(
    prefix="/users",
    tags=["users"],
    dependencies=[Depends(auth.get_api_key)]
)

class User(BaseModel):
    user_id: int
    display_name: str
    email: str
    country: str

@router.post("/create")
def create_user(user: User):
    """
    Stores a new user in the database.
    """
    try:
        with db.engine.begin() as connection:
            connection.execute(sqlalchemy.text(
                """
                INSERT INTO users (user_id, display_name, email, country)
                VALUES (:user_id, :display_name, :email, :country)
                """
            ),
            {
                "user_id": user.user_id,
                "display_name": user.display_name,
                "email": user.email,
                "country": user.country
            })
        return {"message": "User added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/retrieve")
def get_users():
    with db.engine.begin() as connection:
        connection.execute(sqlalchemy.text(
            """
            SELECT * from users
            """
        )).fetchall()
