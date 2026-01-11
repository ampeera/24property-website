import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2, ExternalLink, Wand2, Loader2 } from 'lucide-react';
import { uploadImage, compressImage } from '../../services/googleDriveService';
import { generateImage, generateImagePrompt } from '../../services/aiService';

function ImageUploadCell({
    value,
    rowIndex,
    colIndex,
    propertyData,
    isSelected = false,
    onValueChange,
    className = ''
}) {
    const [isUploading, setIsUploading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const hasImage = value && value.length > 0;

    // Handle file upload
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError(null);

        try {
            // Compress image before upload
            const compressedFile = await compressImage(file, 1920, 0.8);

            // Upload to Google Drive
            const result = await uploadImage(compressedFile);

            // Update cell with direct link
            onValueChange?.(rowIndex, colIndex, result.directLink);
        } catch (err) {
            console.error('Upload failed:', err);
            setError(err.message);
        } finally {
            setIsUploading(false);
            setShowMenu(false);
        }
    };

    // Handle AI image generation
    const handleAIGenerate = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            // Generate image prompt based on property data
            const prompt = await generateImagePrompt(propertyData || {});

            // Generate image
            const result = await generateImage(prompt);

            if (result.isPlaceholder) {
                setError('Image generation failed. Please try again.');
                return;
            }

            // For now, just set the URL directly
            // In production, you might want to download and upload to Drive
            onValueChange?.(rowIndex, colIndex, result.url);
        } catch (err) {
            console.error('AI generation failed:', err);
            setError(err.message);
        } finally {
            setIsGenerating(false);
            setShowMenu(false);
        }
    };

    // Handle URL paste
    const handlePasteUrl = () => {
        const url = prompt('วาง URL รูปภาพ:');
        if (url) {
            onValueChange?.(rowIndex, colIndex, url);
        }
        setShowMenu(false);
    };

    // Handle delete
    const handleDelete = () => {
        if (confirm('ต้องการลบรูปภาพนี้?')) {
            onValueChange?.(rowIndex, colIndex, '');
        }
        setShowMenu(false);
    };

    // Base cell styles
    const baseCellClass = `
        relative px-1 py-1 text-sm border-r border-b border-gray-200
        min-h-[36px] min-w-[60px] transition-all duration-100
        ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset z-10' : 'hover:bg-gray-50'}
        ${className}
    `;

    return (
        <td className={baseCellClass}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            <div
                className="relative w-full h-full min-h-[32px] flex items-center justify-center cursor-pointer group"
                onClick={() => setShowMenu(!showMenu)}
            >
                {isUploading || isGenerating ? (
                    <div className="flex items-center gap-1 text-blue-500">
                        <Loader2 size={16} className="animate-spin" />
                    </div>
                ) : hasImage ? (
                    <>
                        <img
                            src={value}
                            alt=""
                            className="w-8 h-8 object-cover rounded"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling?.classList.remove('hidden');
                            }}
                        />
                        <div className="hidden w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                            <ImageIcon size={14} />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink size={14} className="text-white" />
                        </div>
                    </>
                ) : (
                    <div className="w-8 h-8 bg-gray-50 rounded border border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:bg-gray-100 group-hover:border-gray-400 transition-all">
                        <Upload size={12} />
                    </div>
                )}
            </div>

            {/* Action Menu */}
            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[160px] overflow-hidden">
                        <div
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                        >
                            <Upload size={14} className="text-gray-500" />
                            <span>อัพโหลดรูป</span>
                        </div>
                        <div
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePasteUrl();
                            }}
                        >
                            <ExternalLink size={14} className="text-gray-500" />
                            <span>วาง URL</span>
                        </div>
                        <div
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 cursor-pointer text-purple-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAIGenerate();
                            }}
                        >
                            <Wand2 size={14} />
                            <span>AI สร้างรูป</span>
                        </div>
                        {hasImage && (
                            <>
                                <hr className="border-gray-200" />
                                <div
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPreview(true);
                                        setShowMenu(false);
                                    }}
                                >
                                    <ImageIcon size={14} className="text-gray-500" />
                                    <span>ดูรูปเต็ม</span>
                                </div>
                                <div
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 cursor-pointer text-red-600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete();
                                    }}
                                >
                                    <Trash2 size={14} />
                                    <span>ลบรูป</span>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Error tooltip */}
            {error && (
                <div className="absolute left-0 top-full mt-1 bg-red-500 text-white text-xs px-2 py-1 rounded z-40">
                    {error}
                </div>
            )}

            {/* Full Image Preview Modal */}
            {showPreview && hasImage && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowPreview(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <img
                            src={value}
                            alt=""
                            className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        />
                        <button
                            className="absolute top-2 right-2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full"
                            onClick={() => setShowPreview(false)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </td>
    );
}

export default ImageUploadCell;
