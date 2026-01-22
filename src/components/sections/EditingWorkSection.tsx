import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useDragToScroll } from "@/hooks/useDragToScroll";
import { getCombinedMedia } from "@/lib/supabase/migration";

// Fallback hardcoded data
const fallbackBeforeAfterItems = [
  { 
    id: 1, 
    title: "Color Grading", 
    description: "Cinematic color transformation",
    before: "/assets/photo-edit/photo 1 before.JPG",
    after: "/assets/photo-edit/photo 1 after.JPG"
  },
  { 
    id: 2, 
    title: "Color Grading", 
    description: "Cinematic color transformation",
    before: "/assets/photo-edit/photo 2 before.jpg",
    after: "/assets/photo-edit/photo 2 after.jpg"
  },
];

const fallbackVideoEdits = [
  { id: 1, video: "/assets/shoot-edit/1.MP4", title: "Shoot and Edit 1", duration: "3:45" },
  { id: 2, video: "/assets/shoot-edit/2.mp4", title: "Shoot and Edit 2", duration: "0:30" },
  { id: 3, video: "/assets/shoot-edit/3.mp4", title: "Shoot and Edit 3", duration: "4:20" },
];

const VideoPlayer = ({
  video,
  index,
  isInView,
}: {
  video: typeof videoEdits[0];
  index: number;
  isInView: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch((err) => {
          console.error("Error playing video:", err);
        });
        setIsPlaying(true);
      }
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="group cursor-hover media-card"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
    >
      <motion.div
        className="relative aspect-video rounded-xl overflow-hidden glass-card group"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        {/* Video */}
        {video.video ? (
          <video 
            ref={videoRef}
            src={video.video}
            className="w-full h-full object-cover"
            muted={isMuted}
            loop
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={(e) => {
              console.error("Video error:", e);
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-neon-magenta/30 to-neon-purple/30" />
        )}

        {/* Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.button
            onClick={handleVideoClick}
            className={`w-20 h-20 rounded-full glass-card flex items-center justify-center transition-all duration-300 cursor-pointer pointer-events-auto ${
              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            }`}
            whileHover={{ scale: 1.1, boxShadow: "0 0 30px hsl(320 100% 60% / 0.5)" }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-foreground" fill="currentColor" />
            ) : (
              <Play className="w-8 h-8 text-foreground ml-1" fill="currentColor" />
            )}
          </motion.button>
        </div>

        {/* Mute/Unmute Button */}
        {video.video && (
          <motion.button
            onClick={handleMuteToggle}
            className="absolute top-3 right-3 w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-foreground/10 transition-colors cursor-pointer z-10 pointer-events-auto"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-foreground" />
            ) : (
              <Volume2 className="w-5 h-5 text-foreground" />
            )}
          </motion.button>
        )}

        {/* Video Timeline */}
        {video.video && duration > 0 && (
          <div className="absolute bottom-12 left-3 right-3 z-20">
            <div 
              className="relative h-1.5 bg-foreground/20 rounded-full cursor-pointer group/timeline"
              onClick={handleTimelineClick}
            >
              {/* Progress Bar */}
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-neon-magenta to-neon-purple rounded-full transition-all"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
              
              {/* Progress Handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-foreground rounded-full opacity-0 group-hover/timeline:opacity-100 transition-opacity shadow-lg"
                style={{ left: `calc(${(currentTime / duration) * 100}% - 8px)` }}
              />
            </div>
            
            {/* Time Display */}
            <div className="flex justify-between items-center mt-1.5 text-[10px] text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Duration Badge (actual video duration) */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded glass-card text-xs pointer-events-none">
          {formatTime(duration || 0)}
        </div>

        {/* Title */}
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
          <p className="font-medium text-sm truncate max-w-full">{video.title}</p>
        </div>

        {/* Neon Border */}
        <div className="absolute inset-0 rounded-xl border border-foreground/10 group-hover:border-neon-magenta/40 transition-colors duration-300 pointer-events-none" />
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            boxShadow: "0 0 40px hsl(320 100% 60% / 0.3)",
          }}
        />
      </motion.div>
    </motion.div>
  );
};

const BeforeAfterSlider = ({ item }: { item: typeof beforeAfterItems[0] }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Handle mouse events globally when dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };
    
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <div>
    <div
      ref={containerRef}
      className={`relative aspect-[1080/1350] rounded-xl overflow-hidden glass-card cursor-ew-resize group media-card ${isDragging ? 'select-none' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Before */}
      {item.before ? (
        <img 
          src={item.before} 
          alt="Before"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            // Show placeholder if image fails
            const placeholder = e.currentTarget.parentElement?.querySelector('.before-placeholder') as HTMLElement;
            if (placeholder) placeholder.style.display = 'flex';
          }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 before-placeholder" style={{ display: item.before ? 'none' : 'flex' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-muted-foreground">Before</span>
        </div>
      </div>

      {/* After */}
      {item.after ? (
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img 
            src={item.after} 
            alt="After"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              // Show placeholder if image fails
              const placeholder = e.currentTarget.parentElement?.parentElement?.querySelector('.after-placeholder') as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }}
          />
        </div>
      ) : null}
      <div
        className="absolute inset-0 bg-gradient-to-br from-neon-purple/40 to-neon-cyan/40 after-placeholder"
        style={{ 
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          display: item.after ? 'none' : 'flex'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-foreground font-medium">After</span>
        </div>
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-foreground z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground flex items-center justify-center shadow-lg">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-background rounded-full" />
            <div className="w-0.5 h-4 bg-background rounded-full" />
          </div>
        </div>
      </div>

      {/* Border Glow */}
      <div className="absolute inset-0 rounded-xl border border-foreground/10 group-hover:border-neon-cyan/40 transition-colors duration-300" />
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow: "0 0 40px hsl(190 100% 50% / 0.3), inset 0 0 40px hsl(190 100% 50% / 0.1)",
        }}
      />

      {/* Title */}
      <div className="absolute bottom-4 left-4 right-4">
        <p className="font-medium text-sm">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.description}</p>
      </div>
    </div>
    {/* Before/After Labels */}
    <div className="flex justify-between items-center mt-2 px-1">
      <span className="text-[10px] text-muted-foreground">After</span>
      <span className="text-[10px] text-muted-foreground">Before</span>
    </div>
  </div>
  );
};

const EditingWorkSection = () => {
  const ref = useRef(null);
  const beforeAfterScrollRef = useRef<HTMLDivElement>(null);
  const shootEditScrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [beforeAfterItems, setBeforeAfterItems] = useState(fallbackBeforeAfterItems);
  const [videoEdits, setVideoEdits] = useState(fallbackVideoEdits);
  
  useDragToScroll(beforeAfterScrollRef);
  useDragToScroll(shootEditScrollRef);

  // Load before/after images from database
  const loadBeforeAfter = async () => {
    try {
      const mediaFiles = await getCombinedMedia('editing', 'image');
      
      if (mediaFiles.length > 0) {
        // Group by before/after pairs
        const itemMap = new Map<
          string,
          { before?: string; after?: string; order: number }
        >();
        
        mediaFiles.forEach((file) => {
          const fileName = file.file_name.toLowerCase();
          const isBefore = fileName.includes('before');
          const isAfter = fileName.includes('after');
          
          if (isBefore || isAfter) {
            // Extract base name
            let baseName = file.file_name
              .replace(/\s*-\s*(before|after).*$/i, '')
              .replace(/\s+(before|after).*$/i, '')
              .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
              .trim();
            
            if (!baseName || baseName.length === 0) {
              baseName = `item-${file.id}`;
            }
            
            const normalizedBaseName = baseName.toLowerCase().trim();
            
            if (!itemMap.has(normalizedBaseName)) {
              itemMap.set(normalizedBaseName, { order: Number.POSITIVE_INFINITY });
            }
            
            const item = itemMap.get(normalizedBaseName)!;
            // Keep the earliest display_order among the pair so sorting matches admin order
            const displayOrder =
              typeof (file as any).display_order === "number"
                ? (file as any).display_order
                : Number.POSITIVE_INFINITY;
            item.order = Math.min(item.order ?? Number.POSITIVE_INFINITY, displayOrder);
            if (isBefore) {
              item.before = file.file_url;
            } else if (isAfter) {
              item.after = file.file_url;
            }
          }
        });
        
        // Sort to match admin panel sequence (display_order ascending)
        const dbItems = Array.from(itemMap.entries())
          .sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0))
          .map(([baseName, images], index) => {
            // Get original base name for title
            let title = baseName
              .split(/\s+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            if (!title || title === 'Item') {
              title = `Item ${index + 1}`;
            }
            
            return {
              id: `item-${index + 1}`,
              title: title || `Color Grading ${index + 1}`,
              description: "Cinematic color transformation",
              before: images.before || undefined,
              after: images.after || undefined,
            };
          })
          .filter(item => item.before || item.after); // Only include items with at least one image
        
        if (dbItems.length > 0) {
          setBeforeAfterItems(dbItems);
        }
      }
    } catch (error) {
      console.error('Error loading before/after images:', error);
    }
  };

  // Load videos from database
  const loadVideos = async () => {
    try {
      const mediaFiles = await getCombinedMedia('shoot-edit', 'video');
      
      if (mediaFiles.length > 0) {
        const dbVideos = mediaFiles.map((file, index) => ({
          id: index + 1,
          video: file.file_url,
          // Clean up long/generated file names for display
          title:
            (file.file_name
              .replace(/\.[^/.]+$/, "")
              .replace(/[_-]+/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 60)) || `Shoot and Edit ${index + 1}`,
          // Duration is derived from video metadata inside VideoPlayer
          duration: "",
        }));
        setVideoEdits(dbVideos);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  useEffect(() => {
    loadBeforeAfter();
    loadVideos();
    
    // Reload when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadBeforeAfter();
        loadVideos();
      }
    };
    
    const handleFocus = () => {
      loadBeforeAfter();
      loadVideos();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <section id="editing" className="relative py-24 px-4 overflow-hidden">
      <div className="section-divider mb-24" />

      <div className="container mx-auto max-w-7xl" ref={ref}>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-neon-cyan text-sm font-medium tracking-widest uppercase mb-4 block">
            Post Production
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Editing <span className="neon-text">Work</span>
          </h2>
        </motion.div>

        {/* Before/After Sliders */}
        <div className="mb-20">
          <h3 className="text-xl font-display font-semibold mb-8 text-center">
            Photo <span className="text-neon-purple">Editing</span>
          </h3>
          {/* Single row (same sequence as admin), horizontal scroll */}
          <div ref={beforeAfterScrollRef} className="overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4 overflow-y-visible horizontal-scroll">
            <div className="flex gap-6 min-w-max justify-center py-4">
              {beforeAfterItems.map((item, index) => (
              <motion.div
                key={item.id}
                className="flex-none w-[320px] md:w-[420px] snap-start"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <BeforeAfterSlider item={item} />
              </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Video Editing Previews */}
        <div>
          <h3 className="text-xl font-display font-semibold mb-8 text-center">
            Shoot and <span className="text-neon-magenta">Edit</span>
          </h3>
          {/* Single row, horizontal scroll (same sequence as admin) */}
          <div
            ref={shootEditScrollRef}
            className="overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4 overflow-y-visible horizontal-scroll"
          >
            <div className="flex gap-6 min-w-max justify-center py-4">
              {videoEdits.map((video, index) => (
                <div
                  key={video.id}
                  className="flex-none w-[320px] md:w-[420px] snap-start"
                >
                  <VideoPlayer video={video} index={index} isInView={isInView} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditingWorkSection;
