import type { WrappedStats } from '../types/instagram';

export interface ExportProgress {
  percent: number;
  stage: string;
}

export interface ExportResult {
  blob: Blob;
  url: string;
  mimeType: string;
  filename: string;
}

const STAGES = [
  'Starting export engine...',
  'Putting your year together...',
  'Designing your social circle...',
  'Mapping your social calendar...',
  'Calculating your streaks...',
  'Composing month by month...',
  'Adding finishing touches...',
  'Encoding high-definition video...'
];

export async function exportWrappedVideo(
  stats: WrappedStats,
  showNames: boolean = true,
  onProgress?: (progress: ExportProgress) => void,
  abortSignal?: AbortSignal
): Promise<ExportResult> {
  // Target 1080x1920 (9:16 vertical resolution)
  const width = 1080;
  const height = 1920;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // Determine best supported video MIME type
  let mimeType = 'video/mp4';
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
      mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      mimeType = 'video/webm;codecs=vp8';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }
  }

  const isMp4 = mimeType.includes('mp4');
  const filename = isMp4 ? 'instawrapped-2026.mp4' : 'instawrapped-2026.webm';

  // Setup Web Audio for synthesized chimes in video
  let audioDest: MediaStreamAudioDestinationNode | null = null;
  let audioCtx: AudioContext | null = null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      audioDest = audioCtx.createMediaStreamDestination();
    }
  } catch (e) {
    console.warn('Audio export context not available', e);
  }

  const fps = 30;
  const canvasStream = canvas.captureStream(fps);

  // Combine video + audio tracks if audio destination exists
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...(audioDest ? audioDest.stream.getAudioTracks() : [])
  ]);

  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 6000000 // 6 Mbps crisp high-definition
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  recorder.start();

  function playTone(freq: number, startTime: number, duration: number = 0.6) {
    if (!audioCtx || !audioDest) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioDest);
      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      // Ignore audio glitches in rendering
    }
  }

  // Slide definitions for deterministic video rendering
  interface VideoSlide {
    themeColor: string;
    secondaryColor: string;
    marquee: string;
    duration: number; // in seconds
    toneFreq: number;
    render: (progress: number, time: number) => void;
  }

  // Easing helper
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  // Background painter
  function drawBackground(theme: string, secondary: string, marqueeText: string, time: number) {
    // Dynamic Gradient
    const grad = ctx!.createRadialGradient(width * 0.5, height * 0.35, 100, width * 0.5, height * 0.5, 1200);
    grad.addColorStop(0, secondary);
    grad.addColorStop(1, theme);
    ctx!.fillStyle = grad;
    ctx!.fillRect(0, 0, width, height);

    // Glowing Ambient Orbs
    const orb1X = width * 0.2 + Math.sin(time * 0.8) * 80;
    const orb1Y = height * 0.25 + Math.cos(time * 0.8) * 60;
    const orbGrad1 = ctx!.createRadialGradient(orb1X, orb1Y, 10, orb1X, orb1Y, 450);
    orbGrad1.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    orbGrad1.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx!.fillStyle = orbGrad1;
    ctx!.fillRect(0, 0, width, height);

    // Scrolling Marquee
    if (marqueeText) {
      ctx!.save();
      ctx!.globalAlpha = 0.06;
      ctx!.fillStyle = '#ffffff';
      ctx!.font = '900 130px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx!.textBaseline = 'middle';
      const offset = (time * 120) % 1200;
      for (let row = 0; row < 6; row++) {
        const y = 300 + row * 240;
        const dir = row % 2 === 0 ? -1 : 1;
        const x = (dir * offset) % 1200;
        ctx!.fillText(`${marqueeText} • ${marqueeText} • ${marqueeText} • ${marqueeText}`, x - 800, y);
      }
      ctx!.restore();
    }

    // Top Brand Badge
    ctx!.save();
    ctx!.font = '700 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx!.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx!.textAlign = 'center';
    ctx!.fillText('INSTAWRAPPED 2026', width / 2, 140);
    ctx!.restore();
  }

  const slides: VideoSlide[] = [
    // 1. Intro
    {
      themeColor: '#405DE6',
      secondaryColor: '#5851DB',
      marquee: 'INSTA WRAPPED 2026',
      duration: 3.0,
      toneFreq: 440,
      render: (p) => {
        const titleAlpha = Math.min(p * 2, 1);
        const titleY = 880 - (1 - easeOutCubic(Math.min(p * 1.5, 1))) * 60;
        
        ctx!.save();
        ctx!.textAlign = 'center';
        ctx!.fillStyle = `rgba(255, 255, 255, ${titleAlpha})`;
        ctx!.font = '900 110px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('Your Instagram,', width / 2, titleY);
        ctx!.fillText('wrapped.', width / 2, titleY + 130);

        if (p > 0.3) {
          const subAlpha = Math.min((p - 0.3) * 2, 1);
          ctx!.fillStyle = `rgba(255, 255, 255, ${subAlpha * 0.5})`;
          ctx!.font = '800 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText('2026 EDITION', width / 2, titleY + 300);
        }
        ctx!.restore();
      }
    },
    // 2. Total Messages
    {
      themeColor: '#E1306C',
      secondaryColor: '#C13584',
      marquee: 'TOTAL MESSAGES',
      duration: 3.2,
      toneFreq: 494,
      render: (p) => {
        const countProgress = easeOutExpo(Math.min(p * 1.3, 1));
        const currentCount = Math.floor(stats.totalMessages * countProgress);

        ctx!.save();
        ctx!.textAlign = 'center';
        
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx!.font = '600 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('First things first...', width / 2, 700);

        ctx!.fillStyle = '#ffffff';
        ctx!.font = '900 170px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText(currentCount.toLocaleString(), width / 2, 920);

        ctx!.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx!.font = '700 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('messages exchanged', width / 2, 1040);

        // Sent vs Received Ratio Bar
        if (p > 0.4) {
          const barAlpha = Math.min((p - 0.4) * 2, 1);
          const barW = 760;
          const barH = 18;
          const barX = (width - barW) / 2;
          const barY = 1200;
          const sentRatio = stats.totalMessages > 0 ? stats.messagesSent / stats.totalMessages : 0.5;

          ctx!.fillStyle = `rgba(255, 255, 255, ${barAlpha * 0.15})`;
          ctx!.beginPath();
          ctx!.roundRect(barX, barY, barW, barH, 9);
          ctx!.fill();

          ctx!.fillStyle = `rgba(255, 255, 255, ${barAlpha * 0.9})`;
          ctx!.beginPath();
          ctx!.roundRect(barX, barY, barW * sentRatio * Math.min((p - 0.4) * 2, 1), barH, 9);
          ctx!.fill();

          ctx!.font = '600 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillStyle = `rgba(255, 255, 255, ${barAlpha * 0.7})`;
          ctx!.textAlign = 'left';
          ctx!.fillText(`Sent: ${stats.messagesSent.toLocaleString()}`, barX, barY + 65);
          ctx!.textAlign = 'right';
          ctx!.fillText(`Received: ${stats.messagesReceived.toLocaleString()}`, barX + barW, barY + 65);
        }
        ctx!.restore();
      }
    },
    // 3. Social Circle
    {
      themeColor: '#833AB4',
      secondaryColor: '#5851DB',
      marquee: 'SOCIAL CIRCLE',
      duration: 3.5,
      toneFreq: 554,
      render: (p) => {
        ctx!.save();
        ctx!.textAlign = 'center';

        ctx!.fillStyle = '#ffffff';
        ctx!.font = '900 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('Your Social Circle', width / 2, 450);

        const centerX = width / 2;
        const centerY = 920;

        // Draw Center Node (YOU)
        const centerScale = easeOutCubic(Math.min(p * 2, 1));
        ctx!.fillStyle = '#ffffff';
        ctx!.beginPath();
        ctx!.arc(centerX, centerY, 70 * centerScale, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.fillStyle = '#000000';
        ctx!.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('YOU', centerX, centerY + 12);

        // Draw Orbiting Nodes
        const topConns = stats.allConnections?.slice(0, 8) || [];
        const maxMsgs = topConns[0]?.messageCount || 1;

        topConns.forEach((conn, i) => {
          const delay = 0.15 + i * 0.08;
          if (p < delay) return;
          const nodeP = easeOutCubic(Math.min((p - delay) * 2, 1));
          const angle = (i / topConns.length) * Math.PI * 2 + (p * 0.4);
          const radius = 240 + (i % 2) * 60;
          const x = centerX + Math.cos(angle) * radius * nodeP;
          const y = centerY + Math.sin(angle) * radius * nodeP;
          const size = 35 + (conn.messageCount / maxMsgs) * 45;

          // Connective line
          ctx!.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx!.lineWidth = 2;
          ctx!.beginPath();
          ctx!.moveTo(centerX, centerY);
          ctx!.lineTo(x, y);
          ctx!.stroke();

          // Node Circle
          ctx!.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx!.beginPath();
          ctx!.arc(x, y, size, 0, Math.PI * 2);
          ctx!.fill();
          ctx!.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx!.stroke();

          // Node Label
          if (showNames && size > 45) {
            ctx!.fillStyle = '#ffffff';
            ctx!.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx!.fillText(conn.name.split(' ')[0], x, y + 8);
          }
        });

        // Bottom Stat
        if (p > 0.5) {
          const statAlpha = Math.min((p - 0.5) * 2, 1);
          ctx!.fillStyle = `rgba(255, 255, 255, ${statAlpha})`;
          ctx!.font = '900 100px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText(stats.uniqueContacts.toLocaleString(), width / 2, 1420);
          ctx!.fillStyle = `rgba(255, 255, 255, ${statAlpha * 0.6})`;
          ctx!.font = '600 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText('people you interacted with', width / 2, 1500);
        }
        ctx!.restore();
      }
    },
    // 4. #1 Top Connection
    {
      themeColor: '#009688',
      secondaryColor: '#004D40',
      marquee: 'TOP CONNECTION',
      duration: 3.5,
      toneFreq: 659,
      render: (p) => {
        const top = stats.topConnections[0] || { name: 'Nobody', messageCount: 0 };
        ctx!.save();
        ctx!.textAlign = 'center';

        ctx!.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx!.font = '600 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('Your #1 was...', width / 2, 650);

        const nameAlpha = easeOutCubic(Math.min(p * 1.5, 1));
        const nameScale = 0.8 + 0.2 * easeOutExpo(Math.min(p * 1.5, 1));

        ctx!.save();
        ctx!.translate(width / 2, 900);
        ctx!.scale(nameScale, nameScale);
        ctx!.fillStyle = `rgba(255, 255, 255, ${nameAlpha})`;
        ctx!.font = '900 120px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText(showNames ? top.name : 'Your Best Friend', 0, 0);
        ctx!.restore();

        if (p > 0.4) {
          const countP = easeOutExpo(Math.min((p - 0.4) * 1.6, 1));
          const currentCount = Math.floor(top.messageCount * countP);
          ctx!.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx!.font = '700 52px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText(`${currentCount.toLocaleString()} messages`, width / 2, 1060);

          ctx!.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx!.font = '500 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText(`Top ${Math.round((top.messageCount / (stats.totalMessages || 1)) * 100)}% of all your messages`, width / 2, 1140);
        }
        ctx!.restore();
      }
    },
    // 5. Top 5 Podium
    {
      themeColor: '#F56040',
      secondaryColor: '#D32F2F',
      marquee: 'TOP FIVE FRIENDS',
      duration: 3.5,
      toneFreq: 740,
      render: (p) => {
        ctx!.save();
        ctx!.textAlign = 'center';

        ctx!.fillStyle = '#ffffff';
        ctx!.font = '900 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('Your Inner Circle', width / 2, 450);

        const list = stats.topConnections.slice(0, 5);
        list.forEach((conn, i) => {
          const delay = 0.1 + i * 0.12;
          if (p < delay) return;
          const itemP = easeOutCubic(Math.min((p - delay) * 2, 1));
          const y = 600 + i * 145;
          const x = width / 2 - (1 - itemP) * 50;

          // Row card background
          const cardW = 860;
          const cardH = 115;
          const cardX = x - cardW / 2;

          ctx!.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx!.beginPath();
          ctx!.roundRect(cardX, y, cardW, cardH, 24);
          ctx!.fill();
          ctx!.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx!.lineWidth = 2;
          ctx!.stroke();

          // Rank
          ctx!.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx!.font = '900 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.textAlign = 'left';
          ctx!.fillText(`0${i + 1}`, cardX + 35, y + 72);

          // Name
          ctx!.fillStyle = '#ffffff';
          ctx!.font = '800 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const displayName = showNames ? conn.name : `Friend 0${i + 1}`;
          ctx!.fillText(displayName.length > 16 ? displayName.substring(0, 14) + '...' : displayName, cardX + 115, y + 72);

          // Messages
          ctx!.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx!.font = '600 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.textAlign = 'right';
          ctx!.fillText(`${conn.messageCount.toLocaleString()} msgs`, cardX + cardW - 35, y + 72);
        });
        ctx!.restore();
      }
    },
    // 6. Social Calendar / Heatmap
    {
      themeColor: '#C13584',
      secondaryColor: '#833AB4',
      marquee: 'SOCIAL CALENDAR',
      duration: 3.5,
      toneFreq: 880,
      render: (p) => {
        ctx!.save();
        ctx!.textAlign = 'center';

        ctx!.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx!.font = '600 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('Your Social Calendar', width / 2, 450);

        ctx!.fillStyle = '#ffffff';
        ctx!.font = '900 130px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText(stats.activeDaysCount.toString(), width / 2, 630);

        ctx!.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx!.font = '700 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('active days in 2026', width / 2, 730);

        // Heatmap Grid
        const cal = stats.socialCalendar || [];
        const daysToShow = cal.slice(-120);
        const mostActive = [...cal].sort((a, b) => b.total - a.total)[0] || { total: 100 };

        const cols = 12;
        // rows calculation
        const cellSize = 52;
        const gap = 14;
        const gridW = cols * (cellSize + gap) - gap;
        const startX = (width - gridW) / 2;
        const startY = 880;

        daysToShow.forEach((day, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = startX + col * (cellSize + gap);
          const y = startY + row * (cellSize + gap);

          const delay = 0.2 + (index / daysToShow.length) * 0.5;
          if (p < delay) return;

          const intensity = Math.min(day.total / (mostActive.total || 1), 1);
          let alpha = 0.15;
          if (intensity > 0.1) alpha = 0.35;
          if (intensity > 0.4) alpha = 0.65;
          if (intensity > 0.7) alpha = 0.9;
          if (intensity > 0.9) alpha = 1.0;

          ctx!.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx!.beginPath();
          ctx!.roundRect(x, y, cellSize, cellSize, 10);
          ctx!.fill();
        });

        if (p > 0.6) {
          ctx!.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx!.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText(`Peak: ${stats.peakDayOfWeek} at ${stats.peakHour > 12 ? stats.peakHour - 12 + ' PM' : stats.peakHour + ' AM'}`, width / 2, 1600);
        }
        ctx!.restore();
      }
    },
    // 7. Conversation Streak
    {
      themeColor: '#5851DB',
      secondaryColor: '#3F51B5',
      marquee: 'LONGEST STREAK',
      duration: 3.5,
      toneFreq: 659,
      render: (p) => {
        const streak = stats.longestDayStreak || { days: 42, name: 'Bestie', startDate: 'Jan', endDate: 'Dec' };
        const streakCount = Math.floor(streak.days * easeOutExpo(Math.min(p * 1.5, 1)));

        ctx!.save();
        ctx!.textAlign = 'center';

        ctx!.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx!.font = '600 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('Longest Daily Streak', width / 2, 600);

        ctx!.fillStyle = '#ffffff';
        ctx!.font = '900 240px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText(streakCount.toString(), width / 2, 890);

        ctx!.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx!.font = '700 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('consecutive days chatting', width / 2, 1020);

        if (p > 0.4) {
          const subAlpha = Math.min((p - 0.4) * 2, 1);
          ctx!.fillStyle = `rgba(255, 255, 255, ${subAlpha * 0.7})`;
          ctx!.font = '600 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText(`with ${showNames ? streak.name : 'Someone special'}`, width / 2, 1140);

          if (streak.startDate && streak.endDate) {
            ctx!.fillStyle = `rgba(255, 255, 255, ${subAlpha * 0.4})`;
            ctx!.font = '500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx!.fillText(`${streak.startDate}  ?  ${streak.endDate}`, width / 2, 1220);
          }
        }
        ctx!.restore();
      }
    },
    // 8. Month-by-Month
    {
      themeColor: '#4A154B',
      secondaryColor: '#6B114D',
      marquee: 'MONTH BY MONTH',
      duration: 3.5,
      toneFreq: 523,
      render: (p) => {
        ctx!.save();
        ctx!.textAlign = 'center';

        ctx!.fillStyle = '#ffffff';
        ctx!.font = '900 68px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('Month by Month', width / 2, 420);

        const months = stats.monthlyTopConnections?.slice(-5) || [];
        months.forEach((m, i) => {
          const delay = 0.1 + i * 0.15;
          if (p < delay) return;
          const itemP = easeOutCubic(Math.min((p - delay) * 2, 1));
          const y = 560 + i * 175;

          const cardW = 860;
          const cardH = 135;
          const cardX = (width - cardW) / 2;

          ctx!.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx!.beginPath();
          ctx!.roundRect(cardX, y, cardW, cardH, 24);
          ctx!.fill();

          // Month Label
          ctx!.textAlign = 'left';
          ctx!.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx!.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const formattedMonth = m.month.includes('-') ? (new Date(parseInt(m.month.split('-')[0], 10), parseInt(m.month.split('-')[1], 10) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()) : m.month.toUpperCase();
          ctx!.fillText(formattedMonth, cardX + 35, y + 48);

          // Name
          ctx!.fillStyle = '#ffffff';
          ctx!.font = '800 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText(showNames ? m.name : 'Top Contact', cardX + 35, y + 100);

          // Message Count
          ctx!.textAlign = 'right';
          ctx!.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx!.font = '700 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText(`${m.count.toLocaleString()} msgs`, cardX + cardW - 35, y + 80);

          // Progress Bar
          const barW = (cardW - 70) * Math.min(m.count / 3000, 1) * itemP;
          ctx!.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx!.fillRect(cardX + 35, y + cardH - 12, barW, 4);
        });
        ctx!.restore();
      }
    },
    // 9. Archetype
    {
      themeColor: '#FD1D1D',
      secondaryColor: '#833AB4',
      marquee: 'YOUR ARCHETYPE',
      duration: 3.5,
      toneFreq: 587,
      render: (p) => {
        ctx!.save();
        ctx!.textAlign = 'center';

        ctx!.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx!.font = '600 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('Your 2026 Archetype', width / 2, 600);

        const titleScale = 0.85 + 0.15 * easeOutExpo(Math.min(p * 1.5, 1));
        ctx!.save();
        ctx!.translate(width / 2, 850);
        ctx!.scale(titleScale, titleScale);
        ctx!.fillStyle = '#ffffff';
        ctx!.font = '900 96px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText(stats.archetype.title, 0, 0);
        ctx!.restore();

        if (p > 0.3) {
          const descAlpha = Math.min((p - 0.3) * 2, 1);
          ctx!.fillStyle = `rgba(255, 255, 255, ${descAlpha * 0.65})`;
          ctx!.font = '500 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          
          // Wrap description nicely
          const words = stats.archetype.description.split(' ');
          let line = '';
          let lineY = 1040;
          for (const word of words) {
            const testLine = line + word + ' ';
            if (ctx!.measureText(testLine).width > 860) {
              ctx!.fillText(line, width / 2, lineY);
              line = word + ' ';
              lineY += 60;
            } else {
              line = testLine;
            }
          }
          ctx!.fillText(line, width / 2, lineY);
        }
        ctx!.restore();
      }
    },
    // 10. Outro Card
    {
      themeColor: '#180D2B',
      secondaryColor: '#301358',
      marquee: 'THAT WAS YOUR WRAPPED',
      duration: 3.5,
      toneFreq: 659,
      render: (p) => {
        ctx!.save();
        ctx!.textAlign = 'center';

        ctx!.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx!.font = '700 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('THAT WAS YOUR', width / 2, 600);

        ctx!.fillStyle = '#ffffff';
        ctx!.font = '900 115px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('INSTAWRAPPED', width / 2, 730);

        ctx!.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx!.font = '800 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('2026', width / 2, 830);

        // Summary Pill Card
        if (p > 0.3) {
          const pillAlpha = Math.min((p - 0.3) * 2, 1);
          const cardW = 860;
          const cardH = 340;
          const cardX = (width - cardW) / 2;
          const cardY = 1000;

          ctx!.fillStyle = `rgba(255, 255, 255, ${pillAlpha * 0.1})`;
          ctx!.beginPath();
          ctx!.roundRect(cardX, cardY, cardW, cardH, 32);
          ctx!.fill();
          ctx!.strokeStyle = `rgba(255, 255, 255, ${pillAlpha * 0.2})`;
          ctx!.lineWidth = 2;
          ctx!.stroke();

          ctx!.fillStyle = '#ffffff';
          ctx!.font = '900 70px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText(stats.totalMessages.toLocaleString(), width / 2, cardY + 110);

          ctx!.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx!.font = '600 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText(`Messages Exchanged across ${stats.activeDaysCount} Days`, width / 2, cardY + 180);

          ctx!.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx!.font = '700 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx!.fillText(`Top Connection: ${showNames ? (stats.topConnections[0]?.name || 'Nobody') : 'Hidden'}`, width / 2, cardY + 260);
        }

        ctx!.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx!.font = '600 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx!.fillText('instawrapped-dun.vercel.app', width / 2, 1550);

        ctx!.restore();
      }
    }
  ];

  const totalDuration = slides.reduce((sum, s) => sum + s.duration, 0);
  const totalFrames = Math.floor(totalDuration * fps);

  let currentFrame = 0;
  let currentSlideIndex = 0;
  let slideTimeElapsed = 0;

  return new Promise<ExportResult>((resolve, reject) => {
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        try {
          recorder.stop();
        } catch (e) {}
        reject(new Error('Export canceled by user'));
      });
    }

    recorder.onstop = () => {
      try {
        const videoBlob = new Blob(recordedChunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(videoBlob);
        resolve({
          blob: videoBlob,
          url: videoUrl,
          mimeType,
          filename
        });
      } catch (err) {
        reject(err);
      }
    };

    function renderNextFrame() {
      if (abortSignal?.aborted) return;

      if (currentFrame >= totalFrames || currentSlideIndex >= slides.length) {
        recorder.stop();
        if (audioCtx) {
          audioCtx.close().catch(() => {});
        }
        return;
      }

      const currentSlide = slides[currentSlideIndex];
      const slideProgress = Math.min(slideTimeElapsed / currentSlide.duration, 1);

      // Play chime at start of slide
      if (slideTimeElapsed === 0 && audioCtx) {
        playTone(currentSlide.toneFreq, audioCtx.currentTime);
      }

      // Draw background and slide content
      drawBackground(
        currentSlide.themeColor,
        currentSlide.secondaryColor,
        currentSlide.marquee,
        currentFrame / fps
      );

      currentSlide.render(slideProgress, currentFrame / fps);

      // Cross-fade transition between slides
      if (slideProgress > 0.85 && currentSlideIndex < slides.length - 1) {
        const nextSlide = slides[currentSlideIndex + 1];
        const fadeP = (slideProgress - 0.85) / 0.15;
        ctx!.save();
        ctx!.globalAlpha = easeInOutQuad(fadeP) * 0.4;
        ctx!.fillStyle = nextSlide.themeColor;
        ctx!.fillRect(0, 0, width, height);
        ctx!.restore();
      }

      // Progress reporting
      const overallPercent = Math.min(Math.round((currentFrame / totalFrames) * 100), 99);
      const stageIdx = Math.min(
        Math.floor((currentSlideIndex / slides.length) * STAGES.length),
        STAGES.length - 1
      );
      
      onProgress?.({
        percent: overallPercent,
        stage: STAGES[stageIdx]
      });

      slideTimeElapsed += 1 / fps;
      if (slideTimeElapsed >= currentSlide.duration) {
        currentSlideIndex++;
        slideTimeElapsed = 0;
      }

      currentFrame++;
      // Render in smooth fast batches
      setTimeout(renderNextFrame, 1000 / fps);
    }

    renderNextFrame();
  });
}


