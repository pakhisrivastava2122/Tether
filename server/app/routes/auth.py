from fastapi import APIRouter, Depends, HTTPException, status
from app.utils import json_db
from app.utils.models import (
    UserIn, Token, LoginRequest, UserBase, UserDB,
    UserUpdate, PasswordUpdate # --- NEW ---
)
from app.utils.auth_utils import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    get_current_user
)
import uuid

router = APIRouter()

@router.post("/signup", response_model=Token)
async def signup(user: UserIn):
    """
    Creates a new user account.
    """
    # Check for duplicates
    if json_db.find_user_by_identifier(user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )
    if json_db.find_user_by_identifier(user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    if json_db.find_user_by_identifier(user.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )
        
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create UserDB model
    user_db = UserDB(
        _id=str(uuid.uuid4()), # We need to generate the ID here
        username=user.username,
        email=user.email,
        phone=user.phone,
        hashed_password=hashed_password
    )
    
    # Save to users.json
    # Pydantic's .model_dump(by_alias=True) converts `id` to `_id`
    json_db.insert_submission(user_db.model_dump(by_alias=True), "users")
    
    # Create and return access token
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_db.model_dump() # Send user info back
    }

@router.post("/login", response_model=Token)
async def login(form_data: LoginRequest):
    """
    Logs in a user and returns an access token.
    """
    user = json_db.find_user_by_identifier(form_data.identifier)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username, email, or phone",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Create and return access token
    access_token = create_access_token(data={"sub": user["username"]})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user # Send back the user dict from DB
    }

@router.get("/me", response_model=UserBase)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """
    A protected route to test if a token is valid.
    """
    return current_user



# --- NEW: Route to get user's match status ---
@router.get("/me/status")
async def get_user_match_status(current_user: dict = Depends(get_current_user)):
    """
    Checks all of the user's reports (parent and volunteer)
    to find if any are confirmed.
    """
    user_id = current_user.get("_id")
    reports = json_db.find_reports_by_user_id(user_id)
    
    confirmed_match = None
    submission_id = None

    for report in reports:
        match_info = report.get("match", {})
        if match_info.get("confirmed"):
            confirmed_match = match_info
            submission_id = report.get("_id")
            break # Found one
            
    return {
        "confirmed_match": confirmed_match,
        "submission_id": submission_id
    }

# --- NEW: Route to update user details ---
@router.put("/me", response_model=UserBase)
async def update_user_details(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Updates the current user's username, email, or phone.
    """
    user_id = current_user.get("_id")
    
    # Check for duplicate username, email, phone *that isn't this user*
    if user_update.username != current_user.get("username"):
        if json_db.find_user_by_identifier(user_update.username):
            raise HTTPException(status_code=400, detail="Username already taken")
            
    if user_update.email != current_user.get("email"):
        if json_db.find_user_by_identifier(user_update.email):
            raise HTTPException(status_code=400, detail="Email already registered")

    if user_update.phone != current_user.get("phone"):
        if json_db.find_user_by_identifier(user_update.phone):
            raise HTTPException(status_code=400, detail="Phone already registered")

    # Update the user in the db
    updates = user_update.model_dump()
    json_db.update_user(user_id, updates)
    
    # Return the newly updated user object
    updated_user = json_db.find_user_by_id(user_id)
    return updated_user


# --- NEW: Route to update password ---
@router.post("/me/password")
async def update_user_password(
    pass_update: PasswordUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Updates the current user's password after verifying the old one.
    """
    user_id = current_user.get("_id")
    
    # 1. Verify old password
    if not verify_password(pass_update.old_password, current_user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect old password")
        
    # 2. Hash new password
    new_hashed_password = get_password_hash(pass_update.new_password)
    
    # 3. Update in DB
    json_db.update_user(user_id, {"hashed_password": new_hashed_password})
    
    return {"message": "Password updated successfully"}


# --- END OF FILE ---