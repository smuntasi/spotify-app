from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from database import engine
from services import spotify_api
import uuid
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json

router = APIRouter(
    prefix="/recommendations",
    tags=["recommendations"]
)

@router.get("")
def get_content_based_recommendations(access_token: str = Query(...)):
    """
    Returns content-based recommendations based on user's liked, top, recent, and playlist tracks.
    Uses cosine similarity between vectorized metadata (popularity, release_date, genres).
    """
    try:
        user_profile = spotify_api.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user_profile["id"]))

        with engine.begin() as conn:
            user_tracks = conn.execute(text("""
                SELECT DISTINCT t.id, t.popularity, t.release_date, t.genres, t.artist
                FROM tracks t
                LEFT JOIN user_liked_tracks ult ON t.id = ult.track_id AND ult.user_id = :uid
                LEFT JOIN user_top_tracks utt ON t.id = utt.track_id AND utt.user_id = :uid
                LEFT JOIN user_stream_history ush ON t.id = ush.track_id AND ush.user_id = :uid
                LEFT JOIN playlist_tracks pt ON t.id = pt.track_id
                LEFT JOIN playlists p ON pt.playlist_id = p.id AND p.user_id = :uid
                WHERE ult.user_id IS NOT NULL
                   OR utt.user_id IS NOT NULL
                   OR ush.user_id IS NOT NULL
                   OR p.user_id IS NOT NULL
            """), {"uid": user_uuid}).fetchall()

            all_tracks = conn.execute(text("""
                SELECT id, popularity, release_date, genres, artist
                FROM tracks
            """)).fetchall()

        if not user_tracks:
            raise HTTPException(status_code=404, detail="No user track data found")

        # Normalize genre labels
        def genre_vector(genres, all_genres):
            vec = [0] * len(all_genres)
            for g in json.loads(genres or "[]"):
                if g in all_genres:
                    vec[all_genres.index(g)] = 1
            return vec

        genre_set = set()
        for _, _, _, genres, _ in all_tracks:
            genre_set.update(json.loads(genres or "[]"))
        genre_list = sorted(genre_set)

        def track_to_vector(track):
            popularity = track[1] or 0
            release_year = int((track[2] or "0")[:4]) if track[2] else 0
            genres_vec = genre_vector(track[3], genre_list)
            return [popularity, release_year] + genres_vec

        user_vecs = np.array([track_to_vector(t) for t in user_tracks])
        all_vecs = np.array([track_to_vector(t) for t in all_tracks])

        sims = cosine_similarity(user_vecs, all_vecs)
        avg_sim = sims.mean(axis=0)

        seen_ids = set(t[0] for t in user_tracks)
        recommendations = [
            (track[0], float(score))
            for track, score in zip(all_tracks, avg_sim)
            if track[0] not in seen_ids
        ]
        recommendations.sort(key=lambda x: x[1], reverse=True)
        top_recs = recommendations[:20]

        return {"recommendations": [r[0] for r in top_recs]}

    except Exception as e:
        print("🚨 Error generating content-based recommendations:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
