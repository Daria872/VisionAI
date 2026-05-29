export interface PreprocessMetrics {
  original_size_bytes: number;
  mime_type: string;
  normalized_dims: string;
  channels: number;
  status: string;
}

/**
 * Validates and logs preprocessing step for standard CNN classification pipeline.
 * Mimics pixel normalization and scaling to target tensor shape (e.g., 224x224x3).
 */
export function preprocessImage(
  buffer: Buffer,
  mimeType: string,
  modelInputWidth = 224,
  modelInputHeight = 224
): { success: boolean; error?: string; metrics?: PreprocessMetrics } {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (!buffer || buffer.length === 0) {
    return {
      success: false,
      error: 'Invalid input data: Image buffer is empty.'
    };
  }

  if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
    return {
      success: false,
      error: `Unsupported image format: ${mimeType}. Core models (h5) accept JPEG, PNG, or WEBP.`
    };
  }

  // Calculate mock processing metrics mimicking TF/Keras pixel array casting
  const metrics: PreprocessMetrics = {
    original_size_bytes: buffer.length,
    mime_type: mimeType,
    normalized_dims: `${modelInputWidth}x${modelInputHeight}`,
    channels: 3,
    status: "NORMALIZED_0_TO_1"
  };

  console.log(`[PREPROCESS] Preprocessing image. Size: ${metrics.original_size_bytes}B. Resizing to: ${metrics.normalized_dims}. Values normalized [0, 1].`);

  return {
    success: true,
    metrics
  };
}
