from fastapi import FastAPI, exceptions
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from . import admin, info, users, playlists, songs, playlist_songs
import json
import logging
import sys
from starlette.middleware.cors import CORSMiddleware
from .recommendations import router as rec_router

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

# update with our site
origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

#This is just including all of the routes that have been defined in seperate files

app.include_router(admin.router)
app.include_router(info.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(info.router)
app.include_router(users.router)
app.include_router(playlists.router)
app.include_router(songs.router)
app.include_router(playlist_songs.router)
app.include_router(rec_router)

@app.exception_handler(exceptions.RequestValidationError)
@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    logging.error(f"The client sent invalid data!: {exc}")
    exc_json = json.loads(exc.json())
    response = {"message": [], "data": None}
    for error in exc_json:
        response['message'].append(f"{error['loc']}: {error['msg']}")

    return JSONResponse(response, status_code=422)

#This (@) is a decorator, eitherwise we could not use Fast API and this would be a normal function
@app.get("/")
async def root():
    return {"message": "Welcome to our Spotify App"}
