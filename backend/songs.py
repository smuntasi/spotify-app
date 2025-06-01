from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import sqlalchemy
from . import database as db, auth

router = APIRouter(
    prefix="/songs",
    tags=["songs"],
    dependencies=[Depends(auth.get_api_key)]
)

class SongCreate(BaseModel):
    spotify_id: str
    title: str
    artist: str
    album: str
    genre: str
    duration: int
    track_features: dict  # JSON field

class SongRead(SongCreate):
    song_id: int

@router.post("/create", response_model=SongRead)
def create_song(s: SongCreate):
    sql = """
    INSERT INTO songs (spotify_id, title, artist, album, genre, duration, track_features)
    VALUES (:spotify_id, :title, :artist, :album, :genre, :duration, :track_features)
    RETURNING song_id, spotify_id, title, artist, album, genre, duration, track_features
    """
    with db.engine.begin() as conn:
        row = conn.execute(sqlalchemy.text(sql), **s.dict()).fetchone()
    return dict(row)

@router.get("/{song_id}", response_model=SongRead)
def get_song(song_id: int):
    sql = """
    SELECT song_id, spotify_id, title, artist, album, genre, duration, track_features
    FROM songs
    WHERE song_id = :song_id
    """
    with db.engine.begin() as conn:
        row = conn.execute(sqlalchemy.text(sql), {"song_id": song_id}).fetchone()
    if not row:
        raise HTTPException(404, "Song not found")
    return dict(row)

@router.get("/", response_model=list[SongRead])
def list_songs(limit: int = 50, offset: int = 0):
    sql = """
    SELECT song_id, spotify_id, title, artist, album, genre, duration, track_features
      FROM songs
     ORDER BY song_id
     LIMIT :limit OFFSET :offset
    """
    with db.engine.begin() as conn:
        rows = conn.execute(sqlalchemy.text(sql), {"limit": limit, "offset": offset}).fetchall()
    return [dict(r) for r in rows]
