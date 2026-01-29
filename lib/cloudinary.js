import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary image URL
 * @returns {string} - Public ID
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // Handle cloudinary URLs like: https://res.cloudinary.com/cloud_name/image/upload/v1234/public_id
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
    if (match) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} imageUrl - URL of the image to delete
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export const deleteCloudinaryImage = async (imageUrl) => {
  try {
    if (!imageUrl) return true; // No image to delete

    const publicId = extractPublicIdFromUrl(imageUrl);
    if (!publicId) {
      console.warn('Could not extract public ID from URL:', imageUrl);
      return true; // Don't fail if we can't extract ID
    }

    await cloudinary.uploader.destroy(publicId);
    console.log('Image deleted from Cloudinary:', publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error.message);
    // Don't throw, just log - deletion failure shouldn't block the operation
    return false;
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} imageUrls - Array of image URLs to delete
 * @returns {Promise<void>}
 */
export const deleteMultipleCloudinaryImages = async (imageUrls) => {
  try {
    const promises = imageUrls
      .filter(url => url) // Filter out empty/null URLs
      .map(url => deleteCloudinaryImage(url));
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error deleting multiple images:', error.message);
  }
};
