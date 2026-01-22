import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { 
  LogOut, 
  Edit3, 
  Image, 
  Mail, 
  FileText, 
  Instagram,
  Video,
  UtensilsCrossed,
  Gift,
  Upload,
  Palette,
  Camera,
  Layers,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getUnreadMessageCount } from "@/lib/supabase/content";

const Dashboard = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const previousCountRef = useRef<number>(0);

  // Fetch unread message count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await getUnreadMessageCount();
        
        // Show notification if count increased
        if (count > previousCountRef.current && previousCountRef.current > 0) {
          const newMessages = count - previousCountRef.current;
          toast.success(
            `${newMessages} new message${newMessages > 1 ? 's' : ''} received!`,
            {
              duration: 5000,
              action: {
                label: 'View',
                onClick: () => navigate("/admin/messages"),
              },
            }
          );
        }
        
        previousCountRef.current = count;
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    // Load immediately
    loadUnreadCount();

    // Poll every 30 seconds for new messages
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/admin/login");
  };

  const menuItems = [
    { 
      id: "about", 
      title: "About Section", 
      icon: FileText, 
      description: "Edit about section content",
      path: "/admin/content/about"
    },
    { 
      id: "stories", 
      title: "Instagram Stories", 
      icon: Instagram, 
      description: "Manage Instagram stories images",
      path: "/admin/content/stories",
      hasMedia: true,
      mediaType: 'image' as const
    },
    { 
      id: "pinterest", 
      title: "Pinterest", 
      icon: Image, 
      description: "Manage Pinterest images",
      path: "/admin/content/pinterest",
      hasMedia: true,
      mediaType: 'image' as const
    },
    { 
      id: "posts", 
      title: "Instagram Posts", 
      icon: Instagram, 
      description: "Manage single Instagram posts",
      path: "/admin/content/posts",
      hasMedia: true,
      mediaType: 'image' as const
    },
    { 
      id: "carousel-example", 
      title: "Carousel Example", 
      icon: Layers, 
      description: "Manage carousel examples (multiple photos)",
      path: "/admin/content/carousel-example",
      hasMedia: true,
      mediaType: 'image' as const,
      specialType: 'carousel' as const
    },
    { 
      id: "editing", 
      title: "Photo Editing", 
      icon: Palette, 
      description: "Manage before/after photo editing",
      path: "/admin/content/editing",
      hasMedia: true,
      mediaType: 'image' as const,
      specialType: 'before-after' as const
    },
    { 
      id: "shoot-edit", 
      title: "Shoot and Edit", 
      icon: Camera, 
      description: "Manage shoot and edit videos",
      path: "/admin/content/shoot-edit",
      hasMedia: true,
      mediaType: 'video' as const
    },
    { 
      id: "reels", 
      title: "Reels", 
      icon: Video, 
      description: "Manage video reels",
      path: "/admin/content/reels",
      hasMedia: true,
      mediaType: 'video' as const
    },
    { 
      id: "menus", 
      title: "Food Menu", 
      icon: UtensilsCrossed, 
      description: "Manage food menu images",
      path: "/admin/content/menus",
      hasMedia: true,
      mediaType: 'image' as const
    },
    { 
      id: "wedding", 
      title: "Wedding Invitation", 
      icon: Gift, 
      description: "Manage wedding invitation images",
      path: "/admin/content/wedding",
      hasMedia: true,
      mediaType: 'image' as const
    },
    { 
      id: "contact", 
      title: "Contact Info", 
      icon: Mail, 
      description: "Edit contact information",
      path: "/admin/content/contact"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">
              Admin <span className="neon-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}
            </p>
          </div>
          <motion.button
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl glass-card flex items-center gap-2 hover:bg-foreground/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </motion.button>
        </motion.div>

        {/* Quick Access - Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <motion.button
            onClick={() => navigate("/admin/messages")}
            className="w-full glass-card rounded-2xl p-6 flex items-center justify-between group hover:border-neon-purple/50 border border-transparent transition-all relative"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center group-hover:bg-neon-purple/20 transition-colors">
                  <MessageSquare className="w-6 h-6 text-neon-purple" />
                </div>
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-neon-purple flex items-center justify-center border-2 border-background"
                  >
                    <span className="text-xs font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  </motion.div>
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-semibold text-lg">Contact Messages</h3>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-2 py-0.5 rounded-full bg-neon-purple/20 text-neon-purple text-xs font-semibold"
                    >
                      {unreadCount} new
                    </motion.span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">View and manage contact form submissions</p>
              </div>
            </div>
            <div className="relative">
              <Mail className="w-5 h-5 text-muted-foreground group-hover:text-neon-purple transition-colors" />
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-neon-purple animate-pulse"
                />
              )}
            </div>
          </motion.button>
        </motion.div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(item.path)}
                className="glass-card rounded-2xl p-6 cursor-pointer group hover:border-neon-purple/50 border border-transparent transition-all duration-300"
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center group-hover:bg-neon-purple/20 transition-colors">
                    <Icon className="w-6 h-6 text-neon-purple" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-neon-purple transition-colors">
                  {item.hasMedia ? (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Manage {item.mediaType}s</span>
                    </>
                  ) : (
                    <>
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Content</span>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 glass-card rounded-2xl p-6"
        >
          <h2 className="font-display font-semibold text-xl mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <motion.button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-xl glass-card hover:bg-foreground/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View Portfolio
            </motion.button>
            <motion.button
              onClick={() => window.open("/", "_blank")}
              className="px-4 py-2 rounded-xl glass-card hover:bg-foreground/10 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Open in New Tab
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
