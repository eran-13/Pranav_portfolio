import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDragToScroll } from "@/hooks/useDragToScroll";
import { getCombinedMedia, getCombinedCarousels } from "@/lib/supabase/migration";

// Fallback hardcoded data
const fallbackPosts = [
  { id: 1, type: "single", image: "/assets/posts/bilie eilish.png", gradient: "from-neon-purple to-neon-cyan" },
  { id: 2, type: "single", image: "/assets/posts/post food.png", gradient: "from-neon-cyan to-neon-magenta" },
];

const fallbackCarouselPosts = [
  { 
    id: 1, 
    slides: 4, 
    images: [
      "/assets/carousel-posts/carousel-1/1.png",
      "/assets/carousel-posts/carousel-1/2.png",
      "/assets/carousel-posts/carousel-1/3.png",
      "/assets/carousel-posts/carousel-1/4.png"
    ]
  },
  { 
    id: 2, 
    slides: 5, 
    images: [
      "/assets/carousel-posts/carousel-2/17.png",
      "/assets/carousel-posts/carousel-2/18.png",
      "/assets/carousel-posts/carousel-2/19.png",
      "/assets/carousel-posts/carousel-2/20.png",
      "/assets/carousel-posts/carousel-2/21.png"
    ]
  },
];

const InstagramPostsSection = () => {
  const ref = useRef(null);
  const postsScrollRef = useRef<HTMLDivElement>(null);
  const carouselsScrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [posts, setPosts] = useState(fallbackPosts);
  const [carouselPosts, setCarouselPosts] = useState(fallbackCarouselPosts);
  const [carouselIndices, setCarouselIndices] = useState<Record<number, number>>({});
  
  useDragToScroll(postsScrollRef);
  useDragToScroll(carouselsScrollRef);

  // Load posts and carousels from database
  const loadPosts = async () => {
    try {
      // Load single posts
      const mediaFiles = await getCombinedMedia('posts', 'image');
      
      if (mediaFiles.length > 0) {
        // Keep the same order as admin panel (display_order ascending)
        const dbPosts = mediaFiles.map((file, index) => ({
          id: index + 1,
          type: "single" as const,
          image: file.file_url,
          gradient:
            index % 2 === 0
              ? "from-neon-purple to-neon-cyan"
              : "from-neon-cyan to-neon-magenta",
        }));
        setPosts(dbPosts);
      }

      // Load carousel examples
      const carousels = await getCombinedCarousels('carousel-example', 'image');
      
      if (carousels.length > 0) {
        // Keep the same order as admin panel (display_order ascending)
        const dbCarousels = carousels.map((carousel) => ({
          id: carousel.carouselId,
          slides: carousel.images.length,
          images: carousel.images
            .filter((img) => !img.isHardcoded || img.file_url.startsWith('/'))
            .map((img) => img.file_url),
        }));
        if (dbCarousels.length > 0) {
          setCarouselPosts(dbCarousels);
          // Initialize indices for all carousels
          const initialIndices: Record<number, number> = {};
          dbCarousels.forEach((carousel) => {
            initialIndices[carousel.id] = 0;
          });
          setCarouselIndices(initialIndices);
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  useEffect(() => {
    loadPosts();
    
    // Reload when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPosts();
      }
    };
    
    const handleFocus = () => {
      loadPosts();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const nextSlide = (carouselId: number, imagesLength: number) => {
    setCarouselIndices((prev) => ({
      ...prev,
      [carouselId]: ((prev[carouselId] || 0) + 1) % imagesLength,
    }));
  };

  const prevSlide = (carouselId: number, imagesLength: number) => {
    setCarouselIndices((prev) => ({
      ...prev,
      [carouselId]: ((prev[carouselId] || 0) - 1 + imagesLength) % imagesLength,
    }));
  };

  return (
    <section id="posts" className="relative py-24 px-4 overflow-hidden">
      <div className="section-divider mb-24" />

      <div className="container mx-auto max-w-7xl" ref={ref}>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-neon-purple text-sm font-medium tracking-widest uppercase mb-4 block">
            Feed Content
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Instagram <span className="neon-text">Posts</span>
          </h2>
        </motion.div>

        {/* Posts - single row (same sequence as admin), horizontal scroll */}
        <div ref={postsScrollRef} className="overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4 overflow-y-visible horizontal-scroll">
          <div className="flex gap-6 min-w-max justify-center py-4">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              className="group cursor-hover media-card flex-none w-[280px] sm:w-[320px] md:w-[360px] snap-start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <motion.div
                className="relative aspect-[1080/1350] rounded-xl overflow-hidden glass-card"
                whileHover={{ 
                  rotate: 2,
                  scale: 1.02,
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Post Image */}
                {post.image && (
                  <img 
                    src={post.image} 
                    alt={`Instagram Post ${post.id}`}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Neon Border on Hover */}
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    boxShadow: "inset 0 0 0 2px hsl(280 100% 65%), 0 0 30px hsl(280 100% 65% / 0.4)",
                  }}
                />

                <div className="absolute inset-0 rounded-xl border border-foreground/5 group-hover:border-transparent transition-colors duration-300" />
              </motion.div>
            </motion.div>
          ))}
          </div>
        </div>

        {/* Carousels Section - Side by Side */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <h3 className="text-2xl font-display font-semibold text-center mb-8">
            Carousel <span className="text-neon-cyan">Examples</span>
          </h3>

          <div ref={carouselsScrollRef} className="overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4 overflow-y-visible horizontal-scroll">
            <div className="flex gap-6 lg:gap-8 min-w-max justify-center py-4">
              {/* Dynamic Carousels */}
              {carouselPosts.length > 0 ? (
                carouselPosts.map((carousel, carouselIdx) => {
                  const currentIndex = carouselIndices[carousel.id] || 0;
                  return (
                    <div key={carousel.id} className="flex-none w-[280px] sm:w-[320px] md:w-[360px]">
                    <h4 className="text-lg font-display font-semibold text-center mb-4">
                      Carousel <span className="text-neon-cyan">{carouselIdx + 1}</span>
                    </h4>
                    <div className="relative">
                      <div className="overflow-hidden rounded-2xl">
                        {carousel.images.length > 0 ? (
                          <motion.div
                            className="flex"
                            animate={{ x: `-${currentIndex * 100}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            key={`carousel-${carousel.id}-${carousel.images.length}`}
                          >
                            {carousel.images.map((image, idx) => (
                              <div
                                key={`${carousel.id}-${idx}-${image}`}
                                className="w-full flex-shrink-0 aspect-[1080/1350] relative glass-card cursor-hover media-card"
                              >
                                <img 
                                  src={image} 
                                  alt={`Carousel ${carouselIdx + 1} - Slide ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </motion.div>
                        ) : (
                          <div className="w-full aspect-[1080/1350] relative glass-card cursor-hover media-card">
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-purple via-neon-cyan to-neon-magenta opacity-30" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <span className="text-4xl mb-3 block">🎠</span>
                                <p className="text-lg font-medium">Carousel {carouselIdx + 1}</p>
                                <p className="text-sm text-muted-foreground">No images available</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Navigation Buttons */}
                      {carousel.images.length > 1 && (
                        <>
                          <button
                            onClick={() => prevSlide(carousel.id, carousel.images.length)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-card flex items-center justify-center hover:bg-foreground/10 transition-colors cursor-hover"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => nextSlide(carousel.id, carousel.images.length)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-card flex items-center justify-center hover:bg-foreground/10 transition-colors cursor-hover"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Dots */}
                      {carousel.images.length > 0 && (
                        <div className="flex justify-center gap-2 mt-4">
                          {carousel.images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCarouselIndices((prev) => ({ ...prev, [carousel.id]: index }))}
                              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-hover ${
                                index === currentIndex
                                  ? "w-6 bg-neon-purple"
                                  : "bg-foreground/30 hover:bg-foreground/50"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="text-center py-12 min-w-full">
                  <p className="text-muted-foreground">No carousel examples available</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default InstagramPostsSection;
