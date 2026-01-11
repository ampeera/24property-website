// Google OAuth2 Authentication Service
// สำหรับ Sign In กับ Google และขอ access token

const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
].join(' ');

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let tokenClient = null;
let accessToken = null;
let isInitialized = false;
let currentUser = null;
let authChangeCallbacks = [];

// Initialize from storage
const initFromStorage = () => {
    const storedToken = localStorage.getItem('google_access_token');
    const storedUser = localStorage.getItem('google_user');

    if (storedToken && storedUser) {
        accessToken = storedToken;
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
    // Return unsubscribe function
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
        localStorage.setItem('google_access_token', accessToken);
        localStorage.setItem('google_user', JSON.stringify(currentUser));
    } else {
        localStorage.removeItem('google_access_token');
        localStorage.removeItem('google_user');
    }

    authChangeCallbacks.forEach(cb => cb(authState));
};

// Initialize Google Identity Services
export const initGoogleAuth = () => {
    // Try to load from storage first
    initFromStorage();

    return new Promise((resolve, reject) => {
        if (isInitialized) {
            resolve(true);
            return;
        }

        // Check if google is loaded
        if (typeof google === 'undefined') {
            // Wait for google to load
            const checkGoogle = setInterval(() => {
                if (typeof google !== 'undefined' && google.accounts) {
                    clearInterval(checkGoogle);
                    initializeTokenClient(resolve, reject);
                }
            }, 100);

            // Timeout after 10 seconds
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
            callback: () => { }, // Will be overridden by signIn
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

        // Override callback for this sign-in attempt
        tokenClient.callback = async (response) => {
            if (response.error) {
                reject(new Error(response.error));
                return;
            }
            accessToken = response.access_token;

            // Wait for user info to be fetched
            const user = await fetchUserInfo();

            // Notify listeners
            notifyAuthChange();

            resolve({ accessToken, user });
        };

        // Request access token
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

// Sign out
export const signOut = () => {
    return new Promise((resolve) => {
        const clearLocal = () => {
            accessToken = null;
            currentUser = null;
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_user');
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

// Get current access token
export const getAccessToken = () => {
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

// Refresh token if needed (Google tokens expire after 1 hour)
export const refreshToken = () => {
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
            await fetchUserInfo();
            notifyAuthChange();
            resolve(accessToken);
        };

        tokenClient.requestAccessToken({ prompt: '' });
    });
};

export default {
    initGoogleAuth,
    signIn,
    signOut,
    getAccessToken,
    isSignedIn,
    getCurrentUser,
    refreshToken,
    onAuthChange
};

