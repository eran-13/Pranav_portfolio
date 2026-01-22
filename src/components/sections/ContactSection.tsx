import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Mail, Phone, Instagram, Linkedin, Send } from "lucide-react";
import { toast } from "sonner";
import { getContent, submitContactMessage } from "@/lib/supabase/content";

// Pinterest icon component (lucide-react doesn't have Pinterest icon)
const Pinterest = ({ className, ...props }: { className?: string; [key: string]: any }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.75 8.17 6.56 9.71-.09-.79-.17-2.01.03-2.87.18-.78 1.18-5.05 1.18-5.05s-.3-.6-.3-1.49c0-1.39.81-2.43 1.81-2.43.86 0 1.27.64 1.27 1.4 0 .86-.55 2.14-.83 3.33-.24.99.5 1.8 1.48 1.8 1.78 0 3.15-1.87 3.15-4.57 0-2.39-1.72-4.06-4.18-4.06-2.85 0-4.52 2.14-4.52 4.35 0 .86.33 1.78.74 2.33.08.1.09.19.07.29-.07.3-.24.94-.27 1.07-.04.18-.13.22-.3.13-1.12-.52-1.82-2.15-1.82-3.46 0-2.81 2.04-5.39 5.9-5.39 3.1 0 5.5 2.21 5.5 5.16 0 3.08-1.94 5.56-4.64 5.56-.91 0-1.76-.47-2.05-1.05l-.56 2.13c-.21.81-.78 1.83-1.16 2.45 1.03.32 2.12.49 3.23.49 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

// Facebook icon component (avoid deprecated lucide-react Facebook export)
const FacebookIcon = ({ className, ...props }: { className?: string; [key: string]: any }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22 12a10 10 0 1 0-11.56 9.87v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.88h-2.34v6.99A10 10 0 0 0 22 12z"/>
  </svg>
);

// WhatsApp icon component (lucide-react doesn't have WhatsApp icon)
const WhatsApp = ({ className, ...props }: { className?: string; [key: string]: any }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.05 0C5.46 0 .1 5.36.1 11.95c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 0 0 5.72 1.46h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.2-1.25-6.2-3.43-8.39ZM12 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.72.97.99-3.62-.24-.37a9.87 9.87 0 0 1-1.51-5.24C2.12 6.46 6.52 2.07 12.05 2.07c2.63 0 5.1 1.02 6.96 2.88a9.79 9.79 0 0 1 2.88 6.95c0 5.53-4.4 9.9-9.89 9.9Zm5.73-7.36c-.31-.16-1.86-.92-2.15-1.03-.29-.1-.5-.16-.71.16-.21.31-.82 1.03-1 1.24-.18.21-.37.23-.68.08-.31-.16-1.31-.48-2.5-1.54-.92-.82-1.54-1.84-1.72-2.15-.18-.31-.02-.48.13-.63.13-.13.31-.37.47-.55.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.72-.97-2.35-.26-.62-.52-.53-.71-.54h-.6c-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.22 3.4 5.38 4.77.75.32 1.33.51 1.79.65.75.24 1.43.21 1.97.13.6-.09 1.86-.76 2.12-1.5.26-.73.26-1.36.18-1.5-.08-.13-.29-.21-.6-.37Z"/>
  </svg>
);

// Fallback social links (icon is stored as a STRING and mapped to a component below)
const fallbackSocialLinks: Array<{ icon: string; href: string; label: string }> = [
  { icon: "Instagram", href: "https://www.instagram.com/silent.draft?igsh=MTB1cWFxcHloOGp5MA%3D%3D&utm_source=qr", label: "Instagram" },
  { icon: "Pinterest", href: "https://pin.it/4E8RO2FZb", label: "Pinterest" },
  { icon: "Linkedin", href: "https://www.linkedin.com/in/pranav-patel-b19241347?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", label: "LinkedIn" },
  // Future-ready examples (replace hrefs in admin when needed)
  { icon: "Facebook", href: "https://facebook.com/", label: "Facebook" },
  { icon: "WhatsApp", href: "https://wa.me/", label: "WhatsApp" },
];

const ContactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [content, setContent] = useState<{
    email?: string;
    phone?: string;
    socialLinks?: Array<{ icon: string; href: string; label: string }>;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load content from database
  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await getContent('contact');
        if (data) {
          setContent(data);
        } else {
          // Fallback to hardcoded content
          setContent({
            email: "pranavdpatel1314@gmail.com",
            phone: "+91 6355790534",
            socialLinks: fallbackSocialLinks,
          });
        }
      } catch (error) {
        console.error('Error loading contact content:', error);
        // Fallback to hardcoded content
        setContent({
          email: "pranavdpatel1314@gmail.com",
          phone: "+91 6355790534",
          socialLinks: fallbackSocialLinks,
        });
      }
    };
    loadContent();
  }, []);

  // Get social links with icon components
  const getSocialLinks = () => {
    const links = content?.socialLinks?.length ? content.socialLinks : fallbackSocialLinks;
    
    const iconMap: Record<string, any> = {
      Instagram,
      Pinterest,
      Linkedin,
      Facebook: FacebookIcon,
      WhatsApp,
    };
    
    return links.map(link => ({
      ...link,
      icon: iconMap[link.icon] || Instagram,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Submit message to database
      const result = await submitContactMessage(
        formData.name,
        formData.email,
        formData.message
      );
      
      if (result.success) {
        toast.success("Message sent successfully! I'll get back to you soon.");
        // Reset form
    setFormData({ name: "", email: "", message: "" });
      } else {
        toast.error(result.error || "Failed to send message. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <section id="contact" className="relative py-24 px-4 overflow-hidden">
      <div className="section-divider mb-24" />

      {/* Background Gradient */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-neon-purple/10 rounded-full blur-[200px]" />

      <div className="container mx-auto max-w-4xl relative z-10" ref={ref}>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-neon-magenta text-sm font-medium tracking-widest uppercase mb-4 block">
            Get In Touch
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Let's Work <span className="neon-text">Together</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Have a project in mind? Let's create something amazing together.
          </p>
        </motion.div>

        <motion.div
          className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Neon Border Glow */}
          <div className="absolute inset-0 rounded-3xl opacity-50 pointer-events-none" style={{
            background: "linear-gradient(135deg, hsl(280 100% 65% / 0.1), transparent, hsl(190 100% 50% / 0.1))",
          }} />

          <div className="grid md:grid-cols-2 gap-12 relative z-10">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-display font-semibold mb-6">Contact Info</h3>
                
                <div className="space-y-4">
                  {content?.email && (
                  <motion.a
                      href={`mailto:${content.email}`}
                    className="flex items-center gap-4 group cursor-hover"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center group-hover:border-neon-purple/50 border border-transparent transition-colors duration-300">
                      <Mail className="w-5 h-5 text-neon-purple" />
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        {content.email}
                    </span>
                  </motion.a>
                  )}

                  {content?.phone && (
                  <motion.a
                      href={`tel:${content.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-4 group cursor-hover"
                    whileHover={{ x: 5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center group-hover:border-neon-cyan/50 border border-transparent transition-colors duration-300">
                      <Phone className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                        {content.phone}
                    </span>
                  </motion.a>
                  )}
                </div>
              </div>

              {/* Social Links */}
              <div>
                <h3 className="text-xl font-display font-semibold mb-6">Follow Me</h3>
                <div className="flex gap-4">
                  {getSocialLinks().map((social, index) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      className="w-12 h-12 rounded-xl glass-card flex items-center justify-center group cursor-hover"
                      initial={{ opacity: 0, y: 20 }}
                      animate={isInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                      whileHover={{ 
                        y: -5,
                        boxShadow: "0 10px 40px hsl(320 100% 60% / 0.3)",
                      }}
                    >
                      <social.icon className="w-5 h-5 text-muted-foreground group-hover:text-neon-magenta transition-colors duration-300" />
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all duration-300 placeholder:text-muted-foreground text-foreground cursor-text"
                  style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                />
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all duration-300 placeholder:text-muted-foreground text-foreground cursor-text"
                  style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                />
              </div>
              <div>
                <textarea
                  name="message"
                  placeholder="Tell me about your project..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  autoComplete="off"
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all duration-300 placeholder:text-muted-foreground resize-none text-foreground cursor-text"
                  style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                />
              </div>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full relative group px-8 py-4 rounded-xl font-medium text-foreground overflow-hidden disabled:opacity-50 cursor-hover"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-magenta opacity-80" />
                <span className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-magenta opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? (
                    "Sending..."
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </span>
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center mt-16 text-muted-foreground text-sm"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <p>© 2024 Creative Portfolio. All rights reserved.</p>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
