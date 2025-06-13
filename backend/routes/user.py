from fastapi import APIRouter, Body, HTTPException
from sqlalchemy import text
from database import engine
from datetime import datetime, timezone
import uuid
import services.spotify_api as spotify

router = APIRouter(prefix="/user", tags=["user"])


@router.post("/profile")
def import_user_profile(access_token: str = Body(..., embed=True)):
    try:
        profile = spotify.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, profile["id"]))

        with engine.begin() as conn:
            conn.execute(text("""
                INSERT INTO users (id, spotify_id, email, display_name, country)
                VALUES (:id, :spotify_id, :email, :display_name, :country)
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    display_name = EXCLUDED.display_name,
                    country = EXCLUDED.country
            """), {
                "id": user_uuid,
                "spotify_id": profile["id"],
                "email": profile.get("email", f"{profile['id']}@spotify.com"),
                "display_name": profile.get("display_name"),
                "country": profile.get("country")
            })

        return {"message": "User profile imported successfully."}

    except Exception as e:
        print("Error in /user/profile:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/top-tracks")
def import_user_top_tracks(access_token: str = Body(..., embed=True)):
    try:
        profile = spotify.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, profile["id"]))
        top_tracks = spotify.get_user_top_tracks(access_token)

        with engine.begin() as conn:
            for rank, track in enumerate(top_tracks):
                conn.execute(text("""
                    INSERT INTO tracks (id, name, artist, album, uri)
                    VALUES (:id, :name, :artist, :album, :uri)
                    ON CONFLICT (id) DO NOTHING
                """), {
                    "id": track["id"],
                    "name": track["name"],
                    "artist": track["artists"][0]["name"],
                    "album": track["album"]["name"],
                    "uri": track["uri"]
                })

                conn.execute(text("""
                    INSERT INTO user_top_tracks (user_id, track_id, rank)
                    VALUES (:user_id, :track_id, :rank)
                    ON CONFLICT DO NOTHING
                """), {
                    "user_id": user_uuid,
                    "track_id": track["id"],
                    "rank": rank + 1
                })

        return {"message": f"Imported {len(top_tracks)} top tracks."}

    except Exception as e:
        print("Error in /user/top-tracks:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/liked-tracks")
def import_liked_tracks(access_token: str = Body(..., embed=True)):
    try:
        profile = spotify.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, profile["id"]))
        liked = spotify.get_liked_tracks(access_token)
        now = datetime.now(timezone.utc)

        with engine.begin() as conn:
            for item in liked:
                track = item["track"]
                conn.execute(text("""
                    INSERT INTO tracks (id, name, artist, album, uri)
                    VALUES (:id, :name, :artist, :album, :uri)
                    ON CONFLICT (id) DO NOTHING
                """), {
                    "id": track["id"],
                    "name": track["name"],
                    "artist": track["artists"][0]["name"],
                    "album": track["album"]["name"],
                    "uri": track["uri"]
                })

                conn.execute(text("""
                    INSERT INTO user_liked_tracks (user_id, track_id, liked_at)
                    VALUES (:user_id, :track_id, :liked_at)
                    ON CONFLICT DO NOTHING
                """), {
                    "user_id": user_uuid,
                    "track_id": track["id"],
                    "liked_at": now
                })

        return {"message": f"Imported {len(liked)} liked tracks."}

    except Exception as e:
        print("Error in /user/liked-tracks:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recently-played")
def import_recently_played(access_token: str = Body(..., embed=True)):
    try:
        profile = spotify.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, profile["id"]))
        history = spotify.get_recently_played(access_token)

        with engine.begin() as conn:
            for item in history:
                track = item["track"]
                played_at = item["played_at"]

                conn.execute(text("""
                    INSERT INTO tracks (id, name, artist, album, uri)
                    VALUES (:id, :name, :artist, :album, :uri)
                    ON CONFLICT (id) DO NOTHING
                """), {
                    "id": track["id"],
                    "name": track["name"],
                    "artist": track["artists"][0]["name"],
                    "album": track["album"]["name"],
                    "uri": track["uri"]
                })

                conn.execute(text("""
                    INSERT INTO user_stream_history (user_id, track_id, played_at)
                    VALUES (:user_id, :track_id, :played_at)
                    ON CONFLICT DO NOTHING
                """), {
                    "user_id": user_uuid,
                    "track_id": track["id"],
                    "played_at": played_at
                })

        return {"message": f"Imported {len(history)} recently played tracks."}

    except Exception as e:
        print("Error in /user/history:", e)
        raise HTTPException(status_code=500, detail=str(e))
