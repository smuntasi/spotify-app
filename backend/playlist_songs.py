from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import sqlalchemy
from . import database as db, auth

router = APIRouter(
    prefix="/playlists",
    tags=["playlist_songs"],
    dependencies=[Depends(auth.get_api_key)]
)

class AddSong(BaseModel):
    song_id: int

@router.post("/{playlist_id}/songs/add")
def add_song_to_playlist(playlist_id: int, body: AddSong):
    sql = """
    INSERT INTO playlist_songs (playlist_id, song_id)
    VALUES (:playlist_id, :song_id)
    """
    try:
        with db.engine.begin() as conn:
            conn.execute(sqlalchemy.text(sql), {"playlist_id": playlist_id, "song_id": body.song_id})
    except sqlalchemy.exc.IntegrityError:
        raise HTTPException(400, "Playlist or Song does not exist")
    return {"detail": "Song added"}

@router.delete("/{playlist_id}/songs/{song_id}")
def remove_song_from_playlist(playlist_id: int, song_id: int):
    sql = """
    DELETE FROM playlist_songs
     WHERE playlist_id = :playlist_id
       AND song_id     = :song_id
    """
    with db.engine.begin() as conn:
        res = conn.execute(sqlalchemy.text(sql), {"playlist_id": playlist_id, "song_id": song_id})
    if res.rowcount == 0:
        raise HTTPException(404, "Song not found in playlist")
    return {"detail": "Song removed"}

@router.get("/{playlist_id}/songs", response_model=list[int])
def list_songs_in_playlist(playlist_id: int):
    sql = "SELECT song_id FROM playlist_songs WHERE playlist_id = :playlist_id"
    with db.engine.begin() as conn:
        rows = conn.execute(sqlalchemy.text(sql), {"playlist_id": playlist_id}).fetchall()
    return [r.song_id for r in rows]
