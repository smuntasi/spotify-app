# Corrected data-population script for SQLAlchemy Core (no **kwargs)

import json
import sqlalchemy
from database import engine

def main():
    with engine.begin() as conn:
        # Insert sample users
        users = [
            { "display_name": "Alice", "email": "alice@example.com", "country": "US" },
            { "display_name": "Bob",   "email": "bob@example.com",   "country": "CA" },
            { "display_name": "Carol", "email": "carol@example.com", "country": "GB" }
        ]
        for u in users:
            conn.execute(
                sqlalchemy.text(
                    """
                    INSERT INTO users (display_name, email, country)
                    VALUES (:display_name, :email, :country)
                    ON CONFLICT (email) DO NOTHING
                    """
                ),
                u  # pass the dict as the second positional argument
            )

        # Insert sample songs
        songs = [
            {
                "spotify_id": "6rqhFgbbKwnb9MLmUQDhG6",
                "title": "Song A",
                "artist": "Artist 1",
                "album": "Album X",
                "genre": "Pop",
                "duration": 210,
                "track_features": json.dumps({ "tempo": 120, "energy": 0.8, "valence": 0.9 })
            },
            {
                "spotify_id": "3H7sv3Krffn15BufUuXzf9",
                "title": "Song B",
                "artist": "Artist 2",
                "album": "Album Y",
                "genre": "Rock",
                "duration": 180,
                "track_features": json.dumps({ "tempo": 140, "energy": 0.9, "valence": 0.5 })
            },
            {
                "spotify_id": "1lDWb6b6ieDQ2xT7ewTC3G",
                "title": "Song C",
                "artist": "Artist 3",
                "album": "Album Z",
                "genre": "Jazz",
                "duration": 240,
                "track_features": json.dumps({ "tempo": 100, "energy": 0.6, "valence": 0.7 })
            }
        ]
        for s in songs:
            conn.execute(
                sqlalchemy.text(
                    """
                    INSERT INTO songs (spotify_id, title, artist, album, genre, duration, track_features)
                    VALUES (:spotify_id, :title, :artist, :album, :genre, :duration, :track_features)
                    ON CONFLICT (spotify_id) DO NOTHING
                    """
                ),
                s
            )

        # Insert sample playlists
        playlists = [
            { "user_id": 1, "name": "Alice's Favorites", "description": "My top picks" },
            { "user_id": 2, "name": "Bob's Rock",      "description": "Best of rock" }
        ]
        for p in playlists:
            conn.execute(
                sqlalchemy.text(
                    """
                    INSERT INTO playlists (user_id, name, description)
                    VALUES (:user_id, :name, :description)
                    ON CONFLICT DO NOTHING
                    """
                ),
                p
            )

        # Insert sample playlist_songs
        playlist_songs = [
            { "playlist_id": 1, "song_id": 1 },
            { "playlist_id": 1, "song_id": 2 },
            { "playlist_id": 2, "song_id": 2 },
            { "playlist_id": 2, "song_id": 3 }
        ]
        for ps in playlist_songs:
            conn.execute(
                sqlalchemy.text(
                    """
                    INSERT INTO playlist_songs (playlist_id, song_id)
                    VALUES (:playlist_id, :song_id)
                    ON CONFLICT DO NOTHING
                    """
                ),
                ps
            )

        # Insert sample song_interactions
        interactions = [
            { "user_id": 1, "song_id": 1, "interaction_type": "like" },
            { "user_id": 1, "song_id": 2, "interaction_type": "play" },
            { "user_id": 2, "song_id": 2, "interaction_type": "like" },
            { "user_id": 3, "song_id": 3, "interaction_type": "play" }
        ]
        for i in interactions:
            conn.execute(
                sqlalchemy.text(
                    """
                    INSERT INTO song_interactions (user_id, song_id, interaction_type)
                    VALUES (:user_id, :song_id, :interaction_type)
                    ON CONFLICT DO NOTHING
                    """
                ),
                i
            )

    print("Sample data population complete.")

if __name__ == "__main__":
    main()

