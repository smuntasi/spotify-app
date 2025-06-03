from fastapi import APIRouter, Body, HTTPException
from sqlalchemy import text
from database import engine
import services.spotify_api as spotify_api

router = APIRouter(prefix="/seeds", tags=["seeds"])


@router.post("/new-releases")
def seed_from_new_releases(
    access_token: str = Body(..., embed=True),
    max_albums: int = Body(100)
):
    """
    Seeds the database with tracks from Spotify's new releases (album-based).
    """
    try:
        albums = spotify_api.get_new_releases(access_token, limit=50, max_albums=max_albums)
        print(f"Found {len(albums)} new release albums")

        with engine.begin() as conn:
            for album in albums:
                album_id = album["id"]
                try:
                    album_tracks = spotify_api.get_album_tracks(access_token, album_id)
                    track_ids = [t["id"] for t in album_tracks if t.get("id")]

                    if not track_ids:
                        continue

                    # Get enriched metadata
                    detailed_tracks = spotify_api.get_tracks_metadata(access_token, track_ids)

                    for track in detailed_tracks:
                        if not track or not track.get("id"):
                            continue

                        artist = track["artists"][0]["name"]
                        album_name = track["album"]["name"]
                        uri = track.get("uri")
                        popularity = track.get("popularity")
                        release_date = track.get("album", {}).get("release_date")
                        artist_id = track["artists"][0]["id"]
                        genres = spotify_api.get_artist_genres(access_token, artist_id)

                        conn.execute(text("""
                            INSERT INTO tracks (id, name, artist, album, uri, popularity, release_date, genres)
                            VALUES (:id, :name, :artist, :album, :uri, :popularity, :release_date, :genres)
                            ON CONFLICT (id) DO NOTHING
                        """), {
                            "id": track["id"],
                            "name": track["name"],
                            "artist": artist,
                            "album": album_name,
                            "uri": uri,
                            "popularity": popularity,
                            "release_date": release_date,
                            "genres": genres
                        })

                except Exception as e:
                    print(f"⚠️ Error processing album {album_id}: {e}")
                    continue

        return {"message": "Seeded tracks from new releases"}
    except Exception as e:
        print(f"🚨 Error seeding new releases: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/enrich-missing")
def enrich_missing_metadata(access_token: str = Body(..., embed=True)):
    """
    Enrich all tracks missing popularity, release_date, or genres.
    """
    try:
        with engine.begin() as conn:
            missing = conn.execute(text("""
                SELECT id FROM tracks
                WHERE popularity IS NULL OR release_date IS NULL OR genres IS NULL
            """)).scalars().all()

        print(f"🎯 Found {len(missing)} tracks with missing metadata")

        updated = 0
        for chunk in [missing[i:i + 50] for i in range(0, len(missing), 50)]:
            track_details = spotify_api.get_tracks_metadata(access_token, chunk)

            with engine.begin() as conn:
                for track in track_details:
                    if not track or not track.get("id"):
                        continue

                    artist_id = track["artists"][0]["id"]
                    genres = spotify_api.get_artist_genres(access_token, artist_id)

                    conn.execute(text("""
                        UPDATE tracks
                        SET popularity = :popularity,
                            release_date = :release_date,
                            genres = :genres
                        WHERE id = :id
                    """), {
                        "id": track["id"],
                        "popularity": track.get("popularity"),
                        "release_date": track.get("album", {}).get("release_date"),
                        "genres": genres
                    })
                    updated += 1

        print(f"✅ Enriched metadata for {updated} tracks")
        return {"updated": updated}

    except Exception as e:
        print("🚨 Enrichment failed:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

    
