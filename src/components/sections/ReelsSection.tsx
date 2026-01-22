import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { useDragToScroll } from "@/hooks/useDragToScroll";
import { getCombinedMedia } from "@/lib/supabase/migration";

// Fallback hardcoded data
const fallbackReels = [
  { id: 1, video: "/assets/reels/1.mp4", title: "Reel 1", duration: "0:30" },
  { id: 2, video: "/assets/reels/2.mp4", title: "Reel 2", duration: "0:45" },
  { id: 3, video: "/assets/reels/3.mp4", title: "Reel 3", duration: "1:00" },
];

const ReelVideoPlayer = ({ 
  reel, 
  index, 
  isInView 
}: { 
  reel: typeof reels[0]; 
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
      className="relative group cursor-hover media-card"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <motion.div
        className="relative w-52 aspect-[9/16] rounded-2xl overflow-visible glass-card group"
        whileHover={{ 
          scale: 1.05,
          rotateY: 5,
          z: 50,
        }}
        transition={{ duration: 0.3 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Video Container */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden">
        {/* Reel Video */}
        {reel.video ? (
          <video 
            ref={videoRef}
            src={reel.video}
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
          <>
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-neon-magenta/30 via-neon-purple/30 to-neon-cyan/30" />
          </>
        )}
        </div>
        
        {/* Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.button
            onClick={handleVideoClick}
            className={`w-16 h-16 rounded-full glass-card flex items-center justify-center transition-all duration-300 cursor-pointer pointer-events-auto ${
              isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
            }`}
            whileHover={{ scale: 1.1, boxShadow: "0 0 30px hsl(320 100% 60% / 0.5)" }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-foreground" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 text-foreground ml-1" fill="currentColor" />
            )}
          </motion.button>
        </div>

        {/* Mute/Unmute Button */}
        {reel.video && (
          <motion.button
            onClick={handleMuteToggle}
            className="absolute top-3 right-3 w-9 h-9 rounded-full glass-card flex items-center justify-center hover:bg-foreground/10 transition-colors cursor-pointer z-10 pointer-events-auto"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-foreground" />
            ) : (
              <Volume2 className="w-4 h-4 text-foreground" />
            )}
          </motion.button>
        )}

        {/* Video Timeline */}
        {reel.video && duration > 0 && (
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

        {/* Duration Badge */}
        <div className="absolute top-3 right-3 px-2 py-1 rounded glass-card text-xs pointer-events-none">
          {reel.duration}
        </div>

        {/* Title */}
        <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
          <p className="font-medium text-sm truncate max-w-full">
            {reel.title}
          </p>
        </div>

        {/* Hover Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            boxShadow: "0 0 40px hsl(320 100% 60% / 0.4), inset 0 0 40px hsl(320 100% 60% / 0.1)",
          }}
        />

        {/* Border Glow */}
        <div className="absolute inset-0 rounded-2xl border border-foreground/10 group-hover:border-neon-magenta/50 transition-colors duration-300 pointer-events-none" />
      </motion.div>
    </motion.div>
  );
};

const ReelsSection = () => {
  const ref = useRef(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [reels, setReels] = useState(fallbackReels);
  useDragToScroll(scrollContainerRef);

  // Load from database, fallback to hardcoded
  const loadReels = async () => {
    try {
      const mediaFiles = await getCombinedMedia('reels', 'video');
      
      if (mediaFiles.length > 0) {
        const dbReels = mediaFiles.map((file, index) => ({
          id: index + 1,
          video: file.file_url,
          // Make title UI-safe: strip extension and collapse long/ugly generated names
          title:
            (file.file_name
              .replace(/\.[^/.]+$/, "")
              .replace(/[_-]+/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 60)) || `Reel ${index + 1}`,
          duration: "0:30", // Default duration
        }));
        setReels(dbReels);
      }
    } catch (error) {
      console.error('Error loading reels:', error);
      // Keep fallback data
    }
  };

  useEffect(() => {
    loadReels();
    
    // Reload when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadReels();
      }
    };
    
    // Reload when window gains focus
    const handleFocus = () => {
      loadReels();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <section id="reels" className="relative py-24 px-4 overflow-hidden">
      <div className="section-divider mb-24" />

      <div className="container mx-auto max-w-7xl" ref={ref}>
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="text-neon-magenta text-sm font-medium tracking-widest uppercase mb-4 block">
            Vertical Content
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold">
            Reels
          </h2>
        </motion.div>

        {/* Horizontal Scrolling Carousel */}
        <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide pb-8 -mx-4 px-4 overflow-y-visible horizontal-scroll">
          <div className="flex gap-6 min-w-max justify-center py-4">
            {reels.map((reel, index) => (
              <ReelVideoPlayer
                key={reel.id}
                reel={reel}
                index={index}
                isInView={isInView}
              />
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

export default ReelsSection;

