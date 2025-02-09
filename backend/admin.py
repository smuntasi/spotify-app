from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from . import auth
import sqlalchemy
from . import database as db

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(auth.get_api_key)],
)

@router.post("/reset")
def reset():
    """
    Reset the state.
    """
    # TODO: implement logic to reset state

