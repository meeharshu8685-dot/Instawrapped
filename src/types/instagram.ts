export interface InstaMessage {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  type?: string; 
  is_unsent?: boolean;
  photos?: any[];
  videos?: any[];
  audio_files?: any[];
  share?: any;
  reactions?: any[];
  is_action?: boolean;
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
  activeDays: number;
}

export interface MediaStat {
  type: 'reel' | 'photo' | 'video' | 'post' | 'shared_media' | 'unknown';
  confidence: 'high' | 'medium' | 'low';
}

export type ExportRange = 'all' | '1_year' | '6_months' | '3_months';

export interface Capabilities {
  messages: boolean;
  timestamps: boolean;
  participants: boolean;
  media: boolean;
  reels: boolean;
  reactions: boolean;
}

export interface WrappedStats {
  selectedExportRange: ExportRange;
  actualDateRange: { earliest: number; latest: number; formattedDuration: string } | null;
  capabilities: Capabilities;
  totalMessages: number;
  messagesSent: number;
  messagesReceived: number;
  uniqueContacts: number;
  activeDaysCount: number;
  
  reelsShared: number;
  mediaShared: number;
  
  mostActiveMonth: { month: string; count: number };
  peakHour: number; 
  peakDayOfWeek: string;
  
  longestChat: {
    name: string;
    count: number;
  };
  fastestDensity: {
    name: string;
    messages: number;
    minutes: number;
  } | null;
  longestStreak: {
    name: string;
    count: number;
  } | null;
  comeback: {
    name: string;
    gapDays: number;
    returnMessages: number;
  } | null;
  midnightConnection: {
    name: string;
    count: number;
  } | null;
  consistentConnection: {
    name: string;
    activeDays: number;
  } | null;

  topConnections: ConnectionStat[];
  
  archetype: {
    title: string;
    description: string;
  };
}
