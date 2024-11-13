import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCcw, Printer, AlertCircle } from 'lucide-react';
import { applyTransformation } from '../lib/transformations';
import { printImage } from '../lib/printService';
import { useSettings } from '../contexts/SettingsContext';
import CameraSelect from './CameraSelect';
import type { PrintStatus } from '../types';

interface CameraDevice {
  deviceId: string;
  label: string;
}

export const PhotoBooth: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraInitialized, setIsCameraInitialized] = useState(false);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [printStatus, setPrintStatus] = useState<PrintStatus>({
    isPrinting: false,
    error: null,
    lastPrintTime: null
  });
  const { settings } = useSettings();

  const getCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${devices.indexOf(device) + 1}`
        }));
      
      setCameras(videoDevices);
      
      // Select the first camera if none is selected
      if (videoDevices.length > 0 && !selectedCamera) {
        setSelectedCamera(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  }, [selectedCamera]);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }

      // Stop any existing stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width: { ideal: 1080, min: 720 },
          height: { ideal: 1920, min: 1280 },
          facingMode: 'user',
          aspectRatio: { ideal: 9/16 } // Portrait mode aspect ratio
        },
        audio: false
      }).catch(async () => {
        // Fallback to basic video constraints
        return navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: selectedCamera ? { exact: selectedCamera } : undefined
          },
          audio: false
        });
      });

      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      videoRef.current.srcObject = stream;
      
      await new Promise((resolve, reject) => {
        if (!videoRef.current) return reject('Video element not found');
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(resolve)
            .catch(reject);
        };
        
        videoRef.current.onerror = () => {
          reject('Failed to load video stream');
        };
      });

      setIsCameraInitialized(true);
      setCameraError(null);

      // Update camera list and labels after getting permission
      await getCameras();
    } catch (err) {
      console.error('Camera initialization error:', err);
      setCameraError(
        err instanceof Error 
          ? err.message 
          : 'Failed to initialize camera. Please ensure camera permissions are granted.'
      );
      setIsCameraInitialized(false);
    }
  }, [selectedCamera, getCameras]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraInitialized(false);
  }, []);

  const handlePrint = async () => {
    if (!capturedImage || printStatus.isPrinting) return;

    setPrintStatus(prev => ({ ...prev, isPrinting: true, error: null }));
    try {
      await printImage(capturedImage, {
        printSize: settings.printSize,
        printDPI: settings.printDPI,
        autoprint: settings.autoprint
      });
      setPrintStatus(prev => ({
        ...prev,
        isPrinting: false,
        lastPrintTime: new Date()
      }));
    } catch (error) {
      setPrintStatus(prev => ({
        ...prev,
        isPrinting: false,
        error: {
          code: 'PRINTER_ERROR',
          message: 'Failed to print image',
          details: {
            technical: error instanceof Error ? error.message : 'Unknown error',
            userAction: 'Please try printing again'
          }
        }
      }));
    }
  };

  const transformAndPrint = useCallback(async (imageData: ImageData) => {
    setIsTransforming(true);
    try {
      const transformedImageData = await applyTransformation(
        imageData,
        settings.transformationType
      );

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');
      
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      ctx.putImageData(transformedImageData, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImage(dataUrl);

      if (settings.autoprint) {
        await printImage(dataUrl, {
          printSize: settings.printSize,
          printDPI: settings.printDPI,
          autoprint: settings.autoprint
        });
      }
    } catch (err) {
      console.error('Transformation error:', err);
    } finally {
      setIsTransforming(false);
    }
  }, [settings]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraInitialized) return;

    setIsCapturing(true);
    let count = 3;
    setCountdown(count);

    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(countdownInterval);
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        void transformAndPrint(imageData);
        setIsCapturing(false);
        stopCamera();
      }
    }, 1000);
  }, [transformAndPrint, stopCamera, isCameraInitialized]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setPrintStatus({
      isPrinting: false,
      error: null,
      lastPrintTime: null
    });
    void startCamera();
  }, [startCamera]);

  // Handle camera changes
  useEffect(() => {
    if (selectedCamera && !capturedImage) {
      void startCamera();
    }
  }, [selectedCamera, startCamera, capturedImage]);

  // Initial setup
  useEffect(() => {
    void getCameras();
    return () => {
      stopCamera();
    };
  }, [getCameras, stopCamera]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] bg-canvas p-4">
      <div className="relative w-full max-w-[calc(9/16*70vh)] aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-lg">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white p-8">
            <AlertCircle className="w-16 h-16 text-accent-red mb-4" />
            <h3 className="text-xl font-bold mb-2">Camera Error</h3>
            <p className="text-center text-gray-300 mb-4">{cameraError}</p>
            <button
              onClick={() => void startCamera()}
              className="px-6 py-2 bg-accent-teal text-white rounded-full hover:bg-accent-teal/90 transition-colors shadow-button-3d"
            >
              Retry Camera Access
            </button>
          </div>
        ) : !capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isCapturing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <span className="text-6xl text-white font-bold">{countdown}</span>
              </div>
            )}
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {!capturedImage && cameras.length > 1 && (
        <div className="mt-4">
          <CameraSelect
            cameras={cameras}
            selectedCamera={selectedCamera}
            onSelect={setSelectedCamera}
            onRefresh={getCameras}
          />
        </div>
      )}

      <div className="mt-6 flex gap-4">
        {!capturedImage ? (
          <button
            onClick={captureImage}
            disabled={isCapturing || !!cameraError || !isCameraInitialized}
            className="px-6 py-3 bg-primary text-black rounded-full font-semibold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-button-3d"
          >
            <Camera className="w-5 h-5" />
            {isCapturing ? 'Capturing...' : 'Take Photo'}
          </button>
        ) : (
          <div className="flex gap-4">
            <button
              onClick={handleRetake}
              className="px-6 py-3 bg-accent-red text-white rounded-full font-semibold flex items-center gap-2 hover:bg-accent-red/90 transition-colors shadow-button-3d"
            >
              <RefreshCcw className="w-5 h-5" />
              Retake
            </button>
            <button
              onClick={handlePrint}
              disabled={printStatus.isPrinting}
              className="px-6 py-3 bg-accent-teal text-white rounded-full font-semibold flex items-center gap-2 hover:bg-accent-teal/90 transition-colors disabled:opacity-50 shadow-button-3d"
            >
              <Printer className="w-5 h-5" />
              {printStatus.isPrinting ? 'Printing...' : 'Print'}
            </button>
          </div>
        )}
      </div>

      {isTransforming && (
        <div className="mt-4 text-lg font-semibold text-accent-teal">
          Applying artistic transformation...
        </div>
      )}

      {printStatus.error && (
        <div className="mt-4 text-accent-red">
          {printStatus.error.message}
        </div>
      )}
    </div>
  );
};