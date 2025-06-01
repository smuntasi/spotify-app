from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os

app = FastAPI()

# Allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your domain
    allow_methods=["*"],
    allow_headers=["*"],
)

# Path to your CSV files
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# Serve all music stats from CSV
@app.get("/api/stats/all")
def get_all_stats():
    def load_csv(filename):
        path = os.path.join(DATA_DIR, filename)
        if os.path.exists(path):
            return pd.read_csv(path).to_dict(orient="records")
        return []

    return {
        "scores": load_csv("advanced_song_scores.csv"),
        "top_monthly": load_csv("top_songs_per_month.csv"),
        "top_yearly": load_csv("top_songs_per_year.csv"),
        "top_artists": load_csv("top_artists.csv"),
        "most_skipped": load_csv("most_skipped_songs.csv"),
        "most_consistent": load_csv("most_consistent_songs.csv")
    }
