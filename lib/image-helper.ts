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

function loadImageEl(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image for optimization"));
    };
    img.src = URL.createObjectURL(file);
  });
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to convert image to blob"))),
      'image/webp',
      quality
    );
  });
}

/**
 * Compresses an image for a push-notification hero image (FCM's big-picture
 * display, shown much larger than the 300px thumbnails optimizeImage() is
 * for): resizes to maxWidth, converts to WebP, and iteratively lowers
 * quality — then, if still over budget, shrinks the width and retries — until
 * the result is under maxSizeKB.
 */
export async function compressForNotification(
  file: File,
  maxSizeKB = 100,
  initialMaxWidth = 1024
): Promise<Blob> {
  const img = await loadImageEl(file);
  let maxWidth = initialMaxWidth;
  let blob: Blob;

  for (;;) {
    const scale = Math.min(1, maxWidth / img.width);
    const targetWidth = Math.round(img.width * scale);
    const targetHeight = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not create canvas context");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    let quality = 0.8;
    blob = await canvasToWebp(canvas, quality);
    while (blob.size > maxSizeKB * 1024 && quality > 0.3) {
      quality -= 0.15;
      blob = await canvasToWebp(canvas, quality);
    }

    if (blob.size <= maxSizeKB * 1024 || maxWidth <= 320) break;
    maxWidth = Math.round(maxWidth * 0.7);
  }

  URL.revokeObjectURL(img.src);
  return blob;
}

/**
 * Compresses a batch cover photo: center-crops to 16:9, scales down (never
 * up) to at most 1280x720, and encodes WebP, lowering quality and then size
 * until it is under maxSizeKB. The API's "batches" folder rejects anything
 * over 300KB, so the 150KB default leaves headroom.
 *
 * The object URL and the canvas backing store are released even when
 * encoding fails — a large phone photo decodes to ~50MB of pixels.
 */
export async function compressBatchCover(file: File, maxSizeKB = 150): Promise<Blob> {
  const img = await loadImageEl(file);
  const canvas = document.createElement('canvas');
  try {
    // Largest 16:9 window that fits the source, centred.
    const cropW = Math.min(img.width, Math.round((img.height * 16) / 9));
    const cropH = Math.round((cropW * 9) / 16);
    const sx = Math.round((img.width - cropW) / 2);
    const sy = Math.round((img.height - cropH) / 2);

    let width = Math.min(1280, cropW);
    for (;;) {
      canvas.width = width;
      canvas.height = Math.round((width * 9) / 16);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not create canvas context");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, canvas.width, canvas.height);

      let quality = 0.8;
      let blob = await canvasToWebp(canvas, quality);
      while (blob.size > maxSizeKB * 1024 && quality > 0.5) {
        quality -= 0.1;
        blob = await canvasToWebp(canvas, quality);
      }
      if (blob.size <= maxSizeKB * 1024 || width <= 640) return blob;
      width = Math.round(width * 0.8);
    }
  } finally {
    URL.revokeObjectURL(img.src);
    canvas.width = 0;
    canvas.height = 0;
  }
}
