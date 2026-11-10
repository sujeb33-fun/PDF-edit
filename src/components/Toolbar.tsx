'use client';

import React, { useRef } from 'react';

interface ToolbarProps {
  onOpenFile: (file: File) => void;
  onSaveFile: () => void;
  onSaveAsFile: () => void;
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
  onSaveAsFile,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
  };

  // 縮小 50% 的文字與選單行內樣式
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 700,
    color: '#94a3b8',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const btnStyle: React.CSSProperties = {
    fontSize: '10px',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
    border: 'none',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    fontWeight: 500,
    transition: 'background-color 0.15s ease',
  };

  return (
    <aside style={{
      width: '200px',
      backgroundColor: '#1e293b',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      padding: '12px',
      borderRight: '1px solid #334155',
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      zIndex: 40,
      overflowY: 'auto',
    }}>
      {/* 標題 (縮小 50%) */}
      <h1 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '16px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '4px' }}>
        📄 PDF 編輯器
      </h1>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        style={{ display: 'none' }}
      />

      {/* 1. 檔案開啟 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={sectionTitleStyle}>檔案操作</div>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{ ...btnStyle, backgroundColor: '#2563eb', color: '#ffffff' }}
        >
          📂 開啟 PDF 檔案
        </button>
      </div>

      {/* 2. 字型選擇 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={sectionTitleStyle}>字型設定</div>
        <select
          value={selectedFont}
          onChange={(e) => setSelectedFont(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            color: '#e2e8f0',
            fontSize: '10px',
            borderRadius: '4px',
            padding: '4px 6px',
            outline: 'none',
          }}
        >
          <option value="標楷體">標楷體</option>
          <option value="細明體">細明體</option>
          <option value="草書體">草書體</option>
          <option value="圓字體">圓字體</option>
        </select>
      </div>

      {/* 3. 色彩調整 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={sectionTitleStyle}>色彩調整</div>
        
        {/* 外框顏色 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', color: '#cbd5e1' }}>外框線條：</span>
          <input
            type="color"
            value={strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
        </div>

        {/* 填滿顏色 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: '#cbd5e1' }}>圖形填滿：</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setFillColor('#ffffff00')}
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: fillColor === '#ffffff00' ? '#dc2626' : '#334155',
                color: fillColor === '#ffffff00' ? '#ffffff' : '#cbd5e1',
              }}
            >
              無填滿
            </button>
            <input
              type="color"
              value={fillColor === '#ffffff00' ? '#ffffff' : fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              style={{ width: '22px', height: '22px', borderRadius: '4px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}