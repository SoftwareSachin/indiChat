import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function InvitePage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const inviteCode = params.inviteCode as string;
  const [roomName, setRoomName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      localStorage.setItem("pendingInvite", inviteCode);
      setLocation("/auth");
      return;
    }

    const joinRoom = async () => {
      try {
        const response = await fetch(`/api/rooms/join/${inviteCode}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to join room");

        const room = await response.json();
        setLocation(`/chat/${room.id}`);
      } catch (error) {
        setIsLoading(false);
        console.error("Failed to join room:", error);
      }
    };

    joinRoom();
  }, [inviteCode, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Joining Room</CardTitle>
            <CardDescription>Please wait while we add you to the room...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invalid Invite</CardTitle>
          <CardDescription>This invite link is invalid or has expired.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setLocation("/rooms")} className="w-full">
            Go to Rooms
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
