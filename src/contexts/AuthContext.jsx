import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    initGoogleAuth,
    signIn as googleSignIn,
    signOut as googleSignOut,
    getCurrentUser,
    getAccessToken,
    onAuthChange
} from '../services/googleAuth';

const AuthContext = createContext({});

// Session storage key
const SESSION_KEY = 'admin_session';
const SESSION_EXPIRY_KEY = 'admin_session_expiry';

// Get allowed admin emails from env (comma-separated)
const getAllowedEmails = () => {
    const emails = import.meta.env.VITE_ADMIN_EMAILS || '';
    return emails.split(',').map(e => e.trim().toLowerCase()).filter(e => e);
};

// Get session duration from env (default 30 days)
const getSessionDurationMs = () => {
    const days = parseInt(import.meta.env.VITE_SESSION_DURATION_DAYS) || 30;
    return days * 24 * 60 * 60 * 1000;
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
    const [googleAuthReady, setGoogleAuthReady] = useState(false);

    // Initialize Google Auth and check for existing session
    useEffect(() => {
        const init = async () => {
            try {
                // Initialize Google Auth
                await initGoogleAuth();
                setGoogleAuthReady(true);

                // Check for existing session
                const sessionData = localStorage.getItem(SESSION_KEY);
                const sessionExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);

                if (sessionData && sessionExpiry) {
                    const expiryTime = parseInt(sessionExpiry);
                    const now = Date.now();

                    if (now < expiryTime) {
                        // Session is still valid
                        const userData = JSON.parse(sessionData);
                        setUser(userData);
                        setProfile({ role: 'ADMIN', name: userData.name || 'Admin' });
                    } else {
                        // Session expired, clear it
                        clearSession();
                    }
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            }
            setLoading(false);
        };

        init();

        // Listen for Google auth changes
        const unsubscribe = onAuthChange((authState) => {
            if (!authState.isSignedIn && user) {
                // Google signed out, clear admin session too
                clearSession();
                setUser(null);
                setProfile(null);
            }
        });

        return () => unsubscribe();
    }, []);

    const clearSession = () => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_EXPIRY_KEY);
    };

    const signUp = async () => ({ error: { message: 'Signup disabled for admin panel' } });

    // Sign in with Google
    const signIn = async () => {
        try {
            console.log('[Auth] Starting Google Sign-In...');

            // Trigger Google Sign-In
            const result = await googleSignIn();
            console.log('[Auth] Google Sign-In result:', result);

            if (!result || !result.user) {
                console.error('[Auth] No user in result');
                return {
                    data: null,
                    error: { message: 'ไม่สามารถเข้าสู่ระบบ Google ได้' }
                };
            }

            const googleUser = result.user;
            const userEmail = googleUser.email?.toLowerCase();
            console.log('[Auth] User email:', userEmail);

            // Check if email is in allowed list
            const allowedEmails = getAllowedEmails();
            console.log('[Auth] Allowed emails:', allowedEmails);

            if (allowedEmails.length > 0 && !allowedEmails.includes(userEmail)) {
                console.error('[Auth] Email not in whitelist');
                // Sign out from Google since not authorized
                await googleSignOut();
                return {
                    data: null,
                    error: { message: `อีเมล ${googleUser.email} ไม่ได้รับอนุญาตให้เข้าใช้งาน Admin` }
                };
            }

            // Create user data
            const userData = {
                id: googleUser.id,
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture
            };
            console.log('[Auth] Login successful:', userData.email);

            // Save session to localStorage
            const expiryTime = Date.now() + getSessionDurationMs();
            localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
            localStorage.setItem(SESSION_EXPIRY_KEY, expiryTime.toString());

            setUser(userData);
            setProfile({ role: 'ADMIN', name: userData.name });

            return { data: { user: userData }, error: null };
        } catch (error) {
            console.error('[Auth] Sign in error:', error);
            return {
                data: null,
                error: { message: error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }
            };
        }
    };

    const signOut = async () => {
        try {
            // Sign out from Google
            await googleSignOut();
        } catch (error) {
            console.error('Google sign out error:', error);
        }

        // Clear local session
        clearSession();
        setUser(null);
        setProfile(null);

        return { error: null };
    };

    const updateProfile = async () => ({ error: null });

    const isAdmin = !!user;

    // Check if Google is authenticated (for API calls)
    const isGoogleAuthenticated = () => {
        return !!getAccessToken();
    };

    const value = {
        user,
        profile,
        loading,
        isAdmin,
        googleAuthReady,
        signUp,
        signIn,
        signOut,
        updateProfile,
        isGoogleAuthenticated,
        getAccessToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
