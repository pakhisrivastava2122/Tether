from fastapi import APIRouter, HTTPException
from app.utils import json_db
from app.utils.models import (
    MatchUpdateRequest, MatchResponse, 
    ChildDB, FinalChildInfo, FinalImages, MatchInfo
)
from datetime import datetime
import uuid

router = APIRouter()

def _get_match_pair(submission_id: str):
    """
    Helper to find a submission and its match, returning both
    plus the role of the *initial* submission.
    """
    parent_report = None
    volunteer_report = None
    initial_role = None
    
    # Check if ID is in parents
    submission = json_db.find_submission(submission_id, 'parents')
    if submission:
        initial_role = 'parent'
        parent_report = submission
        matched_id = submission.get("match", {}).get("volunteer_report_id")
        if matched_id:
            volunteer_report = json_db.find_submission(matched_id, 'volunteers')
    else:
        # Check if ID is in volunteers
        submission = json_db.find_submission(submission_id, 'volunteers')
        if submission:
            initial_role = 'volunteer'
            volunteer_report = submission
            matched_id = submission.get("match", {}).get("parent_report_id")
            if matched_id:
                parent_report = json_db.find_submission(matched_id, 'parents')
        else:
            # If not in parents or volunteers, it's not a valid report ID
            raise HTTPException(status_code=404, detail="Submission not found")

    if not parent_report or not volunteer_report:
        raise HTTPException(status_code=404, detail="Match data is incomplete or missing. The other report may not exist.")
        
    return parent_report, volunteer_report, initial_role

@router.get("/match/{submission_id}", response_model=MatchResponse)
def get_match(submission_id: str):
    """
    Gets the match data for a given submission ID.
    This is called by the MatchConfirmationPage.
    """
    print(f"Fetching match data for submission_id: {submission_id}")
    
    parent_report, volunteer_report, initial_role = _get_match_pair(submission_id)
    
    # Get the score from the initial submission's perspective
    if initial_role == 'parent':
        match_score = parent_report.get("match", {}).get("score", 0.0)
    else:
        match_score = volunteer_report.get("match", {}).get("score", 0.0)

    return MatchResponse(
        submission_id=submission_id,
        match_score=match_score,
        parent_report=parent_report,
        volunteer_report=volunteer_report
    )

@router.post("/confirm")
def confirm_match(request: MatchUpdateRequest):
    """
    Confirms a match. 
    1. Sets `confirmed = True` for both records.
    2. Creates a new record in the `children` collection.
    """
    submission_id = request.submission_id
    print(f"Confirming match for submission_id: {submission_id}")
    
    parent_report, volunteer_report, _ = _get_match_pair(submission_id)
    
    parent_id = parent_report["_id"]
    volunteer_id = volunteer_report["_id"]
    
    # --- 1. Update Parent Record ---
    parent_report["match"]["confirmed"] = True
    parent_report["match"]["confirmed_at"] = datetime.utcnow().isoformat()
    json_db.update_submission(parent_id, {"match": parent_report["match"]}, 'parents')
    
    # --- 2. Update Volunteer Record ---
    volunteer_report["match"]["confirmed"] = True
    volunteer_report["match"]["confirmed_at"] = datetime.utcnow().isoformat()
    json_db.update_submission(volunteer_id, {"match": volunteer_report["match"]}, 'volunteers')

    # --- 3. Create New Child Record ---
    # Combine data from both reports
    combined_child_info = FinalChildInfo(
        final_name=parent_report["child_entered"]["name"], # Use parent's name
        final_age=parent_report["child_entered"]["age"],   # Use parent's age
        skin=parent_report["child_entered"]["skin"],       # Use parent's info
        birthmarks=list(set(parent_report["child_entered"]["birthmarks"] + volunteer_report["found_child"]["birthmarks"])), # Combine lists & remove duplicates
        city_last_seen=parent_report["child_entered"]["city"],
        address_found=volunteer_report["found_child"]["address_found"]
    )
    
    combined_images = FinalImages(
        parent_image_path=parent_report.get("image_path"),
        volunteer_image_path=volunteer_report.get("image_path")
    )
    
    new_child_record = ChildDB(
        parent_report_id=parent_id,
        volunteer_report_id=volunteer_id,
        child=combined_child_info,
        images=combined_images,
        match_score=parent_report["match"]["score"]
    )
    
    child_doc = new_child_record.model_dump(by_alias=True)
    json_db.insert_submission(child_doc, 'children')
    
    print(f"Created new child record: {child_doc['_id']}")
        
    return {"status": "confirmed", "child_id": child_doc['_id']}


@router.post("/reject")
def reject_match(request: MatchUpdateRequest):
    """
    Rejects a match. 
    This will clear the match info from BOTH records so they can be 
    matched again in the future.
    """
    submission_id = request.submission_id
    print(f"Rejecting match for submission_id: {submission_id}")
    
    try:
        parent_report, volunteer_report, _ = _get_match_pair(submission_id)
    except HTTPException as e:
        # Match might already be broken, which is fine
        if e.status_code == 404:
            return {"status": "already_rejected_or_not_found"}
        raise
    
    parent_id = parent_report["_id"]
    volunteer_id = volunteer_report["_id"]

    # Define the "cleared" match info
    cleared_match_info = MatchInfo(confirmed=False).model_dump()
    
    # Update both submissions
    json_db.update_submission(parent_id, {"match": cleared_match_info}, 'parents')
    json_db.update_submission(volunteer_id, {"match": cleared_match_info}, 'volunteers')

    return {"status": "rejected"}