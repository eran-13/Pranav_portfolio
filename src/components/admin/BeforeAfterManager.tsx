import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Image as ImageIcon, Loader2, Replace, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { uploadMediaFile, deleteMediaFile, getMediaFiles, MediaFile, replaceMediaFile } from "@/lib/supabase/content";
import { getCombinedMedia, migrateHardcodedData, getHardcodedMedia } from "@/lib/supabase/migration";

interface ExtendedMediaFile extends MediaFile {
  isHardcoded?: boolean;
}

interface BeforeAfterItem {
  id: string;
  title: string;
  description: string;
  beforeImage: ExtendedMediaFile | null;
  afterImage: ExtendedMediaFile | null;
  display_order: number;
  isHardcoded?: boolean;
}

interface BeforeAfterManagerProps {
  section: string;
  onMediaUpdate?: () => void;
}

const BeforeAfterManager = ({ section, onMediaUpdate }: BeforeAfterManagerProps) => {
  const [items, setItems] = useState<BeforeAfterItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [replacingType, setReplacingType] = useState<'before' | 'after' | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadItems();
  }, [section]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const mediaFiles = await getCombinedMedia(section, 'image');
      
      // Group images by pair (before/after pattern)
      const itemMap = new Map<string, { before?: ExtendedMediaFile; after?: ExtendedMediaFile }>();
      
      mediaFiles.forEach((file) => {
        const extendedFile = file as ExtendedMediaFile;
        // Check if filename contains "before" or "after"
        const fileName = file.file_name.toLowerCase();
        const isBefore = fileName.includes('before');
        const isAfter = fileName.includes('after');
        
        if (isBefore || isAfter) {
          // Extract base name (e.g., "photo 1" from "photo 1 before.JPG" or "photo 1 - before")
          // Handle both formats: "photo 1 before.JPG" and "photo 1 - before"
          // Use original filename (not lowercased) for base name to preserve case
          let baseName = file.file_name
            .replace(/\s*-\s*(before|after).*$/i, '') // Remove " - before" or " - after" (case insensitive)
            .replace(/\s+(before|after).*$/i, '') // Remove " before" or " after" (case insensitive)
            .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '') // Remove file extension
            .trim();
          
          // If baseName is empty or just whitespace, try extracting from file URL
          if (!baseName || baseName.length === 0) {
            const urlPath = file.file_url || '';
            const urlFileName = urlPath.split('/').pop() || '';
            baseName = urlFileName
              .replace(/\s*-\s*(before|after).*$/i, '')
              .replace(/\s+(before|after).*$/i, '')
              .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
              .trim();
          }
          
          // Normalize base name: lowercase for comparison, but keep original for display
          const normalizedBaseName = baseName.toLowerCase().trim();
          
          // Fallback to a default name if still empty
          if (!normalizedBaseName || normalizedBaseName.length === 0) {
            const fallbackName = `item-${file.id || Math.random()}`;
            baseName = fallbackName;
            if (!itemMap.has(fallbackName)) {
              itemMap.set(fallbackName, {});
            }
          } else {
            // Use normalized name for map key, but store original for display
            if (!itemMap.has(normalizedBaseName)) {
              itemMap.set(normalizedBaseName, {});
            }
          }
          
          const item = itemMap.get(normalizedBaseName || baseName.toLowerCase())!;
          if (isBefore) {
            item.before = extendedFile;
          } else if (isAfter) {
            item.after = extendedFile;
          }
        }
      });
      
      // Convert to BeforeAfterItem array
      const loadedItems: BeforeAfterItem[] = Array.from(itemMap.entries())
        .map(([normalizedBaseName, images], index) => {
          // Get the original base name from the first available image
          let originalBaseName = normalizedBaseName;
          if (images.before?.file_name) {
            originalBaseName = images.before.file_name
              .replace(/\s*-\s*(before|after).*$/i, '')
              .replace(/\s+(before|after).*$/i, '')
              .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
              .trim();
          } else if (images.after?.file_name) {
            originalBaseName = images.after.file_name
              .replace(/\s*-\s*(before|after).*$/i, '')
              .replace(/\s+(before|after).*$/i, '')
              .replace(/\.(jpg|jpeg|png|gif|webp)$/i, '')
              .trim();
          }
          
          // Clean up the title - remove file extensions and path separators
          let title = originalBaseName;
          if (title.includes('/')) {
            title = title.split('/').pop() || title;
          }
          title = title.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').trim();
          
          // Capitalize first letter of each word for better display
          title = title
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          return {
            id: images.before?.id || images.after?.id || `item-${index}`,
            title: title || `Item ${index + 1}`,
            description: "Color grading transformation",
            beforeImage: images.before || null,
            afterImage: images.after || null,
            display_order: images.before?.display_order ?? images.after?.display_order ?? index * 1000,
            isHardcoded: images.before?.isHardcoded || images.after?.isHardcoded || false,
          };
        })
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      
      setItems(loadedItems);
    } catch (error) {
      console.error('Error loading before/after items:', error);
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const beforeFile = beforeInputRef.current?.files?.[0];
    const afterFile = afterInputRef.current?.files?.[0];

    if (!beforeFile || !afterFile) {
      toast.error("Please select both before and after images");
      return;
    }

    setUploading(true);
    try {
      const maxOrder = items.length > 0 
        ? Math.max(...items.map(i => i.display_order || 0))
        : -1;

      // Upload before image
      const beforeFileName = `${newItemTitle} - before.${beforeFile.name.split('.').pop()}`;
      const beforeFileModified = new File([beforeFile], beforeFileName, { type: beforeFile.type });
      const beforeUrl = await uploadMediaFile(beforeFileModified, section, 'image', maxOrder + 1);

      // Upload after image
      const afterFileName = `${newItemTitle} - after.${afterFile.name.split('.').pop()}`;
      const afterFileModified = new File([afterFile], afterFileName, { type: afterFile.type });
      const afterUrl = await uploadMediaFile(afterFileModified, section, 'image', maxOrder + 2);

      if (beforeUrl && afterUrl) {
        toast.success("Before/After pair added successfully");
        await loadItems();
        onMediaUpdate?.();
        setShowAddModal(false);
        setNewItemTitle("");
        setNewItemDescription("");
        if (beforeInputRef.current) beforeInputRef.current.value = '';
        if (afterInputRef.current) afterInputRef.current.value = '';
      } else {
        toast.error("Failed to upload images");
      }
    } catch (error) {
      toast.error("Error uploading images");
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = async (itemId: string, type: 'before' | 'after') => {
    const file = replaceInputRef.current?.files?.[0];
    if (!file) return;

    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const targetImage = type === 'before' ? item.beforeImage : item.afterImage;
    if (!targetImage || targetImage.isHardcoded) {
      toast.error("Cannot replace hardcoded image. Please migrate first.");
      return;
    }

    setReplacingId(itemId);
    setReplacingType(type);
    setUploading(true);

    try {
      const newUrl = await replaceMediaFile(
        targetImage.id,
        targetImage.file_url,
        file,
        section,
        'image'
      );

      if (newUrl) {
        toast.success(`${type === 'before' ? 'Before' : 'After'} image replaced successfully`);
        await loadItems();
        onMediaUpdate?.();
      } else {
        toast.error("Failed to replace image");
      }
    } catch (error) {
      toast.error("Error replacing image");
    } finally {
      setUploading(false);
      setReplacingId(null);
      setReplacingType(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleDelete = async (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    if (item.isHardcoded) {
      toast.error("Cannot delete hardcoded item. Please migrate first.");
      return;
    }

    if (!confirm(`Delete this before/after pair? This will permanently remove both images.`)) return;

    setUploading(true);
    try {
      const deletePromises: Promise<boolean>[] = [];
      
      if (item.beforeImage && !item.beforeImage.isHardcoded) {
        deletePromises.push(deleteMediaFile(item.beforeImage.id, item.beforeImage.file_url, 'image'));
      }
      
      if (item.afterImage && !item.afterImage.isHardcoded) {
        deletePromises.push(deleteMediaFile(item.afterImage.id, item.afterImage.file_url, 'image'));
      }

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r === true).length;

      if (successCount === deletePromises.length) {
        toast.success("Before/After pair deleted successfully");
        await loadItems();
        onMediaUpdate?.();
      } else {
        toast.error("Failed to delete some images");
      }
    } catch (error) {
      toast.error("Error deleting images");
    } finally {
      setUploading(false);
    }
  };

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const success = await migrateHardcodedData(section);
      if (success) {
        toast.success("Hardcoded data migrated successfully!");
        await loadItems();
        onMediaUpdate?.();
      } else {
        toast.error("Failed to migrate data");
      }
    } catch (error) {
      toast.error("Error migrating data");
    } finally {
      setMigrating(false);
    }
  };

  const hasHardcodedData = () => {
    return items.some(item => item.isHardcoded);
  };

  return (
    <div className="space-y-4">
      {/* Add New Button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Before/After Pairs</h3>
        <motion.button
          onClick={() => setShowAddModal(true)}
          disabled={uploading}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Pair</span>
        </motion.button>
      </div>

      {/* Migration Banner */}
      {hasHardcodedData() && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-4 mb-4 border-2 border-neon-cyan/30 bg-neon-cyan/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-sm mb-1">📦 Hardcoded Data Detected</p>
              <p className="text-xs text-muted-foreground">
                Some before/after pairs are currently in code. Migrate to database to edit/remove them.
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

      {/* Items List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-neon-purple" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 glass-card rounded-xl">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No before/after pairs uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => {
            const isHardcoded = item.isHardcoded;
            return (
              <motion.div
                key={item.id}
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
                  {/* Header */}
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center font-bold text-lg ${
                        isHardcoded 
                          ? 'bg-gradient-to-br from-neon-cyan to-neon-purple' 
                          : 'bg-gradient-to-br from-neon-purple to-neon-cyan'
                      }`}>
                        #{index + 1}
                      </div>
                      {isHardcoded && (
                        <p className="text-[10px] text-center mt-1 text-neon-cyan">(Hardcoded)</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {!isHardcoded && (
                      <motion.button
                        onClick={() => handleDelete(item.id)}
                        disabled={uploading}
                        className="px-4 py-2 rounded-lg glass-card flex items-center gap-2 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <X className="w-4 h-4 text-red-400" />
                        <span className="text-sm">Remove</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Images Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Before Image */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Before</label>
                      <div className="relative aspect-[1080/1350] rounded-lg overflow-hidden glass-card border border-foreground/10">
                        {item.beforeImage ? (
                          <img
                            src={item.beforeImage.file_url}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No image</span>
                          </div>
                        )}
                        {!isHardcoded && item.beforeImage && (
                          <div className="absolute top-2 right-2">
                            <motion.button
                              onClick={() => {
                                setReplacingId(item.id);
                                setReplacingType('before');
                                replaceInputRef.current?.click();
                              }}
                              className="w-8 h-8 rounded glass-card bg-black/60 flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Replace before image"
                            >
                              <Replace className="w-4 h-4 text-white" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* After Image */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">After</label>
                      <div className="relative aspect-[1080/1350] rounded-lg overflow-hidden glass-card border border-foreground/10">
                        {item.afterImage ? (
                          <img
                            src={item.afterImage.file_url}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
                            <span className="text-muted-foreground text-sm">No image</span>
                          </div>
                        )}
                        {!isHardcoded && item.afterImage && (
                          <div className="absolute top-2 right-2">
                            <motion.button
                              onClick={() => {
                                setReplacingId(item.id);
                                setReplacingType('after');
                                replaceInputRef.current?.click();
                              }}
                              className="w-8 h-8 rounded glass-card bg-black/60 flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Replace after image"
                            >
                              <Replace className="w-4 h-4 text-white" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold mb-4">Add New Before/After Pair</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder="e.g., Color Grading 1"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description (optional)</label>
                  <input
                    type="text"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    placeholder="e.g., Cinematic color transformation"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Before Image</label>
                  <input
                    ref={beforeInputRef}
                    type="file"
                    accept="image/*"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">After Image</label>
                  <input
                    ref={afterInputRef}
                    type="file"
                    accept="image/*"
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10"
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleAddItem}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-medium disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {uploading ? "Uploading..." : "Add Pair"}
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewItemTitle("");
                      setNewItemDescription("");
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

      {/* Hidden Replace Input */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          if (replacingId && replacingType && e.target.files?.[0]) {
            handleReplace(replacingId, replacingType);
          }
        }}
        className="hidden"
      />
    </div>
  );
};

export default BeforeAfterManager;

