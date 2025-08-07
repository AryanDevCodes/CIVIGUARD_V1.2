import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface ImageGalleryProps {
  images: string[];
  className?: string;
}

export default function ImageGallery({ images, className = '' }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center text-gray-500 ${className}`}>
        No images available
      </div>
    );
  }

  const openImage = (index: number) => {
    setSelectedImage(index);
    document.body.style.overflow = 'hidden';
  };

  const closeImage = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImage === null) return;
    
    if (direction === 'prev') {
      setSelectedImage(prev => (prev === 0 ? images.length - 1 : prev - 1));
    } else {
      setSelectedImage(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((img, index) => (
          <div 
            key={index} 
            className="relative aspect-square cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => openImage(index)}
          >
            <Image
              src={img}
              alt={`Incident image ${index + 1}`}
              fill
              className="object-cover rounded-md border border-gray-200"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            />
          </div>
        ))}
      </div>

      {/* Fullscreen Image Viewer */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button 
            onClick={closeImage}
            className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-full"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          
          <button 
            onClick={() => navigateImage('prev')}
            className="absolute left-4 text-white hover:bg-white/10 p-2 rounded-full"
            aria-label="Previous image"
          >
            <ChevronLeft size={32} />
          </button>
          
          <div className="relative w-full h-full max-w-4xl mx-16">
            <Image
              src={images[selectedImage]}
              alt={`Incident image ${selectedImage + 1}`}
              fill
              className="object-contain"
              priority
            />
          </div>
          
          <button 
            onClick={() => navigateImage('next')}
            className="absolute right-4 text-white hover:bg-white/10 p-2 rounded-full"
            aria-label="Next image"
          >
            <ChevronRight size={32} />
          </button>
          
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
