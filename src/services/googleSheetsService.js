// Google Sheets API Service
// สำหรับอ่าน/เขียนข้อมูลใน Google Sheets

import { getAccessToken, refreshToken } from './googleAuth';

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;
const SHEET_GID = '681312581';
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Helper to make authenticated requests
const makeRequest = async (url, options = {}) => {
    let token = getAccessToken();

    if (!token) {
        throw new Error('Not authenticated. Please sign in with Google.');
    }

    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
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

// Get sheet name from GID
const getSheetName = async () => {
    try {
        const data = await makeRequest(`${SHEETS_API_BASE}/${SHEET_ID}?fields=sheets.properties`);
        const sheet = data.sheets?.find(s => s.properties.sheetId === parseInt(SHEET_GID));
        return sheet?.properties?.title || 'Sheet1';
    } catch {
        return 'Sheet1';
    }
};

// Get all data from sheet
export const getSheetData = async (range = null) => {
    const sheetName = await getSheetName();
    const rangeParam = range || `${sheetName}`;

    const data = await makeRequest(
        `${SHEETS_API_BASE}/${SHEET_ID}/values/${encodeURIComponent(rangeParam)}`
    );

    return data.values || [];
};

// Get sheet metadata (headers, row count, etc.)
export const getSheetMetadata = async () => {
    const data = await makeRequest(
        `${SHEETS_API_BASE}/${SHEET_ID}?fields=sheets.properties,sheets.data.rowData.values.userEnteredValue`
    );

    return data;
};

// Update a single cell
export const updateCell = async (range, value) => {
    const sheetName = await getSheetName();
    const fullRange = `${sheetName}!${range}`;

    const data = await makeRequest(
        `${SHEETS_API_BASE}/${SHEET_ID}/values/${encodeURIComponent(fullRange)}?valueInputOption=USER_ENTERED`,
        {
            method: 'PUT',
            body: JSON.stringify({
                range: fullRange,
                majorDimension: 'ROWS',
                values: [[value]]
            })
        }
    );

    return data;
};

// Update a range of cells
export const updateRange = async (range, values) => {
    const sheetName = await getSheetName();
    const fullRange = `${sheetName}!${range}`;

    const data = await makeRequest(
        `${SHEETS_API_BASE}/${SHEET_ID}/values/${encodeURIComponent(fullRange)}?valueInputOption=USER_ENTERED`,
        {
            method: 'PUT',
            body: JSON.stringify({
                range: fullRange,
                majorDimension: 'ROWS',
                values: values
            })
        }
    );

    return data;
};

// Append a new row
export const appendRow = async (values) => {
    const sheetName = await getSheetName();
    const range = `${sheetName}!A:Z`;

    const data = await makeRequest(
        `${SHEETS_API_BASE}/${SHEET_ID}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
            method: 'POST',
            body: JSON.stringify({
                majorDimension: 'ROWS',
                values: [values]
            })
        }
    );

    return data;
};

// Update an entire row by row number (1-indexed)
export const updateRow = async (rowNumber, values) => {
    const sheetName = await getSheetName();
    const lastColumn = columnToLetter(values.length - 1);
    const range = `${sheetName}!A${rowNumber}:${lastColumn}${rowNumber}`;

    const data = await makeRequest(
        `${SHEETS_API_BASE}/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
        {
            method: 'PUT',
            body: JSON.stringify({
                range: range,
                majorDimension: 'ROWS',
                values: [values]
            })
        }
    );

    return data;
};

// Delete a row (by clearing and shifting)
export const deleteRow = async (rowIndex) => {
    const sheetId = parseInt(SHEET_GID);

    const data = await makeRequest(
        `${SHEETS_API_BASE}/${SHEET_ID}:batchUpdate`,
        {
            method: 'POST',
            body: JSON.stringify({
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1, // 0-indexed
                            endIndex: rowIndex
                        }
                    }
                }]
            })
        }
    );

    return data;
};

// Insert a new row at specific position
export const insertRow = async (rowIndex, values = []) => {
    const sheetId = parseInt(SHEET_GID);

    // First, insert an empty row
    await makeRequest(
        `${SHEETS_API_BASE}/${SHEET_ID}:batchUpdate`,
        {
            method: 'POST',
            body: JSON.stringify({
                requests: [{
                    insertDimension: {
                        range: {
                            sheetId: sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex - 1,
                            endIndex: rowIndex
                        },
                        inheritFromBefore: false
                    }
                }]
            })
        }
    );

    // Then, fill with values if provided
    if (values.length > 0) {
        const sheetName = await getSheetName();
        await updateRange(`A${rowIndex}`, [values]);
    }

    return true;
};

// Batch update multiple cells
export const batchUpdate = async (updates) => {
    // updates = [{ range: 'A1', value: 'test' }, ...]
    const sheetName = await getSheetName();

    const data = await makeRequest(
        `${SHEETS_API_BASE}/${SHEET_ID}/values:batchUpdate`,
        {
            method: 'POST',
            body: JSON.stringify({
                valueInputOption: 'USER_ENTERED',
                data: updates.map(u => ({
                    range: `${sheetName}!${u.range}`,
                    majorDimension: 'ROWS',
                    values: [[u.value]]
                }))
            })
        }
    );

    return data;
};

// Convert column index to letter (0 -> A, 1 -> B, etc.)
export const columnToLetter = (column) => {
    let letter = '';
    while (column >= 0) {
        letter = String.fromCharCode((column % 26) + 65) + letter;
        column = Math.floor(column / 26) - 1;
    }
    return letter;
};

// Convert letter to column index (A -> 0, B -> 1, etc.)
export const letterToColumn = (letter) => {
    let column = 0;
    for (let i = 0; i < letter.length; i++) {
        column = column * 26 + (letter.charCodeAt(i) - 64);
    }
    return column - 1;
};

// Get cell reference (e.g., A1, B2)
export const getCellRef = (row, col) => {
    return `${columnToLetter(col)}${row}`;
};

export default {
    getSheetData,
    getSheetMetadata,
    updateCell,
    updateRange,
    appendRow,
    updateRow,
    deleteRow,
    insertRow,
    batchUpdate,
    columnToLetter,
    letterToColumn,
    getCellRef
};
