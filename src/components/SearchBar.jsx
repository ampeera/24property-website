import React, { useState } from 'react';
import { Search, Mic, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function SearchBar({ onSearch, compact = false }) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');

    const suggestions = [
        { label: t('search.near_tomorrowland'), icon: "🎵" },
        { label: t('search.price_under_15m'), icon: "💰" },
        { label: t('search.villa_potential'), icon: "🏠" },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSearch) onSearch(query);
    };

    // Compact mode for header
    if (compact) {
        return (
            <form onSubmit={handleSubmit} className="flex items-center bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-gray-200 px-3 py-1.5 gap-2 min-w-[200px] max-w-[400px] flex-1">
                <Sparkles size={16} className="text-blue-500 flex-shrink-0" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className="flex-1 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400 text-sm font-medium min-w-0"
                />
                <button
                    type="submit"
                    className="bg-gray-900 hover:bg-black text-white p-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                    <Search size={14} />
                </button>
            </form>
        );
    }

    // Full mode (floating at bottom)
    return (
        <div className="bg-white rounded-2xl shadow-xl p-3 border border-gray-200 transition-all hover:shadow-2xl">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <Sparkles size={20} />
                </div>

                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('search_placeholder')}
                        className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-lg font-medium"
                    />
                </div>

                <button type="button" className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100">
                    <Mic size={20} />
                </button>

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
                    {suggestions.map((tag, idx) => (
                        <button
                            key={idx}
                            onClick={() => setQuery(tag.label)}
                            className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors whitespace-nowrap flex items-center gap-1"
                        >
                            <span>{tag.icon}</span> {tag.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default React.memo(SearchBar);
