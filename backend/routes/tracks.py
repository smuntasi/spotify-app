from fastapi import APIRouter, Body, HTTPException
from sqlalchemy import text
from database import engine
import uuid
import services.spotify_api as spotify

router = APIRouter(prefix="/tracks", tags=["tracks"])

@router.post("/enrich")
def enrich_tracks_metadata(
    access_token: str = Body(..., embed=True),
    mode: str = Body(..., embed=True)  # "user" or "global"
):
    try:
        if mode not in {"user", "global"}:
            raise HTTPException(status_code=400, detail="Invalid mode. Use 'user' or 'global'.")

        if mode == "user":
            user_data = spotify.get_user_profile(access_token)
            user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user_data["id"]))

            with engine.begin() as conn:
                liked = conn.execute(text("SELECT track_id FROM user_liked_tracks WHERE user_id = :uid"),
                                     {"uid": user_uuid}).scalars().all()
                history = conn.execute(text("SELECT track_id FROM user_stream_history WHERE user_id = :uid"),
                                       {"uid": user_uuid}).scalars().all()
                playlist = conn.execute(text("""
                    SELECT pt.track_id
                    FROM playlist_tracks pt
                    JOIN playlists p ON pt.playlist_id = p.id
                    WHERE p.user_id = :uid
                """), {"uid": user_uuid}).scalars().all()
                top = conn.execute(text("SELECT track_id FROM user_top_tracks WHERE user_id = :uid"),
                                   {"uid": user_uuid}).scalars().all()

            track_ids = list({*liked, *history, *playlist, *top})
            if not track_ids:
                return {"updated": 0, "detail": "No tracks associated with this user."}

            with engine.begin() as conn:
                missing_ids = conn.execute(text("""
                    SELECT id FROM tracks
                    WHERE id = ANY(:ids)
                      AND (popularity IS NULL OR release_date IS NULL OR genres IS NULL)
                """), {"ids": track_ids}).scalars().all()

        else:
            with engine.begin() as conn:
                missing_ids = conn.execute(text("""
                    SELECT id FROM tracks
                    WHERE popularity IS NULL OR release_date IS NULL OR genres IS NULL
                """)).scalars().all()

        if not missing_ids:
            return {"updated": 0, "detail": "No tracks require enrichment."}

        updated = 0
        batches = [missing_ids[i:i+50] for i in range(0, len(missing_ids), 50)]
        for chunk in batches:
            track_meta = spotify.get_tracks_metadata(access_token, chunk)

            with engine.begin() as conn:
                for t in track_meta:
                    if not t or not t.get("id"):
                        continue
                    artist_id = t["artists"][0]["id"]
                    genres = spotify.get_artist_genres(access_token, artist_id)
                    conn.execute(text("""
                        UPDATE tracks
                        SET popularity = :popularity,
                            release_date = :release_date,
                            genres = :genres
                        WHERE id = :id
                    """), {
                        "id": t["id"],
                        "popularity": t.get("popularity"),
                        "release_date": t.get("album", {}).get("release_date"),
                        "genres": genres
                    })
                    updated += 1

        return {"updated": updated, "mode": mode}

    except Exception as e:
        print(f"Metadata enrichment failed ({mode=}):", e)
        raise HTTPException(status_code=500, detail=str(e))
