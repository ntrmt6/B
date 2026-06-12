import React, { useState, useRef, useCallback } from 'react';
import { X, Camera, Upload, Image as ImageIcon, Loader2, Search, ShoppingCart, ExternalLink } from 'lucide-react';
import { Product } from '../../../types';

interface ProductAnalysis {
  productName: string;
  category: string;
  description: string;
  estimatedPrice: string;
  features: string[];
  keywords: string[];
  confidence: number;
}

interface MatchedProduct extends Product {
  matchScore: number;
}

interface ImageSearchResult {
  success: boolean;
  analysis: ProductAnalysis;
  matchingProducts: MatchedProduct[];
  totalMatches: number;
  hasMatches: boolean;
}

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onProductClick?: (product: Product) => void;
}

export const ImageSearchModal: React.FC<ImageSearchModalProps> = ({
  isOpen,
  onClose,
  tenantId,
  onProductClick,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ImageSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const resetState = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    stopCamera();
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError("Camera feature is currently disabled.");
  }, []);
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraMode(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });
              setSelectedImage(file);
              setImagePreview(URL.createObjectURL(blob));
              stopCamera();
            }
          },
          'image/jpeg',
          0.9
        );
      }
    }
  }, [stopCamera]);

  const analyzeImage = useCallback(async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${apiUrl}/api/image-search/analyze`, {
        method: 'POST',
        headers: {
          'x-tenant-id': tenantId,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data: ImageSearchResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedImage, tenantId]);

  const handleProductClick = useCallback(
    (product: Product) => {
      if (onProductClick) {
        onProductClick(product);
        handleClose();
      }
    },
    [onProductClick, handleClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-theme-primary to-blue-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Product Search</h2>
              <p className="text-xs text-white/80">Upload or capture an image to find products</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Camera View */}
          {isCameraMode && (
            <div className="relative mb-4">
              <video
                ref={videoRef}
                className="w-full rounded-xl bg-black"
                playsInline
                autoPlay
                muted
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button
                  onClick={capturePhoto}
                  className="px-6 py-3 bg-theme-primary text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 bg-gray-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload Options */}
          {!isCameraMode && !imagePreview && !result && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-theme-primary hover:bg-theme-primary/5 transition-all group"
              >
                <Upload className="w-10 h-10 text-gray-400 group-hover:text-theme-primary mb-2" />
                <span className="font-medium text-gray-700">Upload Image</span>
                <span className="text-xs text-gray-500">JPG, PNG, WebP</span>
              </button>
              <button
                onClick={startCamera}
                className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-theme-primary hover:bg-theme-primary/5 transition-all group"
              >
                <Camera className="w-10 h-10 text-gray-400 group-hover:text-theme-primary mb-2" />
                <span className="font-medium text-gray-700">Take Photo</span>
                <span className="text-xs text-gray-500">Use camera</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Image Preview */}
          {imagePreview && !result && (
            <div className="mb-4">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Selected"
                  className="w-full max-h-64 object-contain rounded-xl bg-gray-100"
                />
                <button
                  onClick={resetState}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={analyzeImage}
                disabled={isAnalyzing}
                className="w-full mt-4 py-3 bg-gradient-to-r from-theme-primary to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search Products
                  </>
                )}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* AI Analysis */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{result.analysis.productName}</h3>
                    <p className="text-sm text-gray-600">{result.analysis.category}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {Math.round(result.analysis.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3">{result.analysis.description}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {result.analysis.features.slice(0, 4).map((feature, i) => (
                    <span key={i} className="px-2 py-1 bg-white rounded-full text-xs text-gray-600 border">
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="text-sm font-semibold text-theme-primary">
                  Estimated: {result.analysis.estimatedPrice}
                </div>
              </div>

              {/* Matching Products */}
              {result.hasMatches ? (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-theme-primary" />
                    Found in Our Store ({result.totalMatches})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {result.matchingProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product)}
                        className="p-3 bg-white border rounded-xl hover:border-theme-primary hover:shadow-md transition-all text-left group"
                      >
                        <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={product.image || '/placeholder.png'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{product.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {product.originalPrice && product.originalPrice > product.price ? (
                            <>
                              <span className="font-bold text-theme-primary">৳{product.price}</span>
                              <span className="text-xs text-gray-400 line-through">৳{product.originalPrice}</span>
                            </>
                          ) : (
                            <span className="font-bold text-theme-primary">৳{product.price}</span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          {product.matchScore}% match
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Not Found in Store</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This product is not currently available in our store. Based on our analysis, 
                        it appears to be: <strong>{result.analysis.productName}</strong>
                      </p>
                      <p className="text-sm text-yellow-600 mt-2">
                        Contact us if you'd like to request this product!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Try Again Button */}
              <button
                onClick={resetState}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Search Another Product
              </button>
            </div>
          )}
        </div>

        {/* Hidden canvas for capturing photos */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ImageSearchModal;
