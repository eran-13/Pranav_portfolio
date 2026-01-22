import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCombinedCarousels } from "@/lib/supabase/migration";

// Fallback hardcoded data
const fallbackWeddingPages = [
  { 
    id: 1, 
    title: "Wedding Invitation Set", 
    description: "Elegant wedding invitation design", 
    images: [
      "/assets/wedding/1.jpg",
      "/assets/wedding/2.jpg",
      "/assets/wedding/3.jpg",
      "/assets/wedding/4.jpg"
    ]
  },
];

const WeddingCarousel = ({ wedding, index, isInView }: { wedding: typeof fallbackWeddingPages[0]; index: number; isInView: boolean }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validImages, setValidImages] = useState<string[]>(wedding.images);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Update validImages when wedding.images changes
  useEffect(() => {
    setValidImages(wedding.images);
    setImageErrors(new Set()); // Reset errors when wedding changes
    setCurrentIndex(0); // Reset to first image
  }, [wedding.images]);

  // Filter out broken images
  useEffect(() => {
    const filtered = validImages.filter((_, idx) => !imageErrors.has(idx));
    // Reset current index if it's out of bounds
    if (currentIndex >= filtered.length && filtered.length > 0) {
      setCurrentIndex(0);
    } else if (filtered.length === 0) {
      setCurrentIndex(0);
    }
  }, [validImages, imageErrors, currentIndex]);

  const handleImageError = (idx: number) => {
    setImageErrors(prev => new Set(prev).add(idx));
  };

  const nextSlide = () => {
    if (validImages.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }
  };

  const prevSlide = () => {
    if (validImages.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
    }
  };

  return (
        <motion.div
      key={wedding.id}
      className="group cursor-hover media-card"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
          <motion.div
        className="relative aspect-[210/297] rounded-xl overflow-hidden glass-card"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
              <div className="relative w-full h-full overflow-hidden rounded-xl">
          {validImages.length > 0 ? (
                  <motion.div
                    className="flex h-full"
              animate={{ x: `-${currentIndex * 100}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    key={`carousel-${wedding.id}-${validImages.length}`}
                    >
              {validImages.map((image, idx) => {
                        if (imageErrors.has(idx)) return null;
                        return (
                          <div
                            key={`${wedding.id}-${idx}-${image}`}
                            className="w-full flex-shrink-0 h-full relative"
                          >
                            <img 
                              src={image} 
                              alt={`${wedding.title} - Slide ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(idx)}
                              loading="lazy"
                            />
                          </div>
                        );
                      })}
                  </motion.div>
              ) : (
            /* Placeholder when no images */
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/10 via-muted/30 to-amber-50/10 p-4 z-0">
                  {/* Newspaper Header */}
                  <div className="mb-3 pb-2 border-b-2 border-foreground/20">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-3 w-12 bg-foreground/40 rounded" />
                      <div className="h-2.5 w-20 bg-foreground/30 rounded" />
                      <div className="h-3 w-12 bg-foreground/40 rounded" />
                    </div>
                    <div className="h-1 w-full bg-foreground/20 rounded" />
                  </div>

                  {/* Main Headline - Wedding Style */}
                  <div className="mb-3">
                    <div className="h-6 w-full bg-gradient-to-r from-neon-purple/40 via-neon-pink/40 to-neon-purple/40 rounded mb-1.5" />
                    <div className="h-2 w-3/4 bg-foreground/20 rounded mb-1" />
                    <div className="h-2 w-2/3 bg-foreground/20 rounded" />
                  </div>

                  {/* Newspaper Columns */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="space-y-1">
                      {[1, 2, 3].map((line) => (
                        <div key={line} className="h-1 w-full bg-foreground/15 rounded" />
                      ))}
                    </div>
                    <div className="space-y-1">
                      {[1, 2, 3].map((line) => (
                        <div key={line} className="h-1 w-full bg-foreground/15 rounded" />
                      ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
          {validImages.length > 1 && (
                  <>
                    <button
                onClick={prevSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-card flex items-center justify-center hover:bg-foreground/20 transition-colors cursor-hover z-20"
                    >
                      <ChevronLeft className="w-4 h-4 text-foreground" />
                    </button>
                    <button
                onClick={nextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass-card flex items-center justify-center hover:bg-foreground/20 transition-colors cursor-hover z-20"
                    >
                      <ChevronRight className="w-4 h-4 text-foreground" />
                    </button>
                  </>
              )}

          {/* Title Overlay */}
              <div className="absolute top-3 left-3 right-3 z-10">
            <p className="font-medium text-xs">{wedding.title}</p>
            <p className="text-[10px] text-muted-foreground">{wedding.description}</p>
              </div>

                {/* Dots Indicator */}
          {validImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {validImages.map((_, idx) => (
                      <button
                        key={idx}
                  onClick={() => setCurrentIndex(idx)}
                        className={`h-2 rounded-full transition-all duration-300 cursor-hover ${
                    idx === currentIndex
                            ? "w-6 bg-neon-purple"
                            : "w-2 bg-foreground/30 hover:bg-foreground/50"
                        }`}
                      />
                    ))}
              </div>
                )}

              {/* Neon Border */}
              <div className="absolute inset-0 rounded-xl border border-foreground/10 group-hover:border-neon-purple/40 transition-colors duration-300" />
              <motion.div
                className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  boxShadow: "0 0 40px hsl(280 100% 65% / 0.3), inset 0 0 40px hsl(280 100% 65% / 0.1)",
                }}
              />
              </div>
      </motion.div>
          </motion.div>
  );
};

const WeddingInvitationSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [weddingPages, setWeddingPages] = useState(fallbackWeddingPages);

  // Load from database, fallback to hardcoded
  const loadWeddings = async () => {
    try {
      const carousels = await getCombinedCarousels('wedding', 'image');
      
      if (carousels.length > 0) {
        // Trust database items - don't validate them (validation can fail due to CORS/timeout)
        const validCarousels = [];
        for (const carousel of carousels) {
          // Trust all images from database, only filter hardcoded ones if needed
          const validImages = carousel.images
            .filter((img) => {
              // Always trust database items
              if (!img.isHardcoded) {
                return true;
              }
              // For hardcoded/local files, they should exist
              return img.file_url.startsWith('/');
            })
            .map((img) => img.file_url);
          
          if (validImages.length > 0) {
            validCarousels.push({
              id: carousel.carouselId,
              title: carousel.title,
              description: carousel.description || `${carousel.title} wedding invitation`,
              images: validImages,
            });
          }
        }
        
        // ALWAYS set database carousels if we have any - don't keep fallback
        if (validCarousels.length > 0) {
          setWeddingPages(validCarousels);
        }
      }
    } catch (error) {
      console.error('Error loading wedding invitations:', error);
      // Keep fallback data
    }
  };

  useEffect(() => {
    loadWeddings();
    
    // Reload when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadWeddings();
      }
    };
    
    // Reload when window gains focus
    const handleFocus = () => {
      loadWeddings();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <section id="wedding-invitation" className="relative py-12 px-4 overflow-hidden">
      <div className="section-divider mb-12" />

      <div className="container mx-auto max-w-7xl" ref={ref}>
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-neon-purple text-sm font-medium tracking-widest uppercase mb-4 block">
            Invitation Design
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Wedding <span className="neon-text">Invitation</span>
          </h2>
          <p className="text-muted-foreground mt-4">Newspaper Style Multi-Page Design</p>
        </motion.div>

        {/* Wedding Invitation Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
          <div className="flex gap-4 min-w-max justify-center">
            {weddingPages.map((wedding, index) => (
              <div key={`wedding-${wedding.id}-${wedding.images.length}`} className="w-[280px] flex-shrink-0">
                <WeddingCarousel wedding={wedding} index={index} isInView={isInView} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WeddingInvitationSection;


