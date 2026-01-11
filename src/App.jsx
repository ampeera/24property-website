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

  const [isLangOpen, setIsLangOpen] = useState(false);
  const [zones, setZones] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [showAllZones, setShowAllZones] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isFutureViewOpen, setIsFutureViewOpen] = useState(false);

  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
  };

  const handleZoneChange = (zone) => {
    if (zone === null) {
      // Show all zones
      setShowAllZones(true);
      setActiveZone(null);
    } else {
      setShowAllZones(false);
      setActiveZone(zone);
    }
    setSelectedProperty(null);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 font-sans text-gray-900 relative">

      {/* Minimal Header */}
      <header className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
        <div className="px-4 h-16 flex items-center gap-3">

          {/* Logo */}
          <div className="pointer-events-auto bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-sm border border-white/20 flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-blue-500/30 shadow-lg">
              AI
            </div>
            <div className="hidden sm:block">
              <span className="block text-sm font-bold font-thai text-blue-900 leading-none">24Property</span>
              <span className="block text-[9px] text-gray-500 font-medium">Investment Platform</span>
            </div>
          </div>

          {/* Search Bar (Compact) */}
          <div className="pointer-events-auto flex-1 max-w-md">
            <SearchBar compact onSearch={(q) => console.log('Searching:', q)} />
          </div>

          {/* Zone Dropdown */}
          <div className="pointer-events-auto">
            <ZoneDropdown
              zones={zones}
              activeZone={activeZone}
              showAllZones={showAllZones}
              onZoneChange={handleZoneChange}
            />
          </div>

          {/* Language Switcher */}
          <div className="pointer-events-auto relative">
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm border border-gray-200"
            >
              <span className="text-lg">{currentLang.flag}</span>
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
      </header>

      {/* Main Map View */}
      <MapView
        activeZone={showAllZones ? null : activeZone}
        properties={properties}
        onPropertySelect={handlePropertySelect}
        isLoading={isLoading}
        showAllZones={showAllZones}
      />

      {/* Property Detail Drawer */}
      {selectedProperty && (
        <PropertyDetail
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
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
