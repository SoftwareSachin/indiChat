import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bell, MessageSquare, Check, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/AppSidebar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { Notification } from "@shared/schema";

export default function NotificationsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setMarkingAsRead(id);
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        ));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    } finally {
      setMarkingAsRead(null);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        toast({
          title: "Success",
          description: "All notifications marked as read",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate to room if it's a message notification
    if (notification.roomId) {
      setLocation(`/chat/${notification.roomId}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!token) {
    setLocation("/auth");
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-on-background">Notifications</h1>
                <p className="text-on-surface-variant mt-1">
                  {unreadCount > 0 
                    ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                    : 'All caught up!'}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="gap-2"
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-on-surface-variant">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 card-outlined rounded-xl">
                <Bell className="w-16 h-16 mx-auto text-on-surface-variant/30 mb-4" />
                <h3 className="text-xl font-semibold text-on-surface mb-2">No notifications yet</h3>
                <p className="text-on-surface-variant">
                  When you receive messages, you'll see them here
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`
                    card-outlined p-4 cursor-pointer transition-all hover:shadow-md
                    ${!notification.isRead ? 'bg-primary/5 border-primary/20' : ''}
                  `}
                  data-testid={`notification-${notification.id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${!notification.isRead ? 'bg-primary text-primary-foreground' : 'bg-surface-container text-on-surface-variant'}
                    `}>
                      <MessageSquare className="w-5 h-5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-on-surface ${!notification.isRead ? 'font-bold' : ''}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        
                        {!notification.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-on-surface-variant">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>

                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            disabled={markingAsRead === notification.id}
                            className="h-7 text-xs gap-1"
                            data-testid={`button-mark-read-${notification.id}`}
                          >
                            <Check className="w-3 h-3" />
                            Mark as read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
