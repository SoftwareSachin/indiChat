// Auth manager to handle cross-tab authentication issues
export class AuthManager {
  private static instance: AuthManager;
  private currentUserId: string | null = null;
  private storageListener: ((e: StorageEvent) => void) | null = null;

  private constructor() {
    this.initializeCurrentUser();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private initializeCurrentUser() {
    const user = this.getStoredUser();
    this.currentUserId = user?.id || null;
  }

  private getStoredUser() {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  setAuthData(token: string, user: any) {
    // Generate a unique key for this user's session
    const sessionKey = `session_${user.id}`;
    
    // Store the token and user with a session-specific key
    localStorage.setItem(sessionKey, JSON.stringify({ token, user, timestamp: Date.now() }));
    
    // Also store in the default location for backward compatibility
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    
    this.currentUserId = user.id;
  }

  getAuthData(): { token: string | null; user: any } {
    const token = localStorage.getItem("token");
    const user = this.getStoredUser();
    
    // Check if the stored user matches the current user
    if (this.currentUserId && user && user.id !== this.currentUserId) {
      // Session was hijacked by another user, clear it
      return { token: null, user: null };
    }
    
    return { token, user };
  }

  // Listen for storage changes from other tabs
  startListening(onSessionChange: () => void) {
    this.storageListener = (e: StorageEvent) => {
      // Check if the token or user changed
      if (e.key === "token" || e.key === "user") {
        const newUser = this.getStoredUser();
        
        // If another user logged in, notify this tab
        if (newUser && newUser.id !== this.currentUserId) {
          onSessionChange();
        }
      }
    };
    
    window.addEventListener("storage", this.storageListener);
  }

  stopListening() {
    if (this.storageListener) {
      window.removeEventListener("storage", this.storageListener);
      this.storageListener = null;
    }
  }

  clearAuth() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.currentUserId = null;
  }
}
