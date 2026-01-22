import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon, Video, Loader2, Replace, Download, Plus, FolderPlus, GripVertical, ArrowUp, ArrowDown, Settings } from "lucide-react";
import { toast } from "sonner";
import { uploadMediaFile, deleteMediaFile, getMediaFiles, MediaFile, replaceMediaFile, updateMediaOrder } from "@/lib/supabase/content";
import { getCombinedMedia, migrateHardcodedData, getHardcodedMedia, groupMediaByCarousel, getHardcodedCarousels } from "@/lib/supabase/migration";

interface MediaManagerProps {
  section: string;
  fileType: 'image' | 'video';
  onMediaUpdate?: () => void;
}

interface ExtendedMediaFile extends MediaFile {
  isHardcoded?: boolean;
}

interface CarouselGroup {
  carouselId: number;
  title: string;
  description?: string;
  images: ExtendedMediaFile[];
  isHardcoded?: boolean;
}

const MediaManager = ({ section, fileType, onMediaUpdate }: MediaManagerProps) => {
  const [mediaFiles, setMediaFiles] = useState<ExtendedMediaFile[]>([]);
  const [carouselGroups, setCarouselGroups] = useState<CarouselGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [newCarouselName, setNewCarouselName] = useState("");
  const [currentCarouselName, setCurrentCarouselName] = useState<string | null>(null);
  const [isManaging, setIsManaging] = useState(false);
  const [editingCarouselId, setEditingCarouselId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const carouselFileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if section uses carousel grouping
  const isCarouselSection = section === 'menus' || section === 'wedding' || section === 'carousel-example';

  // Load media files (database + hardcoded fallback)
  const loadMedia = async () => {
    setIsLoading(true);
    try {
      // Get combined media (database first, hardcoded as fallback)
      const files = await getCombinedMedia(section, fileType);
      setMediaFiles(files);
      
      // Group by carousel if needed
      if (isCarouselSection && files.length > 0) {
        const groups = groupMediaByCarousel(files, section);
        setCarouselGroups(groups);
      } else if (isCarouselSection && files.length === 0) {
        // Show hardcoded carousels if no database data
        const hardcodedCarousels = getHardcodedCarousels(section);
        const groups = hardcodedCarousels.map((carousel, index) => ({
          carouselId: index + 1,
          title: carousel.title,
          description: carousel.description,
          images: carousel.images.map((url, imgIdx) => ({
            id: `hardcoded-${index}-${imgIdx}`,
            section_name: section,
            file_name: `${carousel.title} - Slide ${imgIdx + 1}`,
            file_url: url,
            file_type: 'image' as const,
            file_size: null,
            display_order: index * 1000 + imgIdx,
            created_at: new Date().toISOString(),
            isHardcoded: true,
          })),
          isHardcoded: true,
        }));
        setCarouselGroups(groups);
      } else {
        setCarouselGroups([]);
      }
    } catch (error) {
      toast.error("Failed to load media files");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if there's hardcoded data to migrate
  const hasHardcodedData = () => {
    const hardcoded = getHardcodedMedia(section);
    return hardcoded.filter(item => item.type === fileType).length > 0;
  };

  // Migrate hardcoded data to database
  const handleMigrate = async () => {
    if (!confirm("This will import all hardcoded images/videos into the database. Continue?")) {
      return;
    }

    setMigrating(true);
    try {
      const success = await migrateHardcodedData(section);
      if (success) {
        toast.success("Data migrated successfully!");
        await loadMedia();
        onMediaUpdate?.();
      } else {
        toast.info("Data already migrated or no data to migrate");
      }
    } catch (error) {
      toast.error("Failed to migrate data");
    } finally {
      setMigrating(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadMedia();
  }, [section]);

  // Handle file upload (for carousel sections, group by carousel name)
  const handleFileUpload = async (files: FileList | null, carouselName?: string) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises: Promise<string | null>[] = [];

    // Get current max display_order for this section
    const maxOrder = mediaFiles.length > 0 
      ? Math.max(...mediaFiles.map(f => f.display_order || 0))
      : -1;

    Array.from(files).forEach((file, index) => {
      // Validate file type
      if (fileType === 'image' && !file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return;
      }
      if (fileType === 'video' && !file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a video file`);
        return;
      }

      // For carousel sections, include carousel name in filename
      if (isCarouselSection && carouselName) {
        const fileExt = file.name.split('.').pop();
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const newFileName = `${carouselName} - Slide ${index + 1}.${fileExt}`;
        const modifiedFile = new File([file], newFileName, { type: file.type });
        uploadPromises.push(uploadMediaFile(modifiedFile, section, fileType, maxOrder + 1 + index));
      } else {
        uploadPromises.push(uploadMediaFile(file, section, fileType, maxOrder + 1 + index));
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successCount = results.filter((r) => r !== null).length;
      
      if (successCount > 0) {
        if (isCarouselSection && carouselName) {
          toast.success(`Successfully created carousel "${carouselName}" with ${successCount} image(s)`);
        } else {
          toast.success(`Successfully uploaded ${successCount} file(s)`);
        }
        await loadMedia();
        // Don't call onMediaUpdate - changes are saved immediately to database
        setCurrentCarouselName(null);
        setShowCarouselModal(false);
        setNewCarouselName("");
      } else {
        toast.error("Failed to upload files");
      }
    } catch (error) {
      toast.error("Error uploading files");
    } finally {
      setUploading(false);
    }
  };

  // Handle reordering items
  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (isCarouselSection) {
      // Reorder carousels
      const newGroups = [...carouselGroups];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex < 0 || newIndex >= newGroups.length) return;
      
      [newGroups[index], newGroups[newIndex]] = [newGroups[newIndex], newGroups[index]];
      setCarouselGroups(newGroups);
      
      // Update display_order in database immediately
      const updates = newGroups.map((group, idx) => 
        group.images.map((img, imgIdx) => ({
          id: img.id,
          display_order: idx * 1000 + imgIdx,
        }))
      ).flat().filter(u => !u.id.startsWith('hardcoded-'));
      
      if (updates.length > 0) {
        const success = await updateMediaOrder(updates);
        if (success) {
          toast.success("Carousel order updated in database");
          await loadMedia(); // Reload to sync
        } else {
          toast.error("Failed to update order");
        }
      }
    } else {
      // Reorder single items
      const newFiles = [...mediaFiles];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (newIndex < 0 || newIndex >= newFiles.length) return;
      
      [newFiles[index], newFiles[newIndex]] = [newFiles[newIndex], newFiles[index]];
      setMediaFiles(newFiles);
      
      // Update display_order immediately
      const updates = newFiles
        .filter(f => !f.id.startsWith('hardcoded-'))
        .map((file, idx) => ({
          id: file.id,
          display_order: idx,
        }));
      
      if (updates.length > 0) {
        const success = await updateMediaOrder(updates);
        if (success) {
          toast.success("Item order updated in database");
          await loadMedia(); // Reload to sync
        } else {
          toast.error("Failed to update order");
        }
      }
    }
  };

  // Handle reordering images within a carousel
  const handleMoveImageInCarousel = async (carouselId: number, imageIndex: number, direction: 'up' | 'down') => {
    const carousel = carouselGroups.find(c => c.carouselId === carouselId);
    if (!carousel) return;
    
    const newImages = [...carousel.images];
    const newIndex = direction === 'up' ? imageIndex - 1 : imageIndex + 1;
    
    if (newIndex < 0 || newIndex >= newImages.length) return;
    
    [newImages[imageIndex], newImages[newIndex]] = [newImages[newIndex], newImages[imageIndex]];
    
    // Update carousel groups
    const updatedGroups = carouselGroups.map(c => 
      c.carouselId === carouselId 
        ? { ...c, images: newImages }
        : c
    );
    setCarouselGroups(updatedGroups);
    
    // Update display_order in database immediately
    const carouselStartOrder = carouselGroups.findIndex(c => c.carouselId === carouselId) * 1000;
    const updates = newImages
      .filter(img => !img.id.startsWith('hardcoded-'))
      .map((img, idx) => ({
        id: img.id,
        display_order: carouselStartOrder + idx,
      }));
    
    if (updates.length > 0) {
      const success = await updateMediaOrder(updates);
      if (success) {
        toast.success("Image order updated in database");
        await loadMedia(); // Reload to sync
      } else {
        toast.error("Failed to update order");
      }
    }
  };

  // Handle create new carousel
  const handleCreateCarousel = () => {
    setShowCarouselModal(true);
  };

  const handleCarouselSubmit = () => {
    if (!newCarouselName.trim()) {
      toast.error("Please enter a carousel name");
      return;
    }
    setCurrentCarouselName(newCarouselName.trim());
    setShowCarouselModal(false);
    // Trigger file input
    setTimeout(() => {
      carouselFileInputRef.current?.click();
    }, 100);
  };

  // Handle file delete
  const handleDelete = async (id: string, fileUrl: string, isHardcoded?: boolean) => {
    if (isHardcoded) {
      toast.error("Cannot delete hardcoded files. Migrate to database first to manage them.");
      return;
    }

    if (!confirm("Are you sure you want to delete this file?")) return;

    const success = await deleteMediaFile(id, fileUrl, fileType);
    if (success) {
      toast.success("File deleted successfully from database");
      await loadMedia();
      // Don't call onMediaUpdate - deletion is immediate
    } else {
      toast.error("Failed to delete file");
    }
  };

  // Handle file replace
  const handleReplace = (id: string, currentUrl: string, isHardcoded?: boolean) => {
    if (isHardcoded) {
      toast.error("Cannot replace hardcoded files. Migrate to database first to manage them.");
      return;
    }

    setReplacingId(id);
    replaceInputRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingId) return;

    // Validate file type
    if (fileType === 'image' && !file.type.startsWith('image/')) {
      toast.error(`${file.name} is not an image file`);
      setReplacingId(null);
      return;
    }
    if (fileType === 'video' && !file.type.startsWith('video/')) {
      toast.error(`${file.name} is not a video file`);
      setReplacingId(null);
      return;
    }

    setUploading(true);
    const existingFile = mediaFiles.find(f => f.id === replacingId);
    
    if (!existingFile) {
      toast.error("File not found");
      setUploading(false);
      setReplacingId(null);
      return;
    }

    try {
      const newUrl = await replaceMediaFile(
        replacingId,
        existingFile.file_url,
        file,
        section,
        fileType
      );

      if (newUrl) {
        toast.success("File replaced successfully in database");
        await loadMedia();
        // Don't call onMediaUpdate - replacement is immediate
      } else {
        toast.error("Failed to replace file");
      }
    } catch (error) {
      toast.error("Error replacing file");
    } finally {
      setUploading(false);
      setReplacingId(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = '';
      }
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCarouselSection && !currentCarouselName) {
      toast.info("Please create a carousel first using 'Create New Carousel' button");
      return;
    }
    handleFileUpload(e.dataTransfer.files, currentCarouselName || undefined);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area - Add New */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">
            {isCarouselSection ? 'Manage Carousels' : `Add New ${fileType === 'image' ? 'Image' : 'Video'}`}
          </h3>
          <div className="flex items-center gap-2">
            {(mediaFiles.length > 0 || carouselGroups.length > 0) && (
              <motion.button
                onClick={() => setIsManaging(!isManaging)}
                className={`px-4 py-2 rounded-lg glass-card text-sm font-medium flex items-center gap-2 ${
                  isManaging ? 'bg-neon-cyan/20 border-2 border-neon-cyan/50' : ''
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-4 h-4" />
                <span>{isManaging ? 'Done Managing' : 'Manage Order'}</span>
              </motion.button>
            )}
            {isCarouselSection && (
              <motion.button
                onClick={handleCreateCarousel}
                disabled={uploading || !!currentCarouselName}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                whileHover={{ scale: uploading || currentCarouselName ? 1 : 1.05 }}
                whileTap={{ scale: uploading || currentCarouselName ? 1 : 0.95 }}
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create New Carousel</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Carousel creation status */}
        {isCarouselSection && currentCarouselName && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 border-2 border-neon-cyan/30 bg-neon-cyan/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm mb-1">
                  Creating: <span className="text-neon-cyan">{currentCarouselName}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {uploading 
                    ? "Uploading images..." 
                    : "Click the file input below or drag and drop images"}
                </p>
              </div>
              <motion.button
                onClick={() => {
                  setCurrentCarouselName(null);
                  setNewCarouselName("");
                  if (carouselFileInputRef.current) {
                    carouselFileInputRef.current.value = '';
                  }
                }}
                className="px-3 py-1 rounded-lg glass-card text-sm hover:bg-red-500/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
            {!uploading && (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="mt-3 border-2 border-dashed border-neon-cyan/30 rounded-xl p-4 text-center hover:border-neon-cyan/50 transition-colors cursor-pointer"
                onClick={() => carouselFileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-neon-cyan" />
                  <p className="text-sm font-medium">Click to select images or drag and drop</p>
                  <p className="text-xs text-muted-foreground">
                    Select multiple images to add to "{currentCarouselName}"
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
        
        {!isCarouselSection && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-foreground/20 rounded-xl p-6 text-center hover:border-neon-purple/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={fileType === 'image' ? 'image/*' : 'video/*'}
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            
            {uploading && !replacingId ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center">
                  <Upload className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <p className="font-medium mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {fileType === 'image' 
                      ? 'PNG, JPG, WebP up to 10MB' 
                      : 'MP4, WebM up to 100MB'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    New {fileType}s will be added at the end
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Carousel Creation Modal */}
      <AnimatePresence>
        {showCarouselModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCarouselModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold mb-2">Create New Carousel</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enter a name for your carousel, then select multiple images to add to it.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Carousel Name
                  </label>
                  <input
                    type="text"
                    value={newCarouselName}
                    onChange={(e) => setNewCarouselName(e.target.value)}
                    placeholder="e.g., Bistro Restaurant, Wedding Times"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCarouselSubmit();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    All images you select will be grouped into this carousel
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleCarouselSubmit}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowCarouselModal(false);
                      setNewCarouselName("");
                    }}
                    className="px-4 py-2 rounded-xl glass-card font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input for carousel uploads */}
      {isCarouselSection && (
        <input
          ref={carouselFileInputRef}
          type="file"
          multiple
          accept={fileType === 'image' ? 'image/*' : 'video/*'}
          onChange={(e) => {
            if (currentCarouselName) {
              handleFileUpload(e.target.files, currentCarouselName);
            }
          }}
          className="hidden"
        />
      )}

      {/* Replace Input (hidden) */}
      <input
        ref={replaceInputRef}
        type="file"
        accept={fileType === 'image' ? 'image/*' : 'video/*'}
        onChange={handleReplaceFile}
        className="hidden"
      />

      {/* Migration Banner */}
      {hasHardcodedData() && (mediaFiles.some(f => f.isHardcoded) || carouselGroups.some(c => c.isHardcoded)) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-4 border-2 border-neon-cyan/30 bg-neon-cyan/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">
                📦 Hardcoded Data Detected
              </p>
              <p className="text-xs text-muted-foreground">
                These {fileType}s are currently in code. Migrate to database to edit/remove them.
              </p>
            </div>
            <motion.button
              onClick={handleMigrate}
              disabled={migrating}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {migrating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Migrating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Migrate to Database</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Current Media Files - Carousel View for Menus/Wedding */}
      {isCarouselSection && carouselGroups.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              Current Carousels - Position View
            </h3>
            <span className="text-sm text-muted-foreground">
              {carouselGroups.length} {carouselGroups.length === 1 ? 'carousel' : 'carousels'}
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-neon-purple" />
            </div>
          ) : (
            <div className="space-y-4">
              {carouselGroups.map((carousel, index) => {
                const position = index + 1;
                const isHardcoded = carousel.isHardcoded || carousel.images[0]?.isHardcoded;
                return (
                  <motion.div
                    key={carousel.carouselId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card rounded-xl p-4 border-2 transition-colors ${
                      isHardcoded 
                        ? 'border-neon-cyan/30 bg-neon-cyan/5' 
                        : 'border-foreground/10 hover:border-neon-purple/30'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Carousel Header */}
                      <div className="flex items-center gap-4">
                        {/* Position Badge */}
                        <div className="flex-shrink-0">
                          <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-lg ${
                            isHardcoded 
                              ? 'bg-gradient-to-br from-neon-cyan to-neon-purple' 
                              : 'bg-gradient-to-br from-neon-purple to-neon-cyan'
                          }`}>
                            #{position}
                          </div>
                          <p className="text-xs text-center mt-1 text-muted-foreground">
                            Carousel {position}
                          </p>
                          {isHardcoded && (
                            <p className="text-[10px] text-center mt-1 text-neon-cyan">
                              (Hardcoded)
                            </p>
                          )}
                        </div>

                        {/* Carousel Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg truncate">{carousel.title}</p>
                          {carousel.description && (
                            <p className="text-sm text-muted-foreground">{carousel.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {carousel.images.length} {carousel.images.length === 1 ? 'image' : 'images'} in this carousel
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {isHardcoded ? (
                            <div className="px-4 py-2 rounded-lg glass-card bg-muted/30">
                              <p className="text-xs text-muted-foreground">
                                Migrate to edit
                              </p>
                            </div>
                          ) : (
                            <>
                              {isManaging && (
                                <div className="flex flex-col gap-1">
                                  <motion.button
                                    onClick={() => handleMoveItem(index, 'up')}
                                    disabled={index === 0}
                                    className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:bg-neon-cyan/20 disabled:opacity-30"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Move carousel up"
                                  >
                                    <ArrowUp className="w-4 h-4 text-neon-cyan" />
                                  </motion.button>
                                  <motion.button
                                    onClick={() => handleMoveItem(index, 'down')}
                                    disabled={index === carouselGroups.length - 1}
                                    className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:bg-neon-cyan/20 disabled:opacity-30"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title="Move carousel down"
                                  >
                                    <ArrowDown className="w-4 h-4 text-neon-cyan" />
                                  </motion.button>
                                </div>
                              )}
                              <motion.button
                                onClick={() => {
                                  setEditingCarouselId(editingCarouselId === carousel.carouselId ? null : carousel.carouselId);
                                }}
                                className={`px-4 py-2 rounded-lg glass-card flex items-center gap-2 transition-colors ${
                                  editingCarouselId === carousel.carouselId 
                                    ? 'bg-neon-purple/20 border-2 border-neon-purple/50' 
                                    : 'hover:bg-neon-purple/20'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Manage images in this carousel"
                              >
                                <Settings className="w-4 h-4 text-neon-purple" />
                                <span className="text-sm">Manage</span>
                              </motion.button>
                              <motion.button
                                onClick={() => {
                                  // TODO: Replace entire carousel
                                  toast.info("Carousel replacement coming soon");
                                }}
                                disabled={uploading}
                                className="px-4 py-2 rounded-lg glass-card flex items-center gap-2 hover:bg-neon-cyan/20 disabled:opacity-50 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Replace entire carousel"
                              >
                                <Replace className="w-4 h-4 text-neon-cyan" />
                                <span className="text-sm">Replace</span>
                              </motion.button>
                              <motion.button
                                onClick={async () => {
                                  if (!confirm(`Delete entire carousel "${carousel.title}" with ${carousel.images.length} images? This will permanently remove them from the database.`)) return;
                                  
                                  setUploading(true);
                                  try {
                                    // Delete all images in carousel from database
                                    const deletePromises = carousel.images
                                      .filter(image => !image.isHardcoded)
                                      .map(image => deleteMediaFile(image.id, image.file_url, fileType));
                                    
                                    const results = await Promise.all(deletePromises);
                                    const successCount = results.filter(r => r === true).length;
                                    
                                    if (successCount === deletePromises.length) {
                                      toast.success(`Successfully deleted carousel "${carousel.title}" from database`);
                                    } else if (successCount > 0) {
                                      toast.warning(`Partially deleted: ${successCount}/${deletePromises.length} images removed`);
                                    } else {
                                      toast.error("Failed to delete carousel from database");
                                    }
                                    
                                    await loadMedia();
                                    // Don't call onMediaUpdate - deletion is immediate
                                  } catch (error) {
                                    toast.error("Error deleting carousel");
                                    console.error(error);
                                  } finally {
                                    setUploading(false);
                                  }
                                }}
                                disabled={uploading}
                                className="px-4 py-2 rounded-lg glass-card flex items-center gap-2 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title="Remove entire carousel from database"
                              >
                                <X className="w-4 h-4 text-red-400" />
                                <span className="text-sm">Remove</span>
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Carousel Images Grid */}
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 pl-20">
                        {carousel.images.map((image, imgIdx) => (
                          <div
                            key={image.id || imgIdx}
                            className="relative aspect-square rounded-lg overflow-hidden glass-card border border-foreground/10 group"
                          >
                            {fileType === 'image' ? (
                              <img
                                src={image.file_url}
                                alt={`${carousel.title} - Slide ${imgIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <video
                                src={image.file_url}
                                className="w-full h-full object-cover"
                                muted
                              />
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 text-white text-[10px] text-center">
                              Slide {imgIdx + 1}
                            </div>
                            {editingCarouselId === carousel.carouselId && !image.isHardcoded && (
                              <div className="absolute top-1 right-1 flex flex-col gap-1">
                                <motion.button
                                  onClick={() => handleMoveImageInCarousel(carousel.carouselId, imgIdx, 'up')}
                                  disabled={imgIdx === 0}
                                  className="w-6 h-6 rounded glass-card bg-black/60 flex items-center justify-center disabled:opacity-30"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Move image up"
                                >
                                  <ArrowUp className="w-3 h-3 text-white" />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleMoveImageInCarousel(carousel.carouselId, imgIdx, 'down')}
                                  disabled={imgIdx === carousel.images.length - 1}
                                  className="w-6 h-6 rounded glass-card bg-black/60 flex items-center justify-center disabled:opacity-30"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Move image down"
                                >
                                  <ArrowDown className="w-3 h-3 text-white" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : !isCarouselSection && mediaFiles.length > 0 ? (
        /* Regular single-item view for other sections */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">
              Current {fileType === 'image' ? 'Images' : 'Videos'} - Position View
            </h3>
            <span className="text-sm text-muted-foreground">
              {mediaFiles.length} {mediaFiles.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-neon-purple" />
            </div>
          ) : (
            <div className="space-y-4">
              {mediaFiles.map((file, index) => {
                const position = index + 1;
                const isHardcoded = file.isHardcoded || file.id.startsWith('hardcoded-');
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-card rounded-xl p-4 border-2 transition-colors ${
                      isHardcoded 
                        ? 'border-neon-cyan/30 bg-neon-cyan/5' 
                        : 'border-foreground/10 hover:border-neon-purple/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Position Badge */}
                      <div className="flex-shrink-0">
                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-lg ${
                          isHardcoded 
                            ? 'bg-gradient-to-br from-neon-cyan to-neon-purple' 
                            : 'bg-gradient-to-br from-neon-purple to-neon-cyan'
                        }`}>
                          #{position}
                        </div>
                        <p className="text-xs text-center mt-1 text-muted-foreground">
                          Position {position}
                        </p>
                        {isHardcoded && (
                          <p className="text-[10px] text-center mt-1 text-neon-cyan">
                            (Hardcoded)
                          </p>
                        )}
                      </div>

                      {/* Media Preview */}
                      <div className="relative flex-shrink-0 w-32 h-32 rounded-lg overflow-hidden glass-card">
                        {fileType === 'image' ? (
                          <img
                            src={file.file_url}
                            alt={file.file_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={file.file_url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Display order: {file.display_order}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {isHardcoded ? (
                          <div className="px-4 py-2 rounded-lg glass-card bg-muted/30">
                            <p className="text-xs text-muted-foreground">
                              Migrate to edit
                            </p>
                          </div>
                        ) : (
                          <>
                            {isManaging && (
                              <div className="flex flex-col gap-1">
                                <motion.button
                                  onClick={() => handleMoveItem(index, 'up')}
                                  disabled={index === 0}
                                  className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:bg-neon-cyan/20 disabled:opacity-30"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Move up"
                                >
                                  <ArrowUp className="w-4 h-4 text-neon-cyan" />
                                </motion.button>
                                <motion.button
                                  onClick={() => handleMoveItem(index, 'down')}
                                  disabled={index === mediaFiles.length - 1}
                                  className="w-8 h-8 rounded-lg glass-card flex items-center justify-center hover:bg-neon-cyan/20 disabled:opacity-30"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Move down"
                                >
                                  <ArrowDown className="w-4 h-4 text-neon-cyan" />
                                </motion.button>
                              </div>
                            )}
                            <motion.button
                              onClick={() => handleReplace(file.id, file.file_url, isHardcoded)}
                              disabled={uploading || replacingId === file.id}
                              className="px-4 py-2 rounded-lg glass-card flex items-center gap-2 hover:bg-neon-cyan/20 disabled:opacity-50 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title={`Replace ${fileType} at position ${position}`}
                            >
                              {replacingId === file.id && uploading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-neon-cyan" />
                                  <span className="text-sm">Replacing...</span>
                                </>
                              ) : (
                                <>
                                  <Replace className="w-4 h-4 text-neon-cyan" />
                                  <span className="text-sm">Replace</span>
                                </>
                              )}
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(file.id, file.file_url, isHardcoded)}
                              disabled={uploading}
                              className="px-4 py-2 rounded-lg glass-card flex items-center gap-2 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              title={`Remove ${fileType} from position ${position}`}
                            >
                              <X className="w-4 h-4 text-red-400" />
                              <span className="text-sm">Remove</span>
                            </motion.button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Empty State */}
      {!isLoading && mediaFiles.length === 0 && carouselGroups.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No {isCarouselSection ? 'carousels' : fileType + 's'} uploaded yet. Upload your first {isCarouselSection ? 'carousel' : fileType} above.</p>
        </div>
      )}
    </div>
  );
};

export default MediaManager;

