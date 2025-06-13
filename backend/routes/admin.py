from fastapi import APIRouter, Body, HTTPException
from database import engine
import sqlalchemy

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/reset")
def reset_all_data():
    try:
        with engine.begin() as conn:
            conn.execute(sqlalchemy.text("DELETE FROM playlist_tracks"))
            conn.execute(sqlalchemy.text("DELETE FROM playlists"))
            conn.execute(sqlalchemy.text("DELETE FROM user_stream_history"))
            conn.execute(sqlalchemy.text("DELETE FROM user_liked_tracks"))
            conn.execute(sqlalchemy.text("DELETE FROM user_top_tracks"))
            conn.execute(sqlalchemy.text("DELETE FROM tracks"))
            conn.execute(sqlalchemy.text("DELETE FROM users"))

        return {"message": "All data wiped successfully."}
    except Exception as e:
        print("Error wiping data:", str(e))
        raise HTTPException(status_code=500, detail="Failed to wipe data.")

@router.get("/ping")
def ping():
    return {"status": "Pong! Backend is alive."}

