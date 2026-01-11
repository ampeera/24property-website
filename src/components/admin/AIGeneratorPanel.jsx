import React, { useState } from 'react';
import { Wand2, Loader2, Copy, Check, Sparkles, Image as ImageIcon, FileText, MapPin, X } from 'lucide-react';
import {
    generateDescription,
    generateTitle,
    generateNearbyArea,
    autoGenerateContent,
    improveText,
    generateImage,
    generateImagePrompt
} from '../../services/aiService';
import { uploadImageFromUrl } from '../../services/googleDriveService';

function AIGeneratorPanel({
    selectedRow,
    propertyData,
    onApplyText,
    onApplyImage,
    onClose,
    isOpen = true
}) {
    const [isGenerating, setIsGenerating] = useState({
        title: false,
        description: false,
        nearby: false,
        image: false,
        all: false
    });
    const [results, setResults] = useState({
        title: '',
        description: '',
        nearby: '',
        imageUrl: ''
    });
    const [copied, setCopied] = useState({});
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const setGenerating = (key, value) => {
        setIsGenerating(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerateTitle = async () => {
        if (!propertyData) return;
        setGenerating('title', true);
        setError(null);
        try {
            const result = await generateTitle(propertyData);
            setResults(prev => ({ ...prev, title: result }));
        } catch (err) {
            setError(err.message);
        }
        setGenerating('title', false);
    };

    const handleGenerateDescription = async () => {
        if (!propertyData) return;
        setGenerating('description', true);
        setError(null);
        try {
            const result = await generateDescription(propertyData);
            setResults(prev => ({ ...prev, description: result }));
        } catch (err) {
            setError(err.message);
        }
        setGenerating('description', false);
    };

    const handleGenerateNearby = async () => {
        if (!propertyData) return;
        setGenerating('nearby', true);
        setError(null);
        try {
            const result = await generateNearbyArea(propertyData);
            setResults(prev => ({ ...prev, nearby: result }));
        } catch (err) {
            setError(err.message);
        }
        setGenerating('nearby', false);
    };

    const handleGenerateImage = async () => {
        if (!propertyData) return;
        setGenerating('image', true);
        setError(null);
        try {
            const prompt = await generateImagePrompt(propertyData);
            const result = await generateImage(prompt);

            if (!result.isPlaceholder) {
                setResults(prev => ({ ...prev, imageUrl: result.url }));
            } else {
                setError('Image generation failed');
            }
        } catch (err) {
            setError(err.message);
        }
        setGenerating('image', false);
    };

    const handleGenerateAll = async () => {
        if (!propertyData) return;
        setGenerating('all', true);
        setError(null);
        try {
            const result = await autoGenerateContent(propertyData);
            if (result.success) {
                setResults(prev => ({
                    ...prev,
                    title: result.title,
                    description: result.description,
                    nearby: result.nearby
                }));
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError(err.message);
        }
        setGenerating('all', false);
    };

    const handleCopy = (key, text) => {
        navigator.clipboard.writeText(text);
        setCopied(prev => ({ ...prev, [key]: true }));
        setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000);
    };

    const handleApply = (key, columnName) => {
        onApplyText?.(columnName, results[key]);
    };

    const handleApplyImage = async () => {
        if (!results.imageUrl) return;

        try {
            // Upload the generated image to Google Drive
            setGenerating('image', true);
            const uploaded = await uploadImageFromUrl(results.imageUrl);
            onApplyImage?.(uploaded.directLink);
        } catch (err) {
            setError(err.message);
        }
        setGenerating('image', false);
    };

    const isAnyGenerating = Object.values(isGenerating).some(v => v);

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-500">
                <div className="flex items-center gap-2 text-white">
                    <Sparkles size={20} />
                    <h2 className="font-semibold">AI Assistant</h2>
                </div>
                <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white p-1 rounded"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Selected Row Info */}
            <div className="p-3 bg-gray-50 border-b border-gray-200">
                {selectedRow !== null ? (
                    <div className="text-sm">
                        <span className="text-gray-500">Selected Row:</span>
                        <span className="ml-2 font-medium text-purple-600">#{selectedRow + 1}</span>
                        {propertyData?.title && (
                            <p className="text-gray-700 truncate mt-1">
                                {typeof propertyData.title === 'object'
                                    ? propertyData.title.th
                                    : propertyData.title}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">
                        เลือกแถวที่ต้องการใช้ AI
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Generate All */}
                <button
                    onClick={handleGenerateAll}
                    disabled={isAnyGenerating || !propertyData}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isGenerating.all ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Sparkles size={18} />
                    )}
                    <span>Generate All Text</span>
                </button>

                {/* Title */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <FileText size={14} />
                            ชื่อโครงการ
                        </label>
                        <button
                            onClick={handleGenerateTitle}
                            disabled={isAnyGenerating || !propertyData}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                        >
                            {isGenerating.title ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                            Generate
                        </button>
                    </div>
                    {results.title && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            <p className="text-gray-700 mb-2">{results.title}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleCopy('title', results.title)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    {copied.title ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    Copy
                                </button>
                                <button
                                    onClick={() => handleApply('title', 'ชื่อโครงการ')}
                                    className="text-xs text-purple-600 hover:text-purple-700"
                                >
                                    ใช้งาน
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <FileText size={14} />
                            รายละเอียด
                        </label>
                        <button
                            onClick={handleGenerateDescription}
                            disabled={isAnyGenerating || !propertyData}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                        >
                            {isGenerating.description ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                            Generate
                        </button>
                    </div>
                    {results.description && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            <p className="text-gray-700 mb-2">{results.description}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleCopy('description', results.description)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    {copied.description ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    Copy
                                </button>
                                <button
                                    onClick={() => handleApply('description', 'รายละเอียด')}
                                    className="text-xs text-purple-600 hover:text-purple-700"
                                >
                                    ใช้งาน
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Nearby Area */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <MapPin size={14} />
                            พื้นที่ใกล้เคียง
                        </label>
                        <button
                            onClick={handleGenerateNearby}
                            disabled={isAnyGenerating || !propertyData}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                        >
                            {isGenerating.nearby ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                            Generate
                        </button>
                    </div>
                    {results.nearby && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            <p className="text-gray-700 mb-2">{results.nearby}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleCopy('nearby', results.nearby)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    {copied.nearby ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                                    Copy
                                </button>
                                <button
                                    onClick={() => handleApply('nearby', 'พื้นที่ใกล้เคียง')}
                                    className="text-xs text-purple-600 hover:text-purple-700"
                                >
                                    ใช้งาน
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Image Generation */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <ImageIcon size={14} />
                            รูปภาพ AI
                        </label>
                        <button
                            onClick={handleGenerateImage}
                            disabled={isAnyGenerating || !propertyData}
                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                        >
                            {isGenerating.image ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                            Generate
                        </button>
                    </div>
                    {results.imageUrl && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <img
                                src={results.imageUrl}
                                alt="AI Generated"
                                className="w-full h-40 object-cover rounded-lg mb-2"
                            />
                            <button
                                onClick={handleApplyImage}
                                disabled={isGenerating.image}
                                className="w-full text-sm bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50"
                            >
                                {isGenerating.image ? 'กำลังอัพโหลด...' : 'อัพโหลดไป Drive'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
                <p>Powered by OpenRouter AI</p>
            </div>
        </div>
    );
}

export default AIGeneratorPanel;
