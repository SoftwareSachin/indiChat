import { useState } from "react";
import { useLocation } from "wouter";
import { 
  MessageSquare, 
  Settings, 
  LogOut, 
  User, 
  Globe, 
  Bell,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface AppSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AppSidebar({ isOpen = true, onToggle }: AppSidebarProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

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
      icon: MessageSquare,
      label: "Rooms",
      href: "/rooms",
      active: location === "/rooms",
    },
    {
      icon: Bell,
      label: "Notifications",
      href: "#",
      active: false,
      badge: 3,
    },
    {
      icon: Settings,
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
        "flex flex-col h-screen bg-surface-container border-r border-outline-variant transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
      data-testid="app-sidebar"
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-outline-variant">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="title-large text-on-surface">Xchat</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="icon-button"
          data-testid="button-toggle-sidebar"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Profile Section */}
      <div className="p-4 border-b border-outline-variant">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-highest transition-colors",
                isCollapsed && "justify-center"
              )}
              data-testid="button-profile-menu"
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground title-medium">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <p className="title-small text-on-surface">{user.username}</p>
                  <p className="label-small text-on-surface-variant">
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

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              onClick={() => item.href !== "#" && setLocation(item.href)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative",
                item.active
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-container-highest",
                isCollapsed && "justify-center"
              )}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && (
                <span className="label-large flex-1 text-left">
                  {item.label}
                </span>
              )}
              {!isCollapsed && item.badge && (
                <span className="bg-error text-on-error rounded-full w-6 h-6 flex items-center justify-center label-small">
                  {item.badge}
                </span>
              )}
              {isCollapsed && item.badge && (
                <span className="absolute -top-1 -right-1 bg-error text-on-error rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-outline-variant space-y-1">
        <button
          onClick={() => setLocation("/settings")}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors",
            isCollapsed && "justify-center"
          )}
          data-testid="nav-settings-footer"
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span className="label-large">Settings</span>}
        </button>
      </div>
    </aside>
  );
}
