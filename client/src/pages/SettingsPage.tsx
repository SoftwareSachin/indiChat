import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Moon, Sun, Globe, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/lib/theme-provider";
import { AppSidebar } from "@/components/AppSidebar";

export default function SettingsPage() {
  const [, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(true);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user.id) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/rooms")}
              className="h-9 w-9"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-on-background">Settings</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                Customize your chat experience
              </p>
            </div>
          </div>

          <div className="bg-surface dark:bg-surface border border-outline-variant rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-primary" />
              ) : (
                <Sun className="w-5 h-5 text-primary" />
              )}
              <h2 className="text-lg font-semibold text-on-surface">Appearance</h2>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-on-surface">Dark Mode</Label>
                <p className="text-xs text-on-surface-variant">
                  Switch between light and dark theme
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                data-testid="switch-theme"
              />
            </div>
          </div>

          <div className="bg-surface dark:bg-surface border border-outline-variant rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-on-surface">Translation</h2>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-on-surface">Auto-Translate Messages</Label>
                <p className="text-xs text-on-surface-variant">
                  Automatically translate incoming messages to your preferred language
                </p>
              </div>
              <Switch
                checked={autoTranslate}
                onCheckedChange={setAutoTranslate}
                data-testid="switch-auto-translate"
              />
            </div>
          </div>

          <div className="bg-surface dark:bg-surface border border-outline-variant rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-on-surface">Notifications</h2>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-outline-variant">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-on-surface">Enable Notifications</Label>
                <p className="text-xs text-on-surface-variant">
                  Receive notifications for new messages
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
                data-testid="switch-notifications"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-on-surface">Sound Notifications</Label>
                <p className="text-xs text-on-surface-variant">
                  Play sound when receiving messages
                </p>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
                data-testid="switch-sound"
              />
            </div>
          </div>

          <div className="bg-surface dark:bg-surface border border-outline-variant rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-on-surface">Privacy & Security</h2>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Your messages are translated using AI and transmitted securely. 
                We do not store your message content permanently.
              </p>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                data-testid="button-privacy-policy"
              >
                View Privacy Policy
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
