import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Sparkles, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function ImageGallery({ images = [], futureImage, currentImage, onClose }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('current'); // 'current' | 'future'
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Combine all images
    const allImages = images.length > 0 ? images : (currentImage ? [currentImage] : []);

    const currentImages = activeTab === 'current' ? allImages : (futureImage ? [futureImage] : []);

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % currentImages.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
    };

    if (currentImages.length === 0) {
        return (
            <div className="h-64 bg-gray-200 flex items-center justify-center">
                <Camera className="text-gray-400" size={48} />
            </div>
        );
    }

    return (
        <>
            <div className="relative h-64 bg-gray-200 group">
                {/* Main Image */}
                <AnimatePresence mode="wait">
                    <motion.img
                        key={`${activeTab}-${currentIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        src={currentImages[currentIndex]}
                        alt={`Property ${activeTab} view`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setIsFullscreen(true)}
                        onError={(e) => {
                            e.target.src = 'https://source.unsplash.com/random/800x600?land';
                        }}
                    />
                </AnimatePresence>

                {/* Tab Switcher */}
                <div className="absolute top-4 left-4 flex bg-black/50 rounded-lg overflow-hidden backdrop-blur-sm">
                    <button
                        onClick={() => { setActiveTab('current'); setCurrentIndex(0); }}
                        className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${activeTab === 'current'
                            ? 'bg-white text-gray-900'
                            : 'text-white hover:bg-white/20'
                            }`}
                    >
                        <Camera size={12} />
                        {t('gallery.current')}
                    </button>
                    {futureImage && (
                        <button
                            onClick={() => { setActiveTab('future'); setCurrentIndex(0); }}
                            className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${activeTab === 'future'
                                ? 'bg-white text-gray-900'
                                : 'text-white hover:bg-white/20'
                                }`}
                        >
                            <Sparkles size={12} />
                            {t('gallery.future')}
                        </button>
                    )}
                </div>

                {/* Navigation Arrows */}
                {currentImages.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}

                {/* Image Counter */}
                {currentImages.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-sm">
                        {currentIndex + 1} / {currentImages.length}
                    </div>
                )}

                {/* Close Button (if onClose provided) */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}

                {/* Thumbnail Dots */}
                {currentImages.length > 1 && currentImages.length <= 5 && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {currentImages.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                    ? 'bg-white w-4'
                                    : 'bg-white/50 hover:bg-white/75'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
                        onClick={() => setIsFullscreen(false)}
                    >
                        <img
                            src={currentImages[currentIndex]}
                            alt="Fullscreen view"
                            className="max-w-full max-h-full object-contain"
                        />
                        <button
                            onClick={() => setIsFullscreen(false)}
                            className="absolute top-4 right-4 p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {/* Fullscreen Navigation */}
                        {currentImages.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 text-white rounded-full hover:bg-white/30"
                                >
                                    <ChevronLeft size={32} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/20 text-white rounded-full hover:bg-white/30"
                                >
                                    <ChevronRight size={32} />
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default ImageGallery;
