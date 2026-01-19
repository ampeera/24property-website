// Google OAuth2 Authentication Service
// สำหรับ Sign In กับ Google และขอ access token
// รองรับ auto-refresh token เพื่อไม่ต้อง login บ่อยๆ

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'email',
    'profile'
].join(' ');

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Storage keys
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'google_access_token',
    TOKEN_EXPIRY: 'google_token_expiry',
    USER: 'google_user'
};

let tokenClient = null;
let accessToken = null;
let tokenExpiry = null;
let isInitialized = false;
let currentUser = null;
let authChangeCallbacks = [];
let refreshPromise = null; // Prevent multiple simultaneous refreshes

// Token expires in 1 hour, we'll refresh 5 minutes before expiry
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

// Initialize from storage
const initFromStorage = () => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const storedExpiry = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

    if (storedToken && storedUser) {
        accessToken = storedToken;
        tokenExpiry = storedExpiry ? parseInt(storedExpiry) : null;
        try {
            currentUser = JSON.parse(storedUser);
        } catch (e) {
            console.error('Failed to parse stored user', e);
        }
    }
};

// Register callback for auth state changes
export const onAuthChange = (callback) => {
    authChangeCallbacks.push(callback);
    return () => {
        authChangeCallbacks = authChangeCallbacks.filter(cb => cb !== callback);
    };
};

// Notify all listeners of auth change
const notifyAuthChange = () => {
    const authState = {
        isSignedIn: accessToken !== null,
        user: currentUser,
        accessToken
    };

    // Persist state
    if (accessToken) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        if (tokenExpiry) {
            localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, tokenExpiry.toString());
        }
    } else {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
        localStorage.removeItem(STORAGE_KEYS.USER);
    }

    authChangeCallbacks.forEach(cb => cb(authState));
};

// Check if token needs refresh
const isTokenExpiredOrExpiring = () => {
    if (!tokenExpiry) return true;
    const now = Date.now();
    // Return true if token is expired or will expire within buffer time
    return now >= (tokenExpiry - TOKEN_REFRESH_BUFFER_MS);
};

// Initialize Google Identity Services
export const initGoogleAuth = () => {
    initFromStorage();

    return new Promise((resolve, reject) => {
        if (isInitialized) {
            resolve(true);
            return;
        }

        if (typeof google === 'undefined') {
            const checkGoogle = setInterval(() => {
                if (typeof google !== 'undefined' && google.accounts) {
                    clearInterval(checkGoogle);
                    initializeTokenClient(resolve, reject);
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkGoogle);
                reject(new Error('Google API failed to load'));
            }, 10000);
        } else {
            initializeTokenClient(resolve, reject);
        }
    });
};

const initializeTokenClient = (resolve, reject) => {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: () => { },
        });
        isInitialized = true;
        resolve(true);
    } catch (error) {
        reject(error);
    }
};

// Fetch current user info
const fetchUserInfo = async () => {
    if (!accessToken) return null;

    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        if (response.ok) {
            currentUser = await response.json();
            return currentUser;
        } else if (response.status === 401) {
            // Token is invalid, clear it
            console.log('[Auth] Token invalid, clearing...');
            accessToken = null;
            tokenExpiry = null;
            return null;
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
    return null;
};

// Sign in with Google
export const signIn = () => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Google Auth not initialized'));
            return;
        }

        tokenClient.callback = async (response) => {
            if (response.error) {
                reject(new Error(response.error));
                return;
            }
            accessToken = response.access_token;
            // Google tokens expire in 3600 seconds (1 hour)
            tokenExpiry = Date.now() + (response.expires_in * 1000);

            const user = await fetchUserInfo();
            notifyAuthChange();
            resolve({ accessToken, user });
        };

        // Request with consent to get refresh capability
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

// Sign out
export const signOut = () => {
    return new Promise((resolve) => {
        const clearLocal = () => {
            accessToken = null;
            tokenExpiry = null;
            currentUser = null;
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
            localStorage.removeItem(STORAGE_KEYS.USER);
            notifyAuthChange();
            console.log('Signed out successfully');
            resolve();
        };

        if (accessToken && typeof google !== 'undefined' && google.accounts) {
            try {
                google.accounts.oauth2.revoke(accessToken, clearLocal);
            } catch (e) {
                console.warn('Revoke failed, clearing local only', e);
                clearLocal();
            }
        } else {
            clearLocal();
        }
    });
};

// Silent token refresh (no popup if user already granted consent)
export const refreshToken = async () => {
    // If already refreshing, wait for that promise
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = new Promise((resolve, reject) => {
        if (!tokenClient) {
            refreshPromise = null;
            reject(new Error('Google Auth not initialized'));
            return;
        }

        console.log('[Auth] Refreshing access token silently...');

        tokenClient.callback = async (response) => {
            refreshPromise = null;

            if (response.error) {
                console.error('[Auth] Token refresh failed:', response.error);
                // If silent refresh fails, user needs to re-login
                reject(new Error(response.error));
                return;
            }

            accessToken = response.access_token;
            tokenExpiry = Date.now() + (response.expires_in * 1000);

            await fetchUserInfo();
            notifyAuthChange();

            console.log('[Auth] Token refreshed successfully, expires at:', new Date(tokenExpiry));
            resolve(accessToken);
        };

        // Empty prompt = silent refresh (no popup if consent was already given)
        tokenClient.requestAccessToken({ prompt: '' });
    });

    return refreshPromise;
};

// Get current access token (with auto-refresh if needed)
export const getAccessToken = () => {
    return accessToken;
};

// Get a valid access token, refreshing if necessary
export const getValidAccessToken = async () => {
    // If no token, can't refresh without user interaction
    if (!accessToken) {
        return null;
    }

    // If token is expired or expiring soon, try to refresh
    if (isTokenExpiredOrExpiring()) {
        try {
            console.log('[Auth] Token expired or expiring, attempting refresh...');
            await refreshToken();
        } catch (error) {
            console.error('[Auth] Failed to refresh token:', error);
            // Return null to indicate re-login needed
            return null;
        }
    }

    return accessToken;
};

// Check if user is signed in
export const isSignedIn = () => {
    return accessToken !== null;
};

// Get current user info
export const getCurrentUser = () => {
    return currentUser;
};

// Check if token is valid (not expired)
export const isTokenValid = () => {
    if (!accessToken || !tokenExpiry) return false;
    return Date.now() < tokenExpiry;
};

export default {
    initGoogleAuth,
    signIn,
    signOut,
    getAccessToken,
    getValidAccessToken,
    isSignedIn,
    getCurrentUser,
    refreshToken,
    onAuthChange,
    isTokenValid
};
