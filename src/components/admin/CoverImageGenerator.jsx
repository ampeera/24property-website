import React, { useState } from 'react';
import { X, Wand2, Loader2, Check, Image as ImageIcon, Sparkles } from 'lucide-react';
import { generateImage } from '../../services/aiService';
import { uploadImageFromUrl } from '../../services/googleDriveService';

function CoverImageGenerator({
    isOpen,
    onClose,
    rowData,
    headers,
    onApplyCoverImage,
    onApplyMockupImage
}) {
    const [selectedImages, setSelectedImages] = useState([]);
    const [coverPrompt, setCoverPrompt] = useState('');
    const [mockupPrompt, setMockupPrompt] = useState('');
    const [isGeneratingCover, setIsGeneratingCover] = useState(false);
    const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
    const [generatedCover, setGeneratedCover] = useState(null);
    const [generatedMockup, setGeneratedMockup] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('cover'); // 'cover' or 'mockup'

    if (!isOpen || !rowData) return null;

    // Get image URLs from columns 2-9
    const getImageUrls = () => {
        const imageColumns = [
            'url รูปภาพ 2', 'url รูปภาพ 3', 'url รูปภาพ 4', 'url รูปภาพ 5',
            'url รูปภาพ 6', 'url รูปภาพ 7', 'url รูปภาพ 8', 'url รูปภาพ 9'
        ];

        return imageColumns.map((col, idx) => {
            const colIndex = headers.indexOf(col);
            const url = colIndex >= 0 ? rowData[colIndex] : null;
            return {
                id: idx + 2,
                label: `รูป ${idx + 2}`,
                url: url && url.length > 0 ? url : null
            };
        }).filter(img => img.url);
    };

    const images = getImageUrls();

    // Get property info for prompts
    const getPropertyInfo = () => {
        const getValue = (key) => {
            const idx = headers.indexOf(key);
            return idx >= 0 ? rowData[idx] : '';
        };

        return {
            title: getValue('ชื่อโครงการ'),
            type: getValue('ประเภท'),
            zone: getValue('ชื่อโซน'),
            price: getValue('ราคา'),
            area: `${getValue('ไร่') || 0} ไร่ ${getValue('งาน') || 0} งาน ${getValue('ตรว') || 0} ตร.ว.`
        };
    };

    const propertyInfo = getPropertyInfo();

    // Toggle image selection
    const toggleImageSelection = (imgId) => {
        setSelectedImages(prev =>
            prev.includes(imgId)
                ? prev.filter(id => id !== imgId)
                : [...prev, imgId]
        );
    };

    // Generate default cover prompt
    const generateDefaultCoverPrompt = () => {
        const info = propertyInfo;
        return `สร้างรูปภาพปกสำหรับขายที่ดิน/อสังหาริมทรัพย์
ประเภท: ${info.type || 'ที่ดิน'}
โซน: ${info.zone || '-'}
ขนาด: ${info.area}
สไตล์: รูปปกสวยงาม มืออาชีพ สำหรับโฆษณาอสังหาริมทรัพย์
รวมรูปภาพที่เลือก: ${selectedImages.length} รูป`;
    };

    // Generate default mockup prompt
    const generateDefaultMockupPrompt = () => {
        const info = propertyInfo;
        return `สร้างภาพจำลองโครงการอสังหาริมทรัพย์
ชื่อโครงการ: ${info.title || '-'}
ประเภท: ${info.type || 'ที่ดิน'}
สไตล์: ภาพ 3D Rendering สวยงาม แสดงศักยภาพของที่ดิน
บรรยากาศ: สว่าง ทันสมัย น่าอยู่`;
    };

    // Handle generate cover image
    const handleGenerateCover = async () => {
        if (selectedImages.length === 0) {
            setError('กรุณาเลือกรูปภาพอย่างน้อย 1 รูป');
            return;
        }

        setIsGeneratingCover(true);
        setError(null);

        try {
            const prompt = coverPrompt || generateDefaultCoverPrompt();

            // Note: In a real implementation, you would send the selected images
            // to an AI service that can combine/edit images
            // For now, we'll use text-to-image with the prompt
            const result = await generateImage(prompt);

            if (!result.isPlaceholder) {
                setGeneratedCover(result.url);
            } else {
                setError('ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่');
            }
        } catch (err) {
            setError(err.message);
        }

        setIsGeneratingCover(false);
    };

    // Handle generate mockup image
    const handleGenerateMockup = async () => {
        setIsGeneratingMockup(true);
        setError(null);

        try {
            const prompt = mockupPrompt || generateDefaultMockupPrompt();
            const result = await generateImage(prompt);

            if (!result.isPlaceholder) {
                setGeneratedMockup(result.url);
            } else {
                setError('ไม่สามารถสร้างรูปภาพได้ กรุณาลองใหม่');
            }
        } catch (err) {
            setError(err.message);
        }

        setIsGeneratingMockup(false);
    };

    // Apply cover image
    const handleApplyCover = async () => {
        if (!generatedCover) return;

        try {
            // Upload to Drive first
            const uploaded = await uploadImageFromUrl(generatedCover);
            onApplyCoverImage?.(uploaded.directLink);
            setGeneratedCover(null);
        } catch (err) {
            // Fallback: use direct URL
            onApplyCoverImage?.(generatedCover);
        }
    };

    // Apply mockup image
    const handleApplyMockup = async () => {
        if (!generatedMockup) return;

        try {
            const uploaded = await uploadImageFromUrl(generatedMockup);
            onApplyMockupImage?.(uploaded.directLink);
            setGeneratedMockup(null);
        } catch (err) {
            onApplyMockupImage?.(generatedMockup);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-500">
                    <div className="flex items-center gap-3 text-white">
                        <Sparkles size={24} />
                        <div>
                            <h2 className="text-lg font-bold">AI สร้างรูปภาพ</h2>
                            <p className="text-sm text-white/80">{propertyInfo.title || 'ไม่ระบุชื่อโครงการ'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white p-1 rounded"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('cover')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'cover'
                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        🖼️ สร้างรูปปก
                    </button>
                    <button
                        onClick={() => setActiveTab('mockup')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'mockup'
                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        🏗️ สร้างรูปจำลอง
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {activeTab === 'cover' && (
                        <div className="space-y-6">
                            {/* Image Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    เลือกรูปภาพที่ต้องการใช้ทำปก (รูปที่ 2-9)
                                </label>
                                {images.length === 0 ? (
                                    <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                                        <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>ไม่มีรูปภาพในคอลัมน์ 2-9</p>
                                        <p className="text-xs mt-1">กรุณาอัพโหลดรูปภาพก่อน</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-4 gap-3">
                                        {images.map((img) => (
                                            <div
                                                key={img.id}
                                                onClick={() => toggleImageSelection(img.id)}
                                                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedImages.includes(img.id)
                                                        ? 'border-purple-500 ring-2 ring-purple-200'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <img
                                                    src={img.url}
                                                    alt={img.label}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                                    {img.label}
                                                </div>
                                                {selectedImages.includes(img.id) && (
                                                    <div className="absolute top-1 right-1 bg-purple-500 text-white p-1 rounded-full">
                                                        <Check size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {selectedImages.length > 0 && (
                                    <p className="text-sm text-purple-600 mt-2">
                                        เลือกแล้ว {selectedImages.length} รูป
                                    </p>
                                )}
                            </div>

                            {/* Prompt Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prompt สำหรับสร้างรูปปก (ถ้าไม่ใส่จะใช้ค่าเริ่มต้น)
                                </label>
                                <textarea
                                    value={coverPrompt}
                                    onChange={(e) => setCoverPrompt(e.target.value)}
                                    placeholder={generateDefaultCoverPrompt()}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateCover}
                                disabled={isGeneratingCover || images.length === 0}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isGeneratingCover ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Wand2 size={20} />
                                )}
                                <span>{isGeneratingCover ? 'กำลังสร้าง...' : 'สร้างรูปปก'}</span>
                            </button>

                            {/* Generated Result */}
                            {generatedCover && (
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <p className="text-sm font-medium text-gray-700 mb-3">รูปปกที่สร้างได้:</p>
                                    <img
                                        src={generatedCover}
                                        alt="Generated cover"
                                        className="w-full max-h-64 object-contain rounded-lg mb-3"
                                    />
                                    <button
                                        onClick={handleApplyCover}
                                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        ใช้รูปนี้เป็นปก
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'mockup' && (
                        <div className="space-y-6">
                            {/* Property Info */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลที่จะใช้สร้างภาพจำลอง</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div><span className="text-gray-500">ประเภท:</span> {propertyInfo.type || '-'}</div>
                                    <div><span className="text-gray-500">โซน:</span> {propertyInfo.zone || '-'}</div>
                                    <div><span className="text-gray-500">ขนาด:</span> {propertyInfo.area}</div>
                                    <div><span className="text-gray-500">ราคา:</span> {propertyInfo.price ? `฿${Number(propertyInfo.price).toLocaleString()}` : '-'}</div>
                                </div>
                            </div>

                            {/* Prompt Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Prompt สำหรับสร้างภาพจำลอง
                                </label>
                                <textarea
                                    value={mockupPrompt}
                                    onChange={(e) => setMockupPrompt(e.target.value)}
                                    placeholder={generateDefaultMockupPrompt()}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerateMockup}
                                disabled={isGeneratingMockup}
                                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isGeneratingMockup ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Wand2 size={20} />
                                )}
                                <span>{isGeneratingMockup ? 'กำลังสร้าง...' : 'สร้างภาพจำลอง'}</span>
                            </button>

                            {/* Generated Result */}
                            {generatedMockup && (
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <p className="text-sm font-medium text-gray-700 mb-3">ภาพจำลองที่สร้างได้:</p>
                                    <img
                                        src={generatedMockup}
                                        alt="Generated mockup"
                                        className="w-full max-h-64 object-contain rounded-lg mb-3"
                                    />
                                    <button
                                        onClick={handleApplyMockup}
                                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        ใช้รูปนี้เป็นภาพจำลอง
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CoverImageGenerator;
