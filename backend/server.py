from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from fastapi import FastAPI, exceptions
from routes import admin, user, playlist, recommendations, seeds, stats, tracks

description = """
Our spotify app offers an alternative experienve to enjoying your music.
"""

app = FastAPI(
    title="My Spotify App",
    description=description,
    version="0.0.1",
    terms_of_service="http://example.com/terms/",
    contact={
        "name": "Adrian Elias",
        "email": "ahern388@calpoly.edu",
    },
)

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin.router)
app.include_router(user.router)
app.include_router(playlist.router)
app.include_router(recommendations.router)
app.include_router(seeds.router)
app.include_router(stats.router)
app.include_router(tracks.router)

@app.get("/")
async def root():
    return {"message": "Welcome to our Spotify App"}