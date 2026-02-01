import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function StreetViewEmbed({ lat, lng, heading = 0 }) {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [hasStreetView, setHasStreetView] = useState(null); // null = checking, true/false = result
    const [panorama, setPanorama] = useState(null);
    const [nearestLocation, setNearestLocation] = useState(null);
    const streetViewRef = useRef(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: MAPS_API_KEY
    });

    // Check if Street View is available at or near the location
    const checkStreetView = useCallback(() => {
        if (!isLoaded || !window.google) return;

        const sv = new window.google.maps.StreetViewService();
        const location = new window.google.maps.LatLng(lat, lng);

        // Search within 500 meters radius for the nearest Street View
        sv.getPanorama({
            location: location,
            radius: 500, // 500 meters radius
            preference: window.google.maps.StreetViewPreference.NEAREST,
            source: window.google.maps.StreetViewSource.OUTDOOR
        }, (data, status) => {
            if (status === window.google.maps.StreetViewStatus.OK) {
                setHasStreetView(true);
                setNearestLocation(data.location.latLng);
            } else {
                setHasStreetView(false);
            }
        });
    }, [isLoaded, lat, lng]);

    useEffect(() => {
        checkStreetView();
    }, [checkStreetView]);

    // Initialize Street View when visible
    useEffect(() => {
        if (!isVisible || !isLoaded || !hasStreetView || !streetViewRef.current || !nearestLocation) return;

        const pano = new window.google.maps.StreetViewPanorama(streetViewRef.current, {
            position: nearestLocation,
            pov: {
                heading: heading,
                pitch: 0
            },
            zoom: 1,
            addressControl: false,
            showRoadLabels: true,
            linksControl: true,
            panControl: true,
            enableCloseButton: false,
            fullscreenControl: true,
            zoomControl: true,
            motionTracking: false,
            motionTrackingControl: false
        });

        setPanorama(pano);

        return () => {
            if (pano) {
                // Cleanup
            }
        };
    }, [isVisible, isLoaded, hasStreetView, nearestLocation, heading]);

    if (!lat || !lng) return null;

    return (
        <div className="mt-4">
            {/* Toggle Button */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                disabled={hasStreetView === false}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all ${hasStreetView === false
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isVisible
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                    }`}
            >
                {hasStreetView === null ? (
                    <>
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span>{t('property.checking_street_view') || 'กำลังตรวจสอบ...'}</span>
                    </>
                ) : hasStreetView === false ? (
                    <>
                        <AlertCircle size={16} />
                        <span>{t('property.no_street_view') || 'ไม่มี Street View ในบริเวณนี้'}</span>
                    </>
                ) : isVisible ? (
                    <>
                        <EyeOff size={16} />
                        <span>{t('property.hide_street_view') || 'ซ่อน Street View'}</span>
                    </>
                ) : (
                    <>
                        <Eye size={16} />
                        <span>{t('property.show_street_view') || 'ดู Street View'}</span>
                    </>
                )}
            </button>

            {/* Street View Container */}
            {isVisible && hasStreetView && (
                <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                    <div
                        ref={streetViewRef}
                        style={{ width: '100%', height: '250px' }}
                        className="bg-gray-100"
                    />
                </div>
            )}
        </div>
    );
}

export default React.memo(StreetViewEmbed);
