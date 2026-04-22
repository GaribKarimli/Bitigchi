import io
import os
import uuid
import logging
from fastapi import UploadFile
from minio import Minio
from PIL import Image

logger = logging.getLogger(__name__)

# MinIO settings from environment
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadminpassword")
BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "bitigchi-media")
MINIO_PUBLIC_URL = os.getenv("MINIO_PUBLIC_URL", "http://localhost:9000")

# Initialize MinIO Client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)

def init_minio():
    """Ensure the media bucket exists and is public."""
    try:
        if not minio_client.bucket_exists(BUCKET_NAME):
            minio_client.make_bucket(BUCKET_NAME)
            logger.info(f"Created MinIO bucket: {BUCKET_NAME}")
            
            # Set bucket policy to public read
            policy = f"""{{
                "Version": "2012-10-17",
                "Statement": [
                    {{
                        "Effect": "Allow",
                        "Principal": {{"AWS": ["*"]}},
                        "Action": ["s3:GetObject"],
                        "Resource": ["arn:aws:s3:::{BUCKET_NAME}/*"]
                    }}
                ]
            }}"""
            minio_client.set_bucket_policy(BUCKET_NAME, policy)
            logger.info(f"Set public read policy for: {BUCKET_NAME}")
    except Exception as e:
        logger.error(f"Error initializing MinIO: {e}")


async def compress_and_upload_image(file: UploadFile, folder: str = "posts") -> str:
    """
    Reads an uploaded image, heavily compresses it by converting to WebP
    to minimize storage costs, and uploads it to MinIO.
    Returns the public URL of the uploaded image.
    """
    try:
        # Read file content into memory
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB (in case it's RGBA which can cause issues with some outputs, though WebP supports it well)
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
            
        # Optimize size - Resize max dimensions if extremely large
        image.thumbnail((1920, 1080))
        
        # Compress and save to WebP format in memory buffer
        buffer = io.BytesIO()
        image.save(buffer, format="WEBP", quality=80, method=4) # high compression
        buffer.seek(0)
        
        # Generate unique filename
        filename = f"{folder}/{uuid.uuid4().hex}.webp"
        
        # Upload to MinIO
        file_size = buffer.getbuffer().nbytes
        minio_client.put_object(
            BUCKET_NAME, 
            filename, 
            data=buffer, 
            length=file_size,
            content_type="image/webp"
        )
        
        # Return URL format
        return f"{MINIO_PUBLIC_URL}/{BUCKET_NAME}/{filename}"
        
    except Exception as e:
        logger.error(f"Failed to compress and upload image: {e}")
        raise ValueError(f"Image processing failed: {str(e)}")

async def upload_video(file: UploadFile, folder: str = "reels") -> str:
    """
    Video upload handler. (Advanced video compression usually requires ffmpeg,
    we'll stream upload directly for prototype or rely on client-side compression).
    """
    try:
        # For videos, we'll store them directly but we could pipe through ffmpeg
        contents = await file.read()
        buffer = io.BytesIO(contents)
        
        ext = file.filename.split('.')[-1] if '.' in file.filename else 'mp4'
        filename = f"{folder}/{uuid.uuid4().hex}.{ext}"
        
        minio_client.put_object(
            BUCKET_NAME, 
            filename, 
            data=buffer, 
            length=len(contents),
            content_type=file.content_type or "video/mp4"
        )
        return f"{MINIO_PUBLIC_URL}/{BUCKET_NAME}/{filename}"
    except Exception as e:
        logger.error(f"Failed to upload video: {e}")
        raise ValueError(f"Video upload failed: {str(e)}")
