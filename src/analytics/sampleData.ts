import type { WrappedStats } from '../types/instagram';

export const sampleStats: WrappedStats = {
  selectedExportRange: 'all',
  actualDateRange: { earliest: 1672531200000, latest: 1723531200000, formattedDuration: '1 year, 7 months' },
  totalMessages: 42105,
  messagesSent: 21000,
  messagesReceived: 21105,
  uniqueContacts: 142,
  activeDaysCount: 340,
  reelsShared: 2800,
  mediaShared: 4500,
  
  mostActiveMonth: { month: 'August', count: 6100 },
  peakHour: 22,
  peakDayOfWeek: 'Friday',
  
  longestChat: { name: "sarah_smith", count: 120 },
  fastestDensity: { name: "alex_jones", messages: 50, minutes: 2 },
  longestStreak: { name: "meme_group", count: 14 },
  comeback: { name: "david_w", gapDays: 45, returnMessages: 100 },
  midnightConnection: { name: "sarah_smith", count: 300 },
  consistentConnection: { name: "emma_t", activeDays: 280 },

  topConnections: [
    { name: "sarah_smith", messageCount: 15420, mediaShared: 840, reactions: 2100, interactionScore: 95, longestConversation: 120, activeDays: 300 },
    { name: "alex_jones", messageCount: 8900, mediaShared: 420, reactions: 1100, interactionScore: 82, longestConversation: 85, activeDays: 250 },
    { name: "meme_group", messageCount: 6500, mediaShared: 2100, reactions: 3400, interactionScore: 78, longestConversation: 45, activeDays: 200 },
    { name: "david_w", messageCount: 4200, mediaShared: 150, reactions: 800, interactionScore: 65, longestConversation: 60, activeDays: 150 },
    { name: "emma_t", messageCount: 3100, mediaShared: 320, reactions: 900, interactionScore: 60, longestConversation: 50, activeDays: 120 },
    { name: "family_chat", messageCount: 2800, mediaShared: 600, reactions: 1500, interactionScore: 55, longestConversation: 30, activeDays: 180 },
  ],
  
  capabilities: {
    messages: true,
    timestamps: true,
    participants: true,
    media: true,
    reels: true,
    reactions: true
  },
  
  archetype: {
    title: 'The Night Owl',
    description: 'You come alive when the world goes to sleep. Your best conversations happen after midnight.'
  }
};
