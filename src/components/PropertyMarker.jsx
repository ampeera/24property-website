import React from 'react';
import { OverlayView } from '@react-google-maps/api';
import { useTranslation } from 'react-i18next';

// Property type config with icons and colors
const PROPERTY_TYPE_CONFIG = {
    // Thai labels
    'ที่ดิน': { icon: '🏞️', color: '#EF4444', gradient: 'linear-gradient(145deg, #FF6B6B, #DC2626)' },    // Red
    'บ้าน': { icon: '🏠', color: '#3B82F6', gradient: 'linear-gradient(145deg, #60A5FA, #2563EB)' },     // Blue
    'คอนโด': { icon: '🏢', color: '#8B5CF6', gradient: 'linear-gradient(145deg, #A78BFA, #7C3AED)' },    // Purple
    'ทาวน์โฮม': { icon: '🏘️', color: '#06B6D4', gradient: 'linear-gradient(145deg, #22D3EE, #0891B2)' }, // Cyan
    'อาคารพาณิชย์': { icon: '🏪', color: '#F59E0B', gradient: 'linear-gradient(145deg, #FBBF24, #D97706)' }, // Orange
    'โรงงาน': { icon: '🏭', color: '#22C55E', gradient: 'linear-gradient(145deg, #4ADE80, #16A34A)' },   // Green
    'โกดัง': { icon: '📦', color: '#A16207', gradient: 'linear-gradient(145deg, #CA8A04, #854D0E)' },    // Brown
    // English fallbacks
    'land': { icon: '🏞️', color: '#EF4444', gradient: 'linear-gradient(145deg, #FF6B6B, #DC2626)' },
    'house': { icon: '🏠', color: '#3B82F6', gradient: 'linear-gradient(145deg, #60A5FA, #2563EB)' },
    'condo': { icon: '🏢', color: '#8B5CF6', gradient: 'linear-gradient(145deg, #A78BFA, #7C3AED)' },
    'townhome': { icon: '🏘️', color: '#06B6D4', gradient: 'linear-gradient(145deg, #22D3EE, #0891B2)' },
    'commercial': { icon: '🏪', color: '#F59E0B', gradient: 'linear-gradient(145deg, #FBBF24, #D97706)' },
    'factory': { icon: '🏭', color: '#22C55E', gradient: 'linear-gradient(145deg, #4ADE80, #16A34A)' },
    'industrial': { icon: '🏭', color: '#22C55E', gradient: 'linear-gradient(145deg, #4ADE80, #16A34A)' },
    'warehouse': { icon: '📦', color: '#A16207', gradient: 'linear-gradient(145deg, #CA8A04, #854D0E)' },
    'residential': { icon: '🏠', color: '#3B82F6', gradient: 'linear-gradient(145deg, #60A5FA, #2563EB)' },
};

const DEFAULT_CONFIG = { icon: '📍', color: '#EF4444', gradient: 'linear-gradient(145deg, #FF6B6B, #DC2626)' };

// Format price to short format
const formatPriceShort = (price) => {
    const num = parseFloat(price) || 0;
    if (num >= 1000000) {
        const millions = num / 1000000;
        if (millions % 1 === 0) {
            return `${millions}M`;
        }
        return `${millions.toFixed(1)}M`;
    }
    if (num >= 1000) {
        return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
};

// Get config for property type
const getTypeConfig = (typeLabel, type) => {
    return PROPERTY_TYPE_CONFIG[typeLabel] ||
        PROPERTY_TYPE_CONFIG[type] ||
        DEFAULT_CONFIG;
};

function PropertyMarker({ property, onClick, isSelected = false }) {
    const { i18n } = useTranslation();

    const config = getTypeConfig(property.typeLabel, property.type);
    const priceText = formatPriceShort(property.price);

    const titleText = typeof property.title === 'object'
        ? (property.title[i18n.language] || property.title['th'] || property.title['en'])
        : property.title;

    return (
        <OverlayView
            position={property.position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={(width, height) => ({
                x: -(width / 2),
                y: -height
            })}
        >
            <div
                onClick={() => onClick(property)}
                title={titleText}
                style={{
                    cursor: 'pointer',
                    transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    zIndex: isSelected ? 1000 : 1,
                    filter: isSelected
                        ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.35))'
                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
                }}
            >
                {/* Main Container */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    {/* Marker Body - Compact Card */}
                    <div
                        style={{
                            background: config.gradient,
                            borderRadius: '8px',
                            padding: '3px 6px 4px 6px',
                            boxShadow: isSelected
                                ? `0 0 0 2px white, 0 0 0 4px ${config.color}`
                                : 'inset 0 1px 2px rgba(255,255,255,0.3)',
                            border: '1.5px solid rgba(255,255,255,0.4)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: '32px',
                        }}
                    >
                        {/* Small Icon on top */}
                        <div
                            style={{
                                fontSize: '10px',
                                lineHeight: '1',
                                marginBottom: '1px',
                            }}
                        >
                            {config.icon}
                        </div>

                        {/* Price below */}
                        <div
                            style={{
                                color: 'white',
                                fontSize: '9px',
                                fontWeight: '700',
                                textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                                whiteSpace: 'nowrap',
                                letterSpacing: '0.2px',
                            }}
                        >
                            {priceText}
                        </div>
                    </div>

                    {/* Pin pointer (triangle) */}
                    <div
                        style={{
                            width: 0,
                            height: 0,
                            borderLeft: '5px solid transparent',
                            borderRight: '5px solid transparent',
                            borderTop: `7px solid ${config.color}`,
                            marginTop: '-1px',
                        }}
                    />
                </div>
            </div>
        </OverlayView>
    );
}

export default React.memo(PropertyMarker);
