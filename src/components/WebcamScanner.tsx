import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserPDF417Reader } from '@zxing/browser';
import { decodeAAMVA } from '../core/decoder';
import { Camera, X, AlertTriangle, ImagePlus } from 'lucide-react';
import { useFormStore } from '../hooks/useFormStore';

interface WebcamScannerProps {
  onClose: () => void;
}

export function WebcamScanner({ onClose }: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [imageScanning, setImageScanning] = useState(false);
  const loadJson = useFormStore((state) => state.loadJson);
  const setStateVersion = useFormStore((state) => state.setStateVersion);

  const applyDecodedPayload = useCallback((text: string) => {
    const decoded = decodeAAMVA(text);
    if (decoded.ok && decoded.json) {
      const { state, version } = decoded.json;
      if (state && version) setStateVersion(state, version);
      loadJson(decoded.json);
      onClose();
      return;
    }
    setError('Detected a barcode, but it is not a valid AAMVA DL/ID format.');
  }, [loadJson, onClose, setStateVersion]);

  const handleImageSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setImageScanning(true);

    const imageReader = new BrowserPDF417Reader();
    const imageUrl = URL.createObjectURL(file);

    try {
      const result = await imageReader.decodeFromImageUrl(imageUrl);
      applyDecodedPayload(result.getText());
    } catch {
      setError('Could not find a readable PDF417 barcode in the selected image.');
    } finally {
      URL.revokeObjectURL(imageUrl);
      setImageScanning(false);
      event.target.value = '';
    }
  };

  useEffect(() => {
    let reader: BrowserPDF417Reader | null = null;
    let controls: { stop: () => void } | null = null;

    const startScanner = async () => {
      try {
        setScanning(true);
        setError(null);
        reader = new BrowserPDF417Reader();
        const videoInputDevices = await BrowserPDF417Reader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
          throw new Error('No camera found on this device.');
        }

        const deviceId = videoInputDevices[videoInputDevices.length - 1].deviceId;

        if (videoRef.current) {
          controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current, (result) => {
            if (result) {
              if (controls) controls.stop();
              applyDecodedPayload(result.getText());
            }
          });
        }
      } catch (err: any) {
        setScanning(false);
        setError(err.message || 'Failed to initialize camera.');
      }
    };

    startScanner();

    return () => {
      if (controls) controls.stop();
    };
  }, [applyDecodedPayload]);

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

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelection}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={imageScanning}
            className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ImagePlus className="h-4 w-4" />
            {imageScanning ? 'Scanning image...' : 'Use photo (iPhone-friendly)'}
          </button>
          <span className="text-xs text-slate-500">Pick from Photos or open camera directly on mobile.</span>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-4">
          Hold the PDF417 barcode steadily in front of the camera. The form will auto-fill when successfully decoded.
        </p>
      </div>
    </div>
  );
}
