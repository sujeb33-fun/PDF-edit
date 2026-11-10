'use client';

import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { fabric } from 'fabric';
import { loadPdfPage } from '@/lib/pdf-loader';
import { exportCanvasToPdf } from '@/lib/pdf-exporter';

export interface CanvasAreaRef {
  handleSave: () => void;
  handleSaveAs: () => void;
}

interface CanvasAreaProps {
  file: File | null;
  activeTool: string;
  fontFamily: string;
  strokeColor: string;
  fillColor: string;
}

const CanvasArea = forwardRef<CanvasAreaRef, CanvasAreaProps>(({
  file,
  activeTool,
  fontFamily,
  strokeColor,
  fillColor,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const clipboardRef = useRef<fabric.Object | null>(null);

  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isUndoRedoingRef = useRef<boolean>(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const baseWidthRef = useRef<number>(800);
  const baseHeightRef = useRef<number>(1130);

  const triggerSave = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const name = file ? file.name : '編輯後的PDF文件.pdf';
    exportCanvasToPdf(fabricCanvasRef.current, name);
  }, [file]);

  const triggerSaveAs = useCallback(() => {
    if (!fabricCanvasRef.current) return;
    const defaultName = file ? `新檔案_${file.name}` : '另存新檔.pdf';
    const userFileName = prompt('請輸入另存檔名：', defaultName);
    if (userFileName) {
      exportCanvasToPdf(fabricCanvasRef.current, userFileName);
    }
  }, [file]);

  useImperativeHandle(ref, () => ({
    handleSave: triggerSave,
    handleSaveAs: triggerSaveAs,
  }));

  const updateUndoRedoStatus = useCallback(() => {
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  }, []);

  const saveState = useCallback(() => {
    if (isUndoRedoingRef.current || !fabricCanvasRef.current) return;
    const canvas = fabricCanvasRef.current;
    const json = JSON.stringify(canvas.toJSON());
    const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    newHistory.push(json);
    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
    updateUndoRedoStatus();
  }, [updateUndoRedoStatus]);

  // 1. 初始化畫布
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 1130,
      backgroundColor: '#ffffff',
    });
    fabricCanvasRef.current = canvas;

    const initialJson = JSON.stringify(canvas.toJSON());
    historyRef.current = [initialJson];
    historyIndexRef.current = 0;
    updateUndoRedoStatus();

    const handleSaveState = () => saveState();
    canvas.on('object:added', handleSaveState);
    canvas.on('object:modified', handleSaveState);
    canvas.on('object:removed', handleSaveState);

    return () => {
      canvas.off('object:added', handleSaveState);
      canvas.off('object:modified', handleSaveState);
      canvas.off('object:removed', handleSaveState);
      canvas.dispose();
    };
  }, [saveState, updateUndoRedoStatus]);

  // 2. 載入 PDF
  useEffect(() => {
    if (!file || !fabricCanvasRef.current) return;

    const renderPdf = async () => {
      try {
        const { canvasDataUrl, width, height } = await loadPdfPage(file, 1);
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        baseWidthRef.current = width;
        baseHeightRef.current = height;
        setZoomLevel(1);

        canvas.setDimensions({ width, height });

        fabric.Image.fromURL(canvasDataUrl, (img) => {
          canvas.setBackgroundImage(
            img,
            () => {
              canvas.renderAll();
              const currentJson = JSON.stringify(canvas.toJSON());
              historyRef.current = [currentJson];
              historyIndexRef.current = 0;
              updateUndoRedoStatus();
            },
            { scaleX: 1, scaleY: 1 }
          );
        });
      } catch (err) {
        console.error('PDF 解析失敗：', err);
        alert('解析 PDF 失敗。');
      }
    };

    renderPdf();
  }, [file, updateUndoRedoStatus]);

  // 縮放控制
  const applyZoom = useCallback((newZoom: number) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const clampedZoom = Math.min(Math.max(newZoom, 0.5), 2.5);
    setZoomLevel(clampedZoom);

    canvas.setDimensions({
      width: baseWidthRef.current * clampedZoom,
      height: baseHeightRef.current * clampedZoom,
    });
    canvas.setZoom(clampedZoom);
    canvas.requestRenderAll();
  }, []);

  const handleZoomIn = () => applyZoom(zoomLevel + 0.15);
  const handleZoomOut = () => applyZoom(zoomLevel - 0.15);
  const handleZoomReset = () => applyZoom(1);

  // 同步屬性（字型與色彩）
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const activeObj = canvas.getActiveObject();
    if (activeObj) {
      if (activeObj.type === 'i-text' || activeObj.type === 'text') {
        if (fontFamily)(activeObj as any).get('fontFamily');
        if (strokeColor && strokeColor !== '#000000') activeObj.set('fill', strokeColor);
      } else {
        if (fillColor) activeObj.set('fill', fillColor);
        if (strokeColor) activeObj.set('stroke', strokeColor);
      }
      canvas.requestRenderAll();
    }
  }, [fillColor, strokeColor, fontFamily]);

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndexRef.current <= 0 || !fabricCanvasRef.current) return;
    isUndoRedoingRef.current = true;
    historyIndexRef.current -= 1;
    const targetState = historyRef.current[historyIndexRef.current];
    fabricCanvasRef.current.loadFromJSON(targetState, () => {
      fabricCanvasRef.current?.renderAll();
      isUndoRedoingRef.current = false;
      updateUndoRedoStatus();
    });
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || !fabricCanvasRef.current) return;
    isUndoRedoingRef.current = true;
    historyIndexRef.current += 1;
    const targetState = historyRef.current[historyIndexRef.current];
    fabricCanvasRef.current.loadFromJSON(targetState, () => {
      fabricCanvasRef.current?.renderAll();
      isUndoRedoingRef.current = false;
      updateUndoRedoStatus();
    });
  };

  // 剪下 / 複製 / 貼上
  const handleCut = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    activeObject.clone((cloned: fabric.Object) => {
      clipboardRef.current = cloned;
      canvas.remove(activeObject);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    });
  };

  const handleCopy = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    activeObject.clone((cloned: fabric.Object) => {
      clipboardRef.current = cloned;
    });
  };

  const handlePaste = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !clipboardRef.current) return;

    clipboardRef.current.clone((clonedObj: fabric.Object) => {
      canvas.discardActiveObject();
      clonedObj.set({
        left: (clonedObj.left || 0) + 15,
        top: (clonedObj.top || 0) + 15,
        evented: true,
      });

      if (clonedObj.type === 'activeSelection') {
        clonedObj.canvas = canvas;
        (clonedObj as fabric.ActiveSelection).forEachObject((obj) => {
          canvas.add(obj);
        });
        clonedObj.setCoords();
      } else {
        canvas.add(clonedObj);
      }

      if (clipboardRef.current?.top !== undefined) clipboardRef.current.top += 15;
      if (clipboardRef.current?.left !== undefined) clipboardRef.current.left += 15;

      canvas.setActiveObject(clonedObj);
      canvas.requestRenderAll();
    });
  };

  // 修正文字輸入邏輯
  const addText = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // 確保文字顏色為深色，防止設為白底/透明看不見
    const textColor = strokeColor && strokeColor !== '#ffffff' ? strokeColor : '#000000';

    const text = new fabric.IText('點擊輸入文字', {
      left: 150,
      top: 150,
      fontFamily: fontFamily || '標楷體',
      fontSize: 22,
      fill: textColor,
      editable: true,
    });

    canvas.add(text);
    canvas.setActiveObject(text);

    // 強制進入文字編輯打字狀態
    setTimeout(() => {
      text.enterEditing();
      text.selectAll();
      canvas.requestRenderAll();
    }, 50);
  };

  const addRect = () => {
    if (!fabricCanvasRef.current) return;
    const actualFill = fillColor && fillColor !== '#ffffff00' ? fillColor : 'rgba(255, 255, 0, 0.4)';
    const actualStroke = strokeColor || '#ff0000';
    const rect = new fabric.Rect({
      left: 200,
      top: 200,
      width: 150,
      height: 100,
      fill: actualFill,
      stroke: actualStroke,
      strokeWidth: 2,
    });
    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
  };

  const addCircle = () => {
    if (!fabricCanvasRef.current) return;
    const actualFill = fillColor && fillColor !== '#ffffff00' ? fillColor : 'rgba(255, 255, 0, 0.4)';
    const actualStroke = strokeColor || '#ff0000';
    const circle = new fabric.Circle({
      left: 250,
      top: 250,
      radius: 60,
      fill: actualFill,
      stroke: actualStroke,
      strokeWidth: 2,
    });
    fabricCanvasRef.current.add(circle);
    fabricCanvasRef.current.setActiveObject(circle);
  };

  const btnBaseStyle: React.CSSProperties = {
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '9999px',
    cursor: 'pointer',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    fontWeight: 600,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* 固定懸浮頂部選單 */}
      <div style={{
        position: 'fixed',
        top: '12px',
        left: 'calc(50% + 100px)',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        padding: '5px 14px',
        borderRadius: '9999px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        color: '#ffffff',
        whiteSpace: 'nowrap',
      }}>
        <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #334155', paddingRight: '6px' }}>
          <button onClick={triggerSave} style={{ ...btnBaseStyle, backgroundColor: '#059669', color: '#ffffff' }}>💾 儲存</button>
          <button onClick={triggerSaveAs} style={{ ...btnBaseStyle, backgroundColor: '#2563eb', color: '#ffffff' }}>📋 另存</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', borderRight: '1px solid #334155', paddingRight: '6px' }}>
          <button onClick={handleZoomOut} style={{ ...btnBaseStyle, backgroundColor: '#334155', color: '#ffffff' }}>🔍 -</button>
          <button onClick={handleZoomReset} style={{ ...btnBaseStyle, backgroundColor: '#334155', color: '#93c5fd' }}>
            {Math.round(zoomLevel * 100)}%
          </button>
          <button onClick={handleZoomIn} style={{ ...btnBaseStyle, backgroundColor: '#334155', color: '#ffffff' }}>🔍 +</button>
        </div>

        <div style={{ display: 'flex', gap: '2px', borderRight: '1px solid #334155', paddingRight: '6px' }}>
          <button onClick={handleUndo} disabled={!canUndo} style={{ ...btnBaseStyle, backgroundColor: canUndo ? '#334155' : 'transparent', color: canUndo ? '#ffffff' : '#64748b' }}>↩️ 後退</button>
          <button onClick={handleRedo} disabled={!canRedo} style={{ ...btnBaseStyle, backgroundColor: canRedo ? '#334155' : 'transparent', color: canRedo ? '#ffffff' : '#64748b' }}>↪️ 前進</button>
        </div>

        <div style={{ display: 'flex', gap: '2px', borderRight: '1px solid #334155', paddingRight: '6px' }}>
          <button onClick={handleCut} style={{ ...btnBaseStyle, backgroundColor: '#334155', color: '#ffffff' }}>✂️ 剪下</button>
          <button onClick={handleCopy} style={{ ...btnBaseStyle, backgroundColor: '#334155', color: '#ffffff' }}>📋 複製</button>
          <button onClick={handlePaste} style={{ ...btnBaseStyle, backgroundColor: '#334155', color: '#ffffff' }}>📥 貼上</button>
        </div>

        <div style={{ display: 'flex', gap: '2px' }}>
          <button onClick={addText} style={{ ...btnBaseStyle, backgroundColor: '#334155', color: '#ffffff' }}>➕ 文字</button>
          <button onClick={addRect} style={{ ...btnBaseStyle, backgroundColor: '#334155', color: '#ffffff' }}>🟩 方形</button>
          <button onClick={addCircle} style={{ ...btnBaseStyle, backgroundColor: '#334155', color: '#ffffff' }}>⚪ 圓形</button>
        </div>
      </div>

      {/* PDF 畫布容器 */}
      <div style={{ marginTop: '50px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
});

CanvasArea.displayName = 'CanvasArea';
export default CanvasArea;