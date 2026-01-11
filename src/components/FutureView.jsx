import React, { useState } from 'react';
import { X, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function FutureView({ property, onClose }) {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState('future'); // 'current' or 'future'

    if (!property) return null;

    // Use real data from property object
    const currentImage = property.currentImage || `https://source.unsplash.com/random/1200x800?land,field&sig=${property.id}-current`;
    const futureImage = property.futureImage || `https://source.unsplash.com/random/1200x800?luxury,villa,resort&sig=${property.id}-future`;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            >
                <div className="relative w-full max-w-5xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col max-h-[90vh]">

                    {/* Header */}
                    <div className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-md absolute top-0 left-0 right-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <Sparkles className="text-white" size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">{t('future_view.title')}</h3>
                                <p className="text-gray-400 text-xs">{t('future_view.subtitle')}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Main Content (Image Area) */}
                    <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden group">

                        {/* Image Display */}
                        <div className="relative w-full h-full">
                            {/* Current View (Background) */}
                            <img
                                src={currentImage}
                                alt="Current Land"
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${viewMode === 'current' ? 'opacity-100' : 'opacity-0'}`}
                            />

                            {/* Future View (Foreground) */}
                            <img
                                src={futureImage}
                                alt="Future Concept"
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${viewMode === 'future' ? 'opacity-100' : 'opacity-0'}`}
                            />

                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white font-semibold">
                                {viewMode === 'future' ? t('future_view.future_concept') : t('future_view.current_state')}
                            </div>
                        </div>
                    </div>

                    {/* Toggle Switch (Centered when hovering or always visible on mobile) */}
                    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex bg-gray-800/80 backdrop-blur p-1.5 rounded-full border border-gray-700">
                        <button
                            onClick={() => setViewMode('current')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${viewMode === 'current' ? 'bg-gray-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            {t('future_view.current')}
                        </button>
                        <button
                            onClick={() => setViewMode('future')}
                            className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'future' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Sparkles size={14} /> {t('future_view.future')}
                        </button>
                    </div>

                    {/* Disclaimer Footer */}
                    <div className="p-4 bg-gray-900 border-t border-gray-800 text-center">
                        <p className="text-gray-500 text-xs flex items-center justify-center gap-2">
                            <AlertCircle size={12} />
                            {t('future_view.disclaimer')}
                        </p>
                    </div>

                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default React.memo(FutureView);
