import JSZip from 'jszip';
import type { InstaConversation } from '../types/instagram';

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
): Promise<InstaConversation[]> => {
  onProgress('Reading your Instagram ZIP...');
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  onProgress('Finding conversations & messages...');
  const messageFiles: JSZip.JSZipObject[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && relativePath.toLowerCase().endsWith('.json') && 
        (relativePath.includes('messages') || relativePath.includes('inbox'))) {
      if (relativePath.includes('message_') || relativePath.split('/').pop()?.startsWith('message')) {
          messageFiles.push(zipEntry);
      }
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
        
        // Filter out actions/unsent and decode
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
      console.warn('Failed to parse a message file:', fileEntry.name, e);
    }
    
    processed++;
    if (processed % Math.ceil(messageFiles.length / 10) === 0) {
      const percentage = Math.round((processed / messageFiles.length) * 100);
      onProgress(`Extracting data: ${percentage}%...`);
    }
  }
  
  if (conversations.length === 0) {
    throw new Error("No valid messages found inside the JSON files.");
  }

  return conversations;
};
