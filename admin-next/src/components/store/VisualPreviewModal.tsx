import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, ZoomIn, ZoomOut, RotateCw, Move, Maximize2, FlipHorizontal } from 'lucide-react';
import type { Product } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

interface VisualPreviewModalProps {
  product: Product;
  onClose: () => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  skewX: number;
}

/** Scales product image to 40% of natural size for better room visualization */
const PRODUCT_SIZE_FACTOR = 0.4;
const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

/**
 * Visual Preview Modal — 2D "In-Your-Space" Room Visualizer
 * Canvas-based rendering: user uploads a room photo, then drags/scales a product image on top.
 */
export const VisualPreviewModal: React.FC<VisualPreviewModalProps> = ({ product, onClose }) => {
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [transform, setTransform] = useState<Transform>({ x: 150, y: 150, scale: 1, rotation: 0, skewX: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedVariantImage, setSelectedVariantImage] = useState<string>(product.image);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roomImgRef = useRef<HTMLImageElement | null>(null);
  const productImgRef = useRef<HTMLImageElement | null>(null);

  // Gallery of variant images to swap between
  const variantImages = [
    product.image,
    ...(product.galleryImages || []),
  ].filter(Boolean);

  // Load images and draw canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw room image (bottom layer)
    if (roomImgRef.current && roomImage) {
      const img = roomImgRef.current;
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = canvas.width / canvas.height;

      let drawW: number, drawH: number, drawX: number, drawY: number;
      if (imgRatio > canvasRatio) {
        drawW = canvas.width;
        drawH = canvas.width / imgRatio;
        drawX = 0;
        drawY = (canvas.height - drawH) / 2;
      } else {
        drawH = canvas.height;
        drawW = canvas.height * imgRatio;
        drawX = (canvas.width - drawW) / 2;
        drawY = 0;
      }
      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } else {
      // Placeholder background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      ctx.setLineDash([]);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload a room photo to get started', canvas.width / 2, canvas.height / 2);
    }

    // Draw product image (top layer) with transforms
    if (productImgRef.current) {
      const pImg = productImgRef.current;
      const pW = pImg.naturalWidth * transform.scale * PRODUCT_SIZE_FACTOR;
      const pH = pImg.naturalHeight * transform.scale * PRODUCT_SIZE_FACTOR;

      ctx.save();
      ctx.translate(transform.x + pW / 2, transform.y + pH / 2);
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.transform(1, 0, Math.tan((transform.skewX * Math.PI) / 180), 1, 0, 0);
      ctx.drawImage(pImg, -pW / 2, -pH / 2, pW, pH);

      // Border indicator
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-pW / 2 - 2, -pH / 2 - 2, pW + 4, pH + 4);
      ctx.setLineDash([]);

      ctx.restore();
    }
  }, [roomImage, transform]);

  // Load product image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      productImgRef.current = img;
      drawCanvas();
    };
    img.src = normalizeImageUrl(selectedVariantImage);
  }, [selectedVariantImage, drawCanvas]);

  // Load room image
  useEffect(() => {
    if (!roomImage) {
      roomImgRef.current = null;
      drawCanvas();
      return;
    }
    const img = new Image();
    img.onload = () => {
      roomImgRef.current = img;
      drawCanvas();
    };
    img.src = roomImage;
  }, [roomImage, drawCanvas]);

  // Redraw on transform changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => drawCanvas());
    observer.observe(container);
    return () => observer.disconnect();
  }, [drawCanvas]);

  // Handle room photo upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRoomImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check if click is near the product
    if (productImgRef.current) {
      const pW = productImgRef.current.naturalWidth * transform.scale * PRODUCT_SIZE_FACTOR;
      const pH = productImgRef.current.naturalHeight * transform.scale * PRODUCT_SIZE_FACTOR;
      if (mx >= transform.x && mx <= transform.x + pW && my >= transform.y && my <= transform.y + pH) {
        setIsDragging(true);
        setDragStart({ x: mx - transform.x, y: my - transform.y });
        canvas.setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setTransform(prev => ({ ...prev, x: mx - dragStart.x, y: my - dragStart.y }));
  };

  const handlePointerUp = () => setIsDragging(false);

  // Pinch to zoom (wheel)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setTransform(prev => ({ ...prev, scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + delta)) }));
  };

  return (
    <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">See in Your Space</h2>
            <p className="text-xs text-slate-500 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          <div ref={containerRef} className="flex-1 relative min-h-[300px] bg-slate-50">
            <canvas
              ref={canvasRef}
              className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onWheel={handleWheel}
            />

            {/* Upload overlay when no room photo */}
            {!roomImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 px-8 py-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                >
                  <Upload size={32} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm font-semibold text-slate-600 group-hover:text-blue-600">Upload My Room</span>
                  <span className="text-xs text-slate-400">JPG, PNG up to 10MB</span>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Controls Sidebar */}
          <div className="lg:w-64 border-t lg:border-t-0 lg:border-l border-slate-100 p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Upload / Change Room */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Upload size={14} /> {roomImage ? 'Change Room Photo' : 'Upload Room Photo'}
            </button>

            {/* Scale */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <Maximize2 size={12} /> Scale
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => setTransform(p => ({ ...p, scale: Math.max(MIN_SCALE, p.scale - 0.1) }))} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                  <ZoomOut size={14} />
                </button>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.05"
                  value={transform.scale}
                  onChange={e => setTransform(p => ({ ...p, scale: parseFloat(e.target.value) }))}
                  className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
                <button onClick={() => setTransform(p => ({ ...p, scale: Math.min(MAX_SCALE, p.scale + 0.1) }))} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
                  <ZoomIn size={14} />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-1">{(transform.scale * 100).toFixed(0)}%</p>
            </div>

            {/* Rotate */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <RotateCw size={12} /> Rotate
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={transform.rotation}
                onChange={e => setTransform(p => ({ ...p, rotation: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[10px] text-slate-400 text-center mt-1">{transform.rotation}°</p>
            </div>

            {/* Skew (Perspective) */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <FlipHorizontal size={12} /> Perspective
              </label>
              <input
                type="range"
                min="-45"
                max="45"
                step="1"
                value={transform.skewX}
                onChange={e => setTransform(p => ({ ...p, skewX: parseInt(e.target.value) }))}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[10px] text-slate-400 text-center mt-1">{transform.skewX}°</p>
            </div>

            {/* Reset */}
            <button
              onClick={() => setTransform({ x: 150, y: 150, scale: 1, rotation: 0, skewX: 0 })}
              className="w-full py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Move size={12} /> Reset Position
            </button>

            {/* Side-by-side variant swapping */}
            {variantImages.length > 1 && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                  Swap Variant
                </label>
                <div className="flex gap-2 flex-wrap">
                  {variantImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariantImage(imgUrl)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedVariantImage === imgUrl
                          ? 'border-blue-500 shadow-md'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={normalizeImageUrl(imgUrl)}
                        alt={`Variant ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color variants */}
            {product.colors && product.colors.length > 1 && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                  Color Options
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {product.colors.map(c => (
                    <span
                      key={c}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tip */}
            <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
              <p className="font-semibold mb-1">💡 Tips</p>
              <ul className="space-y-0.5 text-[11px]">
                <li>• Drag the product to position it</li>
                <li>• Use scroll wheel to zoom</li>
                <li>• Adjust sliders for rotation &amp; perspective</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualPreviewModal;
