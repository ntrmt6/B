import React from 'react';
import dynamic from 'next/dynamic';
import { ProductCardProps } from './types';

const ProductCardStyle1 = dynamic(() => import('./ProductCardStyle1'), { ssr: true });
const ProductCardStyle2 = dynamic(() => import('./ProductCardStyle2'), { ssr: true });
const ProductCardStyle3 = dynamic(() => import('./ProductCardStyle3'), { ssr: true });
const ProductCardStyle4 = dynamic(() => import('./ProductCardStyle4'), { ssr: true });
const ProductCardStyle5 = dynamic(() => import('./ProductCardStyle5'), { ssr: true });
const ProductCardStyle6 = dynamic(() => import('./ProductCardStyle6'), { ssr: true });

export const ProductCard: React.FC<ProductCardProps> = (props) => {
  const { variant = 'style1' } = props;
  
  switch (variant) {
    case 'style2':
      return <ProductCardStyle2 {...props} />;
    case 'style3':
      return <ProductCardStyle3 {...props} />;
    case 'style4':
      return <ProductCardStyle4 {...props} />;
    case 'style5':
      return <ProductCardStyle5 {...props} />;
    case 'style6':
      return <ProductCardStyle6 {...props} />;
    case 'style1':
    default:
      return <ProductCardStyle1 {...props} />;
  }
};
