import supabase from '../config/supabase';

/**
 * Supabase Storage Service
 * Handles file uploads and storage operations
 */

/** Extract storage path from a Supabase signed/public URL. Returns null if not a Supabase storage URL or if the extracted path is itself a URL (malformed data). */
export function extractStoragePathFromSupabaseUrl(url) {
    if (!url || typeof url !== 'string') return null;
    if (!url.includes('/storage/') || !url.includes('/object/')) return null;
    // Signed: .../object/sign/BUCKET/PATH?token=...  Public: .../object/public/PATH
    const signMatch = url.match(/\/object\/sign\/[^/]+\/(.+?)(\?|$)/);
    if (signMatch) {
        const path = decodeURIComponent(signMatch[1]);
        if (path.startsWith('http')) return null;
        return path;
    }
    const publicMatch = url.match(/\/object\/public\/(.+?)(\?|$)/);
    if (publicMatch) {
        const path = decodeURIComponent(publicMatch[1]);
        if (path.startsWith('http')) return null;
        return path;
    }
    return null;
}

class SupabaseStorageService {
    /**
     * Upload a file to Supabase Storage bucket
     * @param {File} file - File to upload
     * @param {string} bucket - Bucket name
     * @param {string} path - Path within the bucket (e.g., 'entity-icons/filename.jpg')
     * @param {Object} options - Upload options
     * @returns {Promise<Object>} Upload result with file path
     */
    async uploadFile(file, bucket, path, options = {}) {
        try {
            const {
                data,
                error
            } = await supabase.storage
                .from(bucket)
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: options.upsert || false, // Overwrite existing file
                    ...options
                });

            if (error) {
                throw error;
            }

            // Return file path instead of public URL
            return {
                success: true,
                path: data.path, // This is the path we'll store in DB
                fullPath: data.fullPath
            };
        } catch (error) {
            console.error('Error uploading file to Supabase:', error);
            throw error;
        }
    }

    /**
     * Upload entity profile picture
     * @param {File} file - Image file
     * @param {string} entityId - Entity ID
     * @returns {Promise<string>} File path to store in database
     */
    async uploadEntityProfilePicture(file, entityId) {
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${entityId}-profile-${timestamp}.${fileExt}`;
        // Path structure: {entityId}/assets/profile pictures/{fileName}
        const path = `${entityId}/assets/profile pictures/${fileName}`;

        const result = await this.uploadFile(file, 'CRM testing', path, {
            upsert: false,
            contentType: file.type
        });

        // Return just the path to store in database
        return result.path;
    }

    /**
     * Upload entity icon
     * @param {File} file - Image file
     * @param {string} entityId - Entity ID
     * @returns {Promise<string>} File path to store in database
     */
    async uploadEntityIcon(file, entityId) {
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${entityId}-icon-${timestamp}.${fileExt}`;
        // Path structure: {entityId}/assets/icons/{fileName}
        const path = `${entityId}/assets/icons/${fileName}`;

        const result = await this.uploadFile(file, 'CRM testing', path, {
            upsert: false,
            contentType: file.type
        });

        // Return just the path to store in database
        return result.path;
    }

    /**
     * Delete a file from Supabase Storage
     * @param {string} bucket - Bucket name
     * @param {string} path - Path to file
     * @returns {Promise<boolean>} Success status
     */
    async deleteFile(bucket, path) {
        try {
            const {
                error
            } = await supabase.storage
                .from(bucket)
                .remove([path]);

            if (error) {
                throw error;
            }

            return true;
        } catch (error) {
            console.error('Error deleting file from Supabase:', error);
            throw error;
        }
    }

    /**
     * Get signed URL for a file (temporary, secure access)
     * @param {string} bucket - Bucket name
     * @param {string} path - Path to file
     * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
     * @returns {Promise<string>} Signed URL
     */
    async getSignedUrl(bucket, path, expiresIn = 3600) {
        try {
            const {
                data,
                error
            } = await supabase.storage
                .from(bucket)
                .createSignedUrl(path, expiresIn);

            if (error) {
                throw error;
            }

            return data.signedUrl;
        } catch (error) {
            console.error('Error creating signed URL:', error);
            throw error;
        }
    }

    /**
     * Get public URL for a file (if bucket is public)
     * @param {string} bucket - Bucket name
     * @param {string} path - Path to file
     * @returns {string} Public URL
     */
    getPublicUrl(bucket, path) {
        const {
            data
        } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return data.publicUrl;
    }

    /**
     * Get file URL using Supabase SDK (preferred method)
     * Uses signed URL for secure access, falls back to public URL if bucket is public
     * @param {string} bucket - Bucket name
     * @param {string} path - Path to file
     * @param {boolean} useSignedUrl - Whether to use signed URL (default: true)
     * @param {number} expiresIn - Expiration time in seconds for signed URL (default: 3600)
     * @returns {Promise<string>} File URL
     */
    async getFileUrl(bucket, path, useSignedUrl = true, expiresIn = 3600) {
        if (!path) return null;

        try {
            if (useSignedUrl) {
                return await this.getSignedUrl(bucket, path, expiresIn);
            } else {
                return this.getPublicUrl(bucket, path);
            }
        } catch (error) {
            console.error('Error getting file URL:', error);
            // Fallback to public URL if signed URL fails
            return this.getPublicUrl(bucket, path);
        }
    }

    /**
     * List files in a bucket folder
     * @param {string} bucket - Bucket name
     * @param {string} folder - Folder path
     * @returns {Promise<Array>} List of files
     */
    async listFiles(bucket, folder = '') {
        try {
            const {
                data,
                error
            } = await supabase.storage
                .from(bucket)
                .list(folder);

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            console.error('Error listing files from Supabase:', error);
            throw error;
        }
    }

    /**
     * Upload interaction scratchpad image
     * @param {string} base64Data - Base64 image data (data:image/png;base64,...)
     * @param {string} entityId - Entity ID
     * @param {string} interactionId - Interaction ID
     * @param {string} fieldName - Field name (CC, S, O, AP)
     * @returns {Promise<string>} File path to store in database
     */
    async uploadInteractionScratchpad(base64Data, entityId, interactionId, fieldName) {
        try {
            // Convert base64 to Blob
            const base64Response = await fetch(base64Data);
            const blob = await base64Response.blob();
            
            // Create File from Blob
            const file = new File([blob], `${fieldName}.png`, { type: 'image/png' });
            
            // Path structure: {entityId}/interactions/{interactionId}/{fieldName}.png
            const path = `${entityId}/interactions/${interactionId}/${fieldName}.png`;
            
            const result = await this.uploadFile(file, 'CRM testing', path, {
                upsert: true, // Overwrite if exists (e.g. re-saving edit without changing image)
                contentType: 'image/png'
            });
            
            // Return just the path to store in database
            return result.path;
        } catch (error) {
            console.error('Error uploading interaction scratchpad to Supabase:', error);
            throw error;
        }
    }

    /**
     * Check if a file exists in Supabase Storage
     * @param {string} bucket - Bucket name
     * @param {string} path - Path to file
     * @returns {Promise<boolean>} Whether file exists
     */
    async fileExists(bucket, path) {
        try {
            const folderPath = path.split('/').slice(0, -1).join('/');
            const fileName = path.split('/').pop();
            
            const { data, error } = await supabase.storage
                .from(bucket)
                .list(folderPath);
            
            if (error) {
                return false;
            }
            
            return data?.some(file => file.name === fileName) || false;
        } catch (error) {
            console.error('Error checking file existence:', error);
            return false;
        }
    }

    /**
     * Upload report file to Supabase Storage
     * @param {File} file - File to upload
     * @param {string} entityId - Entity ID
     * @param {string} patientId - Patient ID
     * @param {string} reportId - Report ID
     * @returns {Promise<string>} File path to store in database
     */
    async uploadReport(file, entityId, patientId, reportId) {
        try {
            // Get file extension
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileName = `${reportId}.${fileExt}`;
            
            // Path structure: {entityId}/reports/{patientId}/{reportId}.{ext}
            const path = `${entityId}/reports/${patientId}/${fileName}`;
            
            const result = await this.uploadFile(file, 'CRM testing', path, {
                upsert: false,
                contentType: file.type
            });
            
            // Return just the path to store in database
            return result.path;
        } catch (error) {
            console.error('Error uploading report to Supabase:', error);
            throw error;
        }
    }
}

export default new SupabaseStorageService();
