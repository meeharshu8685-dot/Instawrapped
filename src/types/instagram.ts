export interface InstaMessage {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  type?: string; // 'Generic', 'Share', 'Call'
  is_unsent?: boolean;
  photos?: any[];
  videos?: any[];
  audio_files?: any[];
  share?: any;
  reactions?: any[];
}

export interface InstaConversation {
  participants: { name: string }[];
  messages: InstaMessage[];
  title?: string;
  is_still_participant?: boolean;
  thread_type?: string;
  thread_path?: string;
  magic_words?: any[];
}

export interface ConnectionStat {
  name: string;
  messageCount: number;
  mediaShared: number;
  reactions: number;
  interactionScore: number;
  longestConversation: number;
}

export interface WrappedStats {
  totalMessages: number;
  messagesSent: number;
  messagesReceived: number;
  uniqueContacts: number;
  reelsShared: number;
  activeDaysCount: number;
  mostActiveMonth: string; // e.g. "JULY"
  peakHour: number; // 0-23
  longestChat: {
    name: string;
    count: number;
  };
  topConnections: ConnectionStat[];
  archetype: {
    title: string;
    description: string;
  };
}
