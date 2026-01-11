// InquiryService.js - Simplified for Google Sheets migration
// Supabase has been removed. Inquiries are currently handling locally or disabled.

export const InquiryService = {

    createInquiry: async (inquiry) => {
        // Mock success to prevent app crash
        console.log('Inquiry received (Backend disabled):', inquiry);
        return { id: 'mock-id', ...inquiry, created_at: new Date().toISOString() };
    },

    getUserInquiries: async (userId) => {
        return [];
    },

    // Admin functions
    getAllInquiries: async () => {
        return [];
    },

    updateInquiryStatus: async (id, status) => {
        return { id, status };
    }
};
