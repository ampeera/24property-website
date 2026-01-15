import React, { useState, useRef, useEffect } from 'react';
import {
    Camera,
    MapPin,
    Clock,
    FileText,
    Upload,
    Check,
    AlertCircle,
    Loader2,
    Image as ImageIcon,
    RefreshCw,
    Trash2,
    ExternalLink
} from 'lucide-react';
import { isSignedIn, getCurrentUser } from '../../services/googleAuth';
import {
    uploadScoutImage,
    saveScoutEntry,
    getCurrentLocation,
    compressImage
} from '../../services/scoutService';

export default function PropertyScout() {
    const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [location, setLocation] = useState(null);
    const [datetime, setDatetime] = useState('');
    const [notes, setNotes] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [uploadedImageUrl, setUploadedImageUrl] = useState('');
    const [gettingLocation, setGettingLocation] = useState(false);

    const fileInputRef = useRef(null);

    // Check auth state on mount
    useEffect(() => {
        setIsGoogleSignedIn(isSignedIn());
    }, []);

    // Handle image capture/selection
    const handleImageCapture = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);
        setSuccess(false);

        try {
            // Compress image
            const compressedFile = await compressImage(file, 1920, 0.8);
            setImageFile(compressedFile);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setCapturedImage(e.target?.result);
            };
            reader.readAsDataURL(compressedFile);

            // Set datetime
            const now = new Date();
            setDatetime(now.toLocaleString('th-TH', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }));

            // Get location
            await handleGetLocation();
        } catch (err) {
            setError('ไม่สามารถประมวลผลรูปภาพได้: ' + err.message);
        }
    };

    // Get GPS location
    const handleGetLocation = async () => {
        setGettingLocation(true);
        setError(null);

        try {
            const loc = await getCurrentLocation();
            setLocation(loc);
        } catch (err) {
            setError(err.message);
        } finally {
            setGettingLocation(false);
        }
    };

    // Upload and save
    const handleSave = async () => {
        if (!imageFile) {
            setError('กรุณาถ่ายหรือเลือกรูปภาพก่อน');
            return;
        }

        if (!isGoogleSignedIn) {
            setError('กรุณาเข้าสู่ระบบ Google ที่หน้า Dashboard ก่อน');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            // Upload image to Drive
            const uploadResult = await uploadScoutImage(imageFile);
            setUploadedImageUrl(uploadResult.directLink);

            setSaving(true);

            // Save entry to Sheet
            await saveScoutEntry({
                datetime: datetime,
                imageUrl: uploadResult.directLink,
                coordinates: location?.googleMapsLink || location?.formatted || '',
                notes: notes
            });

            setSuccess(true);

            // Reset form after 3 seconds
            setTimeout(() => {
                handleReset();
            }, 3000);

        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            setSaving(false);
        }
    };

    // Reset form
    const handleReset = () => {
        setCapturedImage(null);
        setImageFile(null);
        setLocation(null);
        setDatetime('');
        setNotes('');
        setUploadedImageUrl('');
        setError(null);
        setSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Check if user is signed in to Google
    if (!isGoogleSignedIn) {
        return (
            <div className="max-w-lg mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <AlertCircle className="mx-auto mb-4 text-yellow-500" size={48} />
                    <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                        ต้องเข้าสู่ระบบ Google ก่อน
                    </h2>
                    <p className="text-yellow-700 mb-4">
                        กรุณาไปที่หน้า "แดชบอร์ด" แล้วกด "Sign in with Google" เพื่อใช้งานฟีเจอร์นี้
                    </p>
                    <a
                        href="/admin"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        ไปหน้าแดชบอร์ด
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto space-y-6">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">ค้นหาทรัพย์ใหม่</h1>
                <p className="text-gray-500 mt-1">ถ่ายรูปและบันทึกพิกัดทรัพย์ที่พบ</p>
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <Check className="text-green-500" size={24} />
                    <div>
                        <p className="font-semibold text-green-800">บันทึกสำเร็จ!</p>
                        <p className="text-green-700 text-sm">ข้อมูลถูกบันทึกลง Google Sheet แล้ว</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            {/* Camera Button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    className="hidden"
                />

                {!capturedImage ? (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-12 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center gap-4"
                    >
                        <Camera className="text-gray-400" size={48} />
                        <span className="text-gray-600 font-medium">กดเพื่อถ่ายรูป / เลือกรูป</span>
                    </button>
                ) : (
                    <div className="space-y-4">
                        {/* Preview */}
                        <div className="relative">
                            <img
                                src={capturedImage}
                                alt="Preview"
                                className="w-full rounded-lg"
                            />
                            <button
                                onClick={handleReset}
                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Change Image Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-gray-600"
                        >
                            <RefreshCw size={18} />
                            เปลี่ยนรูป
                        </button>
                    </div>
                )}
            </div>

            {/* Auto-filled Data */}
            {capturedImage && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                    {/* DateTime */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Clock className="text-blue-600" size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">วันที่และเวลา</p>
                            <p className="font-medium text-gray-900">{datetime || '-'}</p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <MapPin className="text-green-600" size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500">พิกัด GPS</p>
                            {gettingLocation ? (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>กำลังดึงพิกัด...</span>
                                </div>
                            ) : location ? (
                                <a
                                    href={location.googleMapsLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    {location.formatted}
                                    <ExternalLink size={14} />
                                </a>
                            ) : (
                                <button
                                    onClick={handleGetLocation}
                                    className="text-blue-600 hover:underline text-sm"
                                >
                                    กดเพื่อดึงพิกัด
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Image URL (after upload) */}
                    {uploadedImageUrl && (
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <ImageIcon className="text-purple-600" size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-gray-500">URL รูปภาพ</p>
                                <p className="font-medium text-gray-900 text-sm truncate">
                                    {uploadedImageUrl}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg mt-1">
                            <FileText className="text-yellow-600" size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="กรอกหมายเหตุ (ไม่บังคับ)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            {capturedImage && !success && (
                <button
                    onClick={handleSave}
                    disabled={uploading || saving}
                    className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                    {uploading || saving ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            {uploading ? 'กำลังอัพโหลดรูป...' : 'กำลังบันทึก...'}
                        </>
                    ) : (
                        <>
                            <Upload size={20} />
                            บันทึกข้อมูล
                        </>
                    )}
                </button>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                <p><strong>หมายเหตุ:</strong> ข้อมูลจะถูกบันทึกลง Google Sheet แยกจากระบบทรัพย์หลัก</p>
            </div>
        </div>
    );
}
