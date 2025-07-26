// Large File Upload Utility for files up to 50GB
// Uses S3 multipart upload with chunking

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  currentPart?: number;
  totalParts?: number;
}

interface UploadOptions {
  chunkSize?: number; // Default: 100MB
  maxConcurrentUploads?: number; // Default: 3
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

interface PartUpload {
  partNumber: number;
  presignedUrl: string;
}

interface CompletedPart {
  ETag: string;
  PartNumber: number;
}

class LargeFileUploader {
  private baseUrl: string;
  private abortController: AbortController | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Upload a large file using multipart upload
   * @param file - File to upload
   * @param options - Upload options
   * @returns Promise with upload result
   */
  async uploadLargeFile(
    file: File,
    options: UploadOptions = {}
  ): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
    const {
      chunkSize = 100 * 1024 * 1024, // 100MB default chunk size
      maxConcurrentUploads = 3,
      onProgress,
      onError,
      signal
    } = options;

    // Create abort controller if not provided
    this.abortController = new AbortController();
    const uploadSignal = signal || this.abortController.signal;

    try {
      // Validate file size (max 50GB)
      const maxFileSize = 50 * 1024 * 1024 * 1024; // 50GB
      if (file.size > maxFileSize) {
        throw new Error(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (50GB)`);
      }

      // Calculate total parts
      const totalParts = Math.ceil(file.size / chunkSize);
      if (totalParts > 10000) {
        throw new Error(`File requires ${totalParts} parts, but S3 supports maximum 10,000 parts. Increase chunk size.`);
      }

      console.log(`Starting upload: ${file.name} (${this.formatFileSize(file.size)}) in ${totalParts} parts`);

      // Step 1: Initialize multipart upload
      const initResult = await this.initializeUpload(file, uploadSignal);
      const { uploadId, fileName } = initResult;

      let uploadedBytes = 0;
      const completedParts: CompletedPart[] = [];

      try {
        // Step 2: Upload parts in batches
        for (let i = 0; i < totalParts; i += maxConcurrentUploads) {
          if (uploadSignal.aborted) {
            throw new Error('Upload cancelled by user');
          }

          const batchEnd = Math.min(i + maxConcurrentUploads, totalParts);
          const batchPartNumbers = Array.from({ length: batchEnd - i }, (_, idx) => i + idx + 1);

          // Generate presigned URLs for this batch
          const partUrls = await this.generatePartUrls(fileName, uploadId, batchPartNumbers, uploadSignal);

          // Upload parts concurrently
          const batchPromises = partUrls.map(async (partUpload) => {
            const partNumber = partUpload.partNumber;
            const start = (partNumber - 1) * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);

            const etag = await this.uploadPart(partUpload.presignedUrl, chunk, uploadSignal);
            
            uploadedBytes += chunk.size;
            
            // Report progress
            if (onProgress) {
              onProgress({
                loaded: uploadedBytes,
                total: file.size,
                percentage: Math.round((uploadedBytes / file.size) * 100),
                currentPart: partNumber,
                totalParts
              });
            }

            return { ETag: etag, PartNumber: partNumber };
          });

          const batchResults = await Promise.all(batchPromises);
          completedParts.push(...batchResults);

          console.log(`Completed batch ${Math.floor(i / maxConcurrentUploads) + 1}/${Math.ceil(totalParts / maxConcurrentUploads)}`);
        }

        // Step 3: Complete multipart upload
        const result = await this.completeUpload(fileName, uploadId, completedParts, uploadSignal);

        console.log(`✅ Upload completed successfully: ${result.url}`);
        return {
          success: true,
          url: result.url,
          fileName: result.fileName
        };

      } catch (error) {
        // Abort the multipart upload on error
        console.log('Aborting multipart upload due to error...');
        await this.abortUpload(fileName, uploadId).catch(console.error);
        throw error;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Large file upload failed:', errorMessage);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Cancel ongoing upload
   */
  cancelUpload(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  private async initializeUpload(file: File, signal: AbortSignal) {
    const response = await fetch(`${this.baseUrl}/multipart-upload/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        uploadType: 'large-files'
      }),
      signal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initialize upload');
    }

    const result = await response.json();
    return result.data;
  }

  private async generatePartUrls(
    fileName: string,
    uploadId: string,
    partNumbers: number[],
    signal: AbortSignal
  ): Promise<PartUpload[]> {
    const response = await fetch(`${this.baseUrl}/multipart-upload/generate-part-urls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        uploadId,
        partNumbers
      }),
      signal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to generate part URLs');
    }

    const result = await response.json();
    return result.data.partUrls;
  }

  private async uploadPart(presignedUrl: string, chunk: Blob, signal: AbortSignal): Promise<string> {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: chunk,
      signal
    });

    if (!response.ok) {
      throw new Error(`Failed to upload part: ${response.status} ${response.statusText}`);
    }

    const etag = response.headers.get('ETag');
    if (!etag) {
      throw new Error('No ETag received from S3');
    }

    return etag;
  }

  private async completeUpload(
    fileName: string,
    uploadId: string,
    parts: CompletedPart[],
    signal: AbortSignal
  ) {
    const response = await fetch(`${this.baseUrl}/multipart-upload/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName,
        uploadId,
        parts: parts.sort((a, b) => a.PartNumber - b.PartNumber)
      }),
      signal
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete upload');
    }

    const result = await response.json();
    return result.data;
  }

  private async abortUpload(fileName: string, uploadId: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/multipart-upload/abort`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          uploadId
        })
      });
    } catch (error) {
      console.error('Failed to abort upload:', error);
    }
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const largeFileUploader = new LargeFileUploader();

// Export class for custom instances
export { LargeFileUploader };

// Export types
export type { UploadProgress, UploadOptions }; 