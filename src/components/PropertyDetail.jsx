import React from 'react';
import { X, TrendingUp, Users, DollarSign, ArrowRight, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SalesContact from './SalesContact';
import ImageGallery from './ImageGallery';
import VideoEmbed from './VideoEmbed';

function PropertyDetail({ property, onClose, onFutureView }) {
    const { t, i18n } = useTranslation();
    if (!property) return null;

    // Helper function to get translated status
    const getStatusText = (status) => {
        const statusMap = {
            'available': t('property.status_sale'),
            'rent': t('property.status_rent'),
            'sold': t('property.status_sold'),
            'urgent': t('property.status_urgent')
        };
        return statusMap[status] || status;
    };

    // Helper function to get translated type
    const getTypeText = (type) => {
        const typeMap = {
            'land': t('property.type_land'),
            'house': t('property.type_house'),
            'condo': t('property.type_condo'),
            'factory': t('property.type_factory')
        };
        return typeMap[type] || type;
    };

    // Helper function to get localized text
    const getLocalizedText = (textObj) => {
        if (!textObj) return '';
        if (typeof textObj === 'string') return textObj;
        return textObj[i18n.language] || textObj['en'] || textObj['th'] || '';
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl z-50 overflow-y-auto border-l border-gray-100"
            >
                {/* Image Gallery with Current/Future tabs */}
                <div className="relative">
                    <ImageGallery
                        images={property.images || []}
                        currentImage={property.currentImage}
                        futureImage={property.futureImage}
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-white transition-colors z-10"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${property.type === 'OWNER' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                property.type === 'HOT' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                {property.type === 'OWNER' ? 'EXCLUSIVE OWNER' : property.type}
                            </span>
                            <span className="text-gray-400 text-sm">#{property.id}</span>
                        </div>
                        <h2 className="text-2xl font-bold font-thai text-gray-900">
                            {typeof property.title === 'object' ? (property.title[i18n.language] || property.title['en'] || property.title['th']) : property.title}
                        </h2>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{property.price.toLocaleString()} {t('property.currency')}</p>
                        {property.type === 'land' && property.pricePerRai > 0 && (
                            <p className="text-sm text-gray-500 mt-1">({property.pricePerRai.toLocaleString()} {t('property.per_rai')})</p>
                        )}
                        <p className="text-gray-500 mt-1">
                            {typeof property.description === 'object' ? (property.description[i18n.language] || property.description['en'] || property.description['th']) : property.description}
                        </p>
                    </div>

                    {/* ข้อมูลที่ดิน */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                                <TrendingUp size={18} />
                            </div>
                            <h3 className="font-bold text-gray-900">{t('property.land_info')}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 mb-1">{t('property.land_size')}</p>
                                <p className="text-lg font-bold text-green-600">{property.landArea?.formatted || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">{t('property.status')}</p>
                                <p className="text-lg font-bold text-gray-800">
                                    {getStatusText(property.status)}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                            <div className="flex items-start gap-3">
                                <Users size={16} className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{t('property.type')}: {getTypeText(property.type)}</p>
                                    <p className="text-xs text-gray-500">{t('property.grade')}: {property.grade || '-'}</p>
                                </div>
                            </div>
                        </div>
                        {property.mapLink && (
                            <div className="pt-2">
                                <div className="flex items-start gap-3">
                                    <DollarSign size={16} className="text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{t('property.position')}</p>
                                        <a
                                            href={property.mapLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            {t('property.view_on_google_maps')}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* รายละเอียดเพิ่มเติม Section */}
                    {getLocalizedText(property.additionalDescription) && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <span className="text-lg">📋</span>
                                </div>
                                <h3 className="font-bold text-gray-900">{t('property.additional_details')}</h3>
                            </div>
                            <ul className="space-y-2">
                                {getLocalizedText(property.additionalDescription).split(',').map((item, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="text-emerald-500 mt-0.5">•</span>
                                        <span className="text-gray-700 text-sm">{item.trim()}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* พื้นที่ใกล้เคียง Section */}
                    {getLocalizedText(property.nearbyArea) && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-lg">📍</span>
                                </div>
                                <h3 className="font-bold text-gray-900">{t('property.nearby_area')}</h3>
                            </div>
                            <div className="space-y-2">
                                {getLocalizedText(property.nearbyArea).split(',').map((area, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <p className="text-gray-700 text-sm">{area.trim()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Agent Private Section (Hidden unless ?agent=true) */}
                    {window.location.search.includes('agent=true') && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-2">
                            <h4 className="text-xs font-bold text-yellow-800 uppercase tracking-wider flex items-center gap-2">
                                <AlertCircle size={12} /> Agent Internal
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Commission</p>
                                    <p className="font-mono font-bold text-gray-900">3.0%</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Owner Contact</p>
                                    <p className="font-mono font-bold text-gray-900">K.Somchai</p>
                                    <p className="text-xs text-gray-400">081-999-9999</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-4 pt-4">
                        <button
                            onClick={onFutureView}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            ✨ {t('property.see_future_view')}
                        </button>

                        {/* Video Review Section */}
                        {property.videoUrl && (
                            <VideoEmbed videoUrl={property.videoUrl} compact />
                        )}

                        {/* Sales Contact Section */}
                        <SalesContact />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default React.memo(PropertyDetail);
