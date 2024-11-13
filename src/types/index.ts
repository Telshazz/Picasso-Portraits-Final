// Transformation Types
export type TransformationType = 'pencil' | 'watercolor' | 'oilpainting';

// Print Settings
export type PrintSize = '6x9' | '8x10';

export interface PrintSettings {
  printSize: PrintSize;
  printDPI: number;
  autoprint: boolean;
}

// Camera States
export interface CameraState {
  isCapturing: boolean;
  countdown: number;
  isCameraReady: boolean;  // Indicates if the camera is initialized and ready
  error: string | null;
}

// Transformation States
export interface TransformationState {
  isProcessing: boolean;
  error: string | null;
  transformedImageUrl: string | null;  // Base64 or blob URL of the transformed image
}

// Settings Interface
export interface Settings {
  transformationType: TransformationType;
  printSize: PrintSize;
  printDPI: number;
  autoprint: boolean;
  previewEnabled: boolean;  // Controls whether to show image preview before printing
}

// Error Types
export type PhotoBoothError = {
  code: 'CAMERA_ERROR' | 'TRANSFORM_ERROR' | 'CANVAS_ERROR' | 'PRINTER_ERROR';
  message: string;
  details?: {
    technical?: string;     // Technical details for debugging
    userAction?: string;    // Suggested user action to resolve the error
  };
};

// Print Status
export interface PrintStatus {
  isPrinting: boolean;
  error: PhotoBoothError | null;
  lastPrintTime: Date | null;
}