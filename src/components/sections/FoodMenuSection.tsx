import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCombinedMedia } from "@/lib/supabase/migration";

// Fallback hardcoded data
const fallbackFoodMenus = [
  { 
    id: 1, 
    title: "Bistro Restaurant", 
    description: "Elegant dining menu design", 
    images: [
      "/assets/menus/Bistro Restaurant_page-0001.jpg",
      "/assets/menus/Bistro Restaurant_page-0002.jpg",
      "/assets/menus/Bistro Restaurant_page-0003.jpg",
      "/assets/menus/Bistro Restaurant_page-0004.jpg",
      "/assets/menus/Bistro Restaurant_page-0005.jpg",
      "/assets/menus/Bistro Restaurant_page-0006.jpg",
      "/assets/menus/Bistro Restaurant_page-0007.jpg",
      "/assets/menus/Bistro Restaurant_page-0008.jpg"
    ]
  },
  { 
    id: 2, 
    title: "Retro Menu", 
    description: "Modern coffee shop menu", 
    images: [
      "/assets/menus/Retro menu.pdf_page-0001.jpg",
      "/assets/menus/Retro menu.pdf_page-0002.jpg",
      "/assets/menus/Retro menu.pdf_page-0003.jpg"
    ]
  },
];

type MenuType = {
  id: number;
  title: string;
  description: string;
  images: string[];
};

const MenuCarousel = ({ menu, index, isInView }: { menu: MenuType; index: number; isInView: boolean }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [validImages, setValidImages] = useState<string[]>(menu.images);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  // Update validImages when menu.images changes
  useEffect(() => {
    setValidImages(menu.images);
    setImageErrors(new Set()); // Reset errors when menu changes
    setCurrentIndex(0); // Reset to first image
  }, [menu.images]);

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

  // Removed auto-play - now button-controlled only

  return (
    <motion.div
      key={menu.id}
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
              key={`carousel-${menu.id}-${validImages.length}`}
              >
              {validImages.map((image, idx) => {
                if (imageErrors.has(idx)) return null;
                return (
                  <div
                    key={`${menu.id}-${idx}-${image}`}
                    className="w-full flex-shrink-0 h-full relative"
                  >
                    <img 
                      src={image} 
                      alt={`${menu.title} - Slide ${idx + 1}`}
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
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/30 p-5 z-0">
            {/* Menu Header */}
            <div className="mb-4 pb-3 border-b border-foreground/10">
              <div className="h-6 w-24 bg-gradient-to-r from-neon-purple/40 to-neon-cyan/40 rounded mb-1.5" />
              <div className="h-1.5 w-20 bg-foreground/20 rounded" />
            </div>

            {/* Menu Items Placeholder */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="h-3 w-24 bg-foreground/30 rounded mb-1.5" />
                    <div className="h-2.5 w-36 bg-foreground/20 rounded" />
                  </div>
                  <div className="h-3 w-12 bg-gradient-to-r from-neon-purple/40 to-neon-cyan/40 rounded" />
                </div>
              ))}
            </div>

            {/* Menu Footer */}
            <div className="absolute bottom-5 left-5 right-5 pt-3 border-t border-foreground/10">
              <div className="h-2.5 w-32 bg-foreground/20 rounded mx-auto" />
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
          <p className="font-medium text-xs">{menu.title}</p>
          <p className="text-[10px] text-muted-foreground">{menu.description}</p>
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
                      ? "w-6 bg-neon-cyan"
                      : "w-2 bg-foreground/30 hover:bg-foreground/50"
                  }`}
                />
              ))}
        </div>
          )}

        {/* Neon Border */}
        <div className="absolute inset-0 rounded-xl border border-foreground/10 group-hover:border-neon-cyan/40 transition-colors duration-300" />
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            boxShadow: "0 0 40px hsl(190 100% 50% / 0.3), inset 0 0 40px hsl(190 100% 50% / 0.1)",
          }}
        />
        </div>
      </motion.div>
    </motion.div>
  );
};

const FoodMenuSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [foodMenus, setFoodMenus] = useState(fallbackFoodMenus);

  // Load from database, fallback to hardcoded
  const loadMenus = async () => {
    try {
      const mediaFiles = await getCombinedMedia('menus', 'image');
      
      if (mediaFiles.length > 0) {
        // Trust database items - don't validate them (validation can fail due to CORS/timeout)
        // Only validate hardcoded/local files if needed
        const validMediaFiles = mediaFiles.filter((file) => {
          // Always trust database items (not hardcoded)
          if (!file.isHardcoded) {
            return true;
          }
          // For hardcoded/local files, they should exist
          return file.file_url.startsWith('/');
        });

        if (validMediaFiles.length > 0) {
          // Group images by menu title (assuming naming pattern)
          const menuMap = new Map<string, string[]>();
          validMediaFiles.forEach((file) => {
            // Extract menu name from filename
            // Try multiple patterns: "Menu Name - Slide X", "Menu Name - X", or just "Menu Name"
            let menuName = 'Menu';
            const slideMatch = file.file_name.match(/^(.+?)\s*-\s*Slide\s+\d+/i);
            if (slideMatch) {
              menuName = slideMatch[1].trim();
            } else {
              const parts = file.file_name.split(' - ');
              menuName = parts[0]?.trim() || file.file_name.split('.')[0] || 'Menu';
            }
            
            if (!menuMap.has(menuName)) {
              menuMap.set(menuName, []);
            }
            menuMap.get(menuName)!.push(file.file_url);
          });
          
          const dbMenus = Array.from(menuMap.entries()).map(([title, images], index) => ({
            id: index + 1,
            title: title,
            description: `${title} menu design`,
            images: images,
          }));
          
          // ALWAYS set database menus if we have any - don't keep fallback
          if (dbMenus.length > 0) {
            setFoodMenus(dbMenus);
          }
        }
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      // Keep fallback data
    }
  };

  useEffect(() => {
    loadMenus();
    
    // Reload when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadMenus();
      }
    };
    
    // Reload when window gains focus
    const handleFocus = () => {
      loadMenus();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <section id="food-menu" className="relative py-12 px-4 overflow-hidden">
      <div className="section-divider mb-12" />

      <div className="container mx-auto max-w-7xl" ref={ref}>
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-neon-cyan text-sm font-medium tracking-widest uppercase mb-4 block">
            Menu Design
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Food <span className="neon-text">Menus</span>
          </h2>
        </motion.div>

        {/* Food Menu Horizontal Scroll */}
        <div className="overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
          <div className="flex gap-4 min-w-max justify-center">
          {foodMenus.map((menu, index) => (
              <div key={menu.id} className="w-[280px] flex-shrink-0">
                <MenuCarousel menu={menu} index={index} isInView={isInView} />
              </div>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FoodMenuSection;


