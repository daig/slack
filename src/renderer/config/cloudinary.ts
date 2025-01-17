export const cloudinaryConfig = {
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
};

// Validate configuration
if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
  console.error('Missing Cloudinary configuration:', cloudinaryConfig);
}

export const getCloudinaryUploadUrl = (cloudName: string) => 
  `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`; 