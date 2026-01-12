import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Loader2,
    Upload,
    X,
    MapPin,
    Plus,
    Trash2,
    AlertCircle,
    CheckCircle,
    Image as ImageIcon
} from 'lucide-react';
import { initGoogleAuth, isSignedIn, signIn, getCurrentUser } from '../../services/googleAuth';
import { getSheetData, appendRow, updateRow, getCellRef, columnToLetter } from '../../services/googleSheetsService';
import { uploadImage, compressImage } from '../../services/googleDriveService';

// Column configuration - matches SpreadsheetAdmin
const FORM_FIELDS = [
    { key: 'รหัส', label: 'รหัสทรัพย์สิน', type: 'text', required: true, placeholder: 'เช่น P001' },
    { key: 'โซน', label: 'โซน', type: 'select', required: true, options: ['A', 'B', 'C', 'D', 'E'] },
    { key: 'ชื่อโซน', label: 'ชื่อโซน', type: 'text', placeholder: 'เช่น พัทยา, ศรีราชา' },
    { key: 'ไอคอนโซน', label: 'ไอคอนโซน', type: 'text', placeholder: '📍' },
    { key: 'เกรด', label: 'เกรด', type: 'select', options: ['A', 'B', 'C', 'D'] },
    { key: 'ประเภท', label: 'ประเภท', type: 'select', required: true, options: ['ที่ดิน', 'บ้าน', 'คอนโด', 'ทาวน์โฮม', 'อาคารพาณิชย์', 'โรงงาน', 'โกดัง'] },
    { key: 'สถานะ', label: 'สถานะ', type: 'select', required: true, options: ['ขาย', 'เช่า', 'ขายแล้ว', 'จองแล้ว'] },
    { key: 'ชื่อโครงการ', label: 'ชื่อโครงการ', type: 'text', required: true, placeholder: 'ชื่อโครงการหรือที่ตั้ง' },
    { key: 'ราคา', label: 'ราคา (บาท)', type: 'number', required: true, placeholder: '0' },
    { key: 'ไร่', label: 'ไร่', type: 'number', placeholder: '0' },
    { key: 'งาน', label: 'งาน', type: 'number', placeholder: '0' },
    { key: 'ตรว', label: 'ตร.ว.', type: 'number', placeholder: '0' },
    { key: 'พิกัด', label: 'พิกัด (Lat,Lng)', type: 'text', placeholder: '13.18552,100.932901' },
    { key: 'รายละเอียด', label: 'รายละเอียด', type: 'textarea', placeholder: 'รายละเอียดทรัพย์สิน...' },
    { key: 'รายละเอียด เพิ่มเติม', label: 'รายละเอียดเพิ่มเติม', type: 'textarea', placeholder: 'ข้อมูลเพิ่มเติม...' },
    { key: 'พื้นที่ใกล้เคียง', label: 'พื้นที่ใกล้เคียง', type: 'textarea', placeholder: 'สถานที่ใกล้เคียง, ระยะทาง...' },
];

// Image fields
const IMAGE_FIELDS = [
    { key: 'url รูปภาพปก', label: 'รูปปก' },
    { key: 'url รูปภาพจำลอง', label: 'รูปจำลอง' },
    { key: 'url รูปภาพ 2', label: 'รูป 2' },
    { key: 'url รูปภาพ 3', label: 'รูป 3' },
    { key: 'url รูปภาพ 4', label: 'รูป 4' },
    { key: 'url รูปภาพ 5', label: 'รูป 5' },
    { key: 'url รูปภาพ 6', label: 'รูป 6' },
    { key: 'url รูปภาพ 7', label: 'รูป 7' },
    { key: 'url รูปภาพ 8', label: 'รูป 8' },
    { key: 'url รูปภาพ 9', label: 'รูป 9' },
];

function PropertyForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [formData, setFormData] = useState({});
    const [images, setImages] = useState({});
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    const fileInputRefs = useRef({});

    // Initialize auth and load data
    useEffect(() => {
        const init = async () => {
            try {
                await initGoogleAuth();
                if (isSignedIn()) {
                    setIsAuthenticated(true);
                    setUser(getCurrentUser());
                    if (isEditing) {
                        await loadPropertyData();
                    }
                }
            } catch (err) {
                console.error('Init error:', err);
            }
        };
        init();
    }, [id]);

    // Load existing property data for editing
    const loadPropertyData = async () => {
        setLoading(true);
        try {
            const sheetData = await getSheetData();
            if (sheetData.length > 0) {
                setHeaders(sheetData[0]);
                const rows = sheetData.slice(1);
                const idIndex = sheetData[0].indexOf('รหัส');
                const propertyRow = rows.find(row => row[idIndex] === id);

                if (propertyRow) {
                    const data = {};
                    const imgs = {};
                    sheetData[0].forEach((header, idx) => {
                        if (header.startsWith('url ')) {
                            imgs[header] = propertyRow[idx] || '';
                        } else {
                            data[header] = propertyRow[idx] || '';
                        }
                    });
                    setFormData(data);
                    setImages(imgs);
                }
            }
        } catch (err) {
            setError('Failed to load property: ' + err.message);
        }
        setLoading(false);
    };

    // Load headers for new property
    useEffect(() => {
        const loadHeaders = async () => {
            if (!isEditing && isAuthenticated) {
                try {
                    const sheetData = await getSheetData();
                    if (sheetData.length > 0) {
                        setHeaders(sheetData[0]);
                    }
                } catch (err) {
                    console.error('Failed to load headers:', err);
                }
            }
        };
        loadHeaders();
    }, [isAuthenticated, isEditing]);

    // Handle form field change
    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Handle sign in
    const handleSignIn = async () => {
        try {
            const result = await signIn();
            setUser(result.user);
            setIsAuthenticated(true);
        } catch (err) {
            setError('Sign in failed: ' + err.message);
        }
    };

    // Handle image upload
    const handleImageUpload = async (fieldKey, files) => {
        if (!files || files.length === 0) return;

        setUploading(prev => ({ ...prev, [fieldKey]: true }));
        setError(null);

        try {
            const file = files[0];
            const compressedFile = await compressImage(file, 1920, 0.8);
            const result = await uploadImage(compressedFile);
            setImages(prev => ({ ...prev, [fieldKey]: result.directLink }));
        } catch (err) {
            setError(`Upload failed: ${err.message}`);
        } finally {
            setUploading(prev => ({ ...prev, [fieldKey]: false }));
        }
    };

    // Handle multiple image upload
    const handleMultipleImageUpload = async (files) => {
        if (!files || files.length === 0) return;

        setError(null);
        const fileArray = Array.from(files);
        const emptySlots = IMAGE_FIELDS.filter(f => !images[f.key]);

        if (fileArray.length > emptySlots.length) {
            setError(`มีช่องว่างแค่ ${emptySlots.length} ช่อง แต่เลือก ${fileArray.length} รูป`);
            return;
        }

        for (let i = 0; i < fileArray.length; i++) {
            const fieldKey = emptySlots[i].key;
            setUploading(prev => ({ ...prev, [fieldKey]: true }));

            try {
                const compressedFile = await compressImage(fileArray[i], 1920, 0.8);
                const result = await uploadImage(compressedFile);
                setImages(prev => ({ ...prev, [fieldKey]: result.directLink }));
            } catch (err) {
                console.error(`Upload failed for ${fileArray[i].name}:`, err);
            } finally {
                setUploading(prev => ({ ...prev, [fieldKey]: false }));
            }
        }
    };

    // Remove image
    const handleRemoveImage = (fieldKey) => {
        setImages(prev => ({ ...prev, [fieldKey]: '' }));
    };

    // Save form
    const handleSave = async () => {
        // Validate required fields
        const missingFields = FORM_FIELDS
            .filter(f => f.required && !formData[f.key])
            .map(f => f.label);

        if (missingFields.length > 0) {
            setError(`กรุณากรอก: ${missingFields.join(', ')}`);
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Combine form data and images
            const allData = { ...formData, ...images };

            // Build row array based on headers
            let currentHeaders = headers;
            if (currentHeaders.length === 0) {
                const sheetData = await getSheetData();
                if (sheetData.length > 0) {
                    currentHeaders = sheetData[0];
                    setHeaders(currentHeaders);
                }
            }

            const rowData = currentHeaders.map(header => allData[header] || '');

            if (isEditing) {
                // Find row index and update
                const sheetData = await getSheetData();
                const rows = sheetData.slice(1);
                const idIndex = currentHeaders.indexOf('รหัส');
                const rowIndex = rows.findIndex(row => row[idIndex] === id);

                if (rowIndex >= 0) {
                    await updateRow(rowIndex + 2, rowData); // +2 for header and 1-indexing
                    setSuccess('บันทึกสำเร็จ!');
                }
            } else {
                // Append new row
                await appendRow(rowData);
                setSuccess('เพิ่มรายการสำเร็จ!');

                // Clear form for new entry
                setFormData({});
                setImages({});
            }

            // Navigate back after short delay
            setTimeout(() => {
                navigate('/admin/spreadsheet');
            }, 1500);

        } catch (err) {
            setError('Save failed: ' + err.message);
        }
        setSaving(false);
    };

    // Not authenticated
    if (!isAuthenticated) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">กรุณาลงชื่อเข้าใช้</h1>
                    <p className="text-gray-500 mb-8">คุณต้องลงชื่อเข้าใช้ด้วย Google เพื่อเพิ่มหรือแก้ไขรายการ</p>
                    <button
                        onClick={handleSignIn}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all"
                    >
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/spreadsheet')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>กลับ</span>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
                    </h1>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                </button>
            </div>

            {/* Error/Success Messages */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span>{success}</span>
                </div>
            )}

            {/* Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Basic Info Section */}
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลพื้นฐาน</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {FORM_FIELDS.slice(0, 12).map(field => (
                            <div key={field.key} className={field.type === 'textarea' ? 'col-span-full' : ''}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.type === 'select' ? (
                                    <select
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">เลือก...</option>
                                        {field.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Description Section */}
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">รายละเอียด</h2>
                    <div className="space-y-4">
                        {FORM_FIELDS.slice(12).map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                </label>
                                <textarea
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Images Section */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">รูปภาพ</h2>
                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-all">
                            <Upload size={16} />
                            <span>อัพโหลดหลายรูป</span>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleMultipleImageUpload(e.target.files)}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {IMAGE_FIELDS.map(field => (
                            <div key={field.key} className="relative group">
                                <label className="block text-xs font-medium text-gray-500 mb-1 text-center">
                                    {field.label}
                                </label>
                                <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 hover:border-blue-400 transition-colors">
                                    {uploading[field.key] ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Loader2 size={24} className="animate-spin text-blue-500" />
                                        </div>
                                    ) : images[field.key] ? (
                                        <div className="relative w-full h-full">
                                            <img
                                                src={images[field.key]}
                                                alt={field.label}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => handleRemoveImage(field.key)}
                                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                            <ImageIcon size={24} className="text-gray-300 mb-1" />
                                            <span className="text-xs text-gray-400">คลิกเพิ่ม</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(field.key, e.target.files)}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Save Button */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 shadow-lg shadow-green-500/20"
                >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span>{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                </button>
            </div>
        </div>
    );
}

export default PropertyForm;
