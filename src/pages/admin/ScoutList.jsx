import React, { useState, useEffect } from 'react';
import {
    List,
    Image as ImageIcon,
    MapPin,
    Trash2,
    Loader2,
    AlertCircle,
    RefreshCw,
    ExternalLink,
    X,
    FileText,
    Copy,
    Check,
    Save
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getScoutEntries, deleteScoutEntry, updateScoutNotes } from '../../services/scoutService';

export default function ScoutList() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [editingNotes, setEditingNotes] = useState({});
    const [savingNotes, setSavingNotes] = useState(null);

    // Use auth context
    const { isGoogleAuthenticated } = useAuth();

    // Load entries on mount
    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        setLoading(true);
        setError(null);
        try {
            // Try authenticated API first
            if (isGoogleAuthenticated()) {
                const data = await getScoutEntries();
                setEntries(data);
                setEditingNotes({});
            } else {
                // Fallback to public CSV
                const SCOUT_SHEET_ID = import.meta.env.VITE_SCOUT_SHEET_ID;
                const response = await fetch(
                    `https://docs.google.com/spreadsheets/d/${SCOUT_SHEET_ID}/export?format=csv&gid=0`
                );
                const csv = await response.text();
                const rows = parseCSV(csv);

                // Skip header row, map to objects
                const entries = rows.slice(1).map((row, index) => ({
                    rowIndex: index + 2,
                    datetime: row[0] || '',
                    imageUrl: row[1] || '',
                    coordinates: row[2] || '',
                    notes: row[3] || ''
                }));
                setEntries(entries);
                setEditingNotes({});
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Parse CSV helper
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

    const handleDelete = async (entry) => {
        if (!isGoogleAuthenticated()) {
            setError('ไม่มีสิทธิ์ลบรายการ');
            return;
        }

        if (!window.confirm(`ต้องการลบรายการนี้หรือไม่?\n\nวันที่: ${entry.datetime}\nหมายเหตุ: ${entry.notes || '-'}`)) {
            return;
        }

        setDeleting(entry.rowIndex);
        setError(null);

        try {
            await deleteScoutEntry(entry.rowIndex);
            await loadEntries();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeleting(null);
        }
    };

    // Copy coordinates to clipboard
    const handleCopyCoordinates = async (coordinates, rowIndex) => {
        try {
            // Extract just the coordinates from the URL if needed
            let coordText = coordinates;
            if (coordinates.includes('maps?q=')) {
                coordText = coordinates.split('maps?q=')[1];
            }
            await navigator.clipboard.writeText(coordText);
            setCopiedIndex(rowIndex);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            setError('ไม่สามารถคัดลอกได้');
        }
    };

    // Handle notes change
    const handleNotesChange = (rowIndex, value) => {
        setEditingNotes(prev => ({ ...prev, [rowIndex]: value }));
    };

    // Save notes
    const handleSaveNotes = async (entry) => {
        if (!isGoogleAuthenticated()) {
            setError('ไม่มีสิทธิ์แก้ไขรายการ');
            return;
        }

        const newNotes = editingNotes[entry.rowIndex];
        if (newNotes === undefined || newNotes === entry.notes) {
            return;
        }

        setSavingNotes(entry.rowIndex);
        setError(null);

        try {
            await updateScoutNotes(entry.rowIndex, newNotes);
            // Update local state
            setEntries(prev => prev.map(e =>
                e.rowIndex === entry.rowIndex ? { ...e, notes: newNotes } : e
            ));
            // Clear editing state for this row
            setEditingNotes(prev => {
                const updated = { ...prev };
                delete updated[entry.rowIndex];
                return updated;
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingNotes(null);
        }
    };



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <List className="text-blue-600" size={28} />
                        รายการค้นหาทรัพย์ใหม่
                    </h1>
                    <p className="text-gray-500 mt-1">
                        รายการทรัพย์ที่ถ่ายรูปจากป้ายประกาศหน้างาน
                    </p>
                </div>
                <button
                    onClick={loadEntries}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    รีเฟรช
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading && entries.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <Loader2 className="mx-auto mb-4 animate-spin text-blue-500" size={48} />
                    <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && entries.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <FileText className="mx-auto mb-4 text-gray-300" size={64} />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        ยังไม่มีรายการ
                    </h3>
                    <p className="text-gray-500 mb-4">
                        ไปที่เมนู "ค้นหาทรัพย์ใหม่" เพื่อถ่ายรูปและบันทึกทรัพย์
                    </p>
                    <a
                        href="/admin/scout"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        ไปถ่ายรูปทรัพย์
                    </a>
                </div>
            )}

            {/* Table */}
            {entries.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        #
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        รูปภาพ
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        วันที่/เวลา
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        พิกัด
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        หมายเหตุ
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                                        ลบ
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {entries.map((entry, index) => (
                                    <tr key={entry.rowIndex} className="hover:bg-gray-50 transition-colors">
                                        {/* Row Number */}
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {index + 1}
                                        </td>

                                        {/* Image Thumbnail */}
                                        <td className="px-4 py-3">
                                            {entry.imageUrl ? (
                                                <button
                                                    onClick={() => setPreviewImage(entry.imageUrl)}
                                                    className="block w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                                                >
                                                    <img
                                                        src={entry.imageUrl}
                                                        alt="thumbnail"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gray-100 flex items-center justify-center"><svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                                        }}
                                                    />
                                                </button>
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <ImageIcon className="text-gray-400" size={24} />
                                                </div>
                                            )}
                                        </td>

                                        {/* DateTime */}
                                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                                            {entry.datetime || '-'}
                                        </td>

                                        {/* Coordinates - Full display with copy button */}
                                        <td className="px-4 py-3 text-sm">
                                            {entry.coordinates ? (
                                                <div className="flex flex-col gap-1">
                                                    {/* Full coordinates display */}
                                                    <div className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                                        {entry.coordinates.replace('https://www.google.com/maps?q=', '')}
                                                    </div>
                                                    {/* Action buttons */}
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleCopyCoordinates(entry.coordinates, entry.rowIndex)}
                                                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                                            title="คัดลอกพิกัด"
                                                        >
                                                            {copiedIndex === entry.rowIndex ? (
                                                                <>
                                                                    <Check size={12} className="text-green-500" />
                                                                    <span className="text-green-500">คัดลอกแล้ว</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy size={12} />
                                                                    <span>คัดลอก</span>
                                                                </>
                                                            )}
                                                        </button>
                                                        <a
                                                            href={entry.coordinates.startsWith('http') ? entry.coordinates : `https://www.google.com/maps?q=${entry.coordinates}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                        >
                                                            <MapPin size={12} />
                                                            เปิดแผนที่
                                                        </a>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>

                                        {/* Notes - Editable */}
                                        <td className="px-4 py-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <textarea
                                                    value={editingNotes[entry.rowIndex] !== undefined ? editingNotes[entry.rowIndex] : entry.notes}
                                                    onChange={(e) => handleNotesChange(entry.rowIndex, e.target.value)}
                                                    onBlur={() => handleSaveNotes(entry)}
                                                    className="w-full min-w-[150px] px-2 py-1 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                    rows={2}
                                                    placeholder="เพิ่มหมายเหตุ..."
                                                    disabled={savingNotes === entry.rowIndex}
                                                />
                                                {savingNotes === entry.rowIndex && (
                                                    <Loader2 size={16} className="animate-spin text-blue-500 flex-shrink-0" />
                                                )}
                                                {editingNotes[entry.rowIndex] !== undefined && editingNotes[entry.rowIndex] !== entry.notes && savingNotes !== entry.rowIndex && (
                                                    <button
                                                        onClick={() => handleSaveNotes(entry)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded flex-shrink-0"
                                                        title="บันทึก"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>

                                        {/* Delete Button Only */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center">
                                                <button
                                                    onClick={() => handleDelete(entry)}
                                                    disabled={deleting === entry.rowIndex}
                                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="ลบรายการ"
                                                >
                                                    {deleting === entry.rowIndex ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={18} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
                        ทั้งหมด {entries.length} รายการ
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
                        >
                            <X size={32} />
                        </button>
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
                        />
                        <div className="absolute bottom-4 right-4 flex gap-2">
                            <a
                                href={previewImage}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 bg-white/90 text-gray-800 px-4 py-2 rounded-lg hover:bg-white transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink size={16} />
                                เปิดในแท็บใหม่
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <p><strong>เกี่ยวกับหน้านี้:</strong> แสดงรายการทรัพย์ที่สำรวจจากป้ายประกาศหน้างาน (ถ่ายรูปหน้าที่ดินที่มีป้ายขาย) พร้อมพิกัด GPS เพื่อติดต่อเจ้าของทรัพย์ภายหลัง</p>
            </div>
        </div>
    );
}
