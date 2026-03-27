import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';
import { logDebug, logError } from '@/utils/devLog';
import { parseQRValue, type GeoLocation, type QRCodeData } from '@/lib/qr';
import { reportError } from '@/lib/errorReporter';
import { Spinner } from '@/components/ui/spinner';

// Re-export for consumers that import from QrScanner
export type { QRCodeData, GeoLocation } from '@/lib/qr';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Geolocation hook state
 */
interface UseGeolocationState {
  location: GeoLocation | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Custom hook for getting device geolocation
 */
const useGeolocation = () => {
  const [state, setState] = useState<UseGeolocationState>({
    location: null,
    error: null,
    isLoading: false,
  });

  const getLocation = useCallback((): Promise<GeoLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser';
        setState(prev => ({ ...prev, error, isLoading: false }));
        reject(new Error(error));
        return;
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: GeoLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };
          logDebug('[Geolocation] Location acquired', location);
          setState({ location, error: null, isLoading: false });
          resolve(location);
        },
        (error) => {
          let errorMessage: string;
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '위치 권한이 거부되었습니다. 설정에서 위치 권한을 허용해주세요.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 사용할 수 없습니다.';
              break;
            case error.TIMEOUT:
              errorMessage = '위치 정보 요청 시간이 초과되었습니다.';
              break;
            default:
              errorMessage = '알 수 없는 위치 오류가 발생했습니다.';
          }
          logError('[Geolocation] Error', { code: error.code.toString() });
          setState({ location: null, error: errorMessage, isLoading: false });
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return { ...state, getLocation };
};

/**
 * Props for QRCodeScanner component
 */
export interface QRCodeScannerProps {
  /** Callback fired when QR code is successfully scanned and parsed */
  onScanSuccess?: (data: QRCodeData) => void;
  /** Callback fired when an error occurs during scanning */
  onScanError?: (error: Error) => void;
  /** Auto-start scanning when component mounts */
  autoStart?: boolean;
  /** Delay in ms before resuming scan after successful read */
  scanDelay?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * QR Code Scanner Component
 *
 * Scans QR codes containing: version|siteId|timestamp
 * Example QR value: "1|d3ccf9f6-1d61-4cd0-903b-22597c7cb7ac|1736390400000"
 *
 * Uses @zxing/browser library for cross-browser support (including iOS Safari)
 */
const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  onScanSuccess,
  onScanError,
  autoStart = true,
  scanDelay = 2000,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<QRCodeData | null>(null);
  const [scannedText, setScannedText] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const mountedRef = useRef(true);

  // Geolocation hook
  const {
    location: currentLocation,
    isLoading: isGeoLoading,
    getLocation
  } = useGeolocation();
  const locationRef = useRef<GeoLocation | null>(null);

  // Keep locationRef in sync with currentLocation
  useEffect(() => {
    locationRef.current = currentLocation;
  }, [currentLocation]);

  /**
   * Capture the current video frame as an image
   */
  const captureVideoFrame = (): string | null => {
    try {
      const videoElement = videoRef.current;
      if (!videoElement) {
        console.log('Video element not found');
        return null;
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('Canvas context not available');
        return null;
      }

      ctx.drawImage(videoElement, 0, 0);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      logDebug('Frame captured successfully');
      return imageDataUrl;
    } catch (err) {
      logError('Failed to capture frame');
      return null;
    }
  };

  /**
   * Handle successful QR code scan
   */
  const handleScanSuccess = useCallback((decodedText: string) => {
    const now = Date.now();
    if (now - lastScanTimeRef.current < scanDelay) {
      return; // Debounce rapid scans
    }
    lastScanTimeRef.current = now;

    // Always store the raw scanned text
    setScannedText(decodedText);

    // Capture the video frame before stopping
    const frameImage = captureVideoFrame();
    if (frameImage) {
      setCapturedImage(frameImage);
    }

    // Stop scanning after successful detection
    stopScanner();

    const result = parseQRValue(decodedText, locationRef.current);

    if (result.success) {
      setScannedData(result.data);
      setError(null);
      onScanSuccess?.(result.data);
    } else {
      console.log('Parse error:', result.error);
      // Still show the raw text even if parsing fails
      setScannedData(null);
      setError(result.error);
      onScanError?.(new Error(result.error));
    }
  }, [scanDelay, onScanSuccess, onScanError]);

  /**
   * Stop the QR scanner
   */
  const stopScanner = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
      controlsRef.current = null;
    }
    readerRef.current = null;

    if (mountedRef.current) {
      setIsScanning(false);
    }
  };

  /**
   * Start the QR scanner
   */
  const startScanner = async () => {
    if (isScanning || isInitializing) return;
    if (!videoRef.current) return;

    setIsInitializing(true);
    setError(null);
    setCapturedImage(null);
    setScannedData(null);
    setScannedText(null);

    // Get location before starting scanner
    try {
      await getLocation();
    } catch (geoErr) {
      console.warn('[QRScanner] Failed to get location, continuing without it:', geoErr);
      reportError('GEO_SCAN_FAIL', 'Geolocation failed during scan', { level: 'warn' });
      // Continue without location - don't block scanning
    }

    try {
      const reader = new BrowserQRCodeReader();
      readerRef.current = reader;

      const controls = await reader.decodeFromVideoDevice(
        undefined, // Use default camera (will prefer back camera via constraints)
        videoRef.current,
        (result, error) => {
          if (result) {
            handleScanSuccess(result.getText());
          }
          // Silently ignore decode errors - this is normal during scanning
          if (error && !(error.name === 'NotFoundException')) {
            logDebug('[QRScanner] Decode error:', error.message);
          }
        }
      );

      controlsRef.current = controls;

      if (mountedRef.current) {
        setIsScanning(true);
      }
    } catch (err) {
      console.error('Failed to start scanner:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to start camera';

      if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowed')) {
        reportError('SCANNER_CAMERA_DENIED', 'Camera access denied');
      } else {
        reportError('SCANNER_INIT_FAIL', errorMsg);
      }

      if (mountedRef.current) {
        if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowed')) {
          setError('Camera access denied. Please enable camera permissions in your browser settings.');
        } else if (errorMsg.includes('NotFound') || errorMsg.includes('DevicesNotFound')) {
          setError('No camera found on this device.');
        } else {
          setError(errorMsg);
        }
      }
      onScanError?.(err instanceof Error ? err : new Error(errorMsg));
    } finally {
      if (mountedRef.current) {
        setIsInitializing(false);
      }
    }
  };

  // Auto-start on mount
  useEffect(() => {
    mountedRef.current = true;

    if (autoStart) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          startScanner();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopScanner();
    };
  }, []);

  /**
   * Format datetime for display
   */
  const formatDateTime = (date: Date): string => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Card Container */}
      <div className="rounded-md bg-white">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-lg font-bold text-slate-900">출근 현장 QR 스캔</h1>
          <span className="text-sm text-slate-500"> 근무 현장에 비치된 QR코드를 인식해주세요.</span>
        </div>

        {/* Scanner Area */}
        <div className="mx-6 mb-6">
          <div className="relative w-full aspect-square border border-slate-200 bg-black overflow-hidden">
            {/* Video element for @zxing/browser */}
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: isScanning || isInitializing ? 'block' : 'none' }}
              muted
              playsInline
            />

            {/* Captured image or placeholder when not scanning */}
            {!isScanning && !isInitializing && (
              capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured QR code"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
                  {/* QR Code Placeholder Icon */}
                  <svg
                    width="166"
                    height="166"
                    viewBox="0 0 166 166"
                    fill="none"
                    className="text-slate-300"
                  >
                    {/* Top-left block */}
                    <rect x="10" y="10" width="46" height="46" stroke="currentColor" strokeWidth="4" fill="none" />
                    <rect x="22" y="22" width="22" height="22" fill="currentColor" />
                    {/* Top-right block */}
                    <rect x="110" y="10" width="46" height="46" stroke="currentColor" strokeWidth="4" fill="none" />
                    <rect x="122" y="22" width="22" height="22" fill="currentColor" />
                    {/* Bottom-left block */}
                    <rect x="10" y="110" width="46" height="46" stroke="currentColor" strokeWidth="4" fill="none" />
                    <rect x="22" y="122" width="22" height="22" fill="currentColor" />
                    {/* Center dots */}
                    <rect x="72" y="10" width="12" height="12" fill="currentColor" />
                    <rect x="72" y="32" width="12" height="12" fill="currentColor" />
                    <rect x="10" y="72" width="12" height="12" fill="currentColor" />
                    <rect x="32" y="72" width="12" height="12" fill="currentColor" />
                    <rect x="72" y="72" width="22" height="22" fill="currentColor" />
                    {/* Bottom-right area */}
                    <rect x="110" y="72" width="12" height="12" fill="currentColor" />
                    <rect x="132" y="72" width="12" height="12" fill="currentColor" />
                    <rect x="110" y="110" width="12" height="12" fill="currentColor" />
                    <rect x="132" y="110" width="12" height="12" fill="currentColor" />
                    <rect x="144" y="110" width="12" height="12" fill="currentColor" />
                    <rect x="110" y="132" width="12" height="12" fill="currentColor" />
                    <rect x="144" y="132" width="12" height="12" fill="currentColor" />
                    <rect x="110" y="144" width="46" height="12" fill="currentColor" />
                  </svg>
                </div>
              )
            )}

            {/* Loading indicator */}
            {isInitializing && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90">
                <div className="text-center">
                  <Spinner size="xl" className="mx-auto mb-3" />
                  <p className="text-sm text-slate-500">
                    {isGeoLoading ? '위치 정보 확인 중...' : '카메라 시작 중...'}
                  </p>
                </div>
              </div>
            )}

            {/* Corner brackets overlay for scanning */}
            {isScanning && (
              <>
                <div className="absolute top-4 left-4 w-10 h-10 border-l-3 border-t-3 border-slate-900 pointer-events-none" />
                <div className="absolute top-4 right-4 w-10 h-10 border-r-3 border-t-3 border-slate-900 pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-10 h-10 border-l-3 border-b-3 border-slate-900 pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-10 h-10 border-r-3 border-b-3 border-slate-900 pointer-events-none" />
              </>
            )}
          </div>
        </div>
      </div>


      {/* Error Display */}
      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          <span className="mr-2">⚠</span>
          {error}
        </div>
      )}

      {/* Scanned Text Display - Always show raw text when scanned */}
      {scannedText && (
        <div className="mx-4 mb-4 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 bg-green-50 border-b border-slate-200">
            <span className="text-sm font-medium text-green-600">✓ 스캔 완료</span>
            <span className="text-xs text-slate-500">{formatDateTime(new Date())}</span>
          </div>

          {/* Raw Scanned Text - Prominently displayed */}
          <div className="px-4 py-4 bg-slate-50 border-b border-slate-200">
            <label className="block text-xs text-slate-500 mb-2">인식된 텍스트</label>
            <div className="p-3 bg-white border border-slate-200 rounded-md font-mono text-sm text-slate-900 break-all">
              {scannedText}
            </div>
          </div>

          {/* Parsed Data - Only show if parsing succeeded */}
          {scannedData && (
            <div className="divide-y divide-slate-100">
              <div className="px-4 py-3">
                <label className="block text-xs text-slate-500 mb-1">QR 버전</label>
                <div className="font-medium text-slate-900">{scannedData.version}</div>
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs text-slate-500 mb-1">현장 ID</label>
                <div className="font-medium text-slate-900 font-mono text-sm break-all">{scannedData.siteId}</div>
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs text-slate-500 mb-1">QR 생성 시간</label>
                <div className="font-medium text-slate-900">{formatDateTime(scannedData.issuedAt)}</div>
              </div>
              <div className="px-4 py-3">
                <label className="block text-xs text-slate-500 mb-1">위치 정보</label>
                {scannedData.location ? (
                  <div className="font-medium text-slate-900">
                    <span className="text-green-600 mr-1">✓</span>
                    {scannedData.location.latitude.toFixed(6)}, {scannedData.location.longitude.toFixed(6)}
                    <span className="text-xs text-slate-500 ml-2">(±{scannedData.location.accuracy.toFixed(0)}m)</span>
                  </div>
                ) : (
                  <div className="font-medium text-slate-400">
                    <span className="text-amber-500 mr-1">⚠</span>
                    위치 정보 없음
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRCodeScanner;
