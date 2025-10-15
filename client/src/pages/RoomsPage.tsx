import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, Lock, Globe, Users, ArrowRight, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AuthManager } from "@/lib/auth-manager";
import { AppSidebar } from "@/components/AppSidebar";

interface Room {
  id: string;
  name: string;
  inviteCode: string;
  isPrivate: boolean;
  createdAt: string;
}

export default function RoomsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomName, setRoomName] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!token) {
      setLocation("/auth");
      return;
    }
    fetchRooms();

    const authManager = AuthManager.getInstance();
    authManager.startListening(() => {
      toast({
        title: "Session replaced",
        description: "Another user logged in from a different tab. Please log in again.",
        variant: "destructive",
      });
      setTimeout(() => {
        authManager.clearAuth();
        setLocation("/auth");
      }, 2000);
    });

    return () => {
      authManager.stopListening();
    };
  }, [token]);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/my-rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: roomName, isPrivate }),
      });

      if (!response.ok) throw new Error("Failed to create room");

      const newRoom = await response.json();
      setRooms([...rooms, newRoom]);
      setRoomName("");
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Room created successfully",
        description: "Share the invite link to add members",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!inviteCode.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/rooms/join/${inviteCode}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) throw new Error("Failed to join room");

      const room = await response.json();
      setRooms([...rooms, room]);
      setInviteCode("");
      setIsJoinDialogOpen(false);
      setLocation(`/chat/${room.id}`);
      
      toast({
        title: "Successfully joined",
        description: `Welcome to ${room.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid invite code or failed to join",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = async (code: string) => {
    try {
      const inviteUrl = `${window.location.origin}/invite/${code}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: "Link copied",
        description: "Share this link to invite others to the room",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied",
        description: "Share this code to invite others to the room",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };

  if (!user.id) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-on-background">Chat Rooms</h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Join or create rooms to start chatting
              </p>
            </div>
            <div className="flex gap-3">
              <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" data-testid="button-join-room">
                    <Users className="w-4 h-4" />
                    Join Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Join a Room</DialogTitle>
                    <DialogDescription className="text-sm">
                      Enter the invite code to join an existing room
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="invite-code" className="text-sm font-medium">Invite Code</Label>
                      <Input
                        id="invite-code"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Enter invite code"
                        className="h-11"
                        data-testid="input-invite-code"
                      />
                    </div>
                    <Button
                      onClick={handleJoinRoom}
                      disabled={isLoading || !inviteCode.trim()}
                      className="w-full h-11"
                      data-testid="button-submit-join"
                    >
                      {isLoading ? "Joining..." : "Join Room"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-create-room">
                    <Plus className="w-4 h-4" />
                    Create Room
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Create New Room</DialogTitle>
                    <DialogDescription className="text-sm">
                      Create a new chat room and invite members
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="room-name" className="text-sm font-medium">Room Name</Label>
                      <Input
                        id="room-name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Enter room name"
                        className="h-11"
                        data-testid="input-room-name"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface-container dark:bg-surface-container-high border border-outline-variant">
                      <div className="space-y-0.5">
                        <Label htmlFor="private-room" className="text-sm font-medium">Private Room</Label>
                        <p className="text-xs text-on-surface-variant">
                          Only invited users can join
                        </p>
                      </div>
                      <Switch
                        id="private-room"
                        checked={isPrivate}
                        onCheckedChange={setIsPrivate}
                        data-testid="switch-private"
                      />
                    </div>
                    <Button
                      onClick={handleCreateRoom}
                      disabled={isLoading || !roomName.trim()}
                      className="w-full h-11"
                      data-testid="button-submit-create"
                    >
                      {isLoading ? "Creating..." : "Create Room"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="flex items-center justify-center min-h-[500px]">
              <div className="text-center space-y-6 max-w-md">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <svg 
                    className="w-10 h-10 text-primary" 
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
                <div>
                  <h3 className="text-xl font-semibold text-on-surface">No rooms yet</h3>
                  <p className="text-sm text-on-surface-variant mt-2">
                    Create your first room or join an existing one using the buttons above
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-surface dark:bg-surface border border-outline-variant rounded-2xl p-5 space-y-4 hover:shadow-md dark:hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => setLocation(`/chat/${room.id}`)}
                  data-testid={`room-card-${room.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                        <svg 
                          className="w-6 h-6 text-primary" 
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
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-on-surface truncate">{room.name}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          {room.isPrivate ? (
                            <Badge variant="secondary" className="gap-1 text-xs h-5 px-2">
                              <Lock className="w-3 h-3" />
                              Private
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 text-xs h-5 px-2">
                              <Globe className="w-3 h-3" />
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>

                  <div className="h-px bg-outline-variant"></div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyInviteLink(room.inviteCode);
                      }}
                      className="flex-1 h-9 text-xs"
                      data-testid={`button-copy-link-${room.id}`}
                    >
                      <Link2 className="w-3.5 h-3.5 mr-1.5" />
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyInviteCode(room.inviteCode);
                      }}
                      className="flex-1 h-9 text-xs"
                      data-testid={`button-copy-code-${room.id}`}
                    >
                      <Copy className="w-3.5 h-3.5 mr-1.5" />
                      Copy Code
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
