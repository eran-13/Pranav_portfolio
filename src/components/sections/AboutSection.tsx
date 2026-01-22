import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useState, useEffect } from "react";
import { getContent } from "@/lib/supabase/content";
import designImage from "../../image/Untitled design.svg";

const AboutSection = () => {
  const [content, setContent] = useState<{
    title?: string;
    subtitle?: string;
    description?: string;
    image?: string;
  } | null>(null);

  // Load content from database
  useEffect(() => {
    const loadContent = async () => {
      try {
        const data = await getContent('about');
        if (data) {
          setContent(data);
        } else {
          // Fallback to hardcoded content
          setContent({
            title: "Capturing Moments Creating Stories",
            subtitle: "Creative Visual Artist",
            description: "I'm a visual storyteller specializing in photography, videography, and post-production. From Instagram stories to cinematic reels, I bring creative visions to life through the lens and editing suite.",
            image: designImage,
          });
        }
      } catch (error) {
        console.error('Error loading about content:', error);
        // Fallback to hardcoded content
        setContent({
          title: "Capturing Moments Creating Stories",
          subtitle: "Creative Visual Artist",
          description: "I'm a visual storyteller specializing in photography, videography, and post-production. From Instagram stories to cinematic reels, I bring creative visions to life through the lens and editing suite.",
          image: designImage,
        });
      }
    };
    loadContent();
  }, []);

  const scrollToWork = () => {
    const element = document.getElementById("stories");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="about"
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-20 px-4"
    >
      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-purple/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-cyan/20 rounded-full blur-[120px] animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-magenta/10 rounded-full blur-[150px]" />

      <div className="container relative z-10 mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left - Image/Video Placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative group cursor-hover"
          >
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
              <img 
                src={content?.image || designImage} 
                alt="Design" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to designImage if content image fails
                  if (content?.image && e.currentTarget.src !== designImage) {
                    e.currentTarget.src = designImage;
                  }
                }}
              />
              {/* Neon border effect */}
              <div className="absolute inset-0 rounded-2xl border border-neon-purple/30 group-hover:border-neon-purple/60 transition-colors duration-500" />
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ boxShadow: "rgba(196, 77, 255, 0.2) 0px 0px 60px inset" }} />
            </div>

            {/* Floating elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-20 h-20 rounded-xl glass-card flex items-center justify-center"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <span className="text-2xl">📸</span>
            </motion.div>
            <motion.div
              className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl glass-card flex items-center justify-center"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              <span className="text-xl">🎬</span>
            </motion.div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <span className="inline-block px-4 py-2 rounded-full glass-card text-xs font-medium text-neon-cyan mb-6 tracking-wider uppercase">
                {content?.subtitle || "Creative Visual Artist"}
              </span>
            </motion.div>

            <motion.h1
              className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {content?.title || (
                <>
              Capturing{" "}
              <span className="neon-text">Moments</span>
              <br />
              Creating{" "}
              <span className="neon-text">Stories</span>
                </>
              )}
            </motion.h1>

            <motion.p
              className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
            >
              {content?.description || "I'm a visual storyteller specializing in photography, videography, and post-production. From Instagram stories to cinematic reels, I bring creative visions to life through the lens and editing suite."}
            </motion.p>

            <motion.button
              onClick={scrollToWork}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full font-medium text-foreground overflow-hidden cursor-hover"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-magenta opacity-80" />
              <span className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-cyan to-neon-magenta opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
              <span className="relative z-10">Explore My Work</span>
              <ArrowDown className="relative z-10 w-5 h-5 group-hover:translate-y-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-2 bg-neon-purple rounded-full"
            animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default AboutSection;
