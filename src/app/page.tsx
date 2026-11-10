'use client';

import React, { useState, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import CanvasArea, { CanvasAreaRef } from '@/components/CanvasArea';

export default function Home() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [activeTool, setActiveTool] = useState<string>('select');
  const [selectedFont, setSelectedFont] = useState<string>('標楷體');
  const [fillColor, setFillColor] = useState<string>('#ffffff00');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');

  const canvasRef = useRef<CanvasAreaRef>(null);

  const handleOpenFile = (file: File) => {
    setCurrentFile(file);
  };

  const handleSaveFile = () => {
    canvasRef.current?.handleSave();
  };

  const handleSaveAsFile = () => {
    canvasRef.current?.handleSaveAs();
  };

  return (
    <main className="min-h-screen bg-slate-900 flex">
      <Toolbar
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onSaveAsFile={handleSaveAsFile}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        selectedFont={selectedFont}
        setSelectedFont={setSelectedFont}
        fillColor={fillColor}
        setFillColor={setFillColor}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
      />

      <div className="flex-1 pl-52 flex justify-center items-start p-6 min-h-screen bg-slate-950 overflow-auto">
        <CanvasArea
          ref={canvasRef}
          file={currentFile}
          activeTool={activeTool}
          fontFamily={selectedFont}
          strokeColor={strokeColor}
          fillColor={fillColor}
        />
      </div>
    </main>
  );
}