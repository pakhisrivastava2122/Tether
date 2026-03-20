import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Import routers
from app.routes.report import router as report_router
from app.routes.match import router as match_router
# --- NEW ---
from app.routes.auth import router as auth_router 

# Ensure uploads directory exists
os.makedirs("app/uploads", exist_ok=True)
# --- NEW ---
# Ensure db directory exists (for users.json)
os.makedirs("app/db", exist_ok=True)


app = FastAPI(title="Tether Backend (JSON-File Mode)") # Fixed typo titleA -> title

# CORS (Cross-Origin Resource Sharing)
# ... (no changes) ...
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Serve Static Images ---
# This line is the new "image route". 
# Any request to "/uploads/some-file.jpg" will be served
# from the "app/uploads/" directory.
app.mount("/uploads", StaticFiles(directory="app/uploads"), name="uploads")


# --- Register API Routes ---
app.include_router(report_router, prefix="/api")
app.include_router(match_router, prefix="/api")
# --- NEW ---
app.include_router(auth_router, prefix="/api/auth") # Add the auth router

@app.get("/")
def root():
    return {"message": "Tether Backend Running (JSON-File Mode)"}