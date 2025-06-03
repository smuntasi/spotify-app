from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from database import engine
import uuid
import json
from services import spotify_api

router = APIRouter(
    prefix="/stats",
    tags=["stats"]
)

@router.get("/top-genres")
def get_top_genres(access_token: str = Query(...)):
    """
    Returns the top genres for a user based on their liked, played, and top tracks.
    """
    try:
        user = spotify_api.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user["id"]))

        with engine.begin() as conn:
            results = conn.execute(text("""
                SELECT genres FROM tracks t
                JOIN (
                    SELECT track_id FROM user_liked_tracks WHERE user_id = :uid
                    UNION
                    SELECT track_id FROM user_stream_history WHERE user_id = :uid
                    UNION
                    SELECT track_id FROM user_top_tracks WHERE user_id = :uid
                ) user_tracks
                ON t.id = user_tracks.track_id
                WHERE t.genres IS NOT NULL
            """), {"uid": user_uuid}).fetchall()

        genre_counts = {}
        for (genres_json,) in results:
            if genres_json:
                try:
                    genres = json.loads(genres_json)
                    for genre in genres:
                        genre_counts[genre] = genre_counts.get(genre, 0) + 1
                except json.JSONDecodeError:
                    continue

        top_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        return {"top_genres": top_genres}

    except Exception as e:
        print(f"🚨 Error in /stats/top-genres: {e}")
        raise HTTPException(status_code=500, detail="Failed to get top genres")

@router.get("/top-artists")
def get_top_artists(access_token: str = Query(...)):
    """
    Returns the top artists for a user based on their liked, played, and top tracks.
    """
    try:
        user = spotify_api.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user["id"]))

        with engine.begin() as conn:
            results = conn.execute(text("""
                SELECT artist FROM tracks t
                JOIN (
                    SELECT track_id FROM user_liked_tracks WHERE user_id = :uid
                    UNION
                    SELECT track_id FROM user_stream_history WHERE user_id = :uid
                    UNION
                    SELECT track_id FROM user_top_tracks WHERE user_id = :uid
                ) user_tracks
                ON t.id = user_tracks.track_id
                WHERE t.artist IS NOT NULL
            """), {"uid": user_uuid}).fetchall()

        artist_counts = {}
        for (artist,) in results:
            if artist:
                artist_counts[artist] = artist_counts.get(artist, 0) + 1

        top_artists = sorted(artist_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        return {"top_artists": top_artists}

    except Exception as e:
        print(f"🚨 Error in /stats/top-artists: {e}")
        raise HTTPException(status_code=500, detail="Failed to get top artists")

@router.get("/track-summary")
def get_track_summary(access_token: str = Query(...)):
    """
    Returns a summary of the user's tracks, including average popularity,
    release year distribution, genre diversity, and total unique tracks.
    """
    try:
        user = spotify_api.get_user_profile(access_token)
        user_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, user["id"]))

        with engine.begin() as conn:
            results = conn.execute(text("""
                SELECT t.popularity, t.release_date, t.genres
                FROM tracks t
                JOIN (
                    SELECT track_id FROM user_liked_tracks WHERE user_id = :uid
                    UNION
                    SELECT track_id FROM user_stream_history WHERE user_id = :uid
                    UNION
                    SELECT track_id FROM user_top_tracks WHERE user_id = :uid
                ) user_tracks
                ON t.id = user_tracks.track_id
                WHERE t.popularity IS NOT NULL AND t.release_date IS NOT NULL
            """), {"uid": user_uuid}).fetchall()

        if not results:
            return {"message": "No track data available for summary."}

        total_popularity = 0
        release_years = {}
        genre_set = set()
        total_tracks = 0

        for popularity, release_date, genres_json in results:
            total_tracks += 1
            total_popularity += popularity

            year = release_date[:4]
            release_years[year] = release_years.get(year, 0) + 1

            if genres_json:
                try:
                    genres = json.loads(genres_json)
                    genre_set.update(genres)
                except json.JSONDecodeError:
                    continue

        avg_popularity = round(total_popularity / total_tracks, 2)
        release_year_distribution = dict(sorted(release_years.items(), key=lambda x: x[0], reverse=True))
        genre_diversity = len(genre_set)

        return {
            "average_popularity": avg_popularity,
            "release_year_distribution": release_year_distribution,
            "genre_diversity": genre_diversity,
            "total_unique_tracks": total_tracks
        }

    except Exception as e:
        print(f"🚨 Error in /stats/track-summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve track summary.")
