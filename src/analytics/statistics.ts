import type { ConnectionStat, InstaConversation, WrappedStats } from '../types/instagram';

export const calculateStats = (conversations: InstaConversation[]): WrappedStats => {
  let totalMessages = 0;
  let messagesSent = 0;
  let messagesReceived = 0;
  let reelsShared = 0;
  
  const connectionsMap = new Map<string, ConnectionStat>();
  const activeMonths = new Map<string, number>();
  const activeHours = new Map<number, number>();
  const activeDays = new Set<string>();
  
  let longestChatName = '';
  let longestChatCount = 0;

  for (const convo of conversations) {
    if (!convo.messages || convo.messages.length === 0) continue;
    
    // For 1-on-1 chats mostly. We try to find the "other" person.
    const otherParticipant = convo.participants?.length === 2 
      ? convo.participants[0].name // Usually the first one is the other person if we are the second, or vice versa
      : convo.title || 'Group Chat';

    let convoMessagesCount = convo.messages.length;
    let convoMediaShared = 0;
    let convoReactions = 0;

    if (convoMessagesCount > longestChatCount) {
      longestChatCount = convoMessagesCount;
      longestChatName = otherParticipant;
    }

    for (const msg of convo.messages) {
      totalMessages++;
      
      // Determine if sent or received
      // Note: "is_unsent" or checking sender_name vs our assumed name
      // Usually Instagram doesn't explicitly mark "sent by me" unless we know our own username.
      // We can infer our name as the participant who appears in the most conversations, but for simplicity
      // let's assume we are NOT the 'otherParticipant'.
      const isSentByMe = msg.sender_name !== otherParticipant;
      if (isSentByMe) messagesSent++;
      else messagesReceived++;

      // Media / Reels
      if (msg.share || msg.photos || msg.videos) {
        reelsShared++;
        convoMediaShared++;
      }

      // Reactions
      if (msg.reactions && msg.reactions.length > 0) {
        convoReactions += msg.reactions.length;
      }

      // Timestamps
      if (msg.timestamp_ms) {
        const date = new Date(msg.timestamp_ms);
        const monthKey = date.toLocaleString('default', { month: 'long' }).toUpperCase();
        const hour = date.getHours();
        const dayKey = date.toISOString().split('T')[0];

        activeMonths.set(monthKey, (activeMonths.get(monthKey) || 0) + 1);
        activeHours.set(hour, (activeHours.get(hour) || 0) + 1);
        activeDays.add(dayKey);
      }
    }

    // Interaction Score: msgs + (media * 2) + reactions
    const score = convoMessagesCount + (convoMediaShared * 2) + convoReactions;

    if (otherParticipant && otherParticipant !== 'Group Chat') {
      const existing = connectionsMap.get(otherParticipant);
      if (existing) {
        existing.messageCount += convoMessagesCount;
        existing.mediaShared += convoMediaShared;
        existing.reactions += convoReactions;
        existing.interactionScore += score;
        if (convoMessagesCount > existing.longestConversation) {
          existing.longestConversation = convoMessagesCount;
        }
      } else {
        connectionsMap.set(otherParticipant, {
          name: otherParticipant,
          messageCount: convoMessagesCount,
          mediaShared: convoMediaShared,
          reactions: convoReactions,
          interactionScore: score,
          longestConversation: convoMessagesCount,
        });
      }
    }
  }

  // Sort connections by interaction score
  const topConnections = Array.from(connectionsMap.values())
    .sort((a, b) => b.interactionScore - a.interactionScore)
    .slice(0, 5);

  // Find most active month
  let mostActiveMonth = '';
  let maxMonthVal = 0;
  activeMonths.forEach((val, key) => {
    if (val > maxMonthVal) {
      maxMonthVal = val;
      mostActiveMonth = key;
    }
  });

  // Find peak hour
  let peakHour = 0;
  let maxHourVal = 0;
  activeHours.forEach((val, key) => {
    if (val > maxHourVal) {
      maxHourVal = val;
      peakHour = key;
    }
  });

  // Archetype logic
  let archetypeTitle = "The Conversation Machine";
  let archetypeDesc = "You sent and received an incredible amount of messages. Your DMs are a full-time job.";
  
  if (peakHour >= 22 || peakHour <= 4) {
    archetypeTitle = "The Night Owl";
    archetypeDesc = "Apparently, sleep was optional. Most of your deep conversations and reel spirals happened after hours.";
  } else if (reelsShared > totalMessages * 0.3) {
    archetypeTitle = "The Reel Distributor";
    archetypeDesc = "Words are overrated. You communicated primarily through a vast distribution network of shared media.";
  } else if (messagesSent > messagesReceived * 1.5) {
    archetypeTitle = "The Serial Replier";
    archetypeDesc = "You always had the last word, and the first word. You carried the conversations this year.";
  } else if (messagesReceived > messagesSent * 1.5) {
    archetypeTitle = "The Quiet Observer";
    archetypeDesc = "You let others do the talking. You received far more than you sent, absorbing the tea silently.";
  }

  return {
    totalMessages,
    messagesSent,
    messagesReceived,
    uniqueContacts: connectionsMap.size,
    reelsShared,
    activeDaysCount: activeDays.size,
    mostActiveMonth,
    peakHour,
    longestChat: { name: longestChatName, count: longestChatCount },
    topConnections,
    archetype: { title: archetypeTitle, description: archetypeDesc }
  };
};
