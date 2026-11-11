import * as pdfjsLib from 'pdfjs-dist';

// 指定對應版本的 PDF Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export async function loadPdfPage(file: File, pageNum: number = 1) {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNum);

  const viewport = page.getViewport({ scale: 1.5 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  if (context) {
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
  }

  return {
    canvasDataUrl: canvas.toDataURL('image/png'),
    width: viewport.width,
    height: viewport.height,
    totalPages: pdfDoc.numPages,
  };
}