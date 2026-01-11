import React, { useState } from 'react';
import { X, Send, Loader2, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { InquiryService } from '../services/InquiryService';

export default function InquiryForm({ property, isOpen, onClose }) {
    const { t, i18n } = useTranslation();
    const { user, profile } = useAuth();

    const [formData, setFormData] = useState({
        name: profile?.name || '',
        email: user?.email || '',
        phone: profile?.phone || '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await InquiryService.createInquiry({
                propertyId: property.id,
                userId: user?.id || null,
                ...formData
            });
            setSuccess(true);
        } catch (err) {
            setError(err.message || t('inquiry.error_generic'));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const title = property.title?.[i18n.language] || property.title?.th || property.title?.en || 'Property';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-6 text-white">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <h2 className="text-xl font-bold">{t('inquiry.contact_owner')}</h2>
                    <p className="text-orange-100 mt-1 text-sm truncate">{title}</p>
                </div>

                {success ? (
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('inquiry.sent_success')}</h3>
                        <p className="text-gray-600 mb-4">
                            {t('inquiry.will_contact')}
                        </p>
                        <button
                            onClick={onClose}
                            className="py-2 px-6 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            {t('inquiry.close')}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('inquiry.name_label')} *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    placeholder={t('inquiry.name_placeholder')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('inquiry.email_label')}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        placeholder={t('inquiry.email_label')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('inquiry.phone_label')} *
                                </label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        placeholder="08x-xxx-xxxx"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('inquiry.message_label')}
                            </label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-3 text-gray-400" size={18} />
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
                                    placeholder={t('inquiry.message_placeholder')}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    {t('inquiry.sending')}
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    {t('inquiry.send')}
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
