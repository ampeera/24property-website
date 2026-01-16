// Scout Service - สำหรับระบบค้นหาทรัพย์ใหม่
// แยกจากระบบเดิมโดยสิ้นเชิง

import { getAccessToken, refreshToken } from './googleAuth';

const SCOUT_FOLDER_ID = import.meta.env.VITE_SCOUT_DRIVE_FOLDER_ID;
const SCOUT_SHEET_ID = import.meta.env.VITE_SCOUT_SHEET_ID;
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Helper to make authenticated requests
const makeRequest = async (url, options = {}) => {
    let token = getAccessToken();

    if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบ Google ก่อน');
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
            throw new Error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        }
    }

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API request failed');
    }

    return response.json();
};

// Make file publicly accessible
const setFilePublic = async (fileId) => {
    await makeRequest(
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
};

// Upload image to Scout Drive folder
export const uploadScoutImage = async (file) => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบ Google ก่อน');
    }

    if (!SCOUT_FOLDER_ID) {
        throw new Error('ไม่พบ VITE_SCOUT_DRIVE_FOLDER_ID');
    }

    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `scout_${timestamp}.jpg`;

    // Create metadata
    const metadata = {
        name: fileName,
        mimeType: file.type || 'image/jpeg',
        parents: [SCOUT_FOLDER_ID]
    };

    // Create multipart form data
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch(
        `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id,name,webViewLink`,
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
        throw new Error(error.error?.message || 'อัพโหลดรูปภาพไม่สำเร็จ');
    }

    const data = await response.json();

    // Make file publicly accessible
    await setFilePublic(data.id);

    // Return the direct link for viewing
    return {
        fileId: data.id,
        fileName: data.name,
        viewLink: data.webViewLink,
        directLink: `https://lh3.googleusercontent.com/d/${data.id}`
    };
};

// Save scout entry to Google Sheet
export const saveScoutEntry = async (entry) => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบ Google ก่อน');
    }

    if (!SCOUT_SHEET_ID) {
        throw new Error('ไม่พบ VITE_SCOUT_SHEET_ID');
    }

    // Format: วันที่และเวลา, URL รูปภาพ, พิกัด, หมายเหตุ
    const values = [
        [
            entry.datetime || new Date().toLocaleString('th-TH'),
            entry.imageUrl || '',
            entry.coordinates || '',
            entry.notes || ''
        ]
    ];

    const response = await fetch(
        `${SHEETS_API_BASE}/${SCOUT_SHEET_ID}/values/A:D:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                majorDimension: 'ROWS',
                values: values
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'บันทึกข้อมูลไม่สำเร็จ');
    }

    return await response.json();
};

// Get current GPS coordinates
export const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('เบราว์เซอร์ไม่รองรับ GPS'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                resolve({
                    lat: latitude,
                    lng: longitude,
                    formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                    googleMapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`
                });
            },
            (error) => {
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        reject(new Error('ไม่ได้รับอนุญาตให้เข้าถึง GPS'));
                        break;
                    case error.POSITION_UNAVAILABLE:
                        reject(new Error('ไม่สามารถระบุตำแหน่งได้'));
                        break;
                    case error.TIMEOUT:
                        reject(new Error('หมดเวลาในการดึงตำแหน่ง'));
                        break;
                    default:
                        reject(new Error('เกิดข้อผิดพลาดในการดึงตำแหน่ง'));
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
};

// Compress image before upload
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
                        reject(new Error('บีบอัดรูปภาพไม่สำเร็จ'));
                    }
                },
                'image/jpeg',
                quality
            );
        };
        img.onerror = () => reject(new Error('โหลดรูปภาพไม่สำเร็จ'));
        img.src = URL.createObjectURL(file);
    });
};

// Get all scout entries from Google Sheet
export const getScoutEntries = async () => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบ Google ก่อน');
    }

    if (!SCOUT_SHEET_ID) {
        throw new Error('ไม่พบ VITE_SCOUT_SHEET_ID');
    }

    const response = await fetch(
        `${SHEETS_API_BASE}/${SCOUT_SHEET_ID}/values/A:D?majorDimension=ROWS`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'ดึงข้อมูลไม่สำเร็จ');
    }

    const data = await response.json();
    const rows = data.values || [];

    // Skip header row (first row), map remaining to objects
    // rowIndex starts at 2 because row 1 is header
    return rows.slice(1).map((row, index) => ({
        rowIndex: index + 2, // 2-indexed (skipping header at row 1)
        datetime: row[0] || '',
        imageUrl: row[1] || '',
        coordinates: row[2] || '',
        notes: row[3] || ''
    }));
};

// Delete a scout entry from Google Sheet by row index
export const deleteScoutEntry = async (rowIndex) => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบ Google ก่อน');
    }

    if (!SCOUT_SHEET_ID) {
        throw new Error('ไม่พบ VITE_SCOUT_SHEET_ID');
    }

    // Get sheet ID (GID) - usually 0 for first sheet
    const sheetMetaResponse = await fetch(
        `${SHEETS_API_BASE}/${SCOUT_SHEET_ID}?fields=sheets.properties`,
        {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
    );

    if (!sheetMetaResponse.ok) {
        throw new Error('ไม่สามารถดึงข้อมูล Sheet ได้');
    }

    const sheetMeta = await sheetMetaResponse.json();
    const sheetId = sheetMeta.sheets?.[0]?.properties?.sheetId || 0;

    // Delete the row using batchUpdate
    const response = await fetch(
        `${SHEETS_API_BASE}/${SCOUT_SHEET_ID}:batchUpdate`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1, // 0-indexed
                            endIndex: rowIndex // exclusive
                        }
                    }
                }]
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'ลบข้อมูลไม่สำเร็จ');
    }

    return await response.json();
};

// Update scout entry notes in Google Sheet
export const updateScoutNotes = async (rowIndex, notes) => {
    const token = getAccessToken();
    if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบ Google ก่อน');
    }

    if (!SCOUT_SHEET_ID) {
        throw new Error('ไม่พบ VITE_SCOUT_SHEET_ID');
    }

    // Update only the notes column (D)
    const response = await fetch(
        `${SHEETS_API_BASE}/${SCOUT_SHEET_ID}/values/D${rowIndex}?valueInputOption=USER_ENTERED`,
        {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [[notes]]
            })
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'อัพเดทหมายเหตุไม่สำเร็จ');
    }

    return await response.json();
};

export default {
    uploadScoutImage,
    saveScoutEntry,
    getScoutEntries,
    deleteScoutEntry,
    updateScoutNotes,
    getCurrentLocation,
    compressImage
};
