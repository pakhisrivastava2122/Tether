# app/routes/upload.py
from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId
import json
from datetime import datetime
import io

# from app.utils.database import submissions_col, fs
# badme thik krdunga 
from app.utils.json_db import (
    insert_submission,
    find_submission,
    update_submission,
    list_submissions
)
from app.utils.recognition import get_embedding, l2, distance_to_similarity

router = APIRouter()
THRESHOLD = 0.85


@router.post("/report")
async def report(request: Request, file: UploadFile = File(...)):
    form = await request.form()

    role = form.get("role")  # parent | volunteer

    # ============================
    # REPORTER FIELDS (MATCHING FRONTEND)
    # ============================
    reporter_name = form.get("reporter_name")
    reporter_email = form.get("reporter_email")
    reporter_alt_email = form.get("reporter_alt_email")
    reporter_phone = form.get("reporter_phone")
    reporter_alt_phone = form.get("reporter_alt_phone")

    # ============================
    # CHILD FIELDS (MATCHING FRONTEND)
    # ============================
    child_name = form.get("child_name")
    child_age = form.get("child_age")
    skin_complexion = form.get("skin_complexion")
    city = form.get("city")
    address = form.get("address")

    # ============================
    # BIRTHMARKS (frontend → birthmarks)
    # ============================
    birthmarks = json.loads(form.get("birthmarks", "[]"))

    # ============================
    # IMAGE — GridFS
    # ============================
    img_bytes = await file.read()
    image_id = fs.put(img_bytes, filename=file.filename, contentType=file.content_type)

    # ============================
    # FACE EMBEDDING
    # ============================
    embedding = get_embedding(img_bytes)

    # ============================
    # MATCH SEARCH
    # ============================
    match_id = None
    best_dist = 999
    match_score = None

    if embedding is not None:
        for doc in submissions_col.find({"role": {"$ne": role}, "embedding": {"$ne": None}}):
            dist = l2(embedding, doc["embedding"])
            if dist < best_dist:
                best_dist = dist
                match_id = str(doc["_id"])

        if best_dist < THRESHOLD:
            match_score = distance_to_similarity(best_dist)

    # ============================
    # SAVE DOCUMENT
    # ============================
    new_doc = {
        "role": role,
        "reporter": {
            "name": reporter_name,
            "email": reporter_email,
            "alt_email": reporter_alt_email,
            "phone": reporter_phone,
            "alt_phone": reporter_alt_phone,
        },
        "child": {
            "name": child_name,
            "age": child_age,
            "skin_complexion": skin_complexion,
            "city": city,
            "address": address,
            "birthmarks": birthmarks,
        },
        "image_id": image_id,
        "embedding": embedding.tolist() if embedding is not None else None,
        "match_info": {
            "matched_submission_id": match_id,
            "match_score": match_score,
            "is_confirmed": False,
            "confirmed_at": None
        },
        "created_at": datetime.utcnow(),
    }

    result = submissions_col.insert_one(new_doc)
    submission_id = str(result.inserted_id)

    return {
        "submission_id": submission_id,
        "match_found": match_score is not None,
        "matched_submission_id": match_id,
        "match_score": match_score
    }


# ============================
# GET MATCH DETAILS
# ============================
@router.get("/match/{submission_id}")
def get_match(submission_id: str):
    doc = submissions_col.find_one({"_id": ObjectId(submission_id)})
    if not doc:
        raise HTTPException(404, "Report not found")

    match_id = doc["match_info"]["matched_submission_id"]
    matched_doc = None

    if match_id:
        matched_doc = submissions_col.find_one({"_id": ObjectId(match_id)})

    return {
        "match_id": match_id,
        "match_score": doc["match_info"]["match_score"],
        "parent_report": doc if doc["role"] == "parent" else matched_doc,
        "volunteer_report": matched_doc if doc["role"] == "parent" else doc
    }


# ============================
# SERVE IMAGE
# ============================
@router.get("/image/{file_id}")
def serve_image(file_id: str):
    try:
        f = fs.get(ObjectId(file_id))
        return StreamingResponse(io.BytesIO(f.read()), media_type=f.content_type)
    except:
        raise HTTPException(404, "Image not found")


# ============================
# CONFIRM / REJECT MATCH
# ============================
@router.post("/confirm")
def confirm_match(submission_id: str):
    submissions_col.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {
            "match_info.is_confirmed": True,
            "match_info.confirmed_at": datetime.utcnow()
        }}
    )
    return {"status": "ok"}


@router.post("/reject")
def reject_match(submission_id: str):
    submissions_col.update_one(
        {"_id": ObjectId(submission_id)},
        {"$set": {
            "match_info.matched_submission_id": None,
            "match_info.match_score": None,
            "match_info.is_confirmed": False,
            "match_info.confirmed_at": None
        }}
    )
    return {"status": "ok"}
