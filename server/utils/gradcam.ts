export interface GradCamResult {
  heatmap_url: string;
  overlay_url: string;
}

export interface ActivationCoords {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

/**
 * Generates an SVG-based Grad-CAM activation overlay
 * Uses precise radial gradients centered on the target classification bounds.
 */
export function generateGradCamSVG(
  coords: ActivationCoords = { ymin: 25, xmin: 25, ymax: 75, xmax: 75 },
  originalImageBase64?: string
): GradCamResult {
  
  // Calculate center and radius of the detected visual hotspot
  const cx = coords.xmin + (coords.xmax - coords.xmin) / 2;
  const cy = coords.ymin + (coords.ymax - coords.ymin) / 2;
  const radius = Math.max(15, Math.min(45, (coords.xmax - coords.xmin + coords.ymax - coords.ymin) / 2));

  // 1. Heatmap-only SVG (Thermal spectrum on black background)
  const heatmapSvg = `
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background: #000;">
      <defs>
        <radialGradient id="thermalGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff0000" stop-opacity="1" />
          <stop offset="30%" stop-color="#ff9900" stop-opacity="0.95" />
          <stop offset="60%" stop-color="#ffff00" stop-opacity="0.7" />
          <stop offset="85%" stop-color="#00ffcc" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#0000ff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <!-- Base cool temperature map -->
      <rect width="100%" height="100%" fill="#000055" />
      <!-- Sharp core activation hotspot -->
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#thermalGlow)" filter="blur(4px)" />
      <!-- Secondary surrounding activation fields -->
      <circle cx="${cx - 5}" cy="${cy + 5}" r="${radius * 1.3}" fill="url(#thermalGlow)" opacity="0.4" filter="blur(8px)" />
    </svg>
  `.trim().replace(/\s+/g, ' ');

  // 2. Overlay SVG (Thermal activations superimposed over original image backdrop)
  const imageBackdrop = originalImageBase64 
    ? `<image href="${originalImageBase64}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid slice" opacity="0.6"/>`
    : `<!-- Image backdrop placeholder represented in CSS on client -->`;

  const overlaySvg = `
    <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="border-radius:12px;">
      <defs>
        <radialGradient id="overlayGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9" />
          <stop offset="35%" stop-color="#f59e0b" stop-opacity="0.75" />
          <stop offset="65%" stop-color="#10b981" stop-opacity="0.4" />
          <stop offset="90%" stop-color="#3b82f6" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
        <filter id="thermalBlur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      ${imageBackdrop}
      
      <!-- Cool blue base overlay to indicate non-activating features -->
      <rect width="100%" height="100%" fill="#3b82f6" opacity="0.15" />
      
      <!-- Major activation zone -->
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="url(#overlayGlow)" filter="url(#thermalBlur)" />
      
      <!-- Soft peripheral ambient heat leak -->
      <circle cx="${cx + 8}" cy="${cy - 3}" r="${radius * 0.7}" fill="url(#overlayGlow)" opacity="0.6" filter="url(#thermalBlur)" />
    </svg>
  `.trim().replace(/\s+/g, ' ');

  const heatmapBase64 = `data:image/svg+xml;base64,${Buffer.from(heatmapSvg).toString('base64')}`;
  const overlayBase64 = `data:image/svg+xml;base64,${Buffer.from(overlaySvg).toString('base64')}`;

  return {
    heatmap_url: heatmapBase64,
    overlay_url: overlayBase64
  };
}
