import JSZip from 'jszip';
import type { InstaConversation, ReelsWatchEvent, ParsedInstagramExport } from '../types/instagram';

export const decodeInstaString = (str: string | undefined): string => {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str; 
  }
};

export const parseInstagramZip = async (
  file: File,
  onProgress: (stage: string) => void
): Promise<ParsedInstagramExport> => {
  onProgress('Reading your Instagram ZIP...');
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  onProgress('Finding conversations & activity files...');
  const messageFiles: JSZip.JSZipObject[] = [];
  const reelsFiles: JSZip.JSZipObject[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir || !relativePath.toLowerCase().endsWith('.json')) return;
    
    const lower = relativePath.toLowerCase();
    if (lower.includes('messages') || lower.includes('inbox')) {
      if (lower.includes('message_') || relativePath.split('/').pop()?.startsWith('message')) {
        messageFiles.push(zipEntry);
      }
    } else if (
      lower.includes('reels_watched') || 
      lower.includes('videos_watched') || 
      lower.includes('reels_watch_history') ||
      lower.includes('viewed_reels')
    ) {
      reelsFiles.push(zipEntry);
    }
  });

  if (messageFiles.length === 0) {
    throw new Error("No messages found. Make sure you exported 'Messages' in JSON format.");
  }

  onProgress(`Found ${messageFiles.length} conversation files. Extracting...`);
  const conversations: InstaConversation[] = [];

  let processed = 0;
  for (const fileEntry of messageFiles) {
    try {
      const content = await fileEntry.async('string');
      const data = JSON.parse(content) as InstaConversation;
      
      if (data && data.messages && data.participants) {
        data.participants.forEach(p => {
          if (p.name) p.name = decodeInstaString(p.name);
        });
        
        data.messages = data.messages.filter(m => {
          if (m.is_unsent) return false;
          if (m.type === 'Generic' && m.content && (m.content.includes('created a poll') || m.content.includes('voted'))) return false;
          
          if (m.sender_name) m.sender_name = decodeInstaString(m.sender_name);
          if (m.content) m.content = decodeInstaString(m.content);
          
          return true;
        });
        
        if (data.messages.length > 0) {
          conversations.push(data);
        }
      }
    } catch (e) {
      console.warn('Failed to parse message file:', fileEntry.name, e);
    }
    
    processed++;
    if (processed % Math.max(1, Math.ceil(messageFiles.length / 10)) === 0) {
      const percentage = Math.round((processed / messageFiles.length) * 100);
      onProgress(`Extracting data: ${percentage}%...`);
    }
  }

  // Parse Reels watched history if present in export
  const reelsEvents: ReelsWatchEvent[] = [];
  for (const fileEntry of reelsFiles) {
    try {
      const content = await fileEntry.async('string');
      const json = JSON.parse(content);
      
      const items: any[] = Array.isArray(json) 
        ? json 
        : (json.impressions_history_reels_watched || json.activity_feed_reels_watched || json.impressions_history_videos_watched || json.videos_watched || []);

      items.forEach((item: any) => {
        let ts = 0;
        let author = '';

        if (item.string_map_data?.Time?.timestamp) {
          ts = item.string_map_data.Time.timestamp;
        } else if (item.media_list_data?.[0]?.timestamp) {
          ts = item.media_list_data[0].timestamp;
        } else if (item.timestamp) {
          ts = item.timestamp;
        }

        if (item.string_map_data?.Author?.value) {
          author = decodeInstaString(item.string_map_data.Author.value);
        } else if (item.title) {
          author = decodeInstaString(item.title);
        }

        if (ts > 0) {
          if (ts < 1e11) ts *= 1000;
          reelsEvents.push({ timestamp: ts, author });
        }
      });
    } catch (e) {
      console.warn('Failed to parse reels file:', fileEntry.name, e);
    }
  }
  
  if (conversations.length === 0) {
    throw new Error("No valid messages found inside the JSON files.");
  }

  return { conversations, reelsEvents };
};
