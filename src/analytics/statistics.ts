import type { ConnectionStat, InstaConversation, WrappedStats, Capabilities } from '../types/instagram';

export const calculateStats = (conversations: InstaConversation[]): WrappedStats => {
  const caps: Capabilities = {
    messages: false,
    timestamps: false,
    participants: false,
    media: false,
    reels: false,
    reactions: false,
  };

  let totalMessages = 0;
  let messagesSent = 0;
  let messagesReceived = 0;
  let reelsShared = 0;
  let mediaSharedTotal = 0;

  const connectionsMap = new Map<string, ConnectionStat>();
  const activeMonths = new Map<string, number>();
  const activeHours = new Map<number, number>();
  const activeDaysOfWeek = new Map<number, number>();
  const activeDays = new Set<string>();

  // For complex streaks
  let longestStreakCount = 0;
  let longestStreakName = '';
  
  // Fastest Density (most messages in a 10 min window)
  let maxDensityCount = 0;
  let maxDensityName = '';

  // Comeback (Longest gap in days between messages, with return)
  let maxComebackGap = 0;
  let maxComebackName = '';
  let maxComebackReturnCount = 0;

  // Midnight Connection (12am - 4am)
  let midnightCounts = new Map<string, number>();

  for (const convo of conversations) {
    if (!convo.messages || convo.messages.length === 0) continue;
    caps.messages = true;
    
    const otherParticipant = convo.participants?.length === 2 
      ? convo.participants[0].name 
      : convo.title || 'Group Chat';
    
    if (otherParticipant !== 'Group Chat') caps.participants = true;

    // Ensure sorted messages for time-series analysis (oldest to newest)
    const sortedMessages = [...convo.messages].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
    
    let convoMessagesCount = 0;
    let convoMediaShared = 0;
    let convoReactions = 0;
    const convoActiveDays = new Set<string>();

    // Streak trackers
    let currentStreak = 0;
    let lastSender = '';
    
    // Density tracker
    let windowStartMs = 0;
    let messagesInWindow = 0;

    for (let i = 0; i < sortedMessages.length; i++) {
      const msg = sortedMessages[i];
      totalMessages++;
      convoMessagesCount++;

      // Sent/Received (Simple heuristic: if not otherParticipant, it's me)
      const isSentByMe = msg.sender_name !== otherParticipant;
      if (isSentByMe) messagesSent++;
      else messagesReceived++;

      // Media Tracking
      if (msg.share || msg.photos || msg.videos || msg.type === 'Share') {
        caps.media = true;
        mediaSharedTotal++;
        convoMediaShared++;
        if (msg.share?.link?.includes('instagram.com/reel') || (msg.share && !msg.photos && !msg.videos)) {
          caps.reels = true;
          reelsShared++;
        }
      }

      // Reactions
      if (msg.reactions && msg.reactions.length > 0) {
        caps.reactions = true;
        convoReactions += msg.reactions.length;
      }

      // Time Series
      if (msg.timestamp_ms) {
        caps.timestamps = true;
        const date = new Date(msg.timestamp_ms);
        const monthKey = date.toLocaleString('default', { month: 'long' }).toUpperCase();
        const hour = date.getHours();
        const dayOfWeek = date.getDay(); // 0 = Sunday
        const dayKey = date.toISOString().split('T')[0];

        activeMonths.set(monthKey, (activeMonths.get(monthKey) || 0) + 1);
        activeHours.set(hour, (activeHours.get(hour) || 0) + 1);
        activeDaysOfWeek.set(dayOfWeek, (activeDaysOfWeek.get(dayOfWeek) || 0) + 1);
        activeDays.add(dayKey);
        convoActiveDays.add(dayKey);

        // Midnight
        if (hour >= 0 && hour < 4 && otherParticipant !== 'Group Chat') {
          midnightCounts.set(otherParticipant, (midnightCounts.get(otherParticipant) || 0) + 1);
        }

        // Streak
        if (msg.sender_name === lastSender) {
          currentStreak++;
          if (currentStreak > longestStreakCount && otherParticipant !== 'Group Chat') {
            longestStreakCount = currentStreak;
            longestStreakName = otherParticipant;
          }
        } else {
          currentStreak = 1;
          lastSender = msg.sender_name || '';
        }

        // Density (10 minute sliding window)
        if (windowStartMs === 0) windowStartMs = msg.timestamp_ms;
        if (msg.timestamp_ms - windowStartMs <= 10 * 60 * 1000) {
          messagesInWindow++;
          if (messagesInWindow > maxDensityCount && otherParticipant !== 'Group Chat') {
            maxDensityCount = messagesInWindow;
            maxDensityName = otherParticipant;
          }
        } else {
          windowStartMs = msg.timestamp_ms;
          messagesInWindow = 1;
        }

        // Comeback Detection
        if (i > 0) {
          const prevMsg = sortedMessages[i-1];
          const gapMs = msg.timestamp_ms - prevMsg.timestamp_ms;
          const gapDays = gapMs / (1000 * 60 * 60 * 24);
          
          if (gapDays > 30 && gapDays > maxComebackGap && otherParticipant !== 'Group Chat') {
            // Count messages after comeback
            const msgsAfter = sortedMessages.length - i;
            if (msgsAfter > 10) { // Needs to be an actual conversation return, not just a ping
              maxComebackGap = gapDays;
              maxComebackName = otherParticipant;
              maxComebackReturnCount = msgsAfter;
            }
          }
        }
      }
    }

    // Update Connection Map
    if (otherParticipant && otherParticipant !== 'Group Chat') {
      const score = convoMessagesCount + (convoMediaShared * 3) + (convoReactions * 2);
      connectionsMap.set(otherParticipant, {
        name: otherParticipant,
        messageCount: convoMessagesCount,
        mediaShared: convoMediaShared,
        reactions: convoReactions,
        interactionScore: score,
        longestConversation: convoMessagesCount, // Will rename this to total in UI
        activeDays: convoActiveDays.size
      });
    }
  }

  // Finalize Connections
  const topConnections = Array.from(connectionsMap.values())
    .sort((a, b) => b.interactionScore - a.interactionScore)
    .slice(0, 5);

  const mostConsistent = Array.from(connectionsMap.values())
    .sort((a, b) => b.activeDays - a.activeDays)[0];

  let topMidnightName = '';
  let topMidnightCount = 0;
  midnightCounts.forEach((count, name) => {
    if (count > topMidnightCount) {
      topMidnightCount = count;
      topMidnightName = name;
    }
  });

  // Most active month
  let mostActiveMonth = { month: '', count: 0 };
  activeMonths.forEach((count, month) => {
    if (count > mostActiveMonth.count) mostActiveMonth = { month, count };
  });

  // Peak Hour and Day
  let peakHour = 0;
  let maxHourVal = 0;
  activeHours.forEach((val, key) => {
    if (val > maxHourVal) { maxHourVal = val; peakHour = key; }
  });

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let peakDayOfWeek = 'Sunday';
  let maxDayVal = 0;
  activeDaysOfWeek.forEach((val, key) => {
    if (val > maxDayVal) { maxDayVal = val; peakDayOfWeek = days[key]; }
  });

  // Archetype
  let archetypeTitle = "The Conversation Machine";
  let archetypeDesc = "You sent and received an incredible amount of messages. Your DMs are a full-time job.";
  
  if (topMidnightCount > totalMessages * 0.1) {
    archetypeTitle = "The Night Owl";
    archetypeDesc = "Most of your deep conversations and reel spirals happened after hours. Sleep is optional.";
  } else if (reelsShared > totalMessages * 0.3) {
    archetypeTitle = "The Reel Distributor";
    archetypeDesc = "Words are overrated. You communicated primarily through a vast distribution network of shared media.";
  } else if (messagesSent > messagesReceived * 1.5) {
    archetypeTitle = "The Serial Replier";
    archetypeDesc = "You always had the last word, and the first word. You carried the conversations this year.";
  } else if (messagesReceived > messagesSent * 1.5) {
    archetypeTitle = "The Quiet Observer";
    archetypeDesc = "You let others do the talking. You received far more than you sent, absorbing the tea silently.";
  } else if (maxDensityCount > 100) {
    archetypeTitle = "The Rapid-Fire Texter";
    archetypeDesc = "When you talk, you don't use paragraphs. You use fifty separate messages in two minutes.";
  }

  return {
    capabilities: caps,
    totalMessages,
    messagesSent,
    messagesReceived,
    uniqueContacts: connectionsMap.size,
    activeDaysCount: activeDays.size,
    reelsShared,
    mediaShared: mediaSharedTotal,
    mostActiveMonth,
    peakHour,
    peakDayOfWeek,
    longestChat: topConnections[0] ? { name: topConnections[0].name, count: topConnections[0].messageCount } : { name: 'Nobody', count: 0 },
    fastestDensity: maxDensityCount > 10 ? { name: maxDensityName, messages: maxDensityCount, minutes: 10 } : null,
    longestStreak: longestStreakCount > 5 ? { name: longestStreakName, count: longestStreakCount } : null,
    comeback: maxComebackGap > 30 ? { name: maxComebackName, gapDays: Math.round(maxComebackGap), returnMessages: maxComebackReturnCount } : null,
    midnightConnection: topMidnightCount > 10 ? { name: topMidnightName, count: topMidnightCount } : null,
    consistentConnection: mostConsistent ? { name: mostConsistent.name, activeDays: mostConsistent.activeDays } : null,
    topConnections,
    archetype: { title: archetypeTitle, description: archetypeDesc }
  };
};
