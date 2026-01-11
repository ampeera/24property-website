import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    // Mock user for "admin" access since we are removing Supabase Auth
    // In a real read-only scenario, maybe no login is needed, or we just fake it.
    const [user, setUser] = useState({ id: 'admin', email: 'admin@24property.com' });
    const [profile, setProfile] = useState({ role: 'ADMIN', name: 'Admin' });
    const [loading, setLoading] = useState(false);

    const signUp = async () => ({ error: { message: 'Signup disabled' } });
    const signIn = async () => ({ data: { user }, error: null });
    const signOut = async () => {
        // setUser(null); // Optional: if we want to allow logout
        return { error: null };
    };
    const updateProfile = async () => ({ error: null });

    const isAdmin = true; // Always admin for now to allow viewing the panel

    const value = {
        user,
        profile,
        loading,
        isAdmin,
        signUp,
        signIn,
        signOut,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
