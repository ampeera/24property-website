import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, MapPin } from 'lucide-react';

function ZoneDropdown({ zones, activeZone, onZoneChange, showAllZones }) {
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getZoneName = (zone) => {
        if (!zone) return t('zones_dropdown.all');
        if (typeof zone.name === 'object' && zone.name !== null) {
            return zone.name[i18n.language] || zone.name['en'] || zone.name['th'] || 'Unknown';
        }
        return zone.name;
    };

    const handleSelect = (zone) => {
        onZoneChange(zone);
        setIsOpen(false);
    };

    const currentLabel = showAllZones ? t('zones_dropdown.all') : getZoneName(activeZone);
    const currentIcon = showAllZones ? '🗺️' : (activeZone?.icon || '📍');

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm border border-gray-200"
            >
                <span className="text-lg">{currentIcon}</span>
                <span className="font-medium text-sm text-gray-700 max-w-[120px] truncate">
                    {currentLabel}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                    <div className="max-h-[60vh] overflow-y-auto">
                        {/* All Zones Option */}
                        <button
                            onClick={() => handleSelect(null)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors ${showAllZones ? 'bg-blue-50' : ''}`}
                        >
                            <span className="text-xl">🗺️</span>
                            <span className={`flex-1 text-sm ${showAllZones ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                                {t('zones_dropdown.all')}
                            </span>
                        </button>

                        <div className="border-t border-gray-100 my-1"></div>

                        {/* Individual Zones */}
                        {zones.map((zone) => {
                            const isActive = !showAllZones && activeZone?.id === zone.id;
                            return (
                                <button
                                    key={zone.id}
                                    onClick={() => handleSelect(zone)}
                                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition-colors ${isActive ? 'bg-blue-50' : ''}`}
                                >
                                    <span className="text-xl">{zone.icon || '📍'}</span>
                                    <span className={`flex-1 text-sm ${isActive ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                                        {getZoneName(zone)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ZoneDropdown;
