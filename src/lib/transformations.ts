import type { TransformationType } from '../types';

export async function applyTransformation(
  imageData: ImageData,
  type: TransformationType
): Promise<ImageData> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Failed to get canvas context');

  canvas.width = imageData.width;
  canvas.height = imageData.height;
  ctx.putImageData(imageData, 0, 0);

  // Initial grayscale conversion
  const imageDataGray = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageDataGray.data;
  const output = new ImageData(canvas.width, canvas.height);
  const outputData = output.data;

  // Parameters adjusted for lighter output
  const params = {
    brightnessFactor: 1.4,       // Higher brightness
    contrastFactor: 1.2,        // Moderate contrast
    edgeStrength: 0.8,          // Reduced edge strength for softer lines
    edgeThreshold: 12,          // Moderate threshold for edges
    shadowGray: 180,            // Much lighter shadow tone (70% white)
    midGray: 220,               // Lighter mid-tone (86% white)
    highlightThreshold: 230,    // Lower threshold for pure whites
    backgroundThreshold: 130,   // Lower threshold for more aggressive background removal
    edgeRadius: 3,             // Moderate radius for edge detection
    backgroundEdgeThreshold: 0.08, // Moderate threshold for background edge detection
    noiseThreshold: 10,        // Standard noise reduction
    expandBackground: 2,       // Moderate background expansion
    minConnectedPixels: 100    // Minimum size of connected region to keep
  };

  // First pass: Calculate edges and basic tonal values
  const edges = new Float32Array(canvas.width * canvas.height);
  const tones = new Float32Array(canvas.width * canvas.height);
  const isBackground = new Uint8Array(canvas.width * canvas.height);
  const connectedRegions = new Int32Array(canvas.width * canvas.height);
  let nextRegionId = 1;

  // Initial background detection
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      const brightness = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);
      tones[y * canvas.width + x] = brightness;
      
      // Mark likely background pixels
      if (brightness > params.backgroundThreshold) {
        isBackground[y * canvas.width + x] = 1;
      }
    }
  }

  // Connected component analysis for background regions
  function floodFill(x: number, y: number, regionId: number): number {
    let size = 0;
    const stack: [number, number][] = [[x, y]];
    
    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const idx = cy * canvas.width + cx;
      
      if (cx < 0 || cx >= canvas.width || cy < 0 || cy >= canvas.height ||
          !isBackground[idx] || connectedRegions[idx] !== 0) {
        continue;
      }
      
      connectedRegions[idx] = regionId;
      size++;
      
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    
    return size;
  }

  // Find connected background regions
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = y * canvas.width + x;
      if (isBackground[idx] && connectedRegions[idx] === 0) {
        const size = floodFill(x, y, nextRegionId);
        if (size < params.minConnectedPixels) {
          // Remove small isolated background regions
          for (let i = 0; i < connectedRegions.length; i++) {
            if (connectedRegions[i] === nextRegionId) {
              isBackground[i] = 0;
              connectedRegions[i] = 0;
            }
          }
        }
        nextRegionId++;
      }
    }
  }

  // Edge detection with noise reduction
  for (let y = params.edgeRadius; y < canvas.height - params.edgeRadius; y++) {
    for (let x = params.edgeRadius; x < canvas.width - params.edgeRadius; x++) {
      let maxGradient = 0;
      let gradientCount = 0;
      
      for (let dy = -params.edgeRadius; dy <= params.edgeRadius; dy++) {
        for (let dx = -params.edgeRadius; dx <= params.edgeRadius; dx++) {
          const gradient = Math.abs(tones[y * canvas.width + x] - 
            tones[(y + dy) * canvas.width + (x + dx)]);
            
          if (gradient > params.noiseThreshold) {
            maxGradient = Math.max(maxGradient, gradient);
            gradientCount++;
          }
        }
      }
      
      edges[y * canvas.width + x] = gradientCount > 2 ? 
        Math.min(1, maxGradient / params.edgeThreshold) * params.edgeStrength : 0;
    }
  }

  // Expand background regions
  const expandedBackground = new Uint8Array(isBackground);
  for (let i = 0; i < params.expandBackground; i++) {
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        if (isBackground[y * canvas.width + x]) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (edges[ny * canvas.width + nx] < params.backgroundEdgeThreshold) {
                expandedBackground[ny * canvas.width + nx] = 1;
              }
            }
          }
        }
      }
    }
  }

  // Final pass: Apply artistic effect with white background
  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % canvas.width;
    const y = Math.floor((i / 4) / canvas.width);
    const idx = y * canvas.width + x;

    // Get base tone with enhanced contrast
    let tone = tones[idx];
    tone = ((tone - 128) * params.contrastFactor + 128) * params.brightnessFactor;
    
    let value;

    // Background is always white
    if (expandedBackground[idx] || 
        (tone > params.backgroundThreshold && edges[idx] < params.backgroundEdgeThreshold)) {
      value = 255; // Pure white
    } else {
      const edgeValue = edges[idx];
      
      if (edgeValue > 0.2) {
        // Strong edges - make them gray instead of black
        value = Math.max(params.shadowGray, 255 - edgeValue * 180);
      } else if (tone > params.highlightThreshold) {
        // Pure highlights
        value = 255;
      } else if (tone > 180) {
        // Mid-tones to highlights
        const t = (tone - 180) / (params.highlightThreshold - 180);
        value = params.midGray + (255 - params.midGray) * t;
      } else {
        // Shadows to mid-tones
        const t = Math.max(0, tone / 180);
        value = params.shadowGray + (params.midGray - params.shadowGray) * t;
      }

      // Smooth edge transitions
      if (edgeValue > 0 && edgeValue <= 0.2) {
        value = Math.min(255, value + (255 - value) * (1 - edgeValue * 3));
      }
    }

    outputData[i] = value;
    outputData[i + 1] = value;
    outputData[i + 2] = value;
    outputData[i + 3] = 255; // Full opacity
  }

  return output;
}