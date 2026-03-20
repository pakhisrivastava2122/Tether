```md
Tether Backend Project Structure

This document outlines the file and folder structure for the Python FastAPI backend.

app/
├── main.py             # --- API Entry Point ---
│                       # Initializes the FastAPI app, sets up
│                       # CORS, mounts the /uploads static
│                       # directory, and includes all the routers.
│
├── db/                   # --- JSON Database ---
│   ├── users.json        # Stores user accounts and hashed passwords.
│   ├── parents.json      # Stores all reports submitted by parents.
│   ├── volunteers.json   # Stores all reports submitted by volunteers.
│   └── children.json     # Stores confirmed/reunited children's info.
│
├── routes/               # --- API "Controller" Layer ---
│   ├── auth.py           # Handles all authentication routes:
│   │                     # - POST /api/auth/signup
│   │                     # - POST /api/auth/login
│   │                     # - GET  /api/auth/me (Get user info)
│   │                     # - GET  /api/auth/me/status (Check for confirmed matches)
│   │                     # - PUT  /api/auth/me (Update user profile)
│   │                     # - POST /api/auth/me/password (Update password)
│   │
│   ├── report.py         # Handles the core report submission:
│   │                     # - POST /api/report (Submits parent/volunteer form)
│   │                     # - Triggers face embedding and matching logic.
│   │
│   ├── match.py          # Handles actions *after* a match is found:
│   │                     # - GET  /api/match/{id} (Get details for confirmation)
│   │                     # - POST /api/confirm (Confirms a match)
│   │                     # - POST /api/reject (Rejects a match)
│   │
│   └── (images.py)       # (Legacy file, not used. StaticFiles in main.py)
│   └── (upload.py)       # (Legacy file, not used. Logic is in report.py)
│
├── utils/                # --- "Service" / Helper Layer ---
│   ├── json_db.py        # --- Data Access Layer ---
│   │                     # Contains all functions to read from and write
│   │                     # to the .json files in /db/.
│   │
│   ├── auth_utils.py     # Handles password hashing (Argon2), JWT token
│   │                     # creation/verification, and the
│   │                     # `get_current_user` dependency.
│   │
│   ├── recognition.py    # --- AI / ML Service ---
│   │                     # Uses `facenet-pytorch` to:
│   │                     # 1. Generate a 512-dimension face embedding
│   │                     #    from an image.
│   │                     # 2. Compare embeddings using Euclidean distance.
│   │
│   ├── models.py         # --- Data Schema Layer ---
│   │                     # Uses Pydantic to define all data structures,
│   │                     # e.g., `UserIn`, `ParentSubmission`, `MatchInfo`.
│   │
│   └── (gridfs_utils.py) # (Legacy file from a previous MongoDB version)
│
└── uploads/              # --- Static File Storage ---
    ├── image1.jpg      # All uploaded child images are
    └── image2.png      # saved here and served statically.

```