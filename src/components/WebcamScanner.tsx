import React, { useEffect, useRef, useState } from 'react';
import { BrowserPDF417Reader } from '@zxing/browser';
import { decodeAAMVA } from '../core/decoder';
import { Camera, X, AlertTriangle } from 'lucide-react';
import { useFormStore } from '../hooks/useFormStore';

interface WebcamScannerProps {
  onClose: () => void;
}

export function WebcamScanner({ onClose }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const loadJson = useFormStore((state) => state.loadJson);
  const setStateVersion = useFormStore((state) => state.setStateVersion);

  useEffect(() => {
    let reader: BrowserPDF417Reader | null = null;
    let controls: any = null;

    const startScanner = async () => {
      try {
        setScanning(true);
        setError(null);
        reader = new BrowserPDF417Reader();
        const videoInputDevices = await BrowserPDF417Reader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          throw new Error("No camera found on this device.");
        }

        // Prefer back camera if available
        const deviceId = videoInputDevices[videoInputDevices.length - 1].deviceId;

        if (videoRef.current) {
          controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result, err) => {
            if (result) {
              const text = result.getText();
              const decoded = decodeAAMVA(text);
              if (decoded.ok && decoded.json) {
                const { state, version, ...rest } = decoded.json;
                if (state && version) setStateVersion(state, version);
                loadJson(decoded.json);
                if (controls) controls.stop();
                onClose();
              } else {
                setError("Detected a barcode, but it is not a valid AAMVA DL/ID format.");
              }
            }
            // Ignore stream errors (like checksum failures while moving camera)
          });
        }
      } catch (err: any) {
        setScanning(false);
        setError(err.message || "Failed to initialize camera.");
      }
    };

    startScanner();

    return () => {
      if (controls) controls.stop();
    };
  }, [loadJson, onClose, setStateVersion]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-4">
          <Camera className="w-6 h-6 text-blue-500" />
          Scan DL/ID Barcode
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
          />
          {scanning && !error && (
            <div className="absolute inset-0 border-2 border-blue-500/50 flex items-center justify-center pointer-events-none">
              <div className="w-3/4 h-1/3 border border-red-500/80 rounded relative">
                <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Hold the PDF417 barcode steadily in front of the camera. The form will auto-fill when successfully decoded.
        </p>
      </div>
    </div>
  );
}
