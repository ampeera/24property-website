import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Plus,
    Trash2,
    Save,
    RefreshCw,
    Wand2,
    Search,
    Download,
    Loader2,
    CheckSquare,
    Square,
    LogIn,
    LogOut,
    User,
    AlertCircle,
    ExternalLink,
    Image as ImageIcon
} from 'lucide-react';
import { initGoogleAuth, signIn, signOut, isSignedIn, getCurrentUser, onAuthChange } from '../../services/googleAuth';
import { getSheetData, updateCell, appendRow, deleteRow, getCellRef, columnToLetter } from '../../services/googleSheetsService';
import EditableCell, { CELL_TYPES, DROPDOWN_OPTIONS } from '../../components/admin/EditableCell';
import ImageUploadCell from '../../components/admin/ImageUploadCell';
import LinkCell from '../../components/admin/LinkCell';
import AIGeneratorPanel from '../../components/admin/AIGeneratorPanel';
import CoverImageGenerator from '../../components/admin/CoverImageGenerator';


// Column configuration
const COLUMNS = [
    { key: 'รหัส', label: 'รหัส', type: CELL_TYPES.TEXT, width: 60 },
    { key: 'โซน', label: 'โซน', type: CELL_TYPES.DROPDOWN, width: 60 },
    { key: 'ชื่อโซน', label: 'ชื่อโซน', type: CELL_TYPES.TEXT, width: 150 },
    { key: 'ไอคอนโซน', label: 'ไอคอน', type: CELL_TYPES.TEXT, width: 60 },
    { key: 'เกรด', label: 'เกรด', type: CELL_TYPES.DROPDOWN, width: 60 },
    { key: 'ประเภท', label: 'ประเภท', type: CELL_TYPES.DROPDOWN, width: 100 },
    { key: 'สถานะ', label: 'สถานะ', type: CELL_TYPES.DROPDOWN, width: 80 },
    { key: 'ชื่อโครงการ', label: 'ชื่อโครงการ', type: CELL_TYPES.TEXT, width: 180 },
    { key: 'ราคา', label: 'ราคา', type: CELL_TYPES.NUMBER, width: 100 },
    { key: 'ไร่', label: 'ไร่', type: CELL_TYPES.NUMBER, width: 50 },
    { key: 'งาน', label: 'งาน', type: CELL_TYPES.NUMBER, width: 50 },
    { key: 'ตรว', label: 'ตรว', type: CELL_TYPES.NUMBER, width: 50 },
    { key: 'ลิงก์แผนที่', label: 'แผนที่', type: CELL_TYPES.LINK, width: 80 },
    { key: 'รายละเอียด', label: 'รายละเอียด', type: CELL_TYPES.TEXT, width: 200 },
    { key: 'url รูปภาพปก', label: 'ปก', type: CELL_TYPES.IMAGE, width: 50 },
    { key: 'url รูปภาพจำลอง', label: 'จำลอง', type: CELL_TYPES.IMAGE, width: 50 },
    { key: 'url รูปภาพ 2', label: '2', type: CELL_TYPES.IMAGE, width: 40 },
    { key: 'url รูปภาพ 3', label: '3', type: CELL_TYPES.IMAGE, width: 40 },
    { key: 'url รูปภาพ 4', label: '4', type: CELL_TYPES.IMAGE, width: 40 },
    { key: 'url รูปภาพ 5', label: '5', type: CELL_TYPES.IMAGE, width: 40 },
    { key: 'url รูปภาพ 6', label: '6', type: CELL_TYPES.IMAGE, width: 40 },
    { key: 'url รูปภาพ 7', label: '7', type: CELL_TYPES.IMAGE, width: 40 },
    { key: 'url รูปภาพ 8', label: '8', type: CELL_TYPES.IMAGE, width: 40 },
    { key: 'url รูปภาพ 9', label: '9', type: CELL_TYPES.IMAGE, width: 40 },
];

function SpreadsheetAdmin() {
    // State
    const [data, setData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [editingCell, setEditingCell] = useState(null);
    const [selectedCell, setSelectedCell] = useState(null);
    const [showAIPanel, setShowAIPanel] = useState(false);
    const [showCoverGenerator, setShowCoverGenerator] = useState(false);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [pendingChanges, setPendingChanges] = useState(new Map());
    const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);

    const tableRef = useRef(null);

    // Initialize Google Auth and listen for changes
    useEffect(() => {
        const init = async () => {
            try {
                await initGoogleAuth();

                // Check initial state
                if (isSignedIn()) {
                    setUser(getCurrentUser());
                    setIsGoogleSignedIn(true);
                }

                // Listen for auth changes
                const unsubscribe = onAuthChange((authState) => {
                    setIsGoogleSignedIn(authState.isSignedIn);
                    setUser(authState.user);
                    setAuthLoading(false); // Stop loading when auth state changes

                    // Reload data when signed in
                    if (authState.isSignedIn) {
                        loadData();
                    }
                });

                setAuthLoading(false); // Stop loading after init completes

                return () => unsubscribe();
            } catch (err) {
                console.error('Auth init error:', err);
                setAuthLoading(false); // Stop loading on error too
            }
        };
        init();
    }, []);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    // Load data from Google Sheets
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Try to use authenticated API first
            if (isGoogleSignedIn) {
                const sheetData = await getSheetData();
                if (sheetData.length > 0) {
                    setHeaders(sheetData[0]);
                    setData(sheetData.slice(1));
                    setLoading(false);
                    return;
                }
            }

            // Fallback to public CSV
            const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEETS_ID;
            const SHEET_GID = '681312581';
            const response = await fetch(
                `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`
            );
            const csv = await response.text();
            const rows = parseCSV(csv);

            if (rows.length > 0) {
                setHeaders(rows[0]);
                setData(rows.slice(1));
            }
        } catch (err) {
            setError('Failed to load data: ' + err.message);
        }
        setLoading(false);
    };

    // Parse CSV
    const parseCSV = (csv) => {
        const lines = csv.split('\n');
        const result = [];

        for (const line of lines) {
            if (!line.trim()) continue;

            const values = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim().replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/^"|"$/g, ''));
            result.push(values);
        }

        return result;
    };

    // Handle Google Sign In
    const handleSignIn = async () => {
        try {
            const result = await signIn();
            setUser(result.user);
            setIsGoogleSignedIn(true);
            setAuthLoading(false);
            // Reload data with authenticated access
            loadData();
        } catch (err) {
            setError('Sign in failed: ' + err.message);
            setAuthLoading(false);
        }
    };

    // Handle Sign Out
    const handleSignOut = () => {
        signOut();
        setUser(null);
    };

    // Handle cell value change
    const handleCellChange = async (rowIndex, colIndex, newValue) => {
        // Update local state
        const newData = [...data];
        newData[rowIndex][colIndex] = newValue;
        setData(newData);

        // Track pending change
        const key = `${rowIndex}-${colIndex}`;
        setPendingChanges(prev => new Map(prev).set(key, { rowIndex, colIndex, value: newValue }));

        // If signed in, save immediately
        if (isGoogleSignedIn) {
            try {
                const cellRef = getCellRef(rowIndex + 2, colIndex); // +2 for header row and 1-indexing
                await updateCell(cellRef, newValue);

                // Remove from pending
                setPendingChanges(prev => {
                    const next = new Map(prev);
                    next.delete(key);
                    return next;
                });
            } catch (err) {
                console.error('Save failed:', err);
                setError(`Failed to save: ${err.message}`);
            }
        }
    };

    // Handle checkbox toggle
    const handleRowSelect = (rowIndex) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(rowIndex)) {
            newSelected.delete(rowIndex);
        } else {
            newSelected.add(rowIndex);
        }
        setSelectedRows(newSelected);
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedRows.size === filteredData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(filteredData.map((_, i) => i)));
        }
    };

    // Handle add row
    const handleAddRow = async () => {
        const newRow = headers.map(() => '');

        if (isGoogleSignedIn) {
            try {
                await appendRow(newRow);
                loadData(); // Reload to get updated data
            } catch (err) {
                setError('Failed to add row: ' + err.message);
            }
        } else {
            setData([...data, newRow]);
        }
    };

    // Handle delete selected rows
    const handleDeleteSelected = async () => {
        if (selectedRows.size === 0) return;

        if (!confirm(`ต้องการลบ ${selectedRows.size} แถวที่เลือก?`)) return;

        if (isGoogleSignedIn) {
            try {
                setSaving(true);
                // Delete from bottom to top to avoid index shifting
                const sortedRows = Array.from(selectedRows).sort((a, b) => b - a);
                for (const rowIndex of sortedRows) {
                    await deleteRow(rowIndex + 2); // +2 for header and 1-indexing
                }
                setSelectedRows(new Set());
                loadData();
            } catch (err) {
                setError('Failed to delete: ' + err.message);
            }
            setSaving(false);
        } else {
            const newData = data.filter((_, i) => !selectedRows.has(i));
            setData(newData);
            setSelectedRows(new Set());
        }
    };

    // Handle keyboard navigation
    const handleNavigate = (row, col) => {
        const maxRow = data.length - 1;
        const maxCol = headers.length - 1;

        const newRow = Math.max(0, Math.min(row, maxRow));
        const newCol = Math.max(0, Math.min(col, maxCol));

        setSelectedCell({ row: newRow, col: newCol });
        setEditingCell(null);
    };

    // Handle AI apply text
    const handleAIApplyText = (columnName, text) => {
        if (selectedCell === null) return;

        const colIndex = headers.indexOf(columnName);
        if (colIndex >= 0) {
            handleCellChange(selectedCell.row, colIndex, text);
        }
    };

    // Handle AI apply image
    const handleAIApplyImage = (imageUrl) => {
        if (selectedCell === null) return;

        const colIndex = headers.indexOf('url รูปภาพปก');
        if (colIndex >= 0) {
            handleCellChange(selectedCell.row, colIndex, imageUrl);
        }
    };

    // Get property data for AI
    const getPropertyData = (rowIndex) => {
        if (rowIndex === null || !data[rowIndex]) return null;

        const row = data[rowIndex];
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = row[i];
        });

        return {
            type: obj['ประเภท'],
            title: obj['ชื่อโครงการ'],
            price: parseFloat(obj['ราคา']) || 0,
            zone: obj['โซน'],
            zoneName: obj['ชื่อโซน'],
            grade: obj['เกรด'],
            status: obj['สถานะ'],
            area: `${obj['ไร่'] || 0} ไร่ ${obj['งาน'] || 0} งาน ${obj['ตรว'] || 0} ตร.ว.`
        };
    };

    // Export to CSV
    const handleExport = () => {
        const csvContent = [headers, ...data]
            .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `24property_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Filter data
    const filteredData = data.filter(row => {
        if (!searchTerm) return true;
        return row.some(cell =>
            String(cell || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // Get column config
    const getColumnConfig = (header) => {
        return COLUMNS.find(c => c.key === header) || { type: CELL_TYPES.TEXT, width: 120 };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        // Use calculated height to fit within AdminLayout (100vh - header 64px - padding 48px ~ 112px)
        <div className="h-[calc(100vh-120px)] bg-gray-100 flex flex-col overflow-hidden rounded-lg shadow-sm border border-gray-200">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-40 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold text-gray-900">
                        📊 Spreadsheet Admin
                    </h1>
                    <span className="text-sm text-gray-500">
                        {data.length} rows
                    </span>
                    {pendingChanges.size > 0 && (
                        <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                            {pendingChanges.size} unsaved changes
                        </span>
                    )}
                </div>

                {/* Auth Controls */}
                <div className="flex items-center gap-2">
                    {/* Check both user state and direct auth service state */}
                    {user || getCurrentUser() ? (
                        <div className="flex items-center gap-2">
                            <img
                                src={user?.picture || getCurrentUser()?.picture}
                                alt=""
                                className="w-7 h-7 rounded-full"
                            />
                            <span className="text-sm text-gray-600">{user?.name || getCurrentUser()?.name}</span>
                            <button
                                onClick={handleSignOut}
                                className="text-gray-400 hover:text-gray-600 p-1"
                                title="Sign Out"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleSignIn}
                            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                            <LogIn size={16} />
                            Sign in with Google
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 sticky top-[49px] z-30">
                <button
                    onClick={handleAddRow}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    disabled={!isGoogleSignedIn}
                    title={isGoogleSignedIn ? 'Add Row' : 'Sign in to add rows'}
                >
                    <Plus size={16} />
                    เพิ่มแถว
                </button>

                <button
                    onClick={handleDeleteSelected}
                    disabled={selectedRows.size === 0 || !isGoogleSignedIn}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 size={16} />
                    ลบ ({selectedRows.size})
                </button>

                <button
                    onClick={loadData}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    รีเฟรช
                </button>

                <button
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm ${showAIPanel
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                >
                    <Wand2 size={16} />
                    AI Text
                </button>

                <button
                    onClick={() => setShowCoverGenerator(true)}
                    disabled={selectedCell === null}
                    className="flex items-center gap-1 px-3 py-1.5 rounded text-sm bg-pink-100 text-pink-700 hover:bg-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={selectedCell === null ? 'เลือกแถวก่อน' : 'สร้างรูปปก/จำลองด้วย AI'}
                >
                    <ImageIcon size={16} />
                    AI รูป
                </button>

                <div className="flex-1" />

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหา..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm w-60 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                <button
                    onClick={handleExport}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                >
                    <Download size={16} />
                    Export
                </button>

                <a
                    href={`https://docs.google.com/spreadsheets/d/${import.meta.env.VITE_GOOGLE_SHEETS_ID}/edit#gid=681312581`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                >
                    <ExternalLink size={16} />
                    Open Sheet
                </a>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-red-600">
                    <AlertCircle size={16} />
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                        ✕
                    </button>
                </div>
            )}

            {/* Table Container with horizontal scroll */}
            <div className="flex-1 overflow-x-auto overflow-y-auto" style={{ marginRight: showAIPanel ? '320px' : 0 }}>
                <table ref={tableRef} className="border-collapse bg-white" style={{ minWidth: 'max-content' }}>
                    <thead className="sticky top-0 z-20">
                        {/* Column Letters Row */}
                        <tr className="bg-gray-100">
                            <th className="w-10 px-2 py-1 text-xs text-gray-500 border-r border-b border-gray-300 bg-gray-200">
                                {/* Checkbox column */}
                            </th>
                            <th className="w-10 px-2 py-1 text-xs text-gray-500 border-r border-b border-gray-300 bg-gray-200">
                                #
                            </th>
                            {headers.map((_, idx) => (
                                <th
                                    key={idx}
                                    className="px-2 py-1 text-xs text-gray-500 border-r border-b border-gray-300 bg-gray-200 font-normal"
                                    style={{ minWidth: getColumnConfig(headers[idx]).width }}
                                >
                                    {columnToLetter(idx)}
                                </th>
                            ))}
                        </tr>
                        {/* Headers Row */}
                        <tr className="bg-gray-50">
                            <th className="w-10 px-2 py-2 border-r border-b border-gray-300 bg-gray-100">
                                <button onClick={handleSelectAll} className="text-gray-500 hover:text-gray-700">
                                    {selectedRows.size === filteredData.length && filteredData.length > 0 ? (
                                        <CheckSquare size={16} />
                                    ) : (
                                        <Square size={16} />
                                    )}
                                </button>
                            </th>
                            <th className="w-10 px-2 py-2 text-xs font-semibold text-gray-600 border-r border-b border-gray-300 bg-gray-100">
                                Row
                            </th>
                            {headers.map((header, idx) => (
                                <th
                                    key={idx}
                                    className="px-2 py-2 text-xs font-semibold text-gray-700 border-r border-b border-gray-300 bg-gray-100 text-left whitespace-nowrap"
                                    style={{ minWidth: getColumnConfig(header).width }}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={headers.length + 2} className="text-center py-12 text-gray-500">
                                    {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูล'}
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={`
                                        ${selectedRows.has(rowIndex) ? 'bg-blue-50' : 'hover:bg-gray-50'}
                                        ${selectedCell?.row === rowIndex ? 'bg-blue-50/50' : ''}
                                    `}
                                >
                                    {/* Checkbox */}
                                    <td className="w-10 px-2 py-1 border-r border-b border-gray-200 text-center bg-gray-50">
                                        <button
                                            onClick={() => handleRowSelect(rowIndex)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            {selectedRows.has(rowIndex) ? (
                                                <CheckSquare size={16} className="text-blue-600" />
                                            ) : (
                                                <Square size={16} />
                                            )}
                                        </button>
                                    </td>
                                    {/* Row Number */}
                                    <td className="w-10 px-2 py-1 text-xs text-gray-500 border-r border-b border-gray-200 text-center bg-gray-50 font-mono">
                                        {rowIndex + 1}
                                    </td>
                                    {/* Data Cells */}
                                    {row.map((cell, colIndex) => {
                                        const config = getColumnConfig(headers[colIndex]);
                                        const isImageCol = config.type === CELL_TYPES.IMAGE;
                                        const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                                        const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

                                        if (isImageCol) {
                                            return (
                                                <ImageUploadCell
                                                    key={colIndex}
                                                    value={cell}
                                                    rowIndex={rowIndex}
                                                    colIndex={colIndex}
                                                    propertyData={getPropertyData(rowIndex)}
                                                    isSelected={isSelected}
                                                    onValueChange={handleCellChange}
                                                />
                                            );
                                        }

                                        // Link cell (map links)
                                        if (config.type === CELL_TYPES.LINK) {
                                            return (
                                                <LinkCell
                                                    key={colIndex}
                                                    value={cell}
                                                    rowIndex={rowIndex}
                                                    colIndex={colIndex}
                                                    isSelected={isSelected}
                                                    onValueChange={handleCellChange}
                                                />
                                            );
                                        }

                                        return (
                                            <EditableCell
                                                key={colIndex}
                                                value={cell}
                                                rowIndex={rowIndex}
                                                colIndex={colIndex}
                                                columnName={headers[colIndex]}
                                                cellType={config.type}
                                                isEditing={isEditing}
                                                isSelected={isSelected}
                                                onStartEdit={(r, c) => {
                                                    setEditingCell({ row: r, col: c });
                                                    setSelectedCell({ row: r, col: c });
                                                }}
                                                onEndEdit={() => setEditingCell(null)}
                                                onValueChange={handleCellChange}
                                                onNavigate={handleNavigate}
                                            />
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* AI Panel */}
            {showAIPanel && (
                <AIGeneratorPanel
                    selectedRow={selectedCell?.row ?? null}
                    propertyData={getPropertyData(selectedCell?.row)}
                    onApplyText={handleAIApplyText}
                    onApplyImage={handleAIApplyImage}
                    onClose={() => setShowAIPanel(false)}
                    isOpen={showAIPanel}
                />
            )}

            {/* Cover Image Generator Modal */}
            <CoverImageGenerator
                isOpen={showCoverGenerator}
                onClose={() => setShowCoverGenerator(false)}
                rowData={selectedCell !== null ? data[selectedCell.row] : null}
                headers={headers}
                onApplyCoverImage={(url) => {
                    if (selectedCell !== null) {
                        const colIndex = headers.indexOf('url รูปภาพปก');
                        if (colIndex >= 0) {
                            handleCellChange(selectedCell.row, colIndex, url);
                        }
                    }
                    setShowCoverGenerator(false);
                }}
                onApplyMockupImage={(url) => {
                    if (selectedCell !== null) {
                        const colIndex = headers.indexOf('url รูปภาพจำลอง');
                        if (colIndex >= 0) {
                            handleCellChange(selectedCell.row, colIndex, url);
                        }
                    }
                    setShowCoverGenerator(false);
                }}
            />
        </div>
    );
}

export default SpreadsheetAdmin;
