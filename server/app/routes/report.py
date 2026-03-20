import json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from app.utils import json_db, recognition
# Import new models
from app.utils.models import (
    ParentInfo, ChildInfo, ParentSubmission,
    VolunteerInfo, FoundChildInfo, VolunteerSubmission, MatchInfo
)
# --- NEW ---
from app.utils.auth_utils import get_current_user
from typing import Optional, Dict, Any

router = APIRouter()

# --- Helper Function for Matching Logic ---

def find_and_update_match(
    new_submission_id: str,
    new_submission_role: str, # Note: This is "parent" or "volunteer" (singular)
    new_emb: Optional[list]
    ) -> Optional[dict]:
    """
    Compares a new submission against the *opposite* collection.
    If a match is found, it updates both records in the database.
    """
    if not new_emb:
        print(f"Submission {new_submission_id} has no embedding, skipping match.")
        return None

    # Determine search collection and keys
    if new_submission_role == 'parent':
        search_collection = 'volunteers' # Plural
        my_match_key = "volunteer_report_id"
        their_match_key = "parent_report_id"
        my_collection_name = 'parents' # Plural
    else:
        search_collection = 'parents' # Plural
        my_match_key = "parent_report_id"
        their_match_key = "volunteer_report_id"
        my_collection_name = 'volunteers' # Plural
        
    all_candidates = json_db.list_submissions(search_collection)
    
    # Filter candidates: must have an embedding and not be matched
    candidates = []
    for sub in all_candidates:
        if sub.get("embedding") is not None:
            # Check if match object is default/empty
            match_info = sub.get("match", {})
            if not match_info.get("parent_report_id") and not match_info.get("volunteer_report_id"):
                candidates.append(sub)

    if not candidates:
        print(f"No eligible candidates found in '{search_collection}'.")
        return None
        
    print(f"Comparing against {len(candidates)} candidates from '{search_collection}'...")
    
    # Find Best Match
    best_match_result = recognition.find_best_match(
        target_emb=new_emb,
        candidates=candidates
    )

    if not best_match_result:
        print("No match found above threshold.")
        return None

    # --- We Found a Match! ---
    matched_sub = best_match_result["submission"]
    matched_id = matched_sub["_id"]
    similarity = best_match_result["similarity"]
    
    print(f"MATCH FOUND! ID: {matched_id} with similarity: {similarity:.2f}")
    
    # --- Update Both Records ---
    # 1. Update the new submission (the one just posted)
    new_match_info = MatchInfo(
        **{my_match_key: matched_id, "score": similarity, "confirmed": False}
    ).model_dump() # Use model_dump() for Pydantic v2
    
    json_db.update_submission(new_submission_id, {"match": new_match_info}, my_collection_name)

    # 2. Update the existing submission (the one found in DB)
    existing_match_info = MatchInfo(
        **{their_match_key: new_submission_id, "score": similarity, "confirmed": False}
    ).model_dump()
    json_db.update_submission(matched_id, {"match": existing_match_info}, search_collection)
    
    return best_match_result



# -----------------------------------------------------------------------
# --- API ROUTES ---

@router.post("/report")
async def create_report(
    # --- Get the logged-in user ---
    current_user: Dict[str, Any] = Depends(get_current_user),

    # We still accept flat Form data, as the frontend sends this
    role: str = Form(...),
    reporter_name: str = Form(...),
    reporter_email: str = Form(...),
    reporter_alt_email: str = Form(""),
    reporter_phone: str = Form(...),
    reporter_alt_phone: str = Form(""),
    child_name: str = Form(...), 
    child_age: int = Form(...), 
    skin_complexion: str = Form(...),
    city: str = Form(...), 
    address: str = Form(""), # Volunteer only
    birthmarks: str = Form("[]"), # Expecting a JSON string
    file: UploadFile = File(...)
):
    try:
        # --- 0. Get User ID ---
        user_id = current_user.get("_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid user data in token")
          
        # --- 1. Read Image Bytes & Generate Embedding ---
        image_bytes = await file.read()
        embedding_array = recognition.get_embedding(image_bytes)
        embedding_list = embedding_array.tolist() if embedding_array is not None else None
        
        parsed_birthmarks = json.loads(birthmarks)
        
        submission_id = None
        collection_name = "" 
        
        # --- 2. Create Submission based on Role ---
        if role == 'parent':
            collection_name = "parents"
            # Transform flat data into nested schema
            parent_data = ParentSubmission(
                # --- CRITICAL FIX IS HERE ---
                user_id=user_id,
                # ------------------------------
                parent=ParentInfo(
                    name=reporter_name,
                    email=reporter_email,
                    alt_email=reporter_alt_email,
                    phone=reporter_phone,
                    alt_phone=reporter_alt_phone
                ),
                child_entered=ChildInfo(
                    name=child_name,
                    age=child_age,
                    skin=skin_complexion,
                    birthmarks=parsed_birthmarks,
                    city=city 
                ),
                embedding=embedding_list
            )
            submission_data = parent_data.model_dump(by_alias=True)
            submission_id = json_db.insert_submission(submission_data, collection_name)
        
        elif role == 'volunteer':
            collection_name = "volunteers"
            # Transform flat data into nested schema
            volunteer_data = VolunteerSubmission(
                # --- CRITICAL FIX IS HERE ---
                user_id=user_id,
                # ------------------------------
                volunteer=VolunteerInfo(
                    name=reporter_name,
                    email=reporter_email,
                    phone=reporter_phone,
                    alt_phone=reporter_alt_phone
                ),
                found_child=FoundChildInfo(
                    approx_age=child_age,
                    skin=skin_complexion,
                    birthmarks=parsed_birthmarks,
                    city_found=city,
                    address_found=address
                ),
                embedding=embedding_list
            )
            submission_data = volunteer_data.model_dump(by_alias=True)
            submission_id = json_db.insert_submission(submission_data, collection_name)
        
        else:
            raise HTTPException(status_code=400, detail="Invalid role specified")

        # --- 3. Save Image File using the ID ---
        image_path = await json_db.save_image_file(file, submission_id)
        
        # --- 4. Update Submission with Image Path ---
        json_db.update_submission(submission_id, {"image_path": image_path}, collection_name)
        
        # --- 5. Run Matching Logic ---
        match_result = find_and_update_match(
            new_submission_id=submission_id,
            new_submission_role=role,
            new_emb=embedding_list
        )

        # --- 6. Return Response ---
        if match_result:
            return {
                "match_found": True,
                "submission_id": submission_id,
                "match_score": match_result["similarity"]
            }
        else:
            return {
                "match_found": False,
                "submission_id": submission_id
            }
            
    except Exception as e:
        print(f"Error in create_report: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")