from fastapi import APIRouter, Body, HTTPException
from sqlalchemy import text
from database import engine
from datetime import datetime, timezone
import uuid
import services.spotify_api as spotify
import sqlalchemy
import time

router = APIRouter(prefix="/user", tags=["user"])


@router.post("/profile")
def import_user_profile(access_token: str = Body(..., embed=True)):
    """
    👤 Imports the authenticated user's profile info into the database.
    """
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
        print("🚨 Error in /user/profile:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/top-tracks")
def import_user_top_tracks(access_token: str = Body(..., embed=True)):
    """
    🎵 Imports the user's top 20 tracks and stores them in user_top_tracks and tracks.
    """
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
        print("🚨 Error in /user/top-tracks:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/liked-tracks")
def import_liked_tracks(access_token: str = Body(..., embed=True)):
    """
    💚 Imports the user's liked tracks into user_liked_tracks and tracks tables.
    """
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
        print("🚨 Error in /user/liked-tracks:", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recently-played")
def import_recently_played(access_token: str = Body(..., embed=True)):
    """
    📻 Imports the user's recent listening history into user_stream_history.
    """
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
        print("🚨 Error in /user/history:", e)
        raise HTTPException(status_code=500, detail=str(e))
    


@router.post("/enrich-metadata")
def enrich_track_metadata(access_token: str = Body(..., embed=True)):
    """
    Enrich all of a user's known tracks with:
      - popularity
      - release_date
      - genres

    Gathers track IDs from:
      • user_liked_tracks
      • user_stream_history
      • playlist_tracks (joined with playlists)
      • user_top_tracks

    Only updates tracks whose 'popularity' IS NULL (i.e. not yet enriched).
    """
    try:
        # 1. Determine the user's UUID (deterministic from their Spotify ID)
        user_data = spotify.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user_data["id"]))

        # 2. Collect all distinct track IDs for this user
        with engine.begin() as conn:
            liked_ids = conn.execute(sqlalchemy.text("""
                SELECT track_id
                  FROM user_liked_tracks
                 WHERE user_id = :uid
            """), {"uid": user_uuid}).scalars().all()

            history_ids = conn.execute(sqlalchemy.text("""
                SELECT track_id
                  FROM user_stream_history
                 WHERE user_id = :uid
            """), {"uid": user_uuid}).scalars().all()

            playlist_ids = conn.execute(sqlalchemy.text("""
                SELECT pt.track_id
                  FROM playlist_tracks pt
                  JOIN playlists p ON pt.playlist_id = p.id
                 WHERE p.user_id = :uid
            """), {"uid": user_uuid}).scalars().all()

            top_ids = conn.execute(sqlalchemy.text("""
                SELECT track_id
                  FROM user_top_tracks
                 WHERE user_id = :uid
            """), {"uid": user_uuid}).scalars().all()

            all_track_ids = list({*liked_ids, *history_ids, *playlist_ids, *top_ids})

            # 3. Filter only those tracks whose popularity IS NULL
            missing_ids = conn.execute(sqlalchemy.text("""
                SELECT id
                  FROM tracks
                 WHERE id = ANY(:ids)
                   AND popularity IS NULL
            """), {"ids": all_track_ids}).scalars().all()

        if not missing_ids:
            return {"updated": 0, "detail": "No tracks require enrichment."}

        # 4. Fetch metadata in batches of up to 50 and update each track
        updated_count = 0
        batches = [missing_ids[i : i + 50] for i in range(0, len(missing_ids), 50)]
        for chunk in batches:
            # Call Spotify's /tracks to get track metadata
            tracks_meta = spotify.get_tracks_metadata(access_token, chunk)

            with engine.begin() as conn:
                for t in tracks_meta:
                    if not t:
                        continue
                    track_id = t["id"]
                    popularity = t.get("popularity")
                    release_date = t.get("album", {}).get("release_date")
                    # Get genres from the first artist
                    artist_id = t["artists"][0]["id"]
                    genres = spotify.get_artist_genres(access_token, artist_id)

                    conn.execute(sqlalchemy.text("""
                        UPDATE tracks
                           SET popularity   = :popularity,
                               release_date = :release_date,
                               genres       = :genres
                         WHERE id = :id
                    """), {
                        "id": track_id,
                        "popularity": popularity,
                        "release_date": release_date,
                        "genres": genres
                    })
                    updated_count += 1

        return {"updated": updated_count}

    except Exception as e:
        print(f"🚨 Error in /user/enrich-metadata: {e}")
        raise HTTPException(status_code=500, detail=str(e))
