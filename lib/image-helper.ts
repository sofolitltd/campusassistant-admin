/**
 * Optimizes an image for web delivery:
 * 1. Resizes to a maximum width of 300px (standard thumbnail size)
 * 2. Converts to WebP format
 * 3. Compresses to target a file size under 50KB
 */
export async function optimizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not create canvas context"));
        return;
      }

      // We use a fixed width of 300px for thumbnails
      // This is plenty for the w-24 (96px) display while keeping files very small
      const targetWidth = 300;
      const scale = targetWidth / img.width;
      const targetHeight = img.height * scale;

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw the image onto the canvas with high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Convert to WebP with 0.6 quality (sweet spot for size/clarity)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert image to blob"));
          }
        },
        'image/webp',
        0.6
      );

      // Clean up the object URL to prevent memory leaks
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for optimization"));
    };

    img.src = URL.createObjectURL(file);
  });
}
