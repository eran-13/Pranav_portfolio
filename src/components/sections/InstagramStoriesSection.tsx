import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useDragToScroll } from "@/hooks/useDragToScroll";
import { getCombinedMedia } from "@/lib/supabase/migration";

// Fallback hardcoded data
const fallbackStories = [
  { id: 1, image: "/assets/stories/1.jpg" },
  { id: 2, image: "/assets/stories/2.jpg" },
  { id: 3, image: "/assets/stories/3.jpg" },
  { id: 4, image: "/assets/stories/4.jpg" },
  { id: 5, image: "/assets/stories/5.jpg" },
];

const InstagramStoriesSection = () => {
  const ref = useRef(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [stories, setStories] = useState(fallbackStories);
  useDragToScroll(scrollContainerRef);

  // Load from database, fallback to hardcoded
  const loadStories = async () => {
    try {
      const mediaFiles = await getCombinedMedia('stories', 'image');
      
      if (mediaFiles.length > 0) {
        const dbStories = mediaFiles.map((file, index) => ({
          id: index + 1,
          image: file.file_url,
        }));
        setStories(dbStories);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      // Keep fallback data
    }
  };

  useEffect(() => {
    loadStories();
    
    // Reload when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadStories();
      }
    };
    
    // Reload when window gains focus
    const handleFocus = () => {
      loadStories();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <section id="stories" className="relative py-24 px-4 overflow-hidden">
      <div className="section-divider mb-24" />

      <div className="container mx-auto max-w-7xl" ref={ref}>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-neon-cyan text-sm font-medium tracking-widest uppercase mb-4 block">
            Vertical Content
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Instagram <span className="neon-text">Stories</span>
          </h2>
        </motion.div>

        {/* Horizontal Scrolling Carousel */}
        <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4 overflow-y-visible horizontal-scroll">
          <div className="flex gap-6 min-w-max justify-center py-4">
            {stories.map((story, index) => (
              <motion.div
                key={story.id}
                className="relative group cursor-hover media-card"
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <motion.div
                  className="relative w-52 aspect-[9/16] rounded-2xl overflow-visible glass-card"
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    z: 50,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Story Image Container */}
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                  {story.image ? (
                    <img 
                      src={story.image} 
                      alt={`Instagram Story ${story.id}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      {/* Gradient Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-neon-purple to-neon-cyan opacity-30" />
                      
                      {/* Placeholder Content */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-6">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-foreground/20 flex items-center justify-center">
                            <span className="text-lg">📱</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Story {story.id}</p>
                        </div>
                      </div>
                    </>
                  )}
                  </div>

                  {/* Hover Glow Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      boxShadow: "0 0 40px hsl(280 100% 65% / 0.4), inset 0 0 40px hsl(280 100% 65% / 0.1)",
                    }}
                  />

                  {/* Border Glow */}
                  <div className="absolute inset-0 rounded-2xl border border-foreground/10 group-hover:border-neon-purple/50 transition-colors duration-300 pointer-events-none" />
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <motion.p
          className="text-center text-muted-foreground text-sm mt-4"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          ← Scroll to explore →
        </motion.p>
      </div>
    </section>
  );
};

export default InstagramStoriesSection;
