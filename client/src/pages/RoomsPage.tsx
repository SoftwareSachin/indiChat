import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, LogOut, MessageSquare, Lock, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

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

  const copyInviteLink = (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Link copied",
      description: "Share this link to invite others to the room",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Chat Rooms</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back, {user.username}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-3 mb-8">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
                <DialogDescription>
                  Create a chat room and share the invite link with others
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="room-name">Room Name</Label>
                  <Input
                    id="room-name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name"
                  />
                </div>
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="private" className="flex flex-col space-y-1">
                    <span>Private Room</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Only accessible via invite link
                    </span>
                  </Label>
                  <Switch
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                </div>
                <Button onClick={handleCreateRoom} disabled={isLoading || !roomName.trim()} className="w-full">
                  {isLoading ? "Creating..." : "Create Room"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Join with Invite Code</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Join Room</DialogTitle>
                <DialogDescription>
                  Enter the invite code to join a room
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code"
                  />
                </div>
                <Button onClick={handleJoinRoom} disabled={isLoading || !inviteCode.trim()} className="w-full">
                  {isLoading ? "Joining..." : "Join Room"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {rooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No rooms yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create a room or join using an invite code</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setLocation(`/chat/${room.id}`)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={room.isPrivate ? "secondary" : "outline"} className="text-xs">
                          {room.isPrivate ? (
                            <>
                              <Lock className="w-3 h-3 mr-1" />
                              Private
                            </>
                          ) : (
                            <>
                              <Globe className="w-3 h-3 mr-1" />
                              Public
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Invite Code</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{room.inviteCode}</code>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyInviteLink(room.inviteCode);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Invite Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
