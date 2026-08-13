import type { WrappedStats } from '../types/instagram';

export const sampleStats: WrappedStats = {
  totalMessages: 18492,
  messagesSent: 9410,
  messagesReceived: 9082,
  uniqueContacts: 142,
  reelsShared: 1284,
  activeDaysCount: 312,
  mostActiveMonth: "JULY",
  peakHour: 23, // 11 PM
  longestChat: {
    name: "Rahul",
    count: 386,
  },
  topConnections: [
    {
      name: "Rahul",
      messageCount: 4832,
      mediaShared: 347,
      reactions: 142,
      interactionScore: 5668,
      longestConversation: 386,
    },
    {
      name: "Aditi",
      messageCount: 2940,
      mediaShared: 180,
      reactions: 95,
      interactionScore: 3395,
      longestConversation: 120,
    },
    {
      name: "Aryan",
      messageCount: 1840,
      mediaShared: 90,
      reactions: 50,
      interactionScore: 2070,
      longestConversation: 85,
    },
    {
      name: "Karan",
      messageCount: 950,
      mediaShared: 250, // lots of reels
      reactions: 20,
      interactionScore: 1470,
      longestConversation: 40,
    },
    {
      name: "Sneha",
      messageCount: 820,
      mediaShared: 30,
      reactions: 88,
      interactionScore: 968,
      longestConversation: 60,
    }
  ],
  archetype: {
    title: "The Night Owl",
    description: "Apparently, sleep was optional. Most of your deep conversations and reel spirals happened after hours."
  }
};
