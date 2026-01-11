import React, { useEffect, useState } from 'react';
import { Search, Check, X, Eye, MessageSquare } from 'lucide-react';
import { InquiryService } from '../../services/InquiryService';

function InquiryList() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedInquiry, setSelectedInquiry] = useState(null);

    useEffect(() => {
        loadInquiries();
    }, []);

    async function loadInquiries() {
        try {
            const data = await InquiryService.getAllInquiries();
            setInquiries(data || []);
        } catch (error) {
            console.error('Error loading inquiries:', error);
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(id, status) {
        try {
            await InquiryService.updateInquiryStatus(id, status);

            setInquiries(inquiries.map(i =>
                i.id === id ? { ...i, status } : i
            ));
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    }

    const filteredInquiries = inquiries.filter(inquiry => {
        const matchesSearch =
            inquiry.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inquiry.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inquiry.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getPropertyTitle = (property) => {
        if (!property) return 'Unknown';
        return typeof property.title === 'object'
            ? property.title.th || property.title.en
            : property.title;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
                <p className="text-gray-500">{inquiries.length} total inquiries</p>
                <p className="text-xs text-orange-500 mt-1">Note: Inquiries are currently disabled/mocked due to database migration.</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by message or user..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Inquiries Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Property
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Message
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredInquiries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p>{searchTerm || statusFilter !== 'all' ? 'No inquiries match your filter' : 'No inquiries found'}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredInquiries.map((inquiry) => (
                                    <tr key={inquiry.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {inquiry.user?.name || 'Anonymous'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {inquiry.user?.email}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-900 truncate max-w-[150px]">
                                                {getPropertyTitle(inquiry.property)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-600 truncate max-w-[200px]">
                                                {inquiry.message}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {inquiry.created_at}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800">
                                                {inquiry.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedInquiry(inquiry)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal code can remain or be simplified, but standard structure is fine for empty list */}
        </div>
    );
}

export default InquiryList;
