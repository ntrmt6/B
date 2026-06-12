import React from 'react';
import { Package } from 'lucide-react';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';

export interface ProductImageProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 sm:w-10 sm:h-10',
  md: 'w-10 h-10 sm:w-12 sm:h-12',
  lg: 'w-14 h-14 sm:w-16 sm:h-16'
};

const iconSizes = {
  sm: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
  md: 'w-4 h-4 sm:w-5 sm:h-5',
  lg: 'w-5 h-5 sm:w-6 sm:h-6'
};

const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Product',
  size = 'sm',
  className = ''
}) => {
  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 rounded-xl overflow-hidden ${className}`}>
      {src ? (
        <img
          className="w-full h-full object-cover"
          src={normalizeImageUrl(src)}
          alt={alt}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <Package className={`${iconSizes[size]} text-gray-400`} />
        </div>
      )}
    </div>
  );
};

export default ProductImage;
