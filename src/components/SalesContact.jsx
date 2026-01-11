import React from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Sales team contact info
const SALES_TEAM = [
    {
        name: 'K.Love',
        phone: '0892442468',
        lineId: '66892442468',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Love&backgroundColor=b6e3f4'
    },
    {
        name: 'K.Nut',
        phone: '0818652200',
        lineId: 'ampeera',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nut&backgroundColor=c0aede'
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
                    <div key={sales.name} className="flex gap-1">
                        <a
                            href={`tel:${formatPhoneForTel(sales.phone)}`}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            title={`${t('sales.call')} ${sales.name}`}
                        >
                            <Phone size={18} />
                        </a>
                        <a
                            href={getLineUrl(sales.lineId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#00B900] text-white rounded-lg hover:bg-[#009900] transition-colors"
                            title={`LINE ${sales.name}`}
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
                        key={sales.name}
                        className="bg-gray-50 rounded-xl p-4 flex flex-col items-center gap-3 border border-gray-100"
                    >
                        {/* Avatar */}
                        <img
                            src={sales.avatar}
                            alt={sales.name}
                            className="w-14 h-14 rounded-full bg-white border-2 border-gray-200"
                        />

                        {/* Name */}
                        <span className="font-semibold text-gray-900">{sales.name}</span>

                        {/* Buttons */}
                        <div className="flex gap-2 w-full">
                            <a
                                href={`tel:${formatPhoneForTel(sales.phone)}`}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
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
