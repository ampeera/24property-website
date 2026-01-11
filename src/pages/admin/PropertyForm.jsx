import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Table, ExternalLink } from 'lucide-react';

function PropertyForm() {
    const navigate = useNavigate();

    return (
        <div className="max-w-2xl mx-auto pt-10">
            <button
                onClick={() => navigate('/admin/properties')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Properties
            </button>

            <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-gray-100">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Table size={40} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Property Management
                </h1>

                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Property editing is now managed directly through Google Sheets to ensure data consistency.
                    Please use the link below to add, edit, or remove properties.
                </p>

                <a
                    href="https://docs.google.com/spreadsheets/d/1Js3Lsphz2VzofszRq1ghLXB4d2INBmiDIWHtXdgKvRk/edit?gid=681312581#gid=681312581"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-shadow shadow-sm hover:shadow-md"
                >
                    <ExternalLink size={20} />
                    Open Google Sheets
                </a>

                <div className="mt-8 pt-8 border-t border-gray-100 text-sm text-gray-400">
                    <p>Changes made in Google Sheets will reflect here automatically.</p>
                </div>
            </div>
        </div>
    );
}

export default PropertyForm;
