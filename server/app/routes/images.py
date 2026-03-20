from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId
from app.utils.database import fs
import io

router = APIRouter()


@router.get("/image/{file_id}")
def serve_image(file_id: str):
    try:
        grid_out = fs.get(ObjectId(file_id))
    except Exception:
        raise HTTPException(404, "Image not found")

    return StreamingResponse(io.BytesIO(grid_out.read()), media_type=grid_out.content_type)
