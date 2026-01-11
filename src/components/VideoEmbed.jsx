import React, { useState } from 'react';
import { Play, ExternalLink, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Helper to detect video platform and extract ID
function parseVideoUrl(url) {
    if (!url) return null;

    // YouTube / YouTube Shorts
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
        return { platform: 'youtube', id: youtubeMatch[1] };
    }

    // TikTok
    const tiktokMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
    if (tiktokMatch) {
        return { platform: 'tiktok', id: tiktokMatch[1], url };
    }

    // TikTok short URL
    const tiktokShortMatch = url.match(/vm\.tiktok\.com\/([a-zA-Z0-9]+)/);
    if (tiktokShortMatch) {
        return { platform: 'tiktok', id: tiktokShortMatch[1], url };
    }

    // Facebook Reels / Videos
    const facebookMatch = url.match(/facebook\.com\/(?:reel|watch|[^/]+\/videos)\/(\d+)/);
    if (facebookMatch) {
        return { platform: 'facebook', id: facebookMatch[1], url };
    }

    // Generic video URL
    return { platform: 'unknown', url };
}

function VideoEmbed({ videoUrl, title = 'Property Video', compact = false }) {
    const { t } = useTranslation();
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState(false);

    const videoInfo = parseVideoUrl(videoUrl);

    if (!videoInfo) {
        return null;
    }

    // Render based on platform
    const renderEmbed = () => {
        switch (videoInfo.platform) {
            case 'youtube':
                return (
                    <iframe
                        width="100%"
                        height={compact ? "200" : "315"}
                        src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=${isPlaying ? 1 : 0}`}
                        title={title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="rounded-lg"
                    />
                );

            case 'tiktok':
                // TikTok requires their embed script, so we show a preview with link
                return (
                    <div className="relative bg-black rounded-lg overflow-hidden">
                        <div className={`flex flex-col items-center justify-center ${compact ? 'h-[200px]' : 'h-[315px]'} text-white`}>
                            <div className="w-16 h-16 bg-gradient-to-r from-[#69C9D0] to-[#EE1D52] rounded-full flex items-center justify-center mb-4">
                                <Video size={32} />
                            </div>
                            <p className="text-sm mb-4">TikTok Video</p>
                            <a
                                href={videoInfo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-colors"
                            >
                                <Play size={16} />
                                {t('video.watch_on_tiktok')}
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                );

            case 'facebook':
                // Facebook embed
                return (
                    <div className="relative bg-[#1877F2] rounded-lg overflow-hidden">
                        <div className={`flex flex-col items-center justify-center ${compact ? 'h-[200px]' : 'h-[315px]'} text-white`}>
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </div>
                            <p className="text-sm mb-4">Facebook Reel</p>
                            <a
                                href={videoInfo.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-white text-[#1877F2] rounded-full font-medium hover:bg-gray-100 transition-colors"
                            >
                                <Play size={16} />
                                {t('video.watch_on_facebook')}
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                );

            default:
                // Unknown platform - show link
                return (
                    <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                        <div className={`flex flex-col items-center justify-center ${compact ? 'h-[200px]' : 'h-[315px]'} text-white`}>
                            <Video size={48} className="mb-4 text-gray-400" />
                            <p className="text-sm mb-4 text-gray-400">{t('video.title')}</p>
                            <a
                                href={videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-full font-medium hover:bg-gray-100 transition-colors"
                            >
                                <Play size={16} />
                                {t('video.watch_video')}
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Video size={14} />
                {t('video.title')}
            </h4>
            {renderEmbed()}
        </div>
    );
}

export default VideoEmbed;
