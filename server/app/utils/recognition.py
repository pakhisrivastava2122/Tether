# app/utils/recognition.py
import numpy as np
from PIL import Image
from facenet_pytorch import MTCNN, InceptionResnetV1
import torch
import io
# FIX: Import Union for Python 3.9 compatibility
from typing import List, Dict, Any, Optional, Union 
import time

# Use CPU, as GPU might not be available in all prototype environments
# Change to "cuda:0" if you have a GPU and torch with CUDA installed
device = torch.device("cpu") 

print(f"Running facial recognition on device: {device}")

try:
    mtcnn = MTCNN(
        image_size=160, 
        margin=20, 
        keep_all=False, 
        device=device,
        post_process=False # We want tensors, not PIL Images
    )
    resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)
except Exception as e:
    print(f"Warning: Could not load facenet models. ML will fail. Error: {e}")
    mtcnn = None
    resnet = None

def image_bytes_to_embedding(img_bytes: bytes) -> Optional[np.ndarray]:
    """
    Takes image bytes, detects a face, and returns the 512D embedding.
    """
    if not resnet or not mtcnn:
        print("Error: Facenet models are not loaded.")
        return None
        
    try:
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        print(f"Error opening image: {e}")
        return None
        
    try:
        # Detect face
        face = mtcnn(img)
        
        if face is None:
            print("No face detected.")
            return None
        
        # Add batch dimension and send to device
        face = face.unsqueeze(0).to(device)
        
        # Generate embedding
        with torch.no_grad():
            emb = resnet(face)
            
        # Detach from graph, move to CPU, convert to numpy, and flatten
        return emb.detach().cpu().numpy()[0]
    except Exception as e:
        print(f"Error during embedding generation: {e}")
        return None


def euclidean_distance(a: np.ndarray, b: np.ndarray) -> float:
    """Calculates the L2 distance between two embeddings."""
    # allow b to be a list (from DB) or ndarray
    b_arr = b if isinstance(b, np.ndarray) else np.array(b)
    if a.shape != b_arr.shape:
        print(f"Warning: Embedding shape mismatch. {a.shape} vs {b_arr.shape}")
        return 999.0
    return float(np.linalg.norm(a - b_arr))

def distance_to_similarity(dist: float, max_dist: float = 1.2) -> float:
    """
    Convert Euclidean distance to a 0..1 similarity score.
    Lower distance -> higher similarity.
    max_dist: distance mapped to similarity 0 (tune for your dataset)
    A good match is typically < 0.6 distance.
    """
    # Using a common threshold (e.g., 1.2)
    # A distance of 0.0 -> 1.0 similarity
    # A distance of 1.2 -> 0.0 similarity
    similarity = max(0.0, 1.0 - (dist / max_dist))
    return float(similarity)

def find_best_match(
    # FIX: Use Union[] instead of | for Python 3.9 compatibility
    target_emb: Union[np.ndarray, List[float]], # Accept list or array
    candidates: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Finds the single best match from a list of candidate submissions.
    
    Args:
        target_emb (Union[np.ndarray, List[float]]): The embedding of the new submission.
        candidates (List[Dict]): List of submission dicts from json_db.
        
    Returns:
        Optional[Dict]: A dict with match info, or None.
    """
    best_match = None
    lowest_distance = float('inf')

    # A good threshold for Facenet L2 distance
    # Matches below this are likely the same person.
    # We can tune this: 0.8 is strict, 1.0 is more lenient.
    MATCH_THRESHOLD_DISTANCE = 1.0 

    # --- FIX (from previous error) ---
    # The target_emb is passed as a list from report.py,
    # but we need it as a numpy array for .shape and calculations.
    if not isinstance(target_emb, np.ndarray):
        target_emb = np.array(target_emb)
    # --- END FIX ---

    print(f"Target embedding shape: {target_emb.shape}")
    for candidate in candidates:
        cand_emb = candidate.get("embedding")
        if not cand_emb:
            # print(f"Candidate {candidate.get('_id')} has no embedding.")
            continue # Skip candidates with no embedding
        
        # Ensure candidate embedding is also a numpy array
        cand_emb_arr = cand_emb if isinstance(cand_emb, np.ndarray) else np.array(cand_emb)
        
        dist = euclidean_distance(target_emb, cand_emb_arr)
        # print(f"Dist to {candidate.get('_id')}: {dist}")
        
        if dist < lowest_distance:
            lowest_distance = dist
            best_match = candidate
            
    # Check if the best match is good enough
    print(f"Lowest distance found: {lowest_distance}")
    if best_match and lowest_distance < MATCH_THRESHOLD_DISTANCE:
        similarity_score = distance_to_similarity(lowest_distance)
        return {
            "submission": best_match,
            "distance": lowest_distance,
            "similarity": similarity_score
        }
    
    print("No match found below threshold.")
    return None # No match found


# Compatibility aliases for older route code
get_embedding = image_bytes_to_embedding
l2 = euclidean_distance