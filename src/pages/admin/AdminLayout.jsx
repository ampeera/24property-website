import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    MessageSquare,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Table2,
    PlusCircle,
    Camera
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'แดชบอร์ด', end: true },
    { path: '/admin/properties/new', icon: PlusCircle, label: 'เพิ่มทรัพย์ลงเว็บไซต์' },
    { path: '/admin/spreadsheet', icon: Table2, label: 'รายการทรัพย์ในเว็บไซต์' },
    { path: '/admin/scout', icon: Camera, label: 'ค้นหาทรัพย์ใหม่' },
];

function AdminLayout() {
    const { user, signOut, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    // Debug: log auth state
    console.log('AdminLayout - user:', user, 'loading:', loading);

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Redirect if not logged in
    if (!user) {
        console.log('AdminLayout - No user, redirecting to login');
        return <Navigate to="/admin/login" replace />;
    }

    // For now, allow any logged-in user to access admin
    // In production, check user.role === 'admin'

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-gray-900 text-white
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
                    <h1 className="text-xl font-bold">24Property</h1>
                    <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">Admin</span>
                    <button
                        className="lg:hidden text-gray-400 hover:text-white"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }
                            `}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 px-4 py-2">
                        <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-lg font-bold">
                            {user.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.email}</p>
                            <p className="text-xs text-gray-500">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full mt-2 flex items-center gap-3 px-4 py-2 text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
                    <button
                        className="lg:hidden text-gray-600 hover:text-gray-900"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                    <div className="text-sm text-gray-500">
                        Welcome back, <span className="font-semibold text-gray-900">{user.email}</span>
                    </div>
                    <a
                        href="/"
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        ← Back to Site
                    </a>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;
