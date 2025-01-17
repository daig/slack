import boto3
from botocore.config import Config
import os
from typing import Dict, Optional
from datetime import datetime, UTC
import mimetypes

def generate_presigned_url(
    file_name: str,
    file_size: int,
    content_type: Optional[str] = None,
    expiration: int = 3600
) -> Dict[str, str]:
    """
    Generate a presigned URL for uploading a file to S3.
    
    Args:
        file_name (str): Original name of the file
        file_size (int): Size of the file in bytes
        content_type (str, optional): MIME type of the file
        expiration (int): URL expiration time in seconds (default: 1 hour)
    
    Returns:
        Dict containing the presigned URL and the file key
    """
    # Configure S3 client with appropriate region
    s3_client = boto3.client(
        's3',
        region_name='eu-north-1',  # Match your bucket region
        config=Config(signature_version='s3v4')
    )
    
    # Generate a unique file key using timestamp and original filename
    timestamp = datetime.now(UTC).strftime('%Y%m%d_%H%M%S')
    file_extension = os.path.splitext(file_name)[1]
    unique_key = f"uploads/{timestamp}_{file_name}"
    
    # If content_type wasn't provided, try to guess it
    if not content_type:
        content_type = mimetypes.guess_type(file_name)[0] or 'application/octet-stream'
    
    # Generate the presigned URL
    try:
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': 'dai-slack-app-uploads',
                'Key': unique_key,
                'ContentType': content_type,
                'ContentLength': file_size
            },
            ExpiresIn=expiration,
            HttpMethod='PUT'
        )
        
        return {
            'presignedUrl': presigned_url,
            'fileKey': unique_key,
            'bucket': 'dai-slack-app-uploads'
        }
        
    except Exception as e:
        raise Exception(f"Failed to generate presigned URL: {str(e)}") 