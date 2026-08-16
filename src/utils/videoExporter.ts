import type { WrappedStats } from '../types/instagram';
import { Muxer as Mp4Muxer, ArrayBufferTarget as Mp4Target } from 'mp4-muxer';
import { Muxer as WebmMuxer, ArrayBufferTarget as WebmTarget } from 'webm-muxer';

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

export const formatMonthTitle = (monthStr: string): string => {
  if (!monthStr) return '';
  if (monthStr.includes('-')) {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    if (!isNaN(date.getTime())) {
      const monthName = date.toLocaleString('default', { month: 'long' });
      return monthName.toUpperCase() + ' ' + year;
    }
  }
  return monthStr.toUpperCase();
};

// Canvas Text Safety Helpers
function drawFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxFontSize: number,
  maxWidth: number,
  fontWeight: string = '900',
  fontFamily: string = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
) {
  let currentSize = maxFontSize;
  ctx.font = fontWeight + ' ' + currentSize + 'px ' + fontFamily;
  let width = ctx.measureText(text).width;

  if (width > maxWidth && width > 0) {
    currentSize = Math.max(Math.floor(maxFontSize * (maxWidth / width)), 24);
    ctx.font = fontWeight + ' ' + currentSize + 'px ' + fontFamily;
    width = ctx.measureText(text).width;
  }

  if (width > maxWidth) {
    let truncated = text;
    while (truncated.length > 3 && ctx.measureText(truncated + '...').width > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    ctx.fillText(truncated + '...', x, y);
  } else {
    ctx.fillText(text, x, y);
  }
}

function drawTruncatedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
) {
  const measured = ctx.measureText(text).width;
  if (measured <= maxWidth) {
    ctx.fillText(text, x, y);
    return;
  }
  let truncated = text;
  while (truncated.length > 3 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  ctx.fillText(truncated + '...', x, y);
}

function wrapAndDrawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 4
) {
  const words = text.split(' ');
  let line = '';
  let currentY = startY;
  let linesDrawn = 0;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? line + ' ' + words[i] : words[i];
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && line) {
      linesDrawn++;
      if (linesDrawn === maxLines && i < words.length) {
        drawTruncatedText(ctx, line + '...', x, currentY, maxWidth);
        return;
      }
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line && linesDrawn < maxLines) {
    ctx.fillText(line, x, currentY);
  }
}

export async function exportWrappedVideo(
  stats: WrappedStats,
  showNames: boolean = true,
  onProgress?: (progress: ExportProgress) => void,
  abortSignal?: AbortSignal
): Promise<ExportResult> {
  const width = 1080;
  const height = 1920;
  const fps = 30;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  try {
    if (document.fonts) {
      await document.fonts.ready;
    }
  } catch (e) {}

  const hasWebCodecs = typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined';

  if (hasWebCodecs) {
    try {
      return await exportWithWebCodecs(canvas, ctx, stats, showNames, fps, width, height, onProgress, abortSignal);
    } catch (e: any) {
      if (abortSignal?.aborted) throw e;
      console.warn('WebCodecs failed, falling back to MediaRecorder:', e);
    }
  }

  return await exportWithMediaRecorder(canvas, ctx, stats, showNames, fps, width, height, onProgress, abortSignal);
}

async function exportWithWebCodecs(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  stats: WrappedStats,
  showNames: boolean,
  fps: number,
  width: number,
  height: number,
  onProgress?: (progress: ExportProgress) => void,
  abortSignal?: AbortSignal
): Promise<ExportResult> {
  let isH264 = true;
  let videoCodec = 'avc1.640028';

  try {
    const isSupported = await VideoEncoder.isConfigSupported({
      codec: videoCodec,
      width,
      height,
      bitrate: 10_000_000,
      framerate: fps
    });
    if (!isSupported.supported) {
      videoCodec = 'avc1.42001f';
      const isBaseSupported = await VideoEncoder.isConfigSupported({
        codec: videoCodec,
        width,
        height,
        bitrate: 8_000_000,
        framerate: fps
      });
      if (!isBaseSupported.supported) {
        isH264 = false;
        videoCodec = 'vp09.00.10.08';
      }
    }
  } catch (e) {
    isH264 = false;
    videoCodec = 'vp09.00.10.08';
  }

  const timeline = createTimeline(stats, showNames, width, height, fps);
  const totalFrames = timeline.totalFrames;

  if (isH264) {
    const target = new Mp4Target();
    const muxer = new Mp4Muxer({
      target,
      video: {
        codec: 'avc',
        width,
        height
      },
      fastStart: 'in-memory'
    });

    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('VideoEncoder error', e)
    });

    await encoder.configure({
      codec: videoCodec,
      width,
      height,
      bitrate: 10_000_000,
      framerate: fps
    });

    for (let f = 0; f < totalFrames; f++) {
      if (abortSignal?.aborted) {
        encoder.close();
        throw new Error('Export canceled by user');
      }

      timeline.renderFrame(ctx, f);

      const timestamp = Math.round((f * 1_000_000) / fps);
      const frame = new VideoFrame(canvas, { timestamp });
      const keyFrame = f % 60 === 0;

      encoder.encode(frame, { keyFrame });
      frame.close();

      if (f % 15 === 0) {
        const percent = Math.min(Math.round((f / totalFrames) * 98), 98);
        onProgress?.({
          percent,
          stage: f < totalFrames * 0.5 ? 'Rendering your Wrapped...' : 'Encoding crisp 1080p video...'
        });
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress?.({ percent: 99, stage: 'Finalizing MP4 video...' });
    await encoder.flush();
    encoder.close();
    muxer.finalize();

    const buffer = target.buffer;
    const blob = new Blob([buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    return {
      blob,
      url,
      mimeType: 'video/mp4',
      filename: 'instawrapped-2026.mp4'
    };
  } else {
    const target = new WebmTarget();
    const muxer = new WebmMuxer({
      target,
      video: {
        codec: 'V_VP9',
        width,
        height
      }
    });

    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('VideoEncoder error', e)
    });

    await encoder.configure({
      codec: videoCodec,
      width,
      height,
      bitrate: 10_000_000,
      framerate: fps
    });

    for (let f = 0; f < totalFrames; f++) {
      if (abortSignal?.aborted) {
        encoder.close();
        throw new Error('Export canceled by user');
      }

      timeline.renderFrame(ctx, f);

      const timestamp = Math.round((f * 1_000_000) / fps);
      const frame = new VideoFrame(canvas, { timestamp });
      const keyFrame = f % 60 === 0;

      encoder.encode(frame, { keyFrame });
      frame.close();

      if (f % 15 === 0) {
        const percent = Math.min(Math.round((f / totalFrames) * 98), 98);
        onProgress?.({
          percent,
          stage: 'Encoding high-definition video...'
        });
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress?.({ percent: 99, stage: 'Finalizing video...' });
    await encoder.flush();
    encoder.close();
    muxer.finalize();

    const buffer = target.buffer;
    const blob = new Blob([buffer], { type: 'video/webm' });
    const url = URL.createObjectURL(blob);

    return {
      blob,
      url,
      mimeType: 'video/webm',
      filename: 'instawrapped-2026.webm'
    };
  }
}

async function exportWithMediaRecorder(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  stats: WrappedStats,
  showNames: boolean,
  fps: number,
  width: number,
  height: number,
  onProgress?: (progress: ExportProgress) => void,
  abortSignal?: AbortSignal
): Promise<ExportResult> {
  let mimeType = 'video/webm';
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
      mimeType = 'video/mp4;codecs=avc1';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    }
  }

  const stream = canvas.captureStream(fps);
  const recordedChunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 10_000_000
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  };

  recorder.start();

  const timeline = createTimeline(stats, showNames, width, height, fps);
  const totalFrames = timeline.totalFrames;

  return new Promise<ExportResult>((resolve, reject) => {
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        try { recorder.stop(); } catch (e) {}
        reject(new Error('Export canceled by user'));
      });
    }

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const isMp4 = mimeType.includes('mp4');
      resolve({
        blob,
        url,
        mimeType,
        filename: isMp4 ? 'instawrapped-2026.mp4' : 'instawrapped-2026.webm'
      });
    };

    let f = 0;
    function processNext() {
      if (abortSignal?.aborted) return;
      if (f >= totalFrames) {
        recorder.stop();
        return;
      }

      timeline.renderFrame(ctx, f);

      if (f % 15 === 0) {
        const percent = Math.min(Math.round((f / totalFrames) * 98), 98);
        onProgress?.({
          percent,
          stage: 'Rendering your story...'
        });
      }

      f++;
      setTimeout(processNext, 1000 / fps);
    }

    processNext();
  });
}

function createTimeline(
  stats: WrappedStats,
  showNames: boolean,
  width: number,
  height: number,
  fps: number
) {
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  interface SlideDef {
    theme: string;
    secondary: string;
    marquee: string;
    duration: number;
    render: (ctx: CanvasRenderingContext2D, p: number, t: number) => void;
  }

  const topConns = stats.topConnections || [];
  const top1 = topConns[0] || { name: 'Someone', messageCount: 0 };
  const top5 = topConns.slice(0, 5);
  const cal = stats.socialCalendar || [];
  const mostActiveDay = [...cal].sort((a, b) => b.total - a.total)[0] || { total: 100, date: 'Peak Day' };
  const streak = stats.longestDayStreak || { days: 42, name: 'Bestie', startDate: 'Jan', endDate: 'Dec' };
  const months = stats.monthlyTopConnections?.slice(-5) || [];
  const maxMonthCount = Math.max(...months.map((m) => m.count), 1);

  const slides: SlideDef[] = [
    {
      theme: '#3B5998',
      secondary: '#833AB4',
      marquee: 'INSTAWRAPPED 2026',
      duration: 2.5,
      render: (ctx, p) => {
        const titleAlpha = Math.min(p * 2, 1);
        const titleY = 880 - (1 - easeOutCubic(Math.min(p * 1.5, 1))) * 50;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255, 255, 255, ' + titleAlpha + ')';
        drawFittedText(ctx, 'Your Instagram,', width / 2, titleY, 110, 920);
        drawFittedText(ctx, 'wrapped.', width / 2, titleY + 130, 110, 920);

        if (p > 0.25) {
          const subAlpha = Math.min((p - 0.25) * 2, 1);
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (subAlpha * 0.45) + ')';
          drawFittedText(ctx, '2026 EDITION', width / 2, titleY + 300, 44, 800, '800');
        }
        ctx.restore();
      }
    },
    {
      theme: '#E1306C',
      secondary: '#C13584',
      marquee: 'TOTAL MESSAGES',
      duration: 2.5,
      render: (ctx, p) => {
        const countProgress = easeOutExpo(Math.min(p * 1.4, 1));
        const currentCount = Math.floor(stats.totalMessages * countProgress);

        ctx.save();
        ctx.textAlign = 'center';

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawFittedText(ctx, 'First things first...', width / 2, 680, 42, 800, '700');

        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, currentCount.toLocaleString(), width / 2, 910, 160, 940, '900');

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        drawFittedText(ctx, 'messages exchanged', width / 2, 1030, 54, 880, '800');

        if (p > 0.3) {
          const barAlpha = Math.min((p - 0.3) * 2, 1);
          const barW = 780;
          const barH = 18;
          const barX = (width - barW) / 2;
          const barY = 1180;
          const sentRatio = stats.totalMessages > 0 ? stats.messagesSent / stats.totalMessages : 0.5;

          ctx.fillStyle = 'rgba(255, 255, 255, ' + (barAlpha * 0.15) + ')';
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW, barH, 9);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, ' + (barAlpha * 0.9) + ')';
          ctx.beginPath();
          ctx.roundRect(barX, barY, barW * sentRatio * Math.min((p - 0.3) * 2, 1), barH, 9);
          ctx.fill();

          ctx.font = '700 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (barAlpha * 0.75) + ')';
          ctx.textAlign = 'left';
          drawTruncatedText(ctx, 'Sent: ' + stats.messagesSent.toLocaleString(), barX, barY + 60, 360);
          ctx.textAlign = 'right';
          drawTruncatedText(ctx, 'Received: ' + stats.messagesReceived.toLocaleString(), barX + barW, barY + 60, 360);
        }
        ctx.restore();
      }
    },
    {
      theme: '#833AB4',
      secondary: '#5851DB',
      marquee: 'SOCIAL CIRCLE',
      duration: 2.6,
      render: (ctx, p, t) => {
        ctx.save();
        ctx.textAlign = 'center';

        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, 'Your Social Circle', width / 2, 450, 68, 880, '900');

        const centerX = width / 2;
        const centerY = 920;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 230, 0, Math.PI * 2);
        ctx.stroke();

        const centerScale = easeOutCubic(Math.min(p * 2, 1));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 70 * centerScale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('YOU', centerX, centerY + 11);

        const topSlice = topConns.slice(0, 8);
        const maxM = topSlice[0]?.messageCount || 1;

        topSlice.forEach((conn, i) => {
          const delay = 0.1 + i * 0.08;
          if (p < delay) return;
          const nodeP = easeOutCubic(Math.min((p - delay) * 2, 1));
          const angle = (i / topSlice.length) * Math.PI * 2 + t * 0.5;
          const radius = 220 + (i % 2) * 45;
          const x = centerX + Math.cos(angle) * radius * nodeP;
          const y = centerY + Math.sin(angle) * radius * nodeP;
          const size = 32 + (conn.messageCount / maxM) * 38;

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.stroke();

          if (showNames && size > 40) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '800 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            drawTruncatedText(ctx, conn.name.split(' ')[0], x, y + 7, 120);
          }
        });

        if (p > 0.4) {
          const statAlpha = Math.min((p - 0.4) * 2, 1);
          ctx.fillStyle = 'rgba(255, 255, 255, ' + statAlpha + ')';
          drawFittedText(ctx, stats.uniqueContacts.toLocaleString(), width / 2, 1420, 110, 880, '900');
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (statAlpha * 0.65) + ')';
          drawFittedText(ctx, 'people in your universe', width / 2, 1490, 38, 800, '700');
        }
        ctx.restore();
      }
    },
    {
      theme: '#00897B',
      secondary: '#004D40',
      marquee: 'TOP CONNECTION',
      duration: 2.6,
      render: (ctx, p) => {
        ctx.save();
        ctx.textAlign = 'center';

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawFittedText(ctx, 'Your #1 was...', width / 2, 650, 44, 800, '700');

        const nameAlpha = easeOutCubic(Math.min(p * 1.4, 1));
        const nameScale = 0.85 + 0.15 * easeOutExpo(Math.min(p * 1.4, 1));

        ctx.save();
        ctx.translate(width / 2, 890);
        ctx.scale(nameScale, nameScale);
        ctx.fillStyle = 'rgba(255, 255, 255, ' + nameAlpha + ')';
        const topDisplayName = showNames ? top1.name : 'Your Best Friend';
        drawFittedText(ctx, topDisplayName, 0, 0, 105, 880, '900');
        ctx.restore();

        if (p > 0.35) {
          const countP = easeOutExpo(Math.min((p - 0.35) * 1.5, 1));
          const currentCount = Math.floor(top1.messageCount * countP);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          drawFittedText(ctx, currentCount.toLocaleString() + ' messages', width / 2, 1050, 54, 880, '800');

          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          const pct = Math.round((top1.messageCount / (stats.totalMessages || 1)) * 100);
          drawFittedText(ctx, 'Made up ' + pct + '% of all your messages', width / 2, 1130, 32, 800, '600');
        }
        ctx.restore();
      }
    },
    {
      theme: '#F56040',
      secondary: '#D32F2F',
      marquee: 'TOP FIVE FRIENDS',
      duration: 2.6,
      render: (ctx, p) => {
        ctx.save();
        ctx.textAlign = 'center';

        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, 'Your Inner Circle', width / 2, 450, 68, 880, '900');

        top5.forEach((conn, i) => {
          const delay = 0.08 + i * 0.1;
          if (p < delay) return;
          const itemP = easeOutCubic(Math.min((p - delay) * 2, 1));
          const y = 580 + i * 150;
          const x = width / 2 - (1 - itemP) * 40;

          const cardW = 860;
          const cardH = 120;
          const cardX = x - cardW / 2;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.beginPath();
          ctx.roundRect(cardX, y, cardW, cardH, 24);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.font = '900 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('0' + (i + 1), cardX + 35, y + 74);

          ctx.fillStyle = '#ffffff';
          ctx.font = '800 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const displayName = showNames ? conn.name : 'Friend 0' + (i + 1);
          drawTruncatedText(ctx, displayName, cardX + 115, y + 74, 460);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.font = '700 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'right';
          drawTruncatedText(ctx, conn.messageCount.toLocaleString() + ' msgs', cardX + cardW - 35, y + 74, 240);
        });
        ctx.restore();
      }
    },
    {
      theme: '#C13584',
      secondary: '#833AB4',
      marquee: 'SOCIAL CALENDAR',
      duration: 2.6,
      render: (ctx, p) => {
        ctx.save();
        ctx.textAlign = 'center';

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawFittedText(ctx, 'Your Social Calendar', width / 2, 450, 40, 800, '700');

        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, stats.activeDaysCount.toString(), width / 2, 630, 130, 880, '900');

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        drawFittedText(ctx, 'active days in 2026', width / 2, 730, 50, 880, '800');

        const daysToShow = cal.slice(-108);
        const cols = 12;
        const cellSize = 54;
        const gap = 14;
        const gridW = cols * (cellSize + gap) - gap;
        const startX = (width - gridW) / 2;
        const startY = 880;

        daysToShow.forEach((day, index) => {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = startX + col * (cellSize + gap);
          const y = startY + row * (cellSize + gap);

          const delay = 0.15 + (index / daysToShow.length) * 0.45;
          if (p < delay) return;

          const intensity = Math.min(day.total / (mostActiveDay.total || 1), 1);
          let alpha = 0.15;
          if (intensity > 0.08) alpha = 0.35;
          if (intensity > 0.35) alpha = 0.65;
          if (intensity > 0.7) alpha = 0.9;
          if (intensity > 0.9) alpha = 1.0;

          ctx.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')';
          ctx.beginPath();
          ctx.roundRect(x, y, cellSize, cellSize, 10);
          ctx.fill();
        });

        if (p > 0.5) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          drawFittedText(ctx, 'Peak: ' + stats.peakDayOfWeek + ' at ' + (stats.peakHour > 12 ? (stats.peakHour - 12) + ' PM' : stats.peakHour + ' AM'), width / 2, 1600, 30, 800, '700');
        }
        ctx.restore();
      }
    },
    {
      theme: '#5851DB',
      secondary: '#3F51B5',
      marquee: 'LONGEST STREAK',
      duration: 2.6,
      render: (ctx, p) => {
        const streakCount = Math.floor(streak.days * easeOutExpo(Math.min(p * 1.4, 1)));

        ctx.save();
        ctx.textAlign = 'center';

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawFittedText(ctx, 'Longest Daily Streak', width / 2, 590, 44, 800, '700');

        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, streakCount.toString(), width / 2, 880, 220, 900, '900');

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        drawFittedText(ctx, 'consecutive days chatting', width / 2, 1010, 56, 880, '800');

        if (p > 0.35) {
          const subAlpha = Math.min((p - 0.35) * 2, 1);
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (subAlpha * 0.8) + ')';
          drawFittedText(ctx, 'with ' + (showNames ? streak.name : 'Someone special'), width / 2, 1140, 44, 880, '700');

          if (streak.startDate && streak.endDate) {
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (subAlpha * 0.45) + ')';
            drawFittedText(ctx, streak.startDate + '  →  ' + streak.endDate, width / 2, 1220, 30, 800, '600');
          }
        }
        ctx.restore();
      }
    },
    {
      theme: '#4A154B',
      secondary: '#6B114D',
      marquee: 'MONTH BY MONTH',
      duration: 2.6,
      render: (ctx, p) => {
        ctx.save();
        ctx.textAlign = 'center';

        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, 'Month by Month', width / 2, 420, 68, 880, '900');

        months.forEach((m, i) => {
          const delay = 0.08 + i * 0.12;
          if (p < delay) return;
          const itemP = easeOutCubic(Math.min((p - delay) * 2, 1));
          const y = 560 + i * 175;

          const cardW = 860;
          const cardH = 135;
          const cardX = (width - cardW) / 2;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.beginPath();
          ctx.roundRect(cardX, y, cardW, cardH, 24);
          ctx.fill();

          ctx.textAlign = 'left';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '800 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          drawTruncatedText(ctx, formatMonthTitle(m.month), cardX + 35, y + 48, 400);

          ctx.fillStyle = '#ffffff';
          ctx.font = '800 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const contactName = showNames ? m.name : 'Top Contact';
          drawTruncatedText(ctx, contactName, cardX + 35, y + 100, 480);

          ctx.textAlign = 'right';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '700 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          drawTruncatedText(ctx, m.count.toLocaleString() + ' msgs', cardX + cardW - 35, y + 80, 260);

          const barW = (cardW - 70) * Math.min(m.count / maxMonthCount, 1) * itemP;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(cardX + 35, y + cardH - 10, barW, 5);
        });
        ctx.restore();
      }
    },
    ...(stats.reelsWatchedStats && stats.reelsWatchedStats.totalWatched > 0 ? [{
      theme: '#833AB4',
      secondary: '#E1306C',
      marquee: 'REEL ERA',
      duration: 3.8,
      render: (ctx: CanvasRenderingContext2D, p: number) => {
        const reels = stats.reelsWatchedStats!;
        const countP = easeOutExpo(Math.min(p * 1.4, 1));
        const currentCount = Math.floor(reels.totalWatched * countP);

        ctx.save();
        ctx.textAlign = 'center';

        // Eyebrow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawFittedText(ctx, 'AND FINALLY...', width / 2, 520, 36, 800, '900');

        // Headline
        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, 'WE NEED TO TALK', width / 2, 620, 64, 880, '900');
        drawFittedText(ctx, 'ABOUT YOUR REEL ERA.', width / 2, 700, 64, 880, '900');

        // Number
        const numScale = 0.85 + 0.15 * easeOutExpo(Math.min(p * 1.4, 1));
        ctx.save();
        ctx.translate(width / 2, 920);
        ctx.scale(numScale, numScale);
        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, currentCount.toLocaleString(), 0, 0, 180, 920, '900');
        ctx.restore();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        drawFittedText(ctx, 'Reels watched', width / 2, 1020, 48, 800, '800');

        // Joke Pill
        if (p > 0.35) {
          const pillAlpha = Math.min((p - 0.35) * 2, 1);
          const cardW = 860;
          const cardH = 150;
          const cardX = (width - cardW) / 2;
          const cardY = 1140;

          ctx.fillStyle = 'rgba(255, 255, 255, ' + (pillAlpha * 0.15) + ')';
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 24);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + (pillAlpha * 0.25) + ')';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, ' + (pillAlpha * 0.95) + ')';
          ctx.font = '700 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          wrapAndDrawText(ctx, '"' + reels.headlineJoke + '"', width / 2, cardY + 65, 800, 48, 2);
        }

        // Supporting Stat
        if (p > 0.5) {
          const subText = reels.peakMonth 
            ? 'Peak Reel month: ' + reels.peakMonth 
            : (reels.peakHour !== undefined 
                ? 'Peak Reel hour: ' + (reels.peakHour > 12 ? (reels.peakHour - 12) + ' PM' : (reels.peakHour === 0 ? '12 AM' : reels.peakHour + ' AM'))
                : 'Most Reel-heavy day: ' + reels.peakDayOfWeek);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
          drawFittedText(ctx, subText, width / 2, 1380, 32, 800, '600');
        }

        ctx.restore();
      }
    }] : []),
    {
      theme: '#D81B60',
      secondary: '#833AB4',
      marquee: 'YOUR ARCHETYPE',
      duration: 2.6,
      render: (ctx, p) => {
        ctx.save();
        ctx.textAlign = 'center';

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawFittedText(ctx, 'Your 2026 Archetype', width / 2, 590, 42, 800, '700');

        const titleScale = 0.85 + 0.15 * easeOutExpo(Math.min(p * 1.4, 1));
        ctx.save();
        ctx.translate(width / 2, 850);
        ctx.scale(titleScale, titleScale);
        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, stats.archetype.title, 0, 0, 95, 880, '900');
        ctx.restore();

        if (p > 0.3) {
          const descAlpha = Math.min((p - 0.3) * 2, 1);
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (descAlpha * 0.75) + ')';
          ctx.font = '500 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          wrapAndDrawText(ctx, stats.archetype.description, width / 2, 1040, 860, 58, 4);
        }
        ctx.restore();
      }
    },
    {
      theme: '#1B0C2E',
      secondary: '#301358',
      marquee: 'THAT WAS YOUR WRAPPED',
      duration: 2.5,
      render: (ctx, p) => {
        ctx.save();
        ctx.textAlign = 'center';

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        drawFittedText(ctx, 'THAT WAS YOUR', width / 2, 590, 44, 800, '800');

        ctx.fillStyle = '#ffffff';
        drawFittedText(ctx, 'INSTAWRAPPED', width / 2, 720, 110, 900, '900');

        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        drawFittedText(ctx, '2026', width / 2, 820, 64, 800, '800');

        if (p > 0.25) {
          const pillAlpha = Math.min((p - 0.25) * 2, 1);
          const cardW = 860;
          const cardH = 340;
          const cardX = (width - cardW) / 2;
          const cardY = 980;

          ctx.fillStyle = 'rgba(255, 255, 255, ' + (pillAlpha * 0.12) + ')';
          ctx.beginPath();
          ctx.roundRect(cardX, cardY, cardW, cardH, 32);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + (pillAlpha * 0.25) + ')';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          drawFittedText(ctx, stats.totalMessages.toLocaleString(), width / 2, cardY + 110, 74, 780, '900');

          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          drawFittedText(ctx, 'Messages Exchanged across ' + stats.activeDaysCount + ' Days', width / 2, cardY + 180, 36, 780, '700');

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = '800 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const finalTopName = showNames ? (top1.name || 'Nobody') : 'Hidden';
          drawTruncatedText(ctx, 'Top Connection: ' + finalTopName, width / 2, cardY + 260, 780);
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        drawFittedText(ctx, 'instawrapped-dun.vercel.app', width / 2, 1540, 32, 800, '700');

        ctx.restore();
      }
    }
  ];

  const totalDuration = slides.reduce((sum, s) => sum + s.duration, 0);
  const totalFrames = Math.floor(totalDuration * fps);

  const slideBounds: { startFrame: number; endFrame: number; slide: SlideDef }[] = [];
  let currentStart = 0;
  slides.forEach((slide) => {
    const frameCount = Math.floor(slide.duration * fps);
    slideBounds.push({
      startFrame: currentStart,
      endFrame: currentStart + frameCount,
      slide
    });
    currentStart += frameCount;
  });

  function drawBackground(
    ctx: CanvasRenderingContext2D,
    theme: string,
    secondary: string,
    marqueeText: string,
    time: number
  ) {
    const grad = ctx.createRadialGradient(width * 0.5, height * 0.35, 80, width * 0.5, height * 0.5, 1200);
    grad.addColorStop(0, secondary);
    grad.addColorStop(1, theme);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const orbX = width * 0.2 + Math.sin(time * 0.8) * 80;
    const orbY = height * 0.25 + Math.cos(time * 0.8) * 60;
    const orbGrad = ctx.createRadialGradient(orbX, orbY, 10, orbX, orbY, 450);
    orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
    orbGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = orbGrad;
    ctx.fillRect(0, 0, width, height);

    if (marqueeText) {
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 130px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textBaseline = 'middle';
      const offset = (time * 120) % 1200;
      for (let row = 0; row < 6; row++) {
        const y = 300 + row * 240;
        const dir = row % 2 === 0 ? -1 : 1;
        const x = (dir * offset) % 1200;
        ctx.fillText(marqueeText + ' • ' + marqueeText + ' • ' + marqueeText + ' • ' + marqueeText, x - 800, y);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.font = '800 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('INSTAWRAPPED 2026', width / 2, 140);
    ctx.restore();
  }

  function renderFrame(ctx: CanvasRenderingContext2D, frameIndex: number) {
    const t = frameIndex / fps;
    let bound = slideBounds.find((b) => frameIndex >= b.startFrame && frameIndex < b.endFrame);
    if (!bound) bound = slideBounds[slideBounds.length - 1];

    const currentSlide = bound.slide;
    const slideFrame = frameIndex - bound.startFrame;
    const slideDurationFrames = bound.endFrame - bound.startFrame;
    const slideProgress = Math.min(slideFrame / slideDurationFrames, 1);

    drawBackground(ctx, currentSlide.theme, currentSlide.secondary, currentSlide.marquee, t);
    currentSlide.render(ctx, slideProgress, t);

    if (slideProgress > 0.85 && bound !== slideBounds[slideBounds.length - 1]) {
      const nextBoundIdx = slideBounds.indexOf(bound) + 1;
      const nextSlide = slideBounds[nextBoundIdx].slide;
      const fadeP = (slideProgress - 0.85) / 0.15;
      ctx.save();
      ctx.globalAlpha = easeInOutQuad(fadeP) * 0.45;
      ctx.fillStyle = nextSlide.theme;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  return {
    totalFrames,
    renderFrame
  };
}