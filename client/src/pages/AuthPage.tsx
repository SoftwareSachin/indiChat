import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { type LanguageCode, SUPPORTED_LANGUAGES } from "@/lib/languages";
import { Separator } from "@/components/ui/separator";
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

      // Use AuthManager to set auth data
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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {isLogin ? "Sign in" : "Create account"}
          </CardTitle>
          <CardDescription>
            {isLogin 
              ? "Enter your credentials to access your chat rooms" 
              : "Create an account to start chatting with real-time translation"}
          </CardDescription>
          {!isLogin && (
            <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                <strong>Note:</strong> Multiple accounts in the same browser will share the same session. For testing with multiple users, please use different browsers or incognito/private windows.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language</Label>
                <Select value={preferredLanguage} onValueChange={(value) => setPreferredLanguage(value as LanguageCode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Loading..." : (isLogin ? "Sign in" : "Create account")}
            </Button>

            <Separator />

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
