# backend/main.py (legacy-compatible)
from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import text
import sqlalchemy
from database import engine  # Direct import (no "src" folder)

app = FastAPI()

# Legacy endpoint style with SQL execution
@app.get("/test")
def test_endpoint():
    try:
        with engine.begin() as connection:
            result = connection.execute(text("SELECT 1"))
            return {"result": result.scalar()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))