import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";

interface ImageCropperModalProps {
  imageUrl: string;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export function ImageCropperModal({ imageUrl, onCrop, onCancel }: ImageCropperModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const CROP_SIZE = 300;

  useEffect(() => {
    // Reset state on new image
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [imageUrl]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleSave = async () => {
    if (!imageRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate crop parameters
    const img = imageRef.current;
    
    // The visual container size
    const cw = CROP_SIZE;
    const ch = CROP_SIZE;
    
    // Original image size
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    
    // The scale of the image as rendered BEFORE zoom
    const renderScale = Math.max(cw / iw, ch / ih);
    
    // Final scale including user zoom
    const finalScale = renderScale * zoom;
    
    // Draw onto 512x512 canvas
    const drawScale = 512 / CROP_SIZE; // Scale up the visual 300px crop to 512px
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 512);

    // The center of the canvas is 256, 256
    // The center of the visual crop box is cw/2, ch/2
    const centerX = 256;
    const centerY = 256;

    // Draw the image with transformations
    ctx.translate(centerX, centerY);
    
    // The visual offset needs to be scaled up to the 512 canvas
    ctx.translate(offset.x * drawScale, offset.y * drawScale);
    
    // Draw the image centered at 0,0
    const drawWidth = iw * finalScale * drawScale;
    const drawHeight = ih * finalScale * drawScale;
    
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    canvas.toBlob((blob) => {
      if (blob) onCrop(blob);
    }, "image/jpeg", 0.95);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-md flex flex-col"
      >
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Crop Photo</h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center bg-gray-50">
          <div 
            ref={containerRef}
            className="relative overflow-hidden rounded-full bg-gray-200 cursor-move touch-none shadow-inner ring-4 ring-white"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* The image rendered to perfectly COVER the container initially, then scaled and translated */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <img 
                ref={imageRef}
                src={imageUrl} 
                alt="Crop" 
                className="max-w-none pointer-events-none"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                draggable={false}
              />
            </div>
            
            {/* Grid overlay for guidance */}
            <div className="absolute inset-0 pointer-events-none border border-white/30 rounded-full" />
          </div>

          {/* Zoom Slider */}
          <div className="w-full mt-8 flex items-center gap-4 px-4">
            <ZoomOut className="w-5 h-5 text-gray-400 shrink-0" />
            <input 
              type="range" 
              min="1" 
              max="3" 
              step="0.01" 
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none outline-none accent-[#0D9488]"
            />
            <ZoomIn className="w-5 h-5 text-gray-400 shrink-0" />
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-5 py-2.5 font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-[#0D9488] text-white font-bold rounded-xl shadow-sm hover:bg-[#0D9488]/90 transition-colors flex items-center gap-2">
            <Check className="w-4 h-4" /> Save Photo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
