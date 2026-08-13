import { toBlob } from 'html-to-image';

/**
 * Captures a DOM element and triggers the native share sheet
 * on supported devices, specifically targeting Instagram Stories
 * or general sharing.
 */
export const shareElementAsImage = async (elementId: string): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error('Element to share not found');
      return false;
    }

    // Capture the image as a Blob
    const blob = await toBlob(element, {
      quality: 0.95,
      pixelRatio: 2, // High resolution
      backgroundColor: '#020202',
      style: {
        transform: 'none', // Reset any animations for capture
      }
    });

    if (!blob) {
      throw new Error('Failed to generate image blob');
    }

    // Prepare the file
    const file = new File([blob], 'my-instawrapped.png', { type: 'image/png' });

    // Check if the Web Share API is supported and can share files
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'My InstaWrapped 2026',
        text: 'Check out my Instagram Wrapped!',
        files: [file],
      });
      return true;
    } else {
      // Fallback for desktop or unsupported browsers: open share URL or download
      // For now, we'll download the image as a fallback
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'instawrapped.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    }
  } catch (error) {
    console.error('Error sharing image:', error);
    return false;
  }
};
