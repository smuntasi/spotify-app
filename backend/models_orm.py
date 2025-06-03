import sqlalchemy
from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True)
    email = Column(String, nullable=False)
    display_name = Column(String)
    country = Column(String)
    spotify_id = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime)


class Track(Base):
    __tablename__ = "tracks"
    id = Column(String, primary_key=True)  # Spotify track ID
    name = Column(String, nullable=False)
    artist = Column(String, nullable=False)
    album = Column(String)
    uri = Column(String, nullable=False)


class AudioFeature(Base):
    __tablename__ = "audio_features"
    track_id = Column(String, ForeignKey("tracks.id"), primary_key=True)
    danceability = Column(Float)
    energy = Column(Float)
    tempo = Column(Float)
    valence = Column(Float)
    acousticness = Column(Float)
    instrumentalness = Column(Float)


class UserTopTrack(Base):
    __tablename__ = "user_top_tracks"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    track_id = Column(String, ForeignKey("tracks.id"), primary_key=True)
    rank = Column(sqlalchemy.Integer)


class Playlist(Base):
    __tablename__ = "playlists"
    id = Column(String, primary_key=True)  # Spotify playlist ID
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    is_public = Column(Boolean)
    snapshot_id = Column(String)


class PlaylistTrack(Base):
    __tablename__ = "playlist_tracks"
    playlist_id = Column(String, ForeignKey("playlists.id"), primary_key=True)
    track_id = Column(String, ForeignKey("tracks.id"), primary_key=True)
    added_at = Column(DateTime)


class UserLikedTrack(Base):
    __tablename__ = "user_liked_tracks"
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    track_id = Column(String, ForeignKey("tracks.id"), primary_key=True)
    liked_at = Column(DateTime)
