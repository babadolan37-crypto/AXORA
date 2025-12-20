import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface PhotoViewerProps {
  photos: string[];
  currentIndex: number;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onDelete?: (index: number) => void;
  canDelete?: boolean;
}

export function PhotoViewer({ 
  photos, 
  currentIndex, 
  onClose, 
  onNext, 
  onPrev, 
  onDelete,
  canDelete = false 
}: PhotoViewerProps) {
  const [imageError, setImageError] = useState(false);
  
  if (photos.length === 0) return null;

  const handleDelete = () => {
    if (onDelete && canDelete) {
      if (confirm('Apakah Anda yakin ingin menghapus foto ini?')) {
        onDelete(currentIndex);
      }
    }
  };

  const handleImageError = () => {
    console.error('Failed to load image:', photos[currentIndex]?.substring(0, 100));
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <X size={32} />
      </button>

      {/* Delete button */}
      {canDelete && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-4 left-4 text-white hover:text-red-400 transition-colors z-10 flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg"
        >
          <Trash2 size={20} />
          Hapus Foto
        </button>
      )}

      {/* Previous button */}
      {photos.length > 1 && onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 p-2 rounded-full"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Image */}
      <div className="max-w-7xl max-h-[90vh] p-4">
        {imageError ? (
          <div className="flex flex-col items-center justify-center text-white p-8 bg-gray-800 rounded-lg">
            <svg className="w-24 h-24 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg mb-2">Gagal memuat foto</p>
            <p className="text-sm text-gray-400">Format foto mungkin rusak atau tidak valid</p>
          </div>
        ) : (
          <>
            <img
              src={photos[currentIndex]}
              alt={`Foto ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {photos.length > 1 && (
              <div className="text-white text-center mt-4">
                Foto {currentIndex + 1} dari {photos.length}
              </div>
            )}
          </>
        )}
      </div>

      {/* Next button */}
      {photos.length > 1 && onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 p-2 rounded-full"
        >
          <ChevronRight size={32} />
        </button>
      )}
    </div>
  );
}