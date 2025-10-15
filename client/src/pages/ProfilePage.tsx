import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, User, Globe, Save, Camera, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem("token");

  const [username, setUsername] = useState(user?.username || "");
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>(
    user?.preferredLanguage || "en"
  );
  const [bio, setBio] = useState(user?.bio || "");
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");

  useEffect(() => {
    // Fetch fresh profile data
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUsername(data.username);
          setPreferredLanguage(data.preferredLanguage);
          setBio(data.bio || "");
          setProfileImage(data.profileImage || "");
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, [token]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/user/upload-profile-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      setProfileImage(data.profileImage);
      
      // Update user in localStorage
      const updatedUser = { ...user, profileImage: data.profileImage };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
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
          bio,
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
              <h1 className="text-3xl font-bold text-on-background">Profile Settings</h1>
              <p className="text-on-surface-variant mt-1">
                Manage your account information and preferences
              </p>
            </div>
          </div>

          {/* Profile Header Card with Cover */}
          <div className="relative card-outlined overflow-hidden">
            {/* Cover Image */}
            <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20"></div>
            
            {/* Profile Info */}
            <div className="px-6 pb-6">
              {/* Avatar - positioned to overlap cover */}
              <div className="relative -mt-16 mb-4">
                <div className="relative inline-block">
                  <Avatar className="w-32 h-32 border-4 border-background">
                    {profileImage ? (
                      <AvatarImage src={profileImage} alt={username} />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                        {getInitials(username)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full w-10 h-10 shadow-lg"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    data-testid="button-change-photo"
                  >
                    <Camera className="w-5 h-5" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="input-profile-image"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-on-surface">{username}</h2>
                <p className="text-on-surface-variant">
                  {SUPPORTED_LANGUAGES.find(l => l.code === preferredLanguage)?.nativeName} Speaker
                </p>
                {bio && (
                  <p className="text-on-surface-variant mt-2 max-w-2xl">
                    {bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="card-outlined p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Edit2 className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-semibold text-on-surface">Edit Profile</h3>
            </div>

            <div className="space-y-6">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-on-surface">
                  <User className="w-4 h-4 inline mr-2" />
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="text-base"
                  data-testid="input-username"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-on-surface">
                  About
                </Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="min-h-[100px] text-base resize-none"
                  maxLength={200}
                  data-testid="textarea-bio"
                />
                <p className="text-xs text-on-surface-variant text-right">
                  {bio.length}/200 characters
                </p>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language" className="text-sm font-medium text-on-surface">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Preferred Language
                </Label>
                <Select value={preferredLanguage} onValueChange={(value) => setPreferredLanguage(value as LanguageCode)}>
                  <SelectTrigger id="language" className="text-base" data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-on-surface-variant">
                  Messages will be automatically translated to this language
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setLocation("/rooms")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="gap-2"
                data-testid="button-save"
              >
                <Save className="w-4 h-4" />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Account Information Card */}
          <div className="card-filled p-6 space-y-4">
            <h3 className="text-lg font-semibold text-on-surface">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-on-surface-variant">User ID</p>
                <p className="text-sm text-on-surface font-mono bg-surface-container px-3 py-2 rounded">
                  {user.id}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-on-surface-variant">Member Since</p>
                <p className="text-sm text-on-surface bg-surface-container px-3 py-2 rounded">
                  {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
