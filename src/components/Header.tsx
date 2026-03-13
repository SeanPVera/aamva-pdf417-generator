import React, { useState } from 'react';
import { Settings, FileJson, AlertTriangle, ShieldCheck, Download, Upload, Trash2, Camera } from 'lucide-react';
import { useFormStore } from '../hooks/useFormStore';

interface HeaderProps {
  onStartScan: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onStartScan }) => {
  const { clearFields, fields, state, version } = useFormStore();

  const handleExportJson = () => {
    const data = { state, version, ...fields };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aamva_${state}_${version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all PII from memory?")) {
      clearFields();
      localStorage.removeItem('aamva_form_data');
    }
  };

  return (
    <header className="bg-blue-700 text-white shadow-md z-10 sticky top-0 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <ShieldCheck className="h-6 w-6" />
        <h1 className="text-xl font-bold tracking-wide">AAMVA PDF417 Generator</h1>
        <span className="bg-blue-800 text-xs py-1 px-2 rounded-full border border-blue-600">Professional Grade</span>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onStartScan}
          className="flex items-center space-x-1 hover:bg-blue-600 px-3 py-1.5 rounded transition text-sm"
          title="Scan Barcode from Webcam"
        >
          <Camera size={16} />
          <span>Scan ID</span>
        </button>

        <button
          onClick={handleExportJson}
          className="flex items-center space-x-1 hover:bg-blue-600 px-3 py-1.5 rounded transition text-sm"
          title="Export JSON Profile"
        >
          <Download size={16} />
          <span>Export JSON</span>
        </button>

        <button
          onClick={handleClearData}
          className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition text-sm"
          title="Securely Clear Memory"
        >
          <Trash2 size={16} />
          <span>Clear PII</span>
        </button>
      </div>
    </header>
  );
};