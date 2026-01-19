import React, { useState } from 'react';
import { X, TrendingUp, Users, ArrowRight, AlertCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';
import SalesContact from './SalesContact';
import ImageGallery from './ImageGallery';
import VideoEmbed from './VideoEmbed';
import VideoLinkButtons from './VideoLinkButtons';

function PropertyDetail({ property, onClose, onFutureView }) {
    const { t, i18n } = useTranslation();
    const [isLangOpen, setIsLangOpen] = useState(false);

    const languages = SUPPORTED_LANGUAGES;
    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsLangOpen(false);
    };

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

    // Helper function to get translated type - handles both Thai labels and English keys
    const getTypeText = (typeOrLabel) => {
        // Map Thai labels to translation keys
        const thaiToKey = {
            'ที่ดิน': 'type_land',
            'บ้าน': 'type_house',
            'คอนโด': 'type_condo',
            'ทาวน์โฮม': 'type_townhome',
            'อาคารพาณิชย์': 'type_commercial',
            'โรงงาน': 'type_factory',
            'โกดัง': 'type_warehouse',
        };

        // Map English keys to translation keys
        const englishToKey = {
            'land': 'type_land',
            'house': 'type_house',
            'condo': 'type_condo',
            'townhome': 'type_townhome',
            'commercial': 'type_commercial',
            'factory': 'type_factory',
            'warehouse': 'type_warehouse',
            'industrial': 'type_factory',
            'residential': 'type_house',
        };

        // Try to find translation key
        const key = thaiToKey[typeOrLabel] || englishToKey[typeOrLabel?.toLowerCase()];
        if (key) {
            return t(`property.${key}`);
        }

        return typeOrLabel || '-';
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
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0, right: 0.3 }}
                onDragEnd={(event, info) => {
                    // Close if dragged right more than 100px or with high velocity
                    if (info.offset.x > 100 || info.velocity.x > 500) {
                        onClose();
                    }
                }}
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

                    {/* Language Switcher - top right, replacing X button */}
                    <div className="absolute top-4 right-4 z-10">
                        <button
                            onClick={() => setIsLangOpen(!isLangOpen)}
                            className="flex items-center gap-1.5 px-2.5 py-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-sm border border-white/20"
                        >
                            <span className="text-base">{currentLang.flag}</span>
                            <Globe size={14} className="text-gray-600" />
                        </button>

                        {isLangOpen && (
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden z-50">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className={`flex-1 text-sm ${i18n.language === lang.code ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                                            {lang.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header Info */}
                    <div className="relative">
                        {/* Close Button - X */}
                        <button
                            onClick={onClose}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all z-10"
                            aria-label="Close"
                        >
                            <X size={18} className="text-gray-500" />
                        </button>
                        <div className="flex items-center gap-2 mb-2 pr-8">
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

                        {/* Type and Location - Side by Side */}
                        <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Users size={16} className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{t('property.type')}: {getTypeText(property.typeLabel || property.type)}</p>
                                    <p className="text-xs text-gray-500">{t('property.grade')}: {property.grade || '-'}</p>
                                </div>
                            </div>
                            {property.position && (
                                <div className="flex items-start gap-3">
                                    <svg className="w-4 h-4 text-gray-400 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{t('property.position')}</p>
                                        <p className="text-xs text-gray-500 font-mono">
                                            {property.position.lat?.toFixed(6)}, {property.position.lng?.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
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
                    <div className="space-y-3 pt-4">
                        {/* Row 1: AI Future View + Share Button */}
                        <div className="grid grid-cols-2 gap-2">
                            {/* AI Future View Button - Gradient */}
                            {property.futureImage ? (
                                <a
                                    href={property.futureImage}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-3 px-3 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4facfe 100%)',
                                        backgroundSize: '200% 200%',
                                        animation: 'gradient-shift 3s ease infinite'
                                    }}
                                >
                                    <span>✨</span>
                                    <span>{t('property.see_future_view')}</span>
                                </a>
                            ) : (
                                <div className="py-3 px-3 rounded-xl font-bold text-sm bg-gray-200 text-gray-400 flex items-center justify-center gap-1.5 cursor-not-allowed">
                                    <span>✨</span>
                                    <span>{t('property.see_future_view')}</span>
                                </div>
                            )}

                            {/* Share Button */}
                            <button
                                onClick={() => {
                                    // Generate property-specific share URL
                                    const shareUrl = `${window.location.origin}${window.location.pathname}?property=${property.id}`;
                                    const shareData = {
                                        title: typeof property.title === 'object' ? (property.title[i18n.language] || property.title['th']) : property.title,
                                        text: `${typeof property.title === 'object' ? (property.title[i18n.language] || property.title['th']) : property.title} - ${property.price.toLocaleString()} ${t('property.currency')}`,
                                        url: shareUrl
                                    };
                                    if (navigator.share) {
                                        navigator.share(shareData);
                                    } else {
                                        navigator.clipboard.writeText(shareUrl);
                                        alert(t('property.link_copied') || 'Link copied!');
                                    }
                                }}
                                className="py-3 px-3 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
                                style={{
                                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                }}
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                                </svg>
                                <span>{t('property.share')}</span>
                            </button>
                        </div>

                        {/* Row 2: Social Media Link Buttons - TikTok, Facebook, YouTube */}
                        <VideoLinkButtons
                            tiktokUrl={property.videoTiktok}
                            facebookUrl={property.videoFacebook}
                            youtubeUrl={property.videoYoutube}
                        />

                        {/* Legacy Video Review Section (single video URL) */}
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
