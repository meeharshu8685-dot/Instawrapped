import JSZip from 'jszip';
import type { InstaConversation } from '../types/instagram';

// Helper to fix Instagram's double-encoded utf8 string issue
// Instagram exports often encode UTF-8 characters as latin-1, showing up as "R\u00e3hul" instead of "Rahul"
export const decodeInstaString = (str: string | undefined): string => {
  if (!str) return '';
  try {
    return decodeURIComponent(escape(str));
  } catch (e) {
    return str; // Fallback if it fails
  }
};

export const parseInstagramZip = async (
  file: File,
  onProgress: (stage: string) => void
): Promise<InstaConversation[]> => {
  onProgress('Reading your Instagram ZIP...');
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  onProgress('Finding conversations & messages...');
  const messageFiles: JSZip.JSZipObject[] = [];

  // Instagram zip structure can vary:
  // e.g., your_instagram_activity/messages/inbox/...
  // e.g., messages/inbox/...
  loadedZip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && relativePath.includes('messages') && relativePath.endsWith('.json')) {
      // Only include inbox or direct message folders to avoid message requests / spam if possible
      // but to be safe we grab mostly 'message_1.json', 'message_2.json' etc.
      if (relativePath.includes('message_') || relativePath.endsWith('.json')) {
          messageFiles.push(zipEntry);
      }
    }
  });

  if (messageFiles.length === 0) {
    throw new Error("No messages found. Make sure you exported 'Messages' in JSON format.");
  }

  onProgress(`Found ${messageFiles.length} conversation files...`);
  const conversations: InstaConversation[] = [];

  let processed = 0;
  for (const fileEntry of messageFiles) {
    try {
      const content = await fileEntry.async('string');
      const data = JSON.parse(content) as InstaConversation;
      
      if (data && data.messages && data.participants) {
        // Decode participants
        data.participants.forEach(p => {
          if (p.name) p.name = decodeInstaString(p.name);
        });
        // Decode messages sender names
        data.messages.forEach(m => {
          if (m.sender_name) m.sender_name = decodeInstaString(m.sender_name);
          if (m.content) m.content = decodeInstaString(m.content);
        });
        conversations.push(data);
      }
    } catch (e) {
      console.warn('Failed to parse a message file:', fileEntry.name, e);
    }
    
    processed++;
    if (processed % 50 === 0) {
      onProgress(`Parsed ${processed} of ${messageFiles.length} files...`);
    }
  }

  return conversations;
};
