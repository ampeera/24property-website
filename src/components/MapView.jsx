import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Circle } from '@react-google-maps/api';
import { Navigation, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PropertyMarker from './PropertyMarker';

// Use environment variable for API key (must be set in Netlify)
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const containerStyle = {
    width: '100%',
    height: '100vh'
};

const defaultCenter = {
    lat: 12.9236,
    lng: 101.0186
};



function MapView({ activeZone, language, properties = [], onPropertySelect, isLoading, showAllZones = false }) {
    const { t } = useTranslation();
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: MAPS_API_KEY
    });

    const [map, setMap] = useState(null);
    const [mapType, setMapType] = useState('roadmap'); // roadmap, satellite, hybrid, terrain
    const [userLocation, setUserLocation] = useState(null);
    const [locatingUser, setLocatingUser] = useState(false);

    const onLoad = useCallback(function callback(map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map) {
        setMap(null);
    }, []);

    useEffect(() => {
        if (map) {
            if (showAllZones || !activeZone) {
                // Show all zones - zoom out to see all markers
                map.panTo(defaultCenter);
                map.setZoom(11);
            } else if (activeZone?.center) {
                map.panTo(activeZone.center);
                map.setZoom(activeZone.zoom || 14);
            }
        }
    }, [map, activeZone, showAllZones]);

    // Update map type when changed
    useEffect(() => {
        if (map) {
            map.setMapTypeId(mapType);
        }
    }, [map, mapType]);

    // Get user's current location
    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert(t('map.browser_not_supported'));
            return;
        }

        setLocatingUser(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userPos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserLocation(userPos);
                if (map) {
                    map.panTo(userPos);
                    map.setZoom(16);
                }
                setLocatingUser(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert(t('map.location_error') + ': ' + error.message);
                setLocatingUser(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Toggle map type
    const toggleMapType = () => {
        const types = ['roadmap', 'satellite', 'hybrid', 'terrain'];
        const currentIndex = types.indexOf(mapType);
        const nextIndex = (currentIndex + 1) % types.length;
        setMapType(types[nextIndex]);
    };

    const getMapTypeLabel = () => {
        switch (mapType) {
            case 'roadmap': return t('map.roadmap');
            case 'satellite': return t('map.satellite');
            case 'hybrid': return t('map.hybrid');
            case 'terrain': return t('map.terrain');
            default: return t('map.roadmap');
        }
    };

    if (loadError) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-100 text-red-500 font-bold p-10 text-center">
                <div>
                    <p className="text-2xl mb-2">Map Loading Error</p>
                    <p className="text-sm font-mono text-gray-600">{loadError.message}</p>
                    <p className="mt-4 text-xs text-gray-400">Please check your Google Maps API Key in .env</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-100 text-blue-500">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="font-medium">{t('map.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={activeZone?.center || defaultCenter}
                zoom={showAllZones ? 11 : 14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    mapTypeControl: false,
                    streetViewControl: true,
                    fullscreenControl: true,
                    zoomControl: true,
                    mapTypeId: mapType
                }}
            >


                {/* User Location Marker */}
                {userLocation && (
                    <Circle
                        center={userLocation}
                        radius={50}
                        options={{
                            strokeColor: '#4285F4',
                            strokeOpacity: 1,
                            strokeWeight: 2,
                            fillColor: '#4285F4',
                            fillOpacity: 0.3,
                            zIndex: 100
                        }}
                    />
                )}

                {/* Property Markers */}
                {!isLoading && properties
                    .filter(p => activeZone ? p.zoneId === activeZone.id : true)
                    .map((property) => (
                        <PropertyMarker
                            key={property.id}
                            property={property}
                            onClick={onPropertySelect}
                        />
                    ))
                }
            </GoogleMap>

            {/* Map Controls - adjusted spacing to avoid overlap */}
            <div className="absolute bottom-32 sm:bottom-24 right-2 sm:right-4 flex flex-col gap-1.5 sm:gap-2 z-10">
                {/* Map Type Toggle */}
                <button
                    onClick={toggleMapType}
                    className="bg-white p-2 sm:p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    title={t('map.change_type')}
                >
                    <Layers size={20} className="text-gray-700" />
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                        {getMapTypeLabel()}
                    </span>
                </button>

                <button
                    onClick={handleGetLocation}
                    disabled={locatingUser}
                    className="bg-white p-2 sm:p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
                    title={t('map.my_location')}
                >
                    {locatingUser ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Navigation size={20} className="text-blue-600" />
                    )}
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                        {t('map.my_location')}
                    </span>
                </button>
            </div>
        </div>
    );
}

export default React.memo(MapView);
