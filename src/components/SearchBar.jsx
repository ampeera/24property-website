import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, Sparkles, X, Clock, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Debounce hook
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

// LocalStorage key for recent searches
const RECENT_SEARCHES_KEY = '24property_recent_searches';
const MAX_RECENT_SEARCHES = 5;

function SearchBar({ onSearch, compact = false, properties = [], zones = [], onPropertySelect }) {
    const { t, i18n } = useTranslation();
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [zoneSuggestions, setZoneSuggestions] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);

    // Debounced query for filtering (150ms delay)
    const debouncedQuery = useDebounce(query, 150);

    const quickTags = [
        { label: t('search.near_tomorrowland'), icon: "🎵" },
        { label: t('search.price_under_15m'), icon: "💰" },
        { label: t('search.villa_potential'), icon: "🏠" },
    ];

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (saved) setRecentSearches(JSON.parse(saved));
        } catch (e) { /* ignore */ }
    }, []);

    // Save recent search
    const saveRecentSearch = useCallback((searchTerm) => {
        if (!searchTerm.trim()) return;
        setRecentSearches(prev => {
            const filtered = prev.filter(s => s.toLowerCase() !== searchTerm.toLowerCase());
            const updated = [searchTerm, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            try {
                localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            } catch (e) { /* ignore */ }
            return updated;
        });
    }, []);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper: get text in current language
    const getText = useCallback((obj) => {
        if (typeof obj === 'object' && obj !== null) {
            return obj[i18n.language] || obj['th'] || obj['en'] || '';
        }
        return obj || '';
    }, [i18n.language]);

    // Filter suggestions based on debounced query
    useEffect(() => {
        if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
            setSuggestions([]);
            setZoneSuggestions([]);
            return;
        }

        const q = debouncedQuery.toLowerCase().trim();

        // Match properties
        const matches = properties.filter(p => {
            const title = getText(p.title).toLowerCase();
            if (title.includes(q)) return true;

            // Match description  
            const desc = getText(p.description).toLowerCase();
            if (desc.includes(q)) return true;

            // Match zone name
            const zone = zones.find(z => z.id === p.zoneId);
            if (zone) {
                const zoneName = getText(zone.name).toLowerCase();
                if (zoneName.includes(q)) return true;
            }

            // Match price
            const priceStr = p.price?.toString() || '';
            if (priceStr.includes(q.replace(/,/g, ''))) return true;

            return false;
        }).slice(0, 5);

        setSuggestions(matches);

        // If no property matches, suggest matching zones
        if (matches.length === 0) {
            const matchingZones = zones.filter(z => {
                const name = getText(z.name).toLowerCase();
                return name.includes(q);
            }).slice(0, 3);
            setZoneSuggestions(matchingZones);
        } else {
            setZoneSuggestions([]);
        }
    }, [debouncedQuery, properties, zones, getText]);

    // Trigger search when debounced value changes
    useEffect(() => {
        if (onSearch) onSearch(debouncedQuery);
    }, [debouncedQuery, onSearch]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        setShowSuggestions(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowSuggestions(false);
        if (query.trim()) {
            saveRecentSearch(query.trim());
        }
        if (onSearch) onSearch(query);
    };

    const handleSuggestionClick = (property) => {
        setShowSuggestions(false);
        if (query.trim()) saveRecentSearch(query.trim());
        setQuery('');
        if (onSearch) onSearch('');
        if (onPropertySelect) onPropertySelect(property);
    };

    const handleRecentSearchClick = (searchTerm) => {
        setQuery(searchTerm);
        setShowSuggestions(false);
        if (onSearch) onSearch(searchTerm);
    };

    const handleClear = () => {
        setQuery('');
        setShowSuggestions(false);
        if (onSearch) onSearch('');
        inputRef.current?.focus();
    };

    const getPropertyTitle = (property) => getText(property.title) || 'Unknown';
    const getZoneName = (zoneId) => {
        const zone = zones.find(z => z.id === zoneId);
        return zone ? getText(zone.name) : '';
    };

    // Highlight matching text
    const highlightText = useCallback((text, query) => {
        if (!query || query.length < 2) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part)
                ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{part}</mark>
                : part
        );
    }, []);

    // Compact mode for header
    if (compact) {
        return (
            <div className="relative flex-1" ref={wrapperRef}>
                <form onSubmit={handleSubmit} className="flex items-center bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-gray-200 px-3 py-1.5 gap-2 min-w-[200px] max-w-[400px] flex-1">
                    <Sparkles size={16} className="text-blue-500 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder={t('search_placeholder')}
                        className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm font-medium min-w-0"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <button
                        type="submit"
                        className="bg-gray-900 hover:bg-black text-white p-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                        <Search size={14} />
                    </button>
                </form>

                {/* Autocomplete Dropdown */}
                {showSuggestions && (suggestions.length > 0 || zoneSuggestions.length > 0 || (!query && recentSearches.length > 0)) && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
                        {/* Recent Searches (when no query) */}
                        {!query && recentSearches.length > 0 && (
                            <>
                                <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-400 font-medium">
                                    <Clock size={12} />
                                    {t('search.recent') || 'ค้นหาล่าสุด'}
                                </div>
                                {recentSearches.map((term, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleRecentSearchClick(term)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                                    >
                                        <Search size={14} className="text-gray-400" />
                                        {term}
                                    </button>
                                ))}
                            </>
                        )}

                        {/* Property Suggestions */}
                        {suggestions.map((property) => (
                            <button
                                key={property.id}
                                onClick={() => handleSuggestionClick(property)}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                            >
                                {property.images?.[0] ? (
                                    <img
                                        src={property.images[0]}
                                        alt=""
                                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-gray-400 text-lg">🏠</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {highlightText(getPropertyTitle(property), query)}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {highlightText(getZoneName(property.zoneId), query)}
                                    </p>
                                    <p className="text-sm font-bold text-blue-600">
                                        {property.price?.toLocaleString()} {t('property.currency')}
                                    </p>
                                </div>
                            </button>
                        ))}

                        {/* Zone Suggestions (when no property matches) */}
                        {zoneSuggestions.length > 0 && (
                            <>
                                <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-400 font-medium border-t border-gray-100 mt-2 pt-2">
                                    <MapPin size={12} />
                                    {t('search.zones') || 'โซนที่เกี่ยวข้อง'}
                                </div>
                                {zoneSuggestions.map((zone) => (
                                    <button
                                        key={zone.id}
                                        onClick={() => {
                                            setQuery(getText(zone.name));
                                            setShowSuggestions(false);
                                            if (onSearch) onSearch(getText(zone.name));
                                        }}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                                    >
                                        <MapPin size={14} className="text-blue-500" />
                                        {highlightText(getText(zone.name), query)}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Full mode (floating at bottom)
    return (
        <div className="relative" ref={wrapperRef}>
            <div className="bg-white rounded-2xl shadow-xl p-3 border border-gray-200 transition-all hover:shadow-2xl">
                <form onSubmit={handleSubmit} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                        <Sparkles size={20} />
                    </div>

                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder={t('search_placeholder')}
                            className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-lg font-medium"
                        />
                    </div>

                    {query && (
                        <button type="button" onClick={handleClear} className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                            <X size={20} />
                        </button>
                    )}

                    <button
                        type="submit"
                        className="bg-gray-900 hover:bg-black text-white p-3 rounded-xl transition-colors"
                    >
                        <Search size={20} />
                    </button>
                </form>

                {/* Tags / Suggestions */}
                {!query && (
                    <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">{t('search.ask_ai')}:</span>
                        {quickTags.map((tag, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setQuery(tag.label);
                                    if (onSearch) onSearch(tag.label);
                                }}
                                className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors whitespace-nowrap flex items-center gap-1"
                            >
                                <span>{tag.icon}</span> {tag.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Autocomplete Dropdown for full mode */}
            {showSuggestions && (suggestions.length > 0 || zoneSuggestions.length > 0 || (!query && recentSearches.length > 0)) && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 max-h-80 overflow-y-auto">
                    {/* Recent Searches (when no query) */}
                    {!query && recentSearches.length > 0 && (
                        <>
                            <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-400 font-medium">
                                <Clock size={12} />
                                {t('search.recent') || 'ค้นหาล่าสุด'}
                            </div>
                            {recentSearches.map((term, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleRecentSearchClick(term)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                                >
                                    <Search size={14} className="text-gray-400" />
                                    {term}
                                </button>
                            ))}
                        </>
                    )}

                    {/* Property Suggestions */}
                    {suggestions.map((property) => (
                        <button
                            key={property.id}
                            onClick={() => handleSuggestionClick(property)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                        >
                            {property.images?.[0] ? (
                                <img
                                    src={property.images[0]}
                                    alt=""
                                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-gray-400 text-lg">🏠</span>
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {highlightText(getPropertyTitle(property), query)}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {highlightText(getZoneName(property.zoneId), query)}
                                </p>
                                <p className="text-sm font-bold text-blue-600">
                                    {property.price?.toLocaleString()} {t('property.currency')}
                                </p>
                            </div>
                        </button>
                    ))}

                    {/* Zone Suggestions (when no property matches) */}
                    {zoneSuggestions.length > 0 && (
                        <>
                            <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-400 font-medium border-t border-gray-100 mt-2 pt-2">
                                <MapPin size={12} />
                                {t('search.zones') || 'โซนที่เกี่ยวข้อง'}
                            </div>
                            {zoneSuggestions.map((zone) => (
                                <button
                                    key={zone.id}
                                    onClick={() => {
                                        setQuery(getText(zone.name));
                                        setShowSuggestions(false);
                                        if (onSearch) onSearch(getText(zone.name));
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                                >
                                    <MapPin size={14} className="text-blue-500" />
                                    {highlightText(getText(zone.name), query)}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default React.memo(SearchBar);
