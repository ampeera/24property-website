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
import { getSheetData, appendRow, updateRow } from '../../services/googleSheetsService';
import { uploadImage, compressImage } from '../../services/googleDriveService';
import zonesData from '../../data/zones.json';

// All columns in exact order matching Google Sheet (42 columns)
const SHEET_COLUMNS = [
    // Basic Info (A-G)
    { key: 'รหัส', label: 'รหัสทรัพย์สิน', type: 'text', required: true, placeholder: 'เช่น P001', section: 'basic' },
    { key: 'โซน', label: 'โซน', type: 'hidden', section: 'basic' },
    { key: 'ชื่อโซน', label: 'เลือกโซน', type: 'zone-select', required: true, section: 'basic' },
    { key: 'ไอคอนโซน', label: 'ไอคอนโซน', type: 'hidden', section: 'basic' },
    { key: 'เกรด', label: 'เกรด', type: 'select', options: ['A', 'B', 'C', 'D'], section: 'basic' },
    { key: 'ประเภท', label: 'ประเภท', type: 'select', required: true, options: ['ที่ดิน', 'บ้าน', 'คอนโด', 'ทาวน์โฮม', 'อาคารพาณิชย์', 'โรงงาน', 'โกดัง'], section: 'basic' },
    { key: 'สถานะ', label: 'สถานะ', type: 'select', required: true, options: ['ขาย', 'เช่า', 'ขายแล้ว', 'จองแล้ว'], section: 'basic' },
    // Contact Info (H-K) - moved after สถานะ
    { key: 'ชื่อเจ้าของ', label: 'ชื่อเจ้าของ', type: 'text', placeholder: 'ชื่อผู้ติดต่อ', section: 'contact' },
    { key: 'เบอร์ติดต่อ', label: 'เบอร์ติดต่อ', type: 'text', placeholder: '08x-xxx-xxxx', section: 'contact' },
    { key: 'ไอดีไลน์', label: 'Line ID', type: 'text', placeholder: '@line_id', section: 'contact' },
    { key: 'หมายเหตุ', label: 'หมายเหตุ', type: 'textarea', placeholder: 'บันทึกเพิ่มเติม...', section: 'internal' },
    // Project Name (L-N)
    { key: 'ชื่อโครงการ', label: 'ชื่อโครงการ', type: 'text', required: true, placeholder: 'ชื่อโครงการหรือที่ตั้ง', section: 'basic' },
    { key: 'ชื่อโครงการ (EN)', label: 'ชื่อโครงการ (EN)', type: 'text', placeholder: 'Project name in English', section: 'lang' },
    { key: 'ชื่อโครงการ (ZH)', label: 'ชื่อโครงการ (ZH)', type: 'text', placeholder: '中文项目名称', section: 'lang' },
    // Price & Area (O-R)
    { key: 'ราคา', label: 'ราคา (บาท)', type: 'number', required: true, placeholder: '0', section: 'price' },
    { key: 'ไร่', label: 'ไร่', type: 'number', placeholder: '0', section: 'price' },
    { key: 'งาน', label: 'งาน', type: 'number', placeholder: '0', section: 'price' },
    { key: 'ตรว', label: 'ตร.ว.', type: 'number', placeholder: '0', section: 'price' },
    // Location (S)
    { key: 'พิกัด', label: 'พิกัด (Lat,Lng)', type: 'text', placeholder: '13.18552,100.932901', section: 'location' },
    // Description (T-V)
    { key: 'รายละเอียด', label: 'รายละเอียด', type: 'textarea', placeholder: 'รายละเอียดทรัพย์สิน...', section: 'desc' },
    { key: 'รายละเอียด (EN)', label: 'รายละเอียด (EN)', type: 'textarea', placeholder: 'Description in English...', section: 'lang' },
    { key: 'รายละเอียด (ZH)', label: 'รายละเอียด (ZH)', type: 'textarea', placeholder: '中文描述...', section: 'lang' },
    // Additional Description (W-Y)
    { key: 'รายละเอียด เพิ่มเติม', label: 'รายละเอียดเพิ่มเติม', type: 'textarea', placeholder: 'ข้อมูลเพิ่มเติม...', section: 'desc' },
    { key: 'รายละเอียด เพิ่มเติม (EN)', label: 'รายละเอียดเพิ่มเติม (EN)', type: 'textarea', placeholder: 'Additional details in English...', section: 'lang' },
    { key: 'รายละเอียด เพิ่มเติม (ZH)', label: 'รายละเอียดเพิ่มเติม (ZH)', type: 'textarea', placeholder: '中文补充描述...', section: 'lang' },
    // Nearby (Z-AB)
    { key: 'พื้นที่ใกล้เคียง', label: 'พื้นที่ใกล้เคียง', type: 'textarea', placeholder: 'สถานที่ใกล้เคียง, ระยะทาง...', section: 'desc' },
    { key: 'พื้นที่ใกล้เคียง (EN)', label: 'พื้นที่ใกล้เคียง (EN)', type: 'textarea', placeholder: 'Nearby places in English...', section: 'lang' },
    { key: 'พื้นที่ใกล้เคียง (ZH)', label: 'พื้นที่ใกล้เคียง (ZH)', type: 'textarea', placeholder: '中文附近地点...', section: 'lang' },
    // Images (AC-AL) - 10 columns
    { key: 'url รูปภาพปก', label: 'รูปปก', type: 'image', section: 'image' },
    { key: 'url รูปภาพจำลอง', label: 'รูปจำลอง', type: 'image', section: 'image' },
    { key: 'url รูปภาพ 2', label: 'รูป 2', type: 'image', section: 'image' },
    { key: 'url รูปภาพ 3', label: 'รูป 3', type: 'image', section: 'image' },
    { key: 'url รูปภาพ 4', label: 'รูป 4', type: 'image', section: 'image' },
    { key: 'url รูปภาพ 5', label: 'รูป 5', type: 'image', section: 'image' },
    { key: 'url รูปภาพ 6', label: 'รูป 6', type: 'image', section: 'image' },
    { key: 'url รูปภาพ 7', label: 'รูป 7', type: 'image', section: 'image' },
    { key: 'url รูปภาพ 8', label: 'รูป 8', type: 'image', section: 'image' },
    { key: 'url รูปภาพ 9', label: 'รูป 9', type: 'image', section: 'image' },
    // Video Links (AM-AO) - NEW
    { key: 'ลิงค์วีดีโอ tiktok', label: 'TikTok', type: 'text', placeholder: 'https://tiktok.com/...', section: 'video' },
    { key: 'ลิงค์วีดีโอ facebook', label: 'Facebook', type: 'text', placeholder: 'https://facebook.com/...', section: 'video' },
    { key: 'ลิงค์วีดีโอ youtube', label: 'YouTube', type: 'text', placeholder: 'https://youtube.com/...', section: 'video' },
    // Internal (AP)
    { key: 'สถานะ ภายใน', label: 'สถานะภายใน', type: 'text', placeholder: 'run, pending...', section: 'internal' },
];

// Image fields for easy access
const IMAGE_FIELDS = SHEET_COLUMNS.filter(c => c.type === 'image');

function PropertyForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [formData, setFormData] = useState({});
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('thai');

    // Initialize auth and load data
    useEffect(() => {
        const init = async () => {
            try {
                await initGoogleAuth();
                if (isSignedIn()) {
                    setIsAuthenticated(true);
                    setUser(getCurrentUser());
                    await loadHeaders();
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

    // Load headers from Sheet
    const loadHeaders = async () => {
        try {
            const sheetData = await getSheetData();
            if (sheetData.length > 0) {
                setHeaders(sheetData[0]);
            }
        } catch (err) {
            console.error('Failed to load headers:', err);
        }
    };

    // Load existing property data for editing
    const loadPropertyData = async () => {
        setLoading(true);
        try {
            const sheetData = await getSheetData();
            if (sheetData.length > 0) {
                const headerRow = sheetData[0];
                const rows = sheetData.slice(1);
                const idIndex = headerRow.indexOf('รหัส');
                const propertyRow = rows.find(row => row[idIndex] === id);

                if (propertyRow) {
                    const data = {};
                    headerRow.forEach((header, idx) => {
                        data[header] = propertyRow[idx] || '';
                    });
                    setFormData(data);
                }
            }
        } catch (err) {
            setError('Failed to load property: ' + err.message);
        }
        setLoading(false);
    };

    // Handle form field change
    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    // Handle zone selection - auto-fill zone ID and icon
    const handleZoneChange = (zoneName) => {
        const zone = zonesData.find(z => z.name.th === zoneName);
        if (zone) {
            setFormData(prev => ({
                ...prev,
                'ชื่อโซน': zoneName,
                'โซน': zone.id,
                'ไอคอนโซน': zone.icon
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                'ชื่อโซน': '',
                'โซน': '',
                'ไอคอนโซน': ''
            }));
        }
    };

    // Handle sign in
    const handleSignIn = async () => {
        try {
            const result = await signIn();
            setUser(result.user);
            setIsAuthenticated(true);
            await loadHeaders();
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
            handleChange(fieldKey, result.directLink);
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
        const emptySlots = IMAGE_FIELDS.filter(f => !formData[f.key]);

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
                handleChange(fieldKey, result.directLink);
            } catch (err) {
                console.error(`Upload failed for ${fileArray[i].name}:`, err);
            } finally {
                setUploading(prev => ({ ...prev, [fieldKey]: false }));
            }
        }
    };

    // Remove image
    const handleRemoveImage = (fieldKey) => {
        handleChange(fieldKey, '');
    };

    // Save form
    const handleSave = async () => {
        // Validate required fields
        const missingFields = SHEET_COLUMNS
            .filter(f => f.required && !formData[f.key])
            .map(f => f.label);

        if (missingFields.length > 0) {
            setError(`กรุณากรอก: ${missingFields.join(', ')}`);
            return;
        }

        setSaving(true);
        setError(null);

        try {
            // Get current headers from sheet if not loaded
            let currentHeaders = headers;
            if (currentHeaders.length === 0) {
                const sheetData = await getSheetData();
                if (sheetData.length > 0) {
                    currentHeaders = sheetData[0];
                    setHeaders(currentHeaders);
                }
            }

            // Sanitize data - replace newlines with comma+space to prevent row splits
            const sanitizeForSheet = (value) => {
                if (typeof value !== 'string') return value;
                // Replace newlines with comma+space
                return value.replace(/\r?\n/g, ', ').replace(/\s+,/g, ',').replace(/,\s*,/g, ',');
            };

            // Build row array based on sheet headers order (with sanitized values)
            const rowData = currentHeaders.map(header => sanitizeForSheet(formData[header] || ''));

            if (isEditing) {
                // Find row index and update
                const sheetData = await getSheetData();
                const rows = sheetData.slice(1);
                const idIndex = currentHeaders.indexOf('รหัส');
                const rowIndex = rows.findIndex(row => row[idIndex] === id);

                if (rowIndex >= 0) {
                    await updateRow(rowIndex + 2, rowData);
                    setSuccess('บันทึกสำเร็จ!');
                }
            } else {
                // Append new row
                await appendRow(rowData);
                setSuccess('เพิ่มรายการสำเร็จ!');
                setFormData({});
            }

            setTimeout(() => navigate('/admin/spreadsheet'), 1500);

        } catch (err) {
            setError('Save failed: ' + err.message);
        }
        setSaving(false);
    };

    // Get fields by section (filter out hidden and image types)
    const getFieldsBySection = (section) => SHEET_COLUMNS.filter(c => c.section === section && c.type !== 'image' && c.type !== 'hidden');

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/spreadsheet')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
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
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                </button>
            </div>

            {/* Error/Success */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto">✕</button>
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span>{success}</span>
                </div>
            )}

            {/* Form Sections */}
            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">ข้อมูลพื้นฐาน</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {getFieldsBySection('basic').map(field => (
                            <div key={field.key} className={field.type === 'zone-select' ? 'col-span-2' : ''}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                {field.type === 'zone-select' ? (
                                    <select
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleZoneChange(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                                    >
                                        <option value="">เลือกโซน...</option>
                                        {zonesData.map(zone => (
                                            <option key={zone.id} value={zone.name.th}>
                                                {zone.icon} {zone.id} - {zone.name.th}
                                            </option>
                                        ))}
                                    </select>
                                ) : field.type === 'select' ? (
                                    <select
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">เลือก...</option>
                                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type={field.type}
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Show auto-filled zone info */}
                    {formData['โซน'] && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                            <span className="text-2xl">{formData['ไอคอนโซน']}</span>
                            <div>
                                <span className="text-sm text-gray-500">โซน:</span>
                                <span className="ml-2 font-semibold text-blue-700">{formData['โซน']}</span>
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="text-gray-700">{formData['ชื่อโซน']}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contact Info - moved up */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">📞 ข้อมูลติดต่อ</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {getFieldsBySection('contact').map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <input
                                    type="text"
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Internal Notes - moved up */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">📝 หมายเหตุภายใน</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getFieldsBySection('internal').map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        rows={2}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price & Area */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">ราคาและพื้นที่</h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {getFieldsBySection('price').map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <input
                                    type="number"
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                        {/* Location */}
                        {getFieldsBySection('location').map(field => (
                            <div key={field.key} className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <input
                                    type="text"
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Descriptions - Tabs for languages */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">รายละเอียด</h2>
                        <div className="flex gap-2">
                            {['thai', 'en', 'zh'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {tab === 'thai' ? '🇹🇭 ไทย' : tab === 'en' ? '🇺🇸 EN' : '🇨🇳 中文'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        {activeTab === 'thai' && getFieldsBySection('desc').map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <textarea
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                        {activeTab === 'en' && getFieldsBySection('lang').filter(f => f.key.includes('(EN)')).map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <textarea
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                        {activeTab === 'zh' && getFieldsBySection('lang').filter(f => f.key.includes('(ZH)')).map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <textarea
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">รูปภาพ</h2>
                        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg cursor-pointer hover:bg-blue-700">
                            <Upload size={16} />
                            <span>อัพโหลดหลายรูป</span>
                            <input type="file" accept="image/*" multiple onChange={(e) => handleMultipleImageUpload(e.target.files)} className="hidden" />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {IMAGE_FIELDS.map(field => (
                            <div key={field.key} className="group">
                                <label className="block text-xs font-medium text-gray-500 mb-1 text-center">{field.label}</label>
                                <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 hover:border-blue-400">
                                    {uploading[field.key] ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Loader2 size={24} className="animate-spin text-blue-500" />
                                        </div>
                                    ) : formData[field.key] ? (
                                        <div className="relative w-full h-full">
                                            <img src={formData[field.key]} alt="" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => handleRemoveImage(field.key)}
                                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                            <ImageIcon size={24} className="text-gray-300 mb-1" />
                                            <span className="text-xs text-gray-400">คลิกเพิ่ม</span>
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(field.key, e.target.files)} className="hidden" />
                                        </label>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Video Links */}
                <div className="bg-white rounded-2xl shadow-sm border p-6">
                    <h2 className="text-lg font-semibold mb-4">🎬 ลิงค์วีดีโอ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {getFieldsBySection('video').map(field => (
                            <div key={field.key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                <input
                                    type="text"
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Save */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 disabled:opacity-50 shadow-lg"
                >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span>{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
                </button>
            </div>
        </div>
    );
}

export default PropertyForm;
