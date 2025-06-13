from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class UserBase(BaseModel):
    id: UUID
    email: str
    display_name: Optional[str]
    country: Optional[str]
    spotify_id: str
    created_at: Optional[datetime]


class TrackBase(BaseModel):
    id: str  # Spotify track ID
    name: str
    artist: str
    album: Optional[str]
    uri: str


class AudioFeatureBase(BaseModel):
    track_id: str
    danceability: float
    energy: float
    tempo: float
    valence: float
    acousticness: float
    instrumentalness: float


class UserTopTrack(BaseModel):
    user_id: UUID
    track_id: str
    rank: int


class PlaylistBase(BaseModel):
    id: str  # Spotify playlist ID
    user_id: UUID
    name: str
    is_public: Optional[bool]
    snapshot_id: Optional[str]


class PlaylistTrackBase(BaseModel):
    playlist_id: str
    track_id: str
    added_at: Optional[datetime]


class UserLikedTrack(BaseModel):
    user_id: UUID
    track_id: str
    liked_at: Optional[datetime]