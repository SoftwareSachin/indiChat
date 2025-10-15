import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Settings, 
  LogOut, 
  User, 
  Bell,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { AuthManager } from "@/lib/auth-manager";
import { useTheme } from "@/lib/theme-provider";
import { cn } from "@/lib/utils";
import { socket } from "@/lib/socket";

interface AppSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ isOpen = true, onToggle }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (user?.id) {
      socket.emit("user:identify", { userId: user.id });
    }
  }, [user?.id]);

  const fetchNotificationCount = async () => {
    if (!token) return;
    
    try {
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const unreadCount = data.filter((n: any) => !n.isRead).length;
        setNotificationCount(unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
  }, [token]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotificationCount();
      }
    };

    const handleFocus = () => {
      fetchNotificationCount();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token]);

  useEffect(() => {
    const handleNewNotification = () => {
      setNotificationCount(prev => prev + 1);
    };

    const handleNotificationRead = () => {
      fetchNotificationCount();
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("notification:read", handleNotificationRead);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("notification:read", handleNotificationRead);
    };
  }, [token]);

  const handleLogout = () => {
    const authManager = AuthManager.getInstance();
    authManager.clearAuth();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
    setLocation("/auth");
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    onToggle?.();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navItems = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      label: "Rooms",
      href: "/rooms",
      active: location === "/rooms",
    },
    {
      icon: <Bell className="w-5 h-5" />,
      label: "Notifications",
      href: "/notifications",
      active: location === "/notifications",
      badge: notificationCount > 0 ? notificationCount : undefined,
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: "Settings",
      href: "/settings",
      active: location === "/settings",
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!user) return null;

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-surface dark:bg-surface border-r border-outline-variant transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
      data-testid="app-sidebar"
    >
      <div className="flex items-center justify-between p-4 border-b border-outline-variant">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-primary" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                />
              </svg>
            </div>
            <span className="text-lg font-semibold text-on-surface">XChat</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-9 w-9"
          data-testid="button-toggle-sidebar"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>

      <div className="p-3 border-b border-outline-variant">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-container-high dark:hover:bg-surface-container-high transition-colors",
                isCollapsed && "justify-center"
              )}
              data-testid="button-profile-menu"
            >
              <Avatar className="w-9 h-9 shrink-0">
                {user.profileImage ? (
                  <AvatarImage src={user.profileImage} alt={user.username} />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {getInitials(user.username)}
                  </AvatarFallback>
                )}
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-on-surface truncate">{user.username}</p>
                  <p className="text-xs text-on-surface-variant">
                    {user.preferredLanguage?.toUpperCase() || "EN"}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setLocation("/profile")}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLocation("/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTheme}>
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 mr-2" />
                  Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 mr-2" />
                  Dark Mode
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-error">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          return (
            <button
              key={item.href}
              onClick={() => item.href !== "#" && setLocation(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative text-sm font-medium",
                item.active
                  ? "bg-primary/10 dark:bg-primary/20 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-high",
                isCollapsed && "justify-center"
              )}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              {item.icon}
              {!isCollapsed && (
                <span className="flex-1 text-left">
                  {item.label}
                </span>
              )}
              {!isCollapsed && item.badge && (
                <span className="bg-error text-on-error rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-medium">
                  {item.badge}
                </span>
              )}
              {isCollapsed && item.badge && (
                <span className="absolute -top-1 -right-1 bg-error text-on-error rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-outline-variant">
        <button
          onClick={toggleTheme}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high dark:hover:bg-surface-container-high transition-colors text-sm font-medium",
            isCollapsed && "justify-center"
          )}
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
          {!isCollapsed && (
            <span>
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
