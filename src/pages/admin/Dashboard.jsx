import React, { useEffect, useState } from 'react';
import { Building2, MessageSquare, Users, Table } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PropertyService } from '../../services/PropertyService';

function StatCard({ icon: Icon, label, value, color, link }) {
    const content = (
        <div className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${color} hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
                    <Icon size={24} className={color.replace('border-', 'text-')} />
                </div>
            </div>
        </div>
    );

    return link ? <Link to={link}>{content}</Link> : content;
}

function Dashboard() {
    const [stats, setStats] = useState({
        properties: 0,
        inquiries: 0,
        users: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            // Fetch properties from Sheet
            const properties = await PropertyService.getAllProperties();

            // Inquiries and Users are disabled for now (removed Supabase)
            // You could implement fetching inquiries from another Sheet if needed.

            setStats({
                properties: properties.length || 0,
                inquiries: 0,
                users: 0
            });

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
                    <p className="text-gray-500">ยินดีต้อนรับสู่ระบบจัดการ 24Property</p>
                </div>
                <a
                    href="https://docs.google.com/spreadsheets/d/1Js3Lsphz2VzofszRq1ghLXB4d2INBmiDIWHtXdgKvRk/edit?gid=681312581#gid=681312581"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                    <Table size={20} />
                    จัดการข้อมูลใน Google Sheets
                </a>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon={Building2}
                    label="จำนวนทรัพย์ทั้งหมด"
                    value={stats.properties}
                    color="border-blue-500"
                    link="/admin/properties"
                />
                <StatCard
                    icon={MessageSquare}
                    label="การติดต่อ"
                    value={stats.inquiries}
                    color="border-green-500"
                    link="/admin/inquiries"
                />
                <StatCard
                    icon={Users}
                    label="ผู้ใช้งาน"
                    value={stats.users}
                    color="border-purple-500"
                    link="/admin/users"
                />
            </div>

            {/* Hint */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h3 className="text-blue-900 font-semibold mb-2">หมายเหตุการจัดการข้อมูล</h3>
                <p className="text-blue-700 text-sm">
                    ระบบจัดการนี้อยู่ในโหมด<strong>อ่านอย่างเดียว</strong> ข้อมูลทรัพย์ทั้งหมดจัดการผ่าน Google Sheets โดยตรง
                    คลิก "จัดการข้อมูลใน Google Sheets" เพื่อแก้ไขข้อมูล
                </p>
            </div>
        </div>
    );
}

export default Dashboard;
