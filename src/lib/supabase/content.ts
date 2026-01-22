import { supabase } from "@/integrations/supabase/client";

export interface ContentData {
  [key: string]: any;
}

export interface MediaFile {
  id: string;
  section_name: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_size?: number;
  display_order: number;
  created_at: string;
}

// Content Management
export const getContent = async (section: string): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from('portfolio_content')
      .select('content')
      .eq('section_name', section)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data?.content || null;
  } catch (error) {
    console.error('Error fetching content:', error);
    return null;
  }
};

export const saveContent = async (section: string, content: any): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('portfolio_content')
      .upsert({
        section_name: section,
        content: content,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'section_name'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving content:', error);
    return false;
  }
};

export const getAllContent = async (): Promise<ContentData> => {
  try {
    const { data, error } = await supabase
      .from('portfolio_content')
      .select('section_name, content');

    if (error) throw error;

    const result: ContentData = {};
    data?.forEach((item) => {
      result[item.section_name] = item.content;
    });

    return result;
  } catch (error) {
    console.error('Error fetching all content:', error);
    return {};
  }
};

// Media Management
export const getMediaFiles = async (section: string): Promise<MediaFile[]> => {
  try {
    const { data, error } = await supabase
      .from('portfolio_media')
      .select('*')
      .eq('section_name', section)
      .order('display_order', { ascending: true });

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching media:', error);
    return [];
  }
};

export const uploadMediaFile = async (
  file: File,
  section: string,
  fileType: 'image' | 'video',
  displayOrder?: number
): Promise<string | null> => {
  try {
    // Determine bucket
    const bucket = fileType === 'image' ? 'portfolio-images' : 'portfolio-videos';
    
    // Generate unique filename (preserve original name structure for carousel grouping)
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}.${fileExt}`;
    const filePath = `${section}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Save to database with display order
    const { data: mediaData, error: dbError } = await supabase
      .from('portfolio_media')
      .insert({
        section_name: section,
        file_name: file.name, // Keep original filename for grouping
        file_url: publicUrl,
        file_type: fileType,
        file_size: file.size,
        display_order: displayOrder !== undefined ? displayOrder : 0,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

export const deleteMediaFile = async (id: string, fileUrl: string, fileType: 'image' | 'video'): Promise<boolean> => {
  try {
    // First, delete from database (this is the source of truth)
    const { error: dbError } = await supabase
      .from('portfolio_media')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('Database delete error:', dbError);
      throw dbError;
    }

    // Then try to delete from storage (if it's a Supabase storage URL)
    // Only delete from storage if it's a valid Supabase URL
    try {
      if (fileUrl && (fileUrl.includes('supabase.co') || fileUrl.includes('storage'))) {
        const url = new URL(fileUrl);
        const pathParts = url.pathname.split('/');
        const bucket = fileType === 'image' ? 'portfolio-images' : 'portfolio-videos';
        
        // Check if bucket exists in path
        const bucketIndex = pathParts.indexOf(bucket);
        if (bucketIndex !== -1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          
          // Delete from storage (non-blocking - log error but don't fail)
          const { error: storageError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

          if (storageError) {
            console.warn('Storage delete warning (file may already be deleted):', storageError);
            // Don't throw - database deletion is more important
          }
        }
      }
    } catch (storageErr) {
      // If storage deletion fails (e.g., local file), that's okay
      // Database deletion is the important part
      console.warn('Storage deletion skipped (may be local file):', storageErr);
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

export const updateMediaOrder = async (mediaItems: { id: string; display_order: number }[]): Promise<boolean> => {
  try {
    if (mediaItems.length === 0) return true;
    
    const updates = mediaItems.map((item) =>
      supabase
        .from('portfolio_media')
        .update({ display_order: item.display_order })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);
    
    // Check for errors
    const hasError = results.some(result => result.error);
    if (hasError) {
      const errors = results.filter(r => r.error).map(r => r.error);
      console.error('Error updating media order:', errors);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating media order:', error);
    return false;
  }
};

export const replaceMediaFile = async (
  existingId: string,
  existingUrl: string,
  newFile: File,
  section: string,
  fileType: 'image' | 'video'
): Promise<string | null> => {
  try {
    // Get existing file info (display order)
    const { data: existingData } = await supabase
      .from('portfolio_media')
      .select('display_order')
      .eq('id', existingId)
      .single();

    const displayOrder = existingData?.display_order || 0;

    // Delete old file from storage
    const url = new URL(existingUrl);
    const pathParts = url.pathname.split('/');
    const bucket = fileType === 'image' ? 'portfolio-images' : 'portfolio-videos';
    const filePath = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/');

    await supabase.storage
      .from(bucket)
      .remove([filePath]);

    // Upload new file
    const fileExt = newFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const newFilePath = `${section}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(newFilePath, newFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get new public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(newFilePath);

    const newUrl = urlData.publicUrl;

    // Update database record with new file info
    const { error: updateError } = await supabase
      .from('portfolio_media')
      .update({
        file_name: newFile.name,
        file_url: newUrl,
        file_size: newFile.size,
        display_order: displayOrder,
      })
      .eq('id', existingId);

    if (updateError) throw updateError;

    return newUrl;
  } catch (error) {
    console.error('Error replacing file:', error);
    return null;
  }
};

// Contact Messages Management
export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  message: string;
  read?: boolean;
  created_at?: string;
}

export const submitContactMessage = async (
  name: string,
  email: string,
  message: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        message,
        read: false,
      });

    if (error) {
      console.error('Error submitting message:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting message:', error);
    return { success: false, error: error.message || 'Failed to submit message' };
  }
};

export const getContactMessages = async (): Promise<ContactMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const getUnreadMessageCount = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('id')
      .eq('read', false);

    if (error) throw error;
    return data?.length || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
};

export const markMessageAsRead = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('contact_messages')
      .update({ read: true })
      .eq('id', messageId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
};

export const deleteContactMessage = async (messageId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    return false;
  }
};

