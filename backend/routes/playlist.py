from fastapi import APIRouter, HTTPException, Body, Request
from database import engine
import sqlalchemy
import uuid
import services.spotify_api as spotify
from sqlalchemy import text
from datetime import datetime

router = APIRouter(prefix="/playlists", tags=["playlists"])

@router.post("/import")
def import_user_playlists(access_token: str = Body(..., embed=True)):
    """🎵 Imports all the user's playlists into the database."""
    try:
        user = spotify.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user["id"]))
        playlists = spotify.get_user_playlists(access_token)

        with engine.begin() as conn:
            for pl in playlists:
                conn.execute(sqlalchemy.text("""
                    INSERT INTO playlists (id, user_id, name, is_public, snapshot_id)
                    VALUES (:id, :user_id, :name, :is_public, :snapshot_id)
                    ON CONFLICT (id) DO UPDATE
                    SET name = EXCLUDED.name,
                        is_public = EXCLUDED.is_public,
                        snapshot_id = EXCLUDED.snapshot_id
                """), {
                    "id": pl["id"],
                    "user_id": user_uuid,
                    "name": pl["name"],
                    "is_public": pl["public"],
                    "snapshot_id": pl["snapshot_id"]
                })

        return {"message": f"Imported {len(playlists)} playlists"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/tracks")
def import_playlist_tracks(access_token: str = Body(..., embed=True)):
    """📥 Imports all tracks from each of the user's playlists."""
    try:
        user = spotify.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user["id"]))

        with engine.begin() as conn:
            playlist_ids = conn.execute(sqlalchemy.text("""
                SELECT id FROM playlists WHERE user_id = :uid
            """), {"uid": user_uuid}).scalars().all()

        for playlist_id in playlist_ids:
            tracks = spotify.get_tracks_in_playlist(access_token, playlist_id)

            with engine.begin() as conn:
                for item in tracks:
                    track = item.get("track")
                    if not track or not track.get("id"):
                        continue

                    conn.execute(sqlalchemy.text("""
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

                    conn.execute(sqlalchemy.text("""
                        INSERT INTO playlist_tracks (playlist_id, track_id, added_at)
                        VALUES (:playlist_id, :track_id, :added_at)
                        ON CONFLICT DO NOTHING
                    """), {
                        "playlist_id": playlist_id,
                        "track_id": track["id"],
                        "added_at": item.get("added_at")
                    })

        return {"message": "All playlist tracks imported successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/snapshots")
def refresh_playlists_if_snapshot_changed(access_token: str = Body(..., embed=True)):
    """🔁 Refreshes playlist tracks if the snapshot_id has changed."""
    try:
        user = spotify.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user["id"]))
        playlists = spotify.get_user_playlists(access_token)
        updated_count = 0

        with engine.begin() as conn:
            for pl in playlists:
                playlist_id = pl["id"]
                new_snapshot = pl["snapshot_id"]
                name = pl["name"]
                is_public = pl["public"]

                current = conn.execute(sqlalchemy.text("""
                    SELECT snapshot_id FROM playlists WHERE id = :pid
                """), {"pid": playlist_id}).scalar()

                if current != new_snapshot:
                    print(f"🌀 Updating {name}...")
                    conn.execute(sqlalchemy.text("""
                        UPDATE playlists
                        SET name = :name, is_public = :is_public, snapshot_id = :snapshot_id
                        WHERE id = :id
                    """), {
                        "id": playlist_id,
                        "name": name,
                        "is_public": is_public,
                        "snapshot_id": new_snapshot
                    })

                    tracks = spotify.get_tracks_in_playlist(access_token, playlist_id)
                    for item in tracks:
                        track = item.get("track")
                        if not track or not track.get("id"):
                            continue
                        conn.execute(sqlalchemy.text("""
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
                        conn.execute(sqlalchemy.text("""
                            INSERT INTO playlist_tracks (playlist_id, track_id, added_at)
                            VALUES (:playlist_id, :track_id, :added_at)
                            ON CONFLICT DO NOTHING
                        """), {
                            "playlist_id": playlist_id,
                            "track_id": track["id"],
                            "added_at": item.get("added_at")
                        })

                    updated_count += 1

        return {"updated": updated_count}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/build")
def build_custom_playlist(
    access_token: str = Body(..., embed=True),
    track_ids: list[str] = Body(..., embed=True),
    playlist_name: str = Body(..., embed=True)
):
    """
    🎛 Builds a new Spotify playlist from a list of track IDs and stores it locally.
    """
    try:
        # Get user info and generate consistent local user UUID
        user_data = spotify.get_user_profile(access_token)
        user_id = user_data["id"]
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user_id))

        # 1. Create the playlist on Spotify
        playlist = spotify.create_playlist(access_token, user_id, playlist_name)
        playlist_id = playlist["id"]
        snapshot_id = playlist["snapshot_id"]
        is_public = playlist["public"]

        # 2. Add tracks to the new playlist
        spotify.add_tracks_to_playlist(access_token, playlist_id, track_ids)

        # 3. Store the playlist and tracks locally
        with engine.begin() as conn:
            # Insert playlist record
            conn.execute(text("""
                INSERT INTO playlists (id, user_id, name, is_public, snapshot_id)
                VALUES (:id, :user_id, :name, :is_public, :snapshot_id)
                ON CONFLICT (id) DO NOTHING
            """), {
                "id": playlist_id,
                "user_id": user_uuid,
                "name": playlist_name,
                "is_public": is_public,
                "snapshot_id": snapshot_id
            })

            # Insert track associations
            for track_id in track_ids:
                conn.execute(text("""
                    INSERT INTO playlist_tracks (playlist_id, track_id)
                    VALUES (:playlist_id, :track_id)
                    ON CONFLICT DO NOTHING
                """), {
                    "playlist_id": playlist_id,
                    "track_id": track_id
                })

        return {"message": "Custom playlist created successfully", "playlist_id": playlist_id}

    except Exception as e:
        print(f"🚨 Playlist build error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    


## not working   
@router.post("/combine")
def combine_user_playlists(
    playlist1_id: str = Body(..., embed=True),
    playlist2_id: str = Body(..., embed=True),
):
    """
    Combines two user playlists into a new one and stores it in the database.
    """
    try:
        with engine.begin() as conn:
            # Fetch both sets of track IDs
            tracks1 = conn.execute(text("""
                SELECT track_id FROM playlist_tracks WHERE playlist_id = :id
            """), {"id": playlist1_id}).scalars().all()

            tracks2 = conn.execute(text("""
                SELECT track_id FROM playlist_tracks WHERE playlist_id = :id
            """), {"id": playlist2_id}).scalars().all()

            combined_tracks = list(set(tracks1 + tracks2))
            if not combined_tracks:
                raise HTTPException(status_code=400, detail="No tracks found in the selected playlists.")

            # Create new playlist entry
            new_playlist_id = str(uuid.uuid4())
            combined_name = f"Combined: {playlist1_id[:6]} + {playlist2_id[:6]}"
            now = datetime.utcnow()

            conn.execute(text("""
                INSERT INTO playlists (id, user_id, name, is_public, snapshot_id)
                SELECT :id, user_id, :name, false, :snapshot
                FROM playlists WHERE id = :orig LIMIT 1
            """), {
                "id": new_playlist_id,
                "name": combined_name,
                "snapshot": f"combined-{now.timestamp()}",
                "orig": playlist1_id
            })

            # Insert track mappings
            for track_id in combined_tracks:
                conn.execute(text("""
                    INSERT INTO playlist_tracks (playlist_id, track_id, added_at)
                    VALUES (:playlist_id, :track_id, :added_at)
                    ON CONFLICT DO NOTHING
                """), {
                    "playlist_id": new_playlist_id,
                    "track_id": track_id,
                    "added_at": now
                })

            return {"message": "Combined playlist created", "playlist_id": new_playlist_id, "name": combined_name}

    except Exception as e:
        print(f"🚨 Error combining playlists: {e}")
        raise HTTPException(status_code=500, detail="Failed to combine playlists.")
