// Migration utility to import hardcoded data into database
import { supabase } from "@/integrations/supabase/client";
import { MediaFile } from "./content";

// Hardcoded data from sections
export const HARDCODED_DATA = {
  stories: [
    { id: 1, image: "/assets/stories/1.jpg" },
    { id: 2, image: "/assets/stories/2.jpg" },
    { id: 3, image: "/assets/stories/3.jpg" },
    { id: 4, image: "/assets/stories/4.jpg" },
    { id: 5, image: "/assets/stories/5.jpg" },
  ],
  pinterest: [
    { id: 1, image: "/assets/pinterest/1.jpg" },
    { id: 2, image: "/assets/pinterest/2.jpg" },
    { id: 3, image: "/assets/pinterest/3.jpg" },
    { id: 4, image: "/assets/pinterest/4.jpg" },
    { id: 5, image: "/assets/pinterest/5.jpg" },
  ],
  posts: [
    { id: 1, image: "/assets/posts/bilie eilish.png" },
    { id: 2, image: "/assets/posts/post food.png" },
  ],
  'carousel-example': [
    { 
      id: 1, 
      title: "Carousel 1",
      description: "Instagram carousel example",
      images: [
        "/assets/carousel-posts/carousel-1/1.png",
        "/assets/carousel-posts/carousel-1/2.png",
        "/assets/carousel-posts/carousel-1/3.png",
        "/assets/carousel-posts/carousel-1/4.png"
      ]
    },
    { 
      id: 2, 
      title: "Carousel 2",
      description: "Instagram carousel example",
      images: [
        "/assets/carousel-posts/carousel-2/17.png",
        "/assets/carousel-posts/carousel-2/18.png",
        "/assets/carousel-posts/carousel-2/19.png",
        "/assets/carousel-posts/carousel-2/20.png",
        "/assets/carousel-posts/carousel-2/21.png"
      ]
    },
  ],
  editing: [
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
  ],
  'shoot-edit': [
    { id: 1, video: "/assets/shoot-edit/1.MP4", title: "Shoot and Edit 1", duration: "3:45" },
    { id: 2, video: "/assets/shoot-edit/2.mp4", title: "Shoot and Edit 2", duration: "0:30" },
    { id: 3, video: "/assets/shoot-edit/3.mp4", title: "Shoot and Edit 3", duration: "4:20" },
  ],
  reels: [
    { id: 1, video: "/assets/reels/1.mp4", title: "Reel 1", duration: "0:30" },
    { id: 2, video: "/assets/reels/2.mp4", title: "Reel 2", duration: "0:45" },
    { id: 3, video: "/assets/reels/3.mp4", title: "Reel 3", duration: "1:00" },
  ],
  menus: [
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
  ],
  wedding: [
    { 
      id: 1, 
      pageNumber: 1, 
      title: "Wedding Times", 
      description: "Elegant wedding invitation", 
      images: [
        "/assets/wedding/Wedding Times-images-1.jpg",
        "/assets/wedding/Wedding Times-images-2.jpg",
        "/assets/wedding/Wedding Times-images-3.jpg",
        "/assets/wedding/Wedding Times-images-4.jpg"
      ]
    },
  ],
  about: {
    title: "Capturing Moments Creating Stories",
    subtitle: "Creative Visual Artist",
    description: "I'm a visual storyteller specializing in photography, videography, and post-production. From Instagram stories to cinematic reels, I bring creative visions to life through the lens and editing suite.",
    image: "/image/Untitled design.svg",
  },
  contact: {
    email: "pranavdpatel1314@gmail.com",
    phone: "+91 6355790534",
    socialLinks: [
      { icon: "Instagram", href: "https://www.instagram.com/silent.draft?igsh=MTB1cWFxcHloOGp5MA%3D%3D&utm_source=qr", label: "Instagram" },
      { icon: "Pinterest", href: "https://pin.it/4E8RO2FZb", label: "Pinterest" },
      { icon: "Linkedin", href: "https://www.linkedin.com/in/pranav-patel-b19241347?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app", label: "LinkedIn" },
    ],
  },
};

// Get hardcoded media for a section (returns grouped carousels for menus/wedding/carousel-example)
export const getHardcodedMedia = (section: string): Array<{ url: string; name: string; type: 'image' | 'video' }> => {
  const data = HARDCODED_DATA[section as keyof typeof HARDCODED_DATA];
  if (!data) return [];

  // Handle non-array data (like about, contact)
  if (!Array.isArray(data)) return [];

  if (section === 'reels' || section === 'shoot-edit') {
    return (data as any[]).map((item) => ({
      url: item.video || '',
      name: item.title || `${section === 'reels' ? 'Reel' : 'Shoot and Edit'} ${item.id}`,
      type: 'video' as const,
    })).filter(item => item.url);
  } else if (section === 'menus' || section === 'wedding' || section === 'carousel-example') {
    // For menus, wedding, and carousel-example, return grouped structure
    // This will be handled differently in MediaManager
    const allImages: Array<{ url: string; name: string; type: 'image' }> = [];
    (data as any[]).forEach((item) => {
      if (item.images && Array.isArray(item.images)) {
        item.images.forEach((image: string, idx: number) => {
          if (image) {
            allImages.push({
              url: image,
              name: item.title ? `${item.title} - Slide ${idx + 1}` : `Item ${item.id} - Slide ${idx + 1}`,
              type: 'image' as const,
            });
          }
        });
      }
    });
    return allImages;
  } else if (section === 'editing') {
    // For editing, return before/after images
    // Extract base name from file path to ensure consistent pairing
    const allImages: Array<{ url: string; name: string; type: 'image' }> = [];
    (data as any[]).forEach((item) => {
      if (item.before) {
        // Extract base name from file path (e.g., "photo 1" from "/assets/photo-edit/photo 1 before.JPG")
        const beforePath = item.before;
        const beforeFileName = beforePath.split('/').pop() || '';
        // Remove "before" or "after" and file extension, case-insensitive
        const beforeBaseName = beforeFileName
          .replace(/\s*(before|after)\s*.*$/i, '')
          .trim() || `Item ${item.id}`;
        
        allImages.push({
          url: item.before,
          name: `${beforeBaseName} - before`,
          type: 'image' as const,
        });
      }
      if (item.after) {
        // Extract base name from file path (e.g., "photo 1" from "/assets/photo-edit/photo 1 after.JPG")
        const afterPath = item.after;
        const afterFileName = afterPath.split('/').pop() || '';
        // Remove "before" or "after" and file extension, case-insensitive
        const afterBaseName = afterFileName
          .replace(/\s*(before|after)\s*.*$/i, '')
          .trim() || `Item ${item.id}`;
        
        allImages.push({
          url: item.after,
          name: `${afterBaseName} - after`,
          type: 'image' as const,
        });
      }
    });
    return allImages;
  } else {
    // For stories, pinterest, posts, etc.
    return (data as any[]).map((item) => {
      const imageUrl = item.image || item.url || '';
      if (!imageUrl) return null;
      return {
        url: imageUrl,
        name: imageUrl.split('/').pop() || `Item ${item.id || 'Unknown'}`,
        type: 'image' as const,
      };
    }).filter((item): item is { url: string; name: string; type: 'image' } => item !== null);
  }
};

// Get hardcoded carousels (for menus, wedding, and carousel-example)
export const getHardcodedCarousels = (section: string): Array<{ id: number; title: string; description?: string; images: string[] }> => {
  if (section === 'menus') {
    return HARDCODED_DATA.menus.map((menu) => ({
      id: menu.id,
      title: menu.title,
      description: menu.description,
      images: menu.images || [],
    }));
  } else if (section === 'wedding') {
    return HARDCODED_DATA.wedding.map((page) => ({
      id: page.id,
      title: page.title,
      description: page.description,
      images: page.images || [],
    }));
  } else if (section === 'carousel-example') {
    return HARDCODED_DATA['carousel-example'].map((carousel) => ({
      id: carousel.id,
      title: carousel.title,
      description: carousel.description,
      images: carousel.images || [],
    }));
  }
  return [];
};

// Get hardcoded content for a section
export const getHardcodedContent = (section: string): any => {
  if (section === 'about') {
    return HARDCODED_DATA.about;
  } else if (section === 'contact') {
    return HARDCODED_DATA.contact;
  }
  return null;
};

// Migrate hardcoded data to database
export const migrateHardcodedData = async (section: string): Promise<boolean> => {
  try {
    const hardcodedItems = getHardcodedMedia(section);
    if (hardcodedItems.length === 0) return false;

    // Check if data already exists - use case-insensitive comparison for URLs
    const { data: existing } = await supabase
      .from('portfolio_media')
      .select('file_url')
      .eq('section_name', section);

    // Create a case-insensitive set for comparison
    const existingUrls = new Set(
      (existing || []).map((e) => e.file_url.toLowerCase())
    );

    // Insert only new items - check case-insensitively
    const itemsToInsert = hardcodedItems
      .filter((item) => {
        // Check if URL exists (case-insensitive)
        const urlLower = item.url.toLowerCase();
        return !existingUrls.has(urlLower);
      })
      .map((item, index) => ({
        section_name: section,
        file_name: item.name,
        file_url: item.url,
        file_type: item.type,
        display_order: index,
        file_size: null,
      }));

    if (itemsToInsert.length === 0) {
      return false; // Already migrated
    }

    // Insert in batches to avoid issues
    const batchSize = 10;
    for (let i = 0; i < itemsToInsert.length; i += batchSize) {
      const batch = itemsToInsert.slice(i, i + batchSize);
      const { error } = await supabase
        .from('portfolio_media')
        .insert(batch);

      if (error) {
        console.error('Error inserting batch:', error);
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error('Migration error:', error);
    return false;
  }
};

// Group media files by carousel (for menus, wedding, and carousel-example)
export const groupMediaByCarousel = (
  files: Array<MediaFile & { isHardcoded?: boolean }>,
  section: string
): Array<{
  carouselId: number;
  title: string;
  description?: string;
  images: Array<MediaFile & { isHardcoded?: boolean }>;
  isHardcoded?: boolean;
}> => {
  if (section !== 'menus' && section !== 'wedding' && section !== 'carousel-example') {
    // For other sections, return as individual items
    return files.map((file, index) => ({
      carouselId: index + 1,
      title: file.file_name,
      images: [file],
      isHardcoded: file.isHardcoded,
    }));
  }

  // Group by carousel title pattern
  const carouselMap = new Map<string, Array<MediaFile & { isHardcoded?: boolean }>>();
  
  files.forEach((file) => {
    // Extract carousel name from filename (e.g., "Bistro Restaurant - Slide 1" -> "Bistro Restaurant")
    // Try multiple patterns to handle different naming conventions
    let carouselName = 'Carousel';
    
    // Pattern 1: "Name - Slide X"
    const slideMatch = file.file_name.match(/^(.+?)\s*-\s*Slide\s+\d+/i);
    if (slideMatch) {
      carouselName = slideMatch[1].trim();
    } else {
      // Pattern 2: "Name - X" or "Name - Part X"
      const partMatch = file.file_name.match(/^(.+?)\s*-\s*(?:Part|Page|Image)\s+\d+/i);
      if (partMatch) {
        carouselName = partMatch[1].trim();
      } else {
        // Pattern 3: Split by " - " and take first part
        const parts = file.file_name.split(' - ');
        if (parts.length > 1) {
          carouselName = parts[0].trim();
        } else {
          // Pattern 4: Use filename without extension as carousel name
          carouselName = file.file_name.replace(/\.[^/.]+$/, '').trim();
        }
      }
    }
    
    // If carousel name is empty or just whitespace, use a default
    if (!carouselName || carouselName.length === 0) {
      carouselName = 'Carousel';
    }
    
    if (!carouselMap.has(carouselName)) {
      carouselMap.set(carouselName, []);
    }
    carouselMap.get(carouselName)!.push(file);
  });

  // Convert to array and sort by first image's display_order
  return Array.from(carouselMap.entries())
    .map(([title, images], index) => ({
      carouselId: index + 1,
      title: title,
      description: section === 'menus' ? `${title} menu design` : `${title} wedding invitation`,
      images: images.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)),
      isHardcoded: images[0]?.isHardcoded || false,
    }))
    .sort((a, b) => {
      // Sort by first image's display order
      const orderA = a.images[0]?.display_order || 0;
      const orderB = b.images[0]?.display_order || 0;
      return orderA - orderB;
    });
};

// Get combined media (database + hardcoded fallback)
export const getCombinedMedia = async (
  section: string,
  fileType: 'image' | 'video'
): Promise<Array<MediaFile & { isHardcoded?: boolean }>> => {
  try {
    // Get from database
    const { data: dbMedia, error } = await supabase
      .from('portfolio_media')
      .select('*')
      .eq('section_name', section)
      .eq('file_type', fileType)
      .order('display_order', { ascending: true });

    if (error && error.code !== 'PGRST116') {
      console.error(`[getCombinedMedia] Database error:`, error);
      throw error;
    }

    const dbItems = (dbMedia || []).map((item) => ({
      ...item,
      isHardcoded: false,
    }));

    // ALWAYS return database items if they exist - never use hardcoded fallback when DB has data
    if (dbItems.length > 0) {
      return dbItems;
    }

    // Only use hardcoded data if database is completely empty
    const hardcodedItems = getHardcodedMedia(section)
      .filter((item) => item.type === fileType)
      .map((item, index) => ({
        id: `hardcoded-${index}`,
        section_name: section,
        file_name: item.name,
        file_url: item.url,
        file_type: item.type,
        file_size: null,
        display_order: index,
        created_at: new Date().toISOString(),
        isHardcoded: true,
      }));

    return hardcodedItems;
  } catch (error) {
    console.error('Error getting combined media:', error);
    return [];
  }
};

// Get combined carousels (database + hardcoded fallback) for menus, wedding, and carousel-example sections
export const getCombinedCarousels = async (
  section: string,
  fileType: 'image' | 'video'
): Promise<Array<{
  carouselId: number;
  title: string;
  description?: string;
  images: Array<MediaFile & { isHardcoded?: boolean }>;
  isHardcoded?: boolean;
}>> => {
  try {
    // Get from database
    const mediaFiles = await getCombinedMedia(section, fileType);
    
    // Check if we have database items
    const hasDbItems = mediaFiles.some(f => !f.isHardcoded);
    
    // Group by carousel
    const dbCarousels = groupMediaByCarousel(mediaFiles, section);
    
    // If we have database items, always return the grouped carousels (even if empty)
    if (hasDbItems) {
      return dbCarousels;
    }
    
    // Otherwise, return hardcoded carousels as fallback
    const hardcodedCarousels = getHardcodedCarousels(section);
    if (hardcodedCarousels.length === 0) {
      return [];
    }
    return hardcodedCarousels.map((carousel, index) => ({
      carouselId: carousel.id,
      title: carousel.title,
      description: carousel.description,
      images: carousel.images.map((url, imgIdx) => ({
        id: `hardcoded-${index}-${imgIdx}`,
        section_name: section,
        file_name: `${carousel.title} - Slide ${imgIdx + 1}`,
        file_url: url,
        file_type: fileType,
        file_size: null,
        display_order: index * 1000 + imgIdx,
        created_at: new Date().toISOString(),
        isHardcoded: true,
      })),
      isHardcoded: true,
    }));
  } catch (error) {
    console.error('Error getting combined carousels:', error);
    // Return hardcoded fallback on error
    const hardcodedCarousels = getHardcodedCarousels(section);
    return hardcodedCarousels.map((carousel, index) => ({
      carouselId: carousel.id,
      title: carousel.title,
      description: carousel.description,
      images: carousel.images.map((url, imgIdx) => ({
        id: `hardcoded-${index}-${imgIdx}`,
        section_name: section,
        file_name: `${carousel.title} - Slide ${imgIdx + 1}`,
        file_url: url,
        file_type: fileType,
        file_size: null,
        display_order: index * 1000 + imgIdx,
        created_at: new Date().toISOString(),
        isHardcoded: true,
      })),
      isHardcoded: true,
    }));
  }
};

