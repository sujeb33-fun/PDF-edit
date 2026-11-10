'use client';

import React, { useRef } from 'react';

interface ToolbarProps {
  onOpenFile: (file: File) => void;
  onSaveFile: () => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  selectedFont: string;
  setSelectedFont: (font: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  strokeColor: string;
  setStrokeColor: (color: string) => void;
}

export default function Toolbar({
  onOpenFile,
  onSaveFile,
  activeTool,
  setActiveTool,
  selectedFont,
  setSelectedFont,
  fillColor,
  setFillColor,
  strokeColor,
  setStrokeColor,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 觸發隱藏的 File Input 點擊事件
  const handleOpenFileClick = () => {
    fileInputRef.current?.click();
  };

  // 處理檔案選擇
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onOpenFile(file);
    } else if (file) {
      alert('請選擇有效的 PDF 檔案！');
    }
  };

  return (
    <div className="w-full bg-slate-800 text-white p-3 flex flex-wrap items-center gap-4 shadow-md sticky top-0 z-50">
      {/* 隱藏的檔案上傳輸入框 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      {/* 檔案操作區 */}
      <div className="flex items-center gap-2 border-r border-slate-600 pr-4">
        <button
          onClick={handleOpenFileClick}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-sm font-medium rounded transition"
        >
          📂 開啟檔案
        </button>
        <button
          onClick={onSaveFile}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-sm font-medium rounded transition"
        >
          💾 另存新檔
        </button>
      </div>

      {/* 繪圖與編輯工具選擇 */}
      <div className="flex items-center gap-1 border-r border-slate-600 pr-4">
        <button
          onClick={() => setActiveTool('select')}
          className={`px-3 py-1.5 text-sm rounded ${
            activeTool === 'select' ? 'bg-slate-600 font-bold' : 'hover:bg-slate-700'
          }`}
        >
          🖐️ 選擇
        </button>
        <button
          onClick={() => setActiveTool('text')}
          className={`px-3 py-1.5 text-sm rounded ${
            activeTool === 'text' ? 'bg-slate-600 font-bold' : 'hover:bg-slate-700'
          }`}
        >
          ✍️ 文字
        </button>
        <button
          onClick={() => setActiveTool('rect')}
          className={`px-3 py-1.5 text-sm rounded ${
            activeTool === 'rect' ? 'bg-slate-600 font-bold' : 'hover:bg-slate-700'
          }`}
        >
          🟩 方形
        </button>
        <button
          onClick={() => setActiveTool('circle')}
          className={`px-3 py-1.5 text-sm rounded ${
            activeTool === 'circle' ? 'bg-slate-600 font-bold' : 'hover:bg-slate-700'
          }`}
        >
          ⚪ 圓形
        </button>
        <button
          onClick={() => setActiveTool('line')}
          className={`px-3 py-1.5 text-sm rounded ${
            activeTool === 'line' ? 'bg-slate-600 font-bold' : 'hover:bg-slate-700'
          }`}
        >
          📏 線條
        </button>
      </div>

      {/* 字型選單設定 */}
      <div className="flex items-center gap-2 border-r border-slate-600 pr-4">
        <label className="text-sm font-medium text-slate-300">字型：</label>
        <select
          value={selectedFont}
          onChange={(e) => setSelectedFont(e.target.value)}
          className="bg-slate-700 text-white text-sm rounded px-2 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
        >
          <option value="Kaiti">標楷體</option>
          <option value="MingLiU">細明體</option>
          <option value="Cursive">草書體</option>
          <option value="Rounded">圓字體</option>
        </select>
      </div>

      {/* 顏色設定區 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-300">線條：</label>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-slate-300">填滿：</label>
          <input
            type="color"
            value={fillColor}
            onChange={(e) => setFillColor(e.target.value)}
            className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
          />
        </div>
      </div>
    </div>
  );
}