import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, RefreshCw } from 'lucide-react';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  aspectRatio?: 'square' | 'banner' | 'avatar';
  className?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  label = 'Upload Image',
  aspectRatio = 'square',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    // Convert to Base64 or object URL for instant preview & persistence
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="block text-xs font-medium text-gray-700">{label}</label>}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {value ? (
        <div className={`relative group border border-gray-200 rounded-xl overflow-hidden bg-gray-50 ${
          aspectRatio === 'banner' ? 'h-32 w-full' : aspectRatio === 'avatar' ? 'w-24 h-24 rounded-full mx-auto' : 'w-full h-36'
        }`}>
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-white/90 text-gray-700 rounded-lg text-xs font-medium hover:bg-white flex items-center gap-1 shadow-sm"
              title="Replace Image"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 flex items-center gap-1 shadow-sm"
              title="Delete Image"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragging ? 'border-amber-500 bg-amber-50/50' : 'border-gray-200 hover:border-amber-400 bg-gray-50/50 hover:bg-amber-50/20'
          } ${aspectRatio === 'banner' ? 'h-28' : aspectRatio === 'avatar' ? 'w-24 h-24 rounded-full mx-auto p-2' : 'h-32'}`}
        >
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <Upload className="w-4 h-4" />
          </div>
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-amber-700">Click to browse</span> or drag & drop
          </div>
          <p className="text-[10px] text-gray-400">JPG, PNG, WEBP (Max 5MB)</p>
        </div>
      )}
    </div>
  );
};
