import React, { useEffect, useState } from 'react';
import { Building2, LogIn, LogOut, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PropertyService } from '../../services/PropertyService';
import { initGoogleAuth, signIn, signOut, isSignedIn, getCurrentUser, onAuthChange } from '../../services/googleAuth';

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
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);

    // Initialize Google Auth
    useEffect(() => {
        const init = async () => {
            try {
                await initGoogleAuth();

                if (isSignedIn()) {
                    setUser(getCurrentUser());
                    setIsGoogleSignedIn(true);
                }

                const unsubscribe = onAuthChange((authState) => {
                    setIsGoogleSignedIn(authState.isSignedIn);
                    setUser(authState.user);
                    setAuthLoading(false);
                });

                setAuthLoading(false);
                return () => unsubscribe();
            } catch (err) {
                console.error('Auth init error:', err);
                setAuthLoading(false);
            }
        };
        init();
    }, []);

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

    const handleSignIn = async () => {
        try {
            const result = await signIn();
            setUser(result.user);
            setIsGoogleSignedIn(true);
            setAuthLoading(false);
        } catch (err) {
            console.error('Sign in failed:', err);
            setAuthLoading(false);
        }
    };

    const handleSignOut = () => {
        signOut();
        setUser(null);
        setIsGoogleSignedIn(false);
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ด</h1>
                    <p className="text-gray-500">ยินดีต้อนรับสู่ระบบจัดการ 24Property</p>
                </div>
            </div>

            {/* Google Sign In Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-gray-900 font-semibold mb-4">เชื่อมต่อ Google เพื่อแก้ไขข้อมูล</h3>

                {authLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="animate-spin" size={20} />
                        <span>กำลังตรวจสอบสถานะ...</span>
                    </div>
                ) : user || getCurrentUser() ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={user?.picture || getCurrentUser()?.picture}
                                alt=""
                                className="w-10 h-10 rounded-full"
                            />
                            <div>
                                <p className="font-medium text-gray-900">{user?.name || getCurrentUser()?.name}</p>
                                <p className="text-sm text-green-600">เชื่อมต่อแล้ว ✓</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut size={18} />
                            ออกจากระบบ Google
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <p className="text-gray-500 text-sm">
                            ลงชื่อเข้าใช้ Google เพื่อเพิ่ม/แก้ไขข้อมูลทรัพย์ในระบบ
                        </p>
                        <button
                            onClick={handleSignIn}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <LogIn size={18} />
                            Sign in with Google
                        </button>
                    </div>
                )}
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
                    <li>• <strong>เพิ่มทรัพย์ลงเว็บไซต์</strong> - ใช้ฟอร์มเพื่อเพิ่มทรัพย์ใหม่พร้อมรายละเอียดครบถ้วน</li>
                    <li>• <strong>รายการทรัพย์ในเว็บไซต์</strong> - ดูและแก้ไขข้อมูลทรัพย์ทั้งหมดในรูปแบบตาราง</li>
                    <li>• ต้อง <strong>Sign in with Google</strong> ก่อนจึงจะสามารถเพิ่มหรือแก้ไขข้อมูลได้</li>
                </ul>
            </div>
        </div>
    );
}

export default Dashboard;
