import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

function ZoneSwitcher({ activeZoneId, onZoneChange, zones }) {
    const { i18n } = useTranslation();

    // Helper function to get localized name
    const getZoneName = (zone) => {
        if (typeof zone.name === 'object' && zone.name !== null) {
            return zone.name[i18n.language] || zone.name['en'] || zone.name['th'] || 'Unknown';
        }
        return zone.name;
    };

    return (
        <div className="absolute top-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto z-10 flex justify-center">
            <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-gray-200 flex gap-1 overflow-x-auto max-w-full no-scrollbar">
                {zones.map((zone) => {
                    const isActive = activeZoneId === zone.id;
                    return (
                        <button
                            key={zone.id}
                            onClick={() => onZoneChange(zone)}
                            className={`
                relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2
                ${isActive ? 'text-white' : 'text-gray-600 hover:bg-gray-100'}
              `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeZoneBg"
                                    className="absolute inset-0 bg-blue-600 rounded-full"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 text-lg">{zone.icon}</span>
                            <span className="relative z-10">{getZoneName(zone)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default ZoneSwitcher;

