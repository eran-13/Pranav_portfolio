import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2, Download, Image as ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { getContent, saveContent, uploadMediaFile, replaceMediaFile } from "@/lib/supabase/content";
import { supabase } from "@/integrations/supabase/client";
import { getHardcodedContent, migrateHardcodedData } from "@/lib/supabase/migration";
import MediaManager from "@/components/admin/MediaManager";
import BeforeAfterManager from "@/components/admin/BeforeAfterManager";

const ContentEditor = () => {
  const { section } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<any>(null);
  const [originalContent, setOriginalContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hardcodedContent, setHardcodedContent] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(content) !== JSON.stringify(originalContent);

  // Determine if this section has media
  const mediaSections: Record<string, { type: 'image' | 'video'; specialType?: 'before-after' | 'carousel' }> = {
    stories: { type: 'image' },
    pinterest: { type: 'image' },
    posts: { type: 'image' }, // Single posts
    'carousel-example': { type: 'image', specialType: 'carousel' }, // Carousel examples
    editing: { type: 'image', specialType: 'before-after' },
    'shoot-edit': { type: 'video' },
    reels: { type: 'video' },
    menus: { type: 'image' },
    wedding: { type: 'image' },
  };

  const hasMedia = section ? section in mediaSections : false;
  const mediaType = section ? mediaSections[section]?.type : 'image';
  const specialType = section ? mediaSections[section]?.specialType : undefined;

  useEffect(() => {
    if (section) {
      loadContent();
    }
  }, [section]);

  const loadContent = async () => {
    if (!section) return;
    
    setIsLoading(true);
    try {
      // Load from database
      const data = await getContent(section);
      const contentData = data || {};
      
      // Keep a raw JSON string for socialLinks so editing/selecting is stable
      const withRawSocial = {
        ...contentData,
        ...(contentData?.socialLinks
          ? { _socialLinksRaw: JSON.stringify(contentData.socialLinks, null, 2) }
          : {}),
      };
      
      setContent(withRawSocial);
      setOriginalContent(JSON.parse(JSON.stringify(withRawSocial))); // Deep copy for comparison
      
      // Check for hardcoded content
      const hardcoded = getHardcodedContent(section);
      if (hardcoded && (!data || Object.keys(data).length === 0)) {
        setHardcodedContent(hardcoded);
      } else {
        setHardcodedContent(null);
      }
    } catch (error) {
      toast.error("Failed to load content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateContent = async () => {
    if (!section) return;
    
    setMigrating(true);
    try {
      const hardcoded = getHardcodedContent(section);
      if (hardcoded) {
        const success = await saveContent(section, hardcoded);
        if (success) {
          toast.success("Content migrated successfully!");
          await loadContent();
        } else {
          toast.error("Failed to migrate content");
        }
      }
    } catch (error) {
      toast.error("Error migrating content");
    } finally {
      setMigrating(false);
    }
  };

  const handleSave = async () => {
    if (!section) return;
    
    if (!hasUnsavedChanges) {
      toast.info("No changes to save");
      return;
    }
    
    setIsSaving(true);
    try {
      const success = await saveContent(section, content);
      if (success) {
        toast.success("Content saved successfully!");
        setOriginalContent(JSON.parse(JSON.stringify(content))); // Update original after save
      } else {
        toast.error("Failed to save content");
      }
    } catch (error) {
      toast.error("Error saving content");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (field: string, value: any) => {
    setContent((prev: any) => {
      const next = { ...prev, [field]: value };
      if (field === "socialLinks") {
        next._socialLinksRaw = JSON.stringify(value || [], null, 2);
      }
      return next;
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!section) return;
    
    setUploadingImage(true);
    try {
      // Upload image to about section media
      const imageUrl = await uploadMediaFile(file, 'about', 'image', 0);
      
      if (imageUrl) {
        // Update content with new image URL
        handleContentChange('image', imageUrl);
        toast.success("Image uploaded successfully! Click Save to persist changes.");
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      toast.error("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageReplace = async (file: File) => {
    if (!section || !content?.image) return;
    
    setUploadingImage(true);
    try {
      // Get existing media file to replace
      const { data: existingMedia } = await supabase
        .from('portfolio_media')
        .select('id, file_url')
        .eq('section_name', 'about')
        .eq('file_url', content.image)
        .single();
      
      if (existingMedia) {
        // Replace existing file
        const newUrl = await replaceMediaFile(existingMedia.id, existingMedia.file_url, file, 'about', 'image');
        if (newUrl) {
          handleContentChange('image', newUrl);
          toast.success("Image replaced successfully! Click Save to persist changes.");
        } else {
          toast.error("Failed to replace image");
        }
      } else {
        // No existing file, just upload new one
        await handleImageUpload(file);
      }
    } catch (error) {
      toast.error("Error replacing image");
    } finally {
      setUploadingImage(false);
    }
  };

  if (!section) {
    return <div>Invalid section</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <motion.button
            onClick={() => navigate("/admin/dashboard")}
            className="w-10 h-10 rounded-xl glass-card flex items-center justify-center hover:bg-foreground/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold capitalize">
              Edit {section.replace("-", " ")}
            </h1>
            <p className="text-muted-foreground">Manage content for this section</p>
          </div>
            <motion.button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={`px-6 py-2 rounded-xl flex items-center gap-2 transition-all ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-neon-purple to-neon-cyan'
                : 'bg-muted/50 opacity-50 cursor-not-allowed'
            }`}
            whileHover={hasUnsavedChanges ? { scale: 1.05 } : {}}
            whileTap={hasUnsavedChanges ? { scale: 0.95 } : {}}
            >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
                {hasUnsavedChanges && (
                  <span className="text-xs bg-red-500/20 px-2 py-0.5 rounded-full">Unsaved</span>
                )}
              </>
            )}
            </motion.button>
        </motion.div>

        {/* Hardcoded Content Banner */}
        {hardcodedContent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-4 mb-4 border-2 border-neon-cyan/30 bg-neon-cyan/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">
                  📦 Hardcoded Content Detected
                </p>
                <p className="text-xs text-muted-foreground">
                  Content is currently in code. Migrate to database to edit it.
                </p>
              </div>
            <motion.button
                onClick={handleMigrateContent}
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
                    <span>Migrate Content</span>
                  </>
                )}
            </motion.button>
          </div>
        </motion.div>
        )}

        {/* Current Content Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 mb-6 border-2 border-neon-cyan/30"
        >
          <h2 className="font-display font-semibold text-xl mb-4 flex items-center gap-2">
            <span className="text-neon-cyan">📋 Current Content Preview</span>
            <span className="text-sm text-muted-foreground font-normal">
              {hardcodedContent ? "(Hardcoded - shown below)" : "(What's currently saved in database)"}
            </span>
          </h2>
          
          {/* Show hardcoded content if exists and no database content */}
          {(hardcodedContent && (!content || Object.keys(content).length === 0)) ? (
            <div className="space-y-3">
              {hardcodedContent.title && (
                <div className="p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                  <span className="text-xs text-neon-cyan uppercase tracking-wide font-semibold">Title (Hardcoded):</span>
                  <p className="font-medium mt-1">{hardcodedContent.title}</p>
                </div>
              )}
              {hardcodedContent.subtitle && (
                <div className="p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                  <span className="text-xs text-neon-cyan uppercase tracking-wide font-semibold">Subtitle (Hardcoded):</span>
                  <p className="font-medium mt-1">{hardcodedContent.subtitle}</p>
                </div>
              )}
              {hardcodedContent.description && (
                <div className="p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                  <span className="text-xs text-neon-cyan uppercase tracking-wide font-semibold">Description (Hardcoded):</span>
                  <p className="font-medium mt-1">{hardcodedContent.description}</p>
                </div>
              )}
              {hardcodedContent.email && (
                <div className="p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                  <span className="text-xs text-neon-cyan uppercase tracking-wide font-semibold">Email (Hardcoded):</span>
                  <p className="font-medium mt-1">{hardcodedContent.email}</p>
                </div>
              )}
              {hardcodedContent.phone && (
                <div className="p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                  <span className="text-xs text-neon-cyan uppercase tracking-wide font-semibold">Phone (Hardcoded):</span>
                  <p className="font-medium mt-1">{hardcodedContent.phone}</p>
                </div>
              )}
              {hardcodedContent.socialLinks && (
                <div className="p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                  <span className="text-xs text-neon-cyan uppercase tracking-wide font-semibold">Social Links (Hardcoded):</span>
                  <div className="mt-2 space-y-1">
                    {hardcodedContent.socialLinks.map((link: any, idx: number) => (
                      <p key={idx} className="text-sm">{link.label}: {link.href}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : content && Object.keys(content).length > 0 ? (
            <div className="space-y-3">
              {content.title && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Title:</span>
                  <p className="font-medium mt-1">{content.title}</p>
                </div>
              )}
              {content.subtitle && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Subtitle:</span>
                  <p className="font-medium mt-1">{content.subtitle}</p>
                </div>
              )}
              {content.description && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Description:</span>
                  <p className="font-medium mt-1">{content.description}</p>
                </div>
              )}
              {content.image && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Image:</span>
                  <div className="mt-2 relative aspect-[4/5] rounded-lg overflow-hidden">
                    <img
                      src={content.image}
                      alt="About section image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              {section === 'contact' && (
                <>
                  {content.email && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Email:</span>
                      <p className="font-medium mt-1">{content.email}</p>
                    </div>
                  )}
                  {content.phone && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Phone:</span>
                      <p className="font-medium mt-1">{content.phone}</p>
                    </div>
                  )}
                  {content.socialLinks && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">Social Links:</span>
                      <div className="mt-2 space-y-1">
                        {content.socialLinks.map((link: any, idx: number) => (
                          <p key={idx} className="text-sm">{link.label}: {link.href}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No content saved yet. Fill in the form below to add content.</p>
            </div>
          )}
        </motion.div>

        {/* Content Editor */}
        <div className={`grid grid-cols-1 ${section === 'about' ? 'lg:grid-cols-2' : ''} gap-6`}>
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 space-y-4"
          >
            <h2 className="font-display font-semibold text-xl mb-4">
              Edit Content
            </h2>
            
            {section === 'about' && (
              <>
            <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={content?.title || ""}
                    onChange={(e) => handleContentChange("title", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all"
                    placeholder="e.g., Capturing Moments Creating Stories"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={content?.subtitle || ""}
                    onChange={(e) => handleContentChange("subtitle", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all"
                    placeholder="e.g., Creative Visual Artist"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={content?.description || ""}
                    onChange={(e) => handleContentChange("description", e.target.value)}
                rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all resize-none"
                    placeholder="Enter your about description"
              />
            </div>
              </>
            )}

            {section === 'contact' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={content?.email || ""}
                    onChange={(e) => handleContentChange("email", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
            <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={content?.phone || ""}
                    onChange={(e) => handleContentChange("phone", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all"
                    placeholder="+1 234 567 8900"
              />
            </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Social Links (JSON format)</label>
                  <textarea
                    value={content?._socialLinksRaw !== undefined 
                      ? content._socialLinksRaw 
                      : JSON.stringify(content?.socialLinks || [], null, 2)}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      // Store raw value for editing
                      setContent((prev: any) => ({
                        ...prev,
                        _socialLinksRaw: newValue,
                      }));
                      // Try to parse and update if valid JSON
                      try {
                        const parsed = JSON.parse(newValue);
                        handleContentChange("socialLinks", parsed);
                        // Clear raw value once parsed successfully
                        setContent((prev: any) => {
                          const { _socialLinksRaw, ...rest } = prev;
                          return { ...rest, socialLinks: parsed };
                        });
                      } catch {
                        // Invalid JSON - keep raw value for editing
                      }
                    }}
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all resize-none font-mono text-xs"
                    placeholder='[{"icon":"Instagram","href":"https://...","label":"Instagram"},{"icon":"Pinterest","href":"https://...","label":"Pinterest"},{"icon":"Linkedin","href":"https://...","label":"LinkedIn"},{"icon":"Facebook","href":"https://...","label":"Facebook"},{"icon":"WhatsApp","href":"https://wa.me/xxxxxxxxxx","label":"WhatsApp"}]'
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: Array of objects with icon, href, and label fields. Supported icons: Instagram, Pinterest, Linkedin, Facebook, WhatsApp.
                  </p>
                </div>
              </>
            )}

            {section !== 'about' && section !== 'contact' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={content?.title || ""}
                    onChange={(e) => handleContentChange("title", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all"
                    placeholder="Enter title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={content?.description || ""}
                    onChange={(e) => handleContentChange("description", e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-foreground/10 focus:border-neon-purple/50 focus:outline-none focus:ring-2 focus:ring-neon-purple/20 transition-all resize-none"
                    placeholder="Enter description"
                  />
                </div>
              </>
            )}
          </motion.div>

          {/* Image Section (Right side for About) */}
          {section === 'about' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 space-y-4"
            >
              <h2 className="font-display font-semibold text-xl mb-4">
                About Image
              </h2>
              {content?.image ? (
                <div className="space-y-2">
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden glass-card border border-foreground/10">
                    <img
                      src={content.image}
                      alt="About section image"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="flex-1 px-4 py-2 rounded-lg glass-card flex items-center justify-center gap-2 hover:bg-neon-cyan/20 disabled:opacity-50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Replace Image</span>
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => handleContentChange("image", "")}
                      disabled={uploadingImage}
                      className="px-4 py-2 rounded-lg glass-card flex items-center justify-center gap-2 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </motion.button>
            </div>
          </div>
              ) : (
                <motion.button
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full px-4 py-8 rounded-xl glass-card border-2 border-dashed border-foreground/20 flex flex-col items-center justify-center gap-2 hover:border-neon-purple/50 hover:bg-neon-purple/10 disabled:opacity-50 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin text-neon-purple" />
                      <span className="text-sm">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-neon-purple" />
                      <span className="text-sm font-medium">Upload Image</span>
                      <span className="text-xs text-muted-foreground">Recommended: 4:5 aspect ratio</span>
                    </>
                  )}
                </motion.button>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (content?.image) {
                      handleImageReplace(file);
                    } else {
                      handleImageUpload(file);
                    }
                  }
                  if (imageInputRef.current) {
                    imageInputRef.current.value = '';
                  }
                }}
                className="hidden"
              />
            </motion.div>
          )}

          {/* Media Manager */}
          {hasMedia && specialType === 'before-after' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <h2 className="font-display font-semibold text-xl mb-4">
                Before/After Photo Editing
              </h2>
              <BeforeAfterManager
                section={section}
                onMediaUpdate={loadContent}
              />
            </motion.div>
          ) : hasMedia ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <h2 className="font-display font-semibold text-xl mb-4">
                {mediaType === 'image' ? 'Images' : 'Videos'}
              </h2>
              <MediaManager
                section={section}
                fileType={mediaType}
                onMediaUpdate={loadContent}
              />
        </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;

