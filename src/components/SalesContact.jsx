import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Sales team contact info
const SALES_TEAM = [
    {
        nameKey: 'sales.si_name',
        phone: '0930976723',
        lineId: 'si24property',
        avatar: '/images/sales/si.png'
    },
    {
        nameKey: 'sales.nut_name',
        phone: '0930975722',
        lineId: 'nut24property',
        avatar: '/images/sales/nut.png'
    }
];

function SalesContact({ compact = false }) {
    const { t } = useTranslation();

    const formatPhoneForTel = (phone) => {
        // Convert 0892442468 to +66892442468
        return '+66' + phone.slice(1);
    };

    const getLineUrl = (lineId) => {
        return `https://line.me/ti/p/~${lineId}`;
    };

    if (compact) {
        // Compact view for small spaces
        return (
            <div className="flex gap-2">
                {SALES_TEAM.map((sales) => (
                    <div key={sales.nameKey} className="flex gap-1">
                        <a
                            href={`tel:${formatPhoneForTel(sales.phone)}`}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            title={`${t('sales.call')} ${t(sales.nameKey)}`}
                        >
                            <Phone size={18} />
                        </a>
                        <a
                            href={getLineUrl(sales.lineId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#00B900] text-white rounded-lg hover:bg-[#009900] transition-colors"
                            title={`LINE ${t(sales.nameKey)}`}
                        >
                            <MessageCircle size={18} />
                        </a>
                    </div>
                ))}
            </div>
        );
    }

    // Full view with names and avatars
    return (
        <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {t('sales.contact_sales')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
                {SALES_TEAM.map((sales) => (
                    <div
                        key={sales.nameKey}
                        className="bg-gray-50 rounded-xl p-4 flex flex-col items-center gap-3 border border-gray-100"
                    >
                        {/* Avatar */}
                        <img
                            src={sales.avatar}
                            alt={t(sales.nameKey)}
                            className="w-14 h-14 rounded-full bg-white border-2 border-gray-200"
                        />

                        {/* Name */}
                        <span className="font-semibold text-gray-900">{t(sales.nameKey)}</span>

                        {/* Buttons */}
                        <div className="flex gap-2 w-full">
                            <a
                                href={`tel:${formatPhoneForTel(sales.phone)}`}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                            >
                                <Phone size={14} />
                                {t('sales.call')}
                            </a>
                            <a
                                href={getLineUrl(sales.lineId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#00B900] text-white rounded-lg hover:bg-[#009900] transition-colors text-sm font-medium"
                            >
                                <MessageCircle size={14} />
                                LINE
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default SalesContact;
