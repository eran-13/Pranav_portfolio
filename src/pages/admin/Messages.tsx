import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, Trash2, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { 
  getContactMessages, 
  markMessageAsRead, 
  deleteContactMessage,
  ContactMessage 
} from "@/lib/supabase/content";

const Messages = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await getContactMessages();
      setMessages(data);
    } catch (error) {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    setProcessing(messageId);
    try {
      const success = await markMessageAsRead(messageId);
      if (success) {
        setMessages(prev => 
          prev.map(msg => msg.id === messageId ? { ...msg, read: true } : msg)
        );
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, read: true } : null);
        }
        toast.success("Message marked as read");
      } else {
        toast.error("Failed to update message");
      }
    } catch (error) {
      toast.error("Error updating message");
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    setProcessing(messageId);
    try {
      const success = await deleteContactMessage(messageId);
      if (success) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage(null);
        }
        toast.success("Message deleted");
      } else {
        toast.error("Failed to delete message");
      }
    } catch (error) {
      toast.error("Error deleting message");
    } finally {
      setProcessing(null);
    }
  };

  const unreadCount = messages.filter(msg => !msg.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <motion.button
            onClick={() => navigate("/admin/dashboard")}
            className="p-2 rounded-lg glass-card hover:bg-foreground/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-4xl font-display font-bold mb-2">
              Contact <span className="neon-text">Messages</span>
            </h1>
            <p className="text-muted-foreground">
              {messages.length} total message{messages.length !== 1 ? 's' : ''}
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 rounded-full bg-neon-purple/20 text-neon-purple text-sm">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages List */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-3"
          >
            {messages.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedMessage(message)}
                  className={`glass-card rounded-xl p-4 cursor-pointer transition-all ${
                    selectedMessage?.id === message.id
                      ? 'border-neon-purple/50 border-2'
                      : 'border border-transparent hover:border-foreground/10'
                  } ${!message.read ? 'bg-neon-purple/10' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{message.name}</h3>
                      <p className="text-xs text-muted-foreground mb-1">{message.email}</p>
                    </div>
                    {!message.read && (
                      <div className="w-2 h-2 rounded-full bg-neon-purple ml-2" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {message.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {message.created_at
                      ? new Date(message.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </p>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Message Detail */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            {selectedMessage ? (
              <div className="glass-card rounded-2xl p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-display font-bold mb-2">
                      {selectedMessage.name}
                    </h2>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-neon-purple hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    {!selectedMessage.read && (
                      <motion.button
                        onClick={() => handleMarkAsRead(selectedMessage.id!)}
                        disabled={processing === selectedMessage.id}
                        className="p-2 rounded-lg glass-card hover:bg-neon-cyan/20 disabled:opacity-50 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {processing === selectedMessage.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 text-neon-cyan" />
                        )}
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => handleDelete(selectedMessage.id!)}
                      disabled={processing === selectedMessage.id}
                      className="p-2 rounded-lg glass-card hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {processing === selectedMessage.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      )}
                    </motion.button>
                  </div>
                </div>

                <div className="pt-4 border-t border-foreground/10">
                  <p className="text-sm text-muted-foreground mb-2">Received:</p>
                  <p className="text-sm mb-6">
                    {selectedMessage.created_at
                      ? new Date(selectedMessage.created_at).toLocaleString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Unknown date'}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">Message:</p>
                  <div className="p-4 rounded-xl bg-muted/30">
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-foreground/10">
                  <motion.button
                    onClick={() => {
                      const subject = encodeURIComponent(`Re: Your message from ${selectedMessage.name}`);
                      const body = encodeURIComponent(
                        `Hi ${selectedMessage.name},\n\nThank you for reaching out. Regarding your message:\n\n"${selectedMessage.message}"\n\n`
                      );
                      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedMessage.email)}&su=${subject}&body=${body}`;
                      window.open(gmailUrl, '_blank');
                    }}
                    className="flex-1 px-4 py-3 rounded-xl glass-card text-center hover:bg-neon-purple/20 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Reply via Gmail
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-12 text-center">
                <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a message to view details</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Messages;

