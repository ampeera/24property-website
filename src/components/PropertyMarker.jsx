import React from 'react';
import { Marker } from '@react-google-maps/api';
import { useTranslation } from 'react-i18next';

// Get marker URL based on property type
const getMarkerUrl = (type) => {
    const colorMap = {
        'land': 'red',           // 🔴 ที่ดิน - แดง
        'residential': 'blue',   // 🔵 ที่อยู่อาศัย - น้ำเงิน
        'industrial': 'purple'   // 🟣 อุตสาหกรรม - ม่วง (gray-dot ไม่มี ใช้ purple แทน)
    };
    const color = colorMap[type] || 'red';
    return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
};

function PropertyMarker({ property, onClick }) {
    const { i18n } = useTranslation();

    // Get marker icon URL based on property type
    const iconUrl = getMarkerUrl(property.type);

    // Handle localized title safely
    const titleText = typeof property.title === 'object'
        ? (property.title[i18n.language] || property.title['en'])
        : property.title;

    return (
        <Marker
            position={property.position}
            title={titleText}
            onClick={() => onClick(property)}
            icon={{
                url: iconUrl,
                scaledSize: { width: 40, height: 40 }
            }}
        />
    );
}

export default React.memo(PropertyMarker);
