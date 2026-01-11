// Google Drive API Service
// สำหรับอัพโหลดรูปภาพไป Google Drive

import { getAccessToken, refreshToken } from './googleAuth';

const FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

// Helper to make authenticated requests
const makeRequest = async (url, options = {}) => {
    let token = getAccessToken();

    if (!token) {
        throw new Error('Not authenticated. Please sign in with Google.');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    let response = await fetch(url, { ...options, headers });

    // If token expired, refresh and retry
    if (response.status === 401) {
        try {
            token = await refreshToken();
            headers.Authorization = `Bearer ${token}`;
            response = await fetch(url, { ...options, headers });
        } catch (error) {
            throw new Error('Session expired. Please sign in again.');
        }
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }

    return response.json();
};

// Upload an image file to Google Drive
export const uploadImage = async (file, customFolderId = null) => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated. Please sign in with Google.');
    }

    const folderId = customFolderId || FOLDER_ID;

    // Create metadata
    const metadata = {
        name: file.name || `image_${Date.now()}.jpg`,
        mimeType: file.type || 'image/jpeg',
        parents: folderId ? [folderId] : []
    };

    // Create multipart form data
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
        `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: form
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();

    // Make file publicly accessible
    await setFilePublic(data.id);

    // Return the shareable image URL
    return {
        fileId: data.id,
        fileName: data.name,
        viewLink: data.webViewLink,
        downloadLink: data.webContentLink,
        directLink: `https://lh3.googleusercontent.com/d/${data.id}`
    };
};

// Upload image from URL
export const uploadImageFromUrl = async (imageUrl, fileName = null) => {
    try {
        // Fetch the image
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        // Create a File object
        const file = new File(
            [blob],
            fileName || `image_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`,
            { type: blob.type }
        );

        return uploadImage(file);
    } catch (error) {
        throw new Error(`Failed to upload image from URL: ${error.message}`);
    }
};

// Make a file publicly accessible
export const setFilePublic = async (fileId) => {
    const data = await makeRequest(
        `${DRIVE_API_BASE}/files/${fileId}/permissions`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                role: 'reader',
                type: 'anyone'
            })
        }
    );

    return data;
};

// Get shareable link for a file
export const getShareableLink = async (fileId) => {
    const data = await makeRequest(
        `${DRIVE_API_BASE}/files/${fileId}?fields=webViewLink,webContentLink`
    );

    return {
        viewLink: data.webViewLink,
        downloadLink: data.webContentLink,
        directLink: `https://lh3.googleusercontent.com/d/${fileId}`
    };
};

// Delete a file from Drive
export const deleteFile = async (fileId) => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('Not authenticated. Please sign in with Google.');
    }

    const response = await fetch(
        `${DRIVE_API_BASE}/files/${fileId}`,
        {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    if (!response.ok && response.status !== 204) {
        throw new Error('Failed to delete file');
    }

    return true;
};

// Create a folder in Drive
export const createFolder = async (folderName, parentFolderId = null) => {
    const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : []
    };

    const data = await makeRequest(
        `${DRIVE_API_BASE}/files`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        }
    );

    return data;
};

// List files in a folder
export const listFiles = async (folderId = null) => {
    const targetFolder = folderId || FOLDER_ID;
    const query = targetFolder
        ? `'${targetFolder}' in parents and trashed=false`
        : 'trashed=false';

    const data = await makeRequest(
        `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink)`
    );

    return data.files || [];
};

// Get file by ID
export const getFile = async (fileId) => {
    const data = await makeRequest(
        `${DRIVE_API_BASE}/files/${fileId}?fields=id,name,mimeType,webViewLink,webContentLink,thumbnailLink`
    );

    return data;
};

// Compress image before upload (optional utility)
export const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                },
                'image/jpeg',
                quality
            );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};

export default {
    uploadImage,
    uploadImageFromUrl,
    setFilePublic,
    getShareableLink,
    deleteFile,
    createFolder,
    listFiles,
    getFile,
    compressImage
};
