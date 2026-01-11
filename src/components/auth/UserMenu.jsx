import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, Heart, MessageSquare, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function UserMenu() {
    const { user, profile, signOut, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        setIsOpen(false);
    };

    if (!user) return null;

    const displayName = profile?.name || user.email?.split('@')[0] || 'User';
    const avatarUrl = profile?.avatar_url;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm border border-gray-200"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={displayName}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-blue-600" />
                    </div>
                )}
                <span className="font-medium text-sm hidden md:block max-w-[100px] truncate">
                    {displayName}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-semibold text-gray-900">{displayName}</p>
                        <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        {isAdmin && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                <Shield size={10} />
                                Admin
                            </span>
                        )}
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                            <Heart size={18} className="text-gray-400" />
                            รายการโปรด
                        </button>
                        <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                            <MessageSquare size={18} className="text-gray-400" />
                            การติดต่อของฉัน
                        </button>
                        <button className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-700">
                            <Settings size={18} className="text-gray-400" />
                            ตั้งค่าบัญชี
                        </button>
                    </div>

                    {/* Admin Link */}
                    {isAdmin && (
                        <div className="py-2 border-t border-gray-100">
                            <a
                                href="/admin"
                                className="w-full text-left px-4 py-2.5 hover:bg-purple-50 flex items-center gap-3 text-purple-700"
                            >
                                <Shield size={18} />
                                Admin Panel
                            </a>
                        </div>
                    )}

                    {/* Sign Out */}
                    <div className="border-t border-gray-100 pt-2">
                        <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2.5 hover:bg-red-50 flex items-center gap-3 text-red-600"
                        >
                            <LogOut size={18} />
                            ออกจากระบบ
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
