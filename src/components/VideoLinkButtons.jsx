import React from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Platform configurations
const PLATFORMS = {
    tiktok: {
        name: 'TikTok',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
            </svg>
        ),
        bgClass: 'bg-black',
        hoverClass: 'hover:bg-gray-800 hover:shadow-gray-500/30',
        translationKey: 'video.open_tiktok'
    },
    facebook: {
        name: 'Facebook',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        ),
        bgClass: 'bg-[#1877F2]',
        hoverClass: 'hover:bg-[#166fe5] hover:shadow-blue-500/30',
        translationKey: 'video.open_facebook'
    },
    youtube: {
        name: 'YouTube',
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
        bgClass: 'bg-[#FF0000]',
        hoverClass: 'hover:bg-[#cc0000] hover:shadow-red-500/30',
        translationKey: 'video.open_youtube'
    }
};

function VideoLinkButtons({ tiktokUrl, facebookUrl, youtubeUrl }) {
    const { t } = useTranslation();

    const links = [
        { platform: 'tiktok', url: tiktokUrl },
        { platform: 'facebook', url: facebookUrl },
        { platform: 'youtube', url: youtubeUrl }
    ].filter(link => link.url && link.url.trim() !== '');

    if (links.length === 0) return null;

    return (
        <div className="grid grid-cols-3 gap-2">
            {links.map(({ platform, url }) => {
                const config = PLATFORMS[platform];
                return (
                    <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`
                            py-3 px-2 rounded-xl font-bold text-sm
                            shadow-lg ${config.hoverClass}
                            hover:shadow-xl hover:scale-[1.02] transition-all
                            flex items-center justify-center gap-1.5
                            text-white
                            ${config.bgClass}
                        `}
                    >
                        {config.icon}
                        <span className="hidden sm:inline">{t(config.translationKey)}</span>
                    </a>
                );
            })}
        </div>
    );
}

export default VideoLinkButtons;
