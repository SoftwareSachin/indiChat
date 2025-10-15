import { useState } from "react";
import { useLocation } from "wouter";
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
      <div className="w-full max-w-[440px]">
        <div className="space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 dark:bg-primary/20 mb-2">
              <svg 
                className="w-7 h-7 text-primary" 
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
            <h1 className="text-3xl font-semibold tracking-tight text-on-background">
              XChat
            </h1>
            <p className="text-sm text-on-surface-variant">
              Global Multilingual Communication
            </p>
          </div>

          <div className="bg-surface dark:bg-surface border border-outline-variant rounded-2xl p-8 space-y-6 shadow-sm">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-on-surface">
                {isLogin ? "Sign in to your account" : "Create your account"}
              </h2>
              <p className="text-sm text-on-surface-variant">
                {isLogin 
                  ? "Enter your credentials to access your chat rooms" 
                  : "Join the global conversation with real-time translation"}
              </p>
            </div>

            {!isLogin && (
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-medium text-on-surface">Note:</span> Multiple accounts in the same browser will share the same session. For testing with multiple users, use different browsers or incognito windows.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-on-surface">
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
                  className="h-11 text-base"
                  data-testid="input-username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-on-surface">
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
                  className="h-11 text-base"
                  data-testid="input-password"
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium text-on-surface">
                    Preferred Language
                  </Label>
                  <Select value={preferredLanguage} onValueChange={(value) => setPreferredLanguage(value as LanguageCode)}>
                    <SelectTrigger id="language" className="h-11 text-base" data-testid="select-language">
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
                className="w-full h-11 text-base font-medium"
                data-testid="button-submit"
              >
                {isLoading ? "Please wait..." : (isLogin ? "Sign In" : "Create Account")}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface dark:bg-surface px-2 text-on-surface-variant">Or</span>
              </div>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium text-primary hover:underline underline-offset-4"
                data-testid="button-toggle-mode"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-on-surface-variant">
              Supports 12 Indian regional languages
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
