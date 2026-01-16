import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
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
        properties: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            const properties = await PropertyService.getAllProperties();
            setStats({
                properties: properties.length || 0
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
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-6">
                <StatCard
                    icon={Building2}
                    label="จำนวนทรัพย์ทั้งหมด"
                    value={stats.properties}
                    color="border-blue-500"
                    link="/admin/spreadsheet"
                />
            </div>

            {/* Hint */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h3 className="text-blue-900 font-semibold mb-2">วิธีใช้งานระบบ</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                    <li>• <strong>ค้นหาทรัพย์ใหม่</strong> - ถ่ายรูปป้ายประกาศหน้างานพร้อมบันทึกพิกัด GPS</li>
                    <li>• <strong>รายการค้นหาทรัพย์ใหม่</strong> - ดูรายการทรัพย์ที่ถ่ายไว้</li>
                    <li>• <strong>เพิ่มทรัพย์ลงเว็บไซต์</strong> - ใช้ฟอร์มเพื่อเพิ่มทรัพย์ใหม่พร้อมรายละเอียดครบถ้วน</li>
                    <li>• <strong>รายการทรัพย์ในเว็บไซต์</strong> - ดูและแก้ไขข้อมูลทรัพย์ทั้งหมดในรูปแบบตาราง</li>
                </ul>
            </div>
        </div>
    );
}

export default Dashboard;
