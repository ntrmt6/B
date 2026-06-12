import React from 'react';
import { Product } from '../../../types';

interface InventoryStatusBadgeProps {
  product: Product;
}

const InventoryStatusBadge: React.FC<InventoryStatusBadgeProps> = ({ product }) => {
  const isPublished = product.status === 'Active';

  return (
    <span className={`inline-flex px-[9px] py-0.5 rounded-[30px] text-[12px] font-medium ${
      isPublished ? 'bg-[#c1ffbc] text-[#085e00]' : 'bg-orange-100 text-orange-700'
    }`}>
      {isPublished ? 'Publish' : 'Draft'}
    </span>
  );
};

export default InventoryStatusBadge;
