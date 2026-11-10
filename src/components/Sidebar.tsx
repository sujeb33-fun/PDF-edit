'use client';

import React from 'react';

interface SidebarProps {
  totalPages: number;
  currentPage: number;
  onSelectPage: (page: number) => void;
  pageThumbnails: string[]; // 儲存各頁面的 Base64 縮圖 DataURL
  selectedObject: any;      // Fabric.js 目前選取的物件
  onUpdateObject: (attrs: Record<string, any>) => void;
  onDeleteObject: () => void;
}

export default function Sidebar({
  totalPages,
  currentPage,
  onSelectPage,
  pageThumbnails,
  selectedObject,
  onUpdateObject,
  onDeleteObject,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-slate-800 text-slate-200 border-l border-slate-700 flex flex-col h-[calc(100vh-57px)]">
      {/* 物件屬性編輯區 */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
          ⚙️ 物件屬性
        </h3>

        {selectedObject ? (
          <div className="space-y-3 text-sm">
            {/* 如果選中的是文字 */}
            {selectedObject.type === 'i-text' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">字型大小 (px)</label>
                <input
                  type="number"
                  value={selectedObject.fontSize || 24}
                  onChange={(e) => onUpdateObject({ fontSize: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none"
                />
              </div>
            )}

            {/* 線條粗細設定 */}
            {['rect', 'circle', 'line'].includes(selectedObject.type) && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">外框線寬 (px)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={selectedObject.strokeWidth || 2}
                  onChange={(e) => onUpdateObject({ strokeWidth: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white focus:outline-none"
                />
              </div>
            )}

            {/* 刪除物件按鈕 */}
            <button
              onClick={onDeleteObject}
              className="w-full mt-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium transition"
            >
              🗑️ 刪除選取物件
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">點擊畫布上的文字或圖形進行修改</p>
        )}
      </div>

      {/* 頁面縮圖清單 */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">
          📄 頁面預覽 ({totalPages} 頁)
        </h3>

        <div className="space-y-3">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const isSelected = pageNum === currentPage;

            return (
              <div
                key={pageNum}
                onClick={() => onSelectPage(pageNum)}
                className={`cursor-pointer rounded-lg p-2 transition flex flex-col items-center border-2 ${
                  isSelected
                    ? 'border-blue-500 bg-slate-700/80 shadow-md'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                }`}
              >
                {/* 顯示縮圖或預設 Placeholder */}
                <div className="w-full h-36 bg-slate-900 rounded flex items-center justify-center overflow-hidden mb-1.5">
                  {pageThumbnails[idx] ? (
                    <img
                      src={pageThumbnails[idx]}
                      alt={`第 ${pageNum} 頁`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-slate-600 text-xs">載入中...</span>
                  )}
                </div>
                <span className={`text-xs font-medium ${isSelected ? 'text-blue-400' : 'text-slate-400'}`}>
                  第 {pageNum} 頁
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}