import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

// Session storage key
const SESSION_KEY = 'admin_session';
const SESSION_EXPIRY_KEY = 'admin_session_expiry';

// Get session duration from env (default 30 days)
const getSessionDurationMs = () => {
    const days = parseInt(import.meta.env.VITE_SESSION_DURATION_DAYS) || 30;
    return days * 24 * 60 * 60 * 1000; // Convert days to milliseconds
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const checkSession = () => {
            try {
                const sessionData = localStorage.getItem(SESSION_KEY);
                const sessionExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);

                if (sessionData && sessionExpiry) {
                    const expiryTime = parseInt(sessionExpiry);
                    const now = Date.now();

                    if (now < expiryTime) {
                        // Session is still valid
                        const userData = JSON.parse(sessionData);
                        setUser(userData);
                        setProfile({ role: 'ADMIN', name: 'Admin' });
                    } else {
                        // Session expired, clear it
                        localStorage.removeItem(SESSION_KEY);
                        localStorage.removeItem(SESSION_EXPIRY_KEY);
                    }
                }
            } catch (error) {
                console.error('Error checking session:', error);
                localStorage.removeItem(SESSION_KEY);
                localStorage.removeItem(SESSION_EXPIRY_KEY);
            }
            setLoading(false);
        };

        checkSession();
    }, []);

    const signUp = async () => ({ error: { message: 'Signup disabled for admin panel' } });

    const signIn = async (username, password) => {
        // Get credentials from environment variables
        const adminUsername = import.meta.env.VITE_ADMIN_USERNAME;
        const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

        // Validate credentials
        if (username === adminUsername && password === adminPassword) {
            const userData = { id: 'admin', email: `${username}@24property.com`, username };

            // Save session to localStorage
            const expiryTime = Date.now() + getSessionDurationMs();
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());

            setUser(userData);
            setProfile({ role: 'ADMIN', name: 'Admin' });

            return { data: { user: userData }, error: null };
        } else {
            return {
                data: null,
                error: { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
            };
        }
    };

    const signOut = async () => {
        // Clear session from localStorage
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_EXPIRY_KEY);

        setUser(null);
        setProfile(null);

        return { error: null };
    };

    const updateProfile = async () => ({ error: null });

    const isAdmin = !!user;

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
