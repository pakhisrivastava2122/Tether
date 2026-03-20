# app/utils/gridfs_utils.py
from bson import ObjectId
from app.utils.database import fs


def save_image_to_gridfs(image_bytes: bytes, filename: str, content_type: str = "image/jpeg") -> str:
    """Save image bytes and return string file id."""
    file_id = fs.put(image_bytes, filename=filename, content_type=content_type)
    return str(file_id)


def get_image_from_gridfs(file_id: str):
    """Return tuple (bytes, content_type) for a GridFS file id."""
    grid_out = fs.get(ObjectId(file_id))
    return grid_out.read(), getattr(grid_out, "content_type", "application/octet-stream")

