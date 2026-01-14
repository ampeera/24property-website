import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Eye, Search, Table, ChevronDown } from 'lucide-react';
import { PropertyService } from '../../services/PropertyService';
import { SUPPORTED_LANGUAGES } from '../../i18n';

function PropertyList() {
    const { t, i18n } = useTranslation();
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLangOpen, setIsLangOpen] = useState(false);

    const languages = SUPPORTED_LANGUAGES;
    const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setIsLangOpen(false);
    };

    useEffect(() => {
        loadProperties();
    }, []);

    async function loadProperties() {
        setLoading(true);
        try {
            const data = await PropertyService.getAllProperties();
            setProperties(data || []);
        } catch (error) {
            console.error('Error loading properties:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredProperties = properties.filter(p => {
        const title = typeof p.title === 'object' ? p.title.en || p.title.th : p.title;
        return title?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('th-TH').format(price);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'land': return 'bg-red-100 text-red-800';
            case 'residential': return 'bg-blue-100 text-blue-800';
            case 'industrial': return 'bg-gray-100 text-gray-800';
            case 'commercial': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'land': return 'ที่ดิน';
            case 'residential': return 'ที่อยู่อาศัย';
            case 'industrial': return 'อุตสาหกรรม';
            case 'commercial': return 'พาณิชยกรรม';
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
                    <p className="text-gray-500">{properties.length} total properties</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Language Switcher */}
                    <div className="relative">
                        <button
                            onClick={() => setIsLangOpen(!isLangOpen)}
                            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
                        >
                            <span className="text-lg">{currentLang.flag}</span>
                            <span className="font-medium text-sm hidden sm:block">{currentLang.name}</span>
                            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isLangOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden z-50">
                                <div className="max-h-[60vh] overflow-y-auto">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => changeLanguage(lang.code)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                        >
                                            <span className="text-xl">{lang.flag}</span>
                                            <span className={`flex-1 text-sm ${i18n.language === lang.code ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                                                {lang.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <a
                        href="https://docs.google.com/spreadsheets/d/1Js3Lsphz2VzofszRq1ghLXB4d2INBmiDIWHtXdgKvRk/edit?gid=681312581#gid=681312581"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Table size={20} />
                        Manage in Google Sheets
                    </a>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Properties Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Property
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Price (฿)
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Zone
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    View
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProperties.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm ? 'No properties found matching your search' : 'No properties found in Sheet'}
                                    </td>
                                </tr>
                            ) : (
                                filteredProperties.map((property, index) => (
                                    <tr key={property.id || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={property.currentImage || property.images?.[0] || 'https://via.placeholder.com/60'}
                                                    alt=""
                                                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                                                    onError={(e) => e.target.src = 'https://via.placeholder.com/60'}
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900 truncate max-w-[300px]">
                                                        {typeof property.title === 'object'
                                                            ? property.title.th || property.title.en
                                                            : property.title}
                                                    </p>
                                                    {/* ID Removed as requested */}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-medium">
                                                {formatPrice(property.price)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600">
                                                {property.zoneId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${getTypeColor(property.type)}`}>
                                                {getTypeLabel(property.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${property.status === 'active' || property.status === 'available'
                                                ? 'bg-green-100 text-green-800'
                                                : property.status === 'sold'
                                                    ? 'bg-gray-100 text-gray-800'
                                                    : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                {property.status || 'available'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => window.open(`/?property=${property.id}`, '_blank')}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="View on Site"
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default PropertyList;
