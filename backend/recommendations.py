# recommendations.py
from fastapi import APIRouter, Depends, HTTPException
import sqlalchemy
from . import database as db, auth
from math import sqrt

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"],
    dependencies=[Depends(auth.get_api_key)]
)

@router.get("/{user_id}")
def get_recommendations(user_id: int, limit: int = 10):
    # 1) Fetch all track_features for songs in the user’s playlists
    sql_user = """
    SELECT s.track_features
     FROM playlist_songs ps
      JOIN playlists p  ON ps.playlist_id = p.playlist_id
      JOIN songs s      ON ps.song_id     = s.song_id
     WHERE p.user_id     = :user_id
    """
    with db.engine.begin() as conn:
        rows = conn.execute(sqlalchemy.text(sql_user), {"user_id": user_id}).fetchall()

    if not rows:
        raise HTTPException(404, "No playlist data for user—cannot build profile")

    # 2) Build user profile: average each feature across their songs
    feats = [r[0] for r in rows]  # each r[0] is a Python dict from JSONB
    all_keys = set().union(*(f.keys() for f in feats))
    user_vec = {
        k: sum(f.get(k, 0) for f in feats) / len(feats)
        for k in all_keys
    }
    mean_u = sum(user_vec.values()) / len(user_vec)

    # 3) Pull every song’s features
    sql_all = "SELECT song_id, track_features FROM songs"
    with db.engine.begin() as conn:
        all_songs = conn.execute(sqlalchemy.text(sql_all)).fetchall()

    # 4) Pearson correlation function
    def pearson(u: dict, s: dict):
        keys = set(u.keys()).union(s.keys())
        u_vals = [u.get(k, 0) for k in keys]
        s_vals = [s.get(k, 0) for k in keys]
        mean_s = sum(s_vals) / len(s_vals)

        num = sum((uv - mean_u)*(sv - mean_s) for uv, sv in zip(u_vals, s_vals))
        den = sqrt(sum((uv - mean_u)**2 for uv in u_vals) *
                   sum((sv - mean_s)**2 for sv in s_vals))
        return (num/den) if den else 0

    # 5) Score all songs
    scores = [(sid, pearson(user_vec, feat)) for sid, feat in all_songs]
    top_n = sorted(scores, key=lambda x: x[1], reverse=True)[:limit]
    song_ids = [sid for sid, _ in top_n]
    if not song_ids:
        return {"recommended": []}

    # 6) Fetch full song records for the top IDs
    sql_details = """
    SELECT song_id, spotify_id, title, artist, album, genre, duration, track_features
      FROM songs
     WHERE song_id = ANY(:song_ids)
    """
    with db.engine.begin() as conn:
       result = conn.execute(sqlalchemy.text(sql_details), {"song_ids": song_ids})
       # .mappings().all() gives a list of dicts
       details = result.mappings().all()

    detail_map = {d["song_id"]: d for d in details}
    # preserve order of song_ids
    recs = [detail_map[sid] for sid in song_ids if sid in detail_map]

    return {"recommended": recs}
