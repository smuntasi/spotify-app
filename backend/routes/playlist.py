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

    try:
        user_data = spotify.get_user_profile(access_token)
        user_id = user_data["id"]
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user_id))

        playlist = spotify.create_playlist(access_token, user_id, playlist_name)
        playlist_id = playlist["id"]
        snapshot_id = playlist["snapshot_id"]
        is_public = playlist["public"]

        spotify.add_tracks_to_playlist(access_token, playlist_id, track_ids)

        with engine.begin() as conn:
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
        print(f"Playlist build error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/combine")
def combine_playlists(
    access_token: str = Body(..., embed=True),
    playlist_ids: list[str] = Body(..., embed=True),
    playlist_name: str = Body(..., embed=True)
):
    try:
        user_data = spotify.get_user_profile(access_token)
        user_id = user_data["id"]
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user_id))
        combined_tracks = []

        combined_track_ids = set()
        for pid in playlist_ids:
            tracks = spotify.get_playlist_tracks(access_token, pid)
            for t in tracks:
                if t["track"] and t["track"]["id"]:
                    combined_track_ids.add(t["track"]["id"])

        track_ids = list(combined_track_ids)

        playlist = spotify.create_playlist(access_token, user_id, playlist_name)
        playlist_id = playlist["id"]
        snapshot_id = playlist["snapshot_id"]
        is_public = playlist["public"]

        spotify.add_tracks_to_playlist(access_token, playlist_id, track_ids)

        with engine.begin() as conn:
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

            for track in combined_tracks:
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

            for track_id in track_ids:
                conn.execute(text("""
                    INSERT INTO playlist_tracks (playlist_id, track_id)
                    VALUES (:playlist_id, :track_id)
                    ON CONFLICT DO NOTHING
                """), {
                    "playlist_id": playlist_id,
                    "track_id": track_id
                })

        return {"message": "Combined playlist created", "playlist_id": playlist_id}

    except Exception as e:
        print(f"Playlist combine error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/prune")
def delete_removed_playlists(access_token: str = Body(..., embed=True)):
    try:
        user = spotify.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user["id"]))
        spotify_playlists = spotify.get_user_playlists(access_token)
        spotify_playlist_ids = {pl["id"] for pl in spotify_playlists}

        with engine.begin() as conn:
            local_playlist_ids = set(conn.execute(text("""
                SELECT id FROM playlists WHERE user_id = :uid
            """), {"uid": user_uuid}).scalars().all())

            deleted_ids = local_playlist_ids - spotify_playlist_ids

            if deleted_ids:
                conn.execute(text("""
                    DELETE FROM playlist_tracks WHERE playlist_id = ANY(:deleted)
                """), {"deleted": list(deleted_ids)})

                conn.execute(text("""
                    DELETE FROM playlists WHERE id = ANY(:deleted)
                """), {"deleted": list(deleted_ids)})

        return {"deleted": list(deleted_ids)}

    except Exception as e:
        print("Playlist prune error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


