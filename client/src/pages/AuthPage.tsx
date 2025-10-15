import { useState } from "react";
import { useLocation } from "wouter";
import { MessageSquare, User, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { type LanguageCode, SUPPORTED_LANGUAGES } from "@/lib/languages";
import { AuthManager } from "@/lib/auth-manager";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<LanguageCode>("en");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const body = isLogin 
        ? { username, password }
        : { username, password, preferredLanguage };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      const authManager = AuthManager.getInstance();
      authManager.setAuthData(data.token, data.user);

      toast({
        title: isLogin ? "Welcome back" : "Account created",
        description: `Logged in as ${data.user.username}`,
      });

      const pendingInvite = localStorage.getItem("pendingInvite");
      if (pendingInvite) {
        localStorage.removeItem("pendingInvite");
        setLocation(`/invite/${pendingInvite}`);
      } else {
        setLocation("/rooms");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <MessageSquare className="w-9 h-9 text-primary-foreground" />
          </div>
          <div>
            <h1 className="headline-large text-on-background">Xchat</h1>
            <p className="body-large text-on-surface-variant mt-2">
              Global Multilingual Communication
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="card-outlined p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="title-large text-on-surface">
              {isLogin ? "Sign in to your account" : "Create your account"}
            </h2>
            <p className="body-medium text-on-surface-variant">
              {isLogin 
                ? "Enter your credentials to access your chat rooms" 
                : "Join the global conversation with real-time translation"}
            </p>
          </div>

          {!isLogin && (
            <div className="surface-container-high rounded-xl p-4">
              <p className="body-small text-on-surface-variant">
                <strong className="text-on-surface">Note:</strong> Multiple accounts in the same browser will share the same session. For testing with multiple users, use different browsers or incognito windows.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="label-large text-on-surface flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
                className="body-large h-12"
                data-testid="input-username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="label-large text-on-surface flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="body-large h-12"
                data-testid="input-password"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="language" className="label-large text-on-surface flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Preferred Language
                </Label>
                <Select value={preferredLanguage} onValueChange={(value) => setPreferredLanguage(value as LanguageCode)}>
                  <SelectTrigger id="language" className="body-large h-12" data-testid="select-language">
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
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 btn-filled label-large"
              data-testid="button-submit"
            >
              {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
            </Button>
          </form>

          <div className="divider"></div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="label-large text-primary hover:underline"
              data-testid="button-toggle-mode"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center space-y-2">
          <p className="body-small text-on-surface-variant">
            Supports 12 Indian regional languages
          </p>
          <p className="body-small text-on-surface-variant">
            Real-time AI translation powered by Google Gemini
          </p>
        </div>
      </div>
    </div>
  );
}
