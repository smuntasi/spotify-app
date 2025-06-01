from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import sqlalchemy
from . import database as db, auth

router = APIRouter(
    prefix="/playlists",
    tags=["playlists"],
    dependencies=[Depends(auth.get_api_key)]
)

class PlaylistCreate(BaseModel):
    user_id: int
    name: str
    description: str = ""

class PlaylistRead(PlaylistCreate):
    playlist_id: int

@router.post("/create", response_model=PlaylistRead)
def create_playlist(p: PlaylistCreate):
    sql = """
    INSERT INTO playlists (user_id, name, description)
    VALUES (:user_id, :name, :description)
    RETURNING playlist_id, user_id, name, description
    """
    with db.engine.begin() as conn:
        row = conn.execute(sqlalchemy.text(sql), **p.dict()).fetchone()
    return dict(row)

@router.get("/user/{user_id}", response_model=list[PlaylistRead])
def list_playlists(user_id: int):
    sql = "SELECT playlist_id, user_id, name, description FROM playlists WHERE user_id = :user_id"
    with db.engine.begin() as conn:
        rows = conn.execute(sqlalchemy.text(sql), {"user_id": user_id}).fetchall()
    return [dict(r) for r in rows]

@router.get("/{playlist_id}", response_model=PlaylistRead)
def get_playlist(playlist_id: int):
    sql = "SELECT playlist_id, user_id, name, description FROM playlists WHERE playlist_id = :playlist_id"
    with db.engine.begin() as conn:
        row = conn.execute(sqlalchemy.text(sql), {"playlist_id": playlist_id}).fetchone()
    if not row:
        raise HTTPException(404, "Playlist not found")
    return dict(row)

@router.delete("/{playlist_id}")
def delete_playlist(playlist_id: int):
    sql = "DELETE FROM playlists WHERE playlist_id = :playlist_id"
    with db.engine.begin() as conn:
        res = conn.execute(sqlalchemy.text(sql), {"playlist_id": playlist_id})
    if res.rowcount == 0:
        raise HTTPException(404, "Playlist not found")
    return {"detail": "Playlist deleted"}
