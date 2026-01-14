import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import MapView from './components/MapView';
import ZoneDropdown from './components/ZoneDropdown';
import PropertyDetail from './components/PropertyDetail';
import FutureView from './components/FutureView';
import SearchBar from './components/SearchBar';
import { PropertyService } from './services/PropertyService';
import { ZoneService } from './services/ZoneService';
import { SUPPORTED_LANGUAGES } from './i18n';

function App() {
  const { t, i18n } = useTranslation();

  const [zones, setZones] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isFutureViewOpen, setIsFutureViewOpen] = useState(false);

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load zones from Google Sheets
  useEffect(() => {
    const loadZones = async () => {
      const data = await ZoneService.getAllZones();
      setZones(data);
    };
    loadZones();
  }, []);

  useEffect(() => {
    const loadProperties = async () => {
      setIsLoading(true);
      try {
        const data = await PropertyService.getAllProperties();
        setProperties(data);

        // Check for property ID in URL parameter and auto-open
        const urlParams = new URLSearchParams(window.location.search);
        const propertyId = urlParams.get('property');
        if (propertyId && data.length > 0) {
          const foundProperty = data.find(p => p.id === propertyId);
          if (foundProperty) {
            setSelectedProperty(foundProperty);
          }
        }
      } catch (error) {
        console.error("Failed to load properties", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProperties();
  }, []);

  // Use imported languages list
  const languages = SUPPORTED_LANGUAGES;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsLangOpen(false);
  };

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    setIsFutureViewOpen(false);

    // Update URL with property ID for sharing
    if (property) {
      const url = new URL(window.location.href);
      url.searchParams.set('property', property.id);
      window.history.pushState({}, '', url.toString());
    }
  };

  const handlePropertyClose = () => {
    setSelectedProperty(null);

    // Remove property ID from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('property');
    window.history.pushState({}, '', url.toString());
  };

  const handleZoneChange = (zone) => {
    setActiveZone(zone);
    setSelectedProperty(null);
  };

  // Search handler - filters properties based on query
  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  // Filter properties based on search query and active zone
  const getFilteredProperties = () => {
    let filtered = properties;

    // Filter by zone
    if (activeZone) {
      filtered = filtered.filter(p => p.zoneId === activeZone.id);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => {
        // Search in title
        const title = typeof p.title === 'object'
          ? Object.values(p.title).join(' ').toLowerCase()
          : (p.title || '').toLowerCase();
        if (title.includes(query)) return true;

        // Search in description
        const desc = typeof p.description === 'object'
          ? Object.values(p.description).join(' ').toLowerCase()
          : (p.description || '').toLowerCase();
        if (desc.includes(query)) return true;

        // Search by zone name
        const zone = zones.find(z => z.id === p.zoneId);
        if (zone) {
          const zoneName = typeof zone.name === 'object'
            ? Object.values(zone.name).join(' ').toLowerCase()
            : (zone.name || '').toLowerCase();
          if (zoneName.includes(query)) return true;
        }

        // Search by price (if number entered)
        const numQuery = parseFloat(query.replace(/,/g, ''));
        if (!isNaN(numQuery) && p.price <= numQuery) return true;

        return false;
      });
    }

    return filtered;
  };

  const filteredProperties = getFilteredProperties();

  const [isLangOpen, setIsLangOpen] = useState(false);
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 font-sans text-gray-900 relative">

      {/* Minimal Header - 2 rows on mobile, 1 row on desktop */}
      <header className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        {/* Row 1: Logo, Zone, Language (always visible) */}
        <div className="px-4 h-14 sm:h-16 flex items-center gap-2 sm:gap-3">

          {/* Logo */}
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl shadow-sm border border-white/20 flex items-center gap-2 flex-shrink-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shadow-blue-500/30 shadow-lg">
              24
            </div>
            <div className="hidden sm:block">
              <span className="block text-xs sm:text-sm font-bold font-thai text-blue-900 leading-none">24 Property</span>
              <span className="block text-[9px] text-gray-500 font-medium">Investment Platform</span>
            </div>
          </div>

          {/* Search Bar - HIDDEN on mobile (shown in row 2), visible on sm+ */}
          <div className="pointer-events-auto hidden sm:flex flex-1 max-w-md">
            <SearchBar
              compact
              onSearch={handleSearch}
              properties={properties}
              zones={zones}
              onPropertySelect={handlePropertySelect}
            />
          </div>

          {/* Zone Dropdown - always visible */}
          <div className="pointer-events-auto flex-1 sm:flex-none">
            <ZoneDropdown
              zones={zones}
              activeZone={activeZone}
              onZoneChange={handleZoneChange}
            />
          </div>

          {/* Language Switcher */}
          <div className="pointer-events-auto relative flex-shrink-0">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/90 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm border border-gray-200"
            >
              <span className="text-base sm:text-lg">{currentLang.flag}</span>
              <span className="font-medium hidden md:block text-sm">{currentLang.name}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
            </button>

            {isLangOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
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

        </div>

        {/* Row 2: Search Bar (ONLY visible on mobile) */}
        <div className="px-4 pb-2 sm:hidden pointer-events-auto">
          <SearchBar
            compact
            onSearch={handleSearch}
            properties={properties}
            zones={zones}
            onPropertySelect={handlePropertySelect}
          />
        </div>
      </header>

      {/* Main Map View */}
      <MapView
        activeZone={activeZone}
        properties={filteredProperties}
        onPropertySelect={handlePropertySelect}
        isLoading={isLoading}
      />

      {/* Property Detail Drawer */}
      {selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onClose={handlePropertyClose}
          onFutureView={() => setIsFutureViewOpen(true)}
        />
      )}

      {/* Future View Modal */}
      {isFutureViewOpen && selectedProperty && (
        <FutureView
          property={selectedProperty}
          onClose={() => setIsFutureViewOpen(false)}
        />
      )}

    </div>
  );
}

export default App;
