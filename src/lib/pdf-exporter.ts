import { fabric } from 'fabric';

/**
 * 將 Fabric 畫布與背景圖像直接打包，並讓使用者選擇資料夾儲存 PDF
 */
export async function exportCanvasToPdf(canvas: fabric.Canvas, fileName: string = 'edited.pdf') {
  if (!canvas) {
    alert('畫布尚未準備就緒！');
    return;
  }

  try {
    // 1. 將 Fabric 畫布轉換為高解析度 PNG
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    if (!dataUrl) {
      alert('無法取得畫布畫面！');
      return;
    }

    // 2. 動態載入 pdf-lib 並合成 PDF
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();

    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    const image = await pdfDoc.embedPng(imageBytes);
    const width = canvas.width || 800;
    const height = canvas.height || 1130;

    const page = pdfDoc.addPage([width, height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });

    const pdfBytes = await pdfDoc.save();
    const finalName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

    // 3. 嘗試使用 File System Access API（跳出選擇資料夾與檔名視窗）
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: finalName,
          types: [
            {
              description: 'PDF 文件',
              accept: { 'application/pdf': ['.pdf'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(pdfBytes);
        await writable.close();
        return; // 儲存完成
      } catch (err: any) {
        // 使用者主動取消選擇視窗
        if (err.name === 'AbortError') return;
        console.warn('FilePicker 失敗，切換為傳統下載機制', err);
      }
    }

    // 4. 備用傳統下載機制 (Fallback)
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    
    link.href = objectUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    }, 100);

  } catch (err) {
    console.error('PDF 匯出錯誤：', err);
    alert(`儲存失敗：${err instanceof Error ? err.message : String(err)}`);
  }
}