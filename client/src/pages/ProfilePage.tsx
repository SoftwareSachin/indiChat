import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, User, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { type LanguageCode, SUPPORTED_LANGUAGES } from "@/lib/languages";
import { AppSidebar } from "@/components/AppSidebar";

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem("token");

  const [username, setUsername] = useState(user?.username || "");
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(
    user?.preferredLanguage || "en"
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          preferredLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || !token) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/rooms")}
              className="icon-button"
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="headline-medium text-on-background">Profile Settings</h1>
              <p className="body-medium text-on-surface-variant">
                Manage your account information and preferences
              </p>
            </div>
          </div>

          {/* Profile Card */}
          <div className="card-outlined p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="bg-primary text-primary-foreground headline-small">
                  {getInitials(username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="title-large text-on-surface">{username}</h2>
                <p className="body-medium text-on-surface-variant">
                  Language: {SUPPORTED_LANGUAGES.find(l => l.code === preferredLanguage)?.name}
                </p>
              </div>
            </div>

            <div className="divider"></div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="label-large text-on-surface">
                  <User className="w-4 h-4 inline mr-2" />
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="body-large"
                  data-testid="input-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="label-large text-on-surface">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Preferred Language
                </Label>
                <Select value={preferredLanguage} onValueChange={(value) => setPreferredLanguage(value as LanguageCode)}>
                  <SelectTrigger id="language" className="body-large" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name} ({lang.nativeName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="body-small text-on-surface-variant">
                  This language will be used for translations in your chats
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/rooms")}
                className="btn-outlined"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="btn-filled gap-2"
                data-testid="button-save"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="card-filled p-6 space-y-4">
            <h3 className="title-medium text-on-surface">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="label-small text-on-surface-variant">User ID</p>
                <p className="body-medium text-on-surface font-mono">{user.id}</p>
              </div>
              <div>
                <p className="label-small text-on-surface-variant">Member Since</p>
                <p className="body-medium text-on-surface">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
