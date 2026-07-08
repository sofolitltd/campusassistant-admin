import * as pdfjs from 'pdfjs-dist';

// Use CDN for the worker to avoid complex bundler configuration
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface PdfMetadata {
  thumbnail: Blob;
  pageCount: number;
}

export async function generatePdfMetadata(file: File): Promise<PdfMetadata> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;

  // Render first page to canvas
  const page = await pdf.getPage(1);
  const unscaledViewport = page.getViewport({ scale: 1.0 });
  const scale = 300 / unscaledViewport.width;
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Could not create canvas context');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve({ thumbnail: blob, pageCount });
      } else {
        reject(new Error('Canvas to Blob conversion failed'));
      }
    }, 'image/webp', 0.7); // WebP format at 60% quality for extreme size reduction
  });
}
