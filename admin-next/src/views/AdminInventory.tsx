import React from 'react';
import { Product } from '../types';
import FigmaInventory from '../components/dashboard/FigmaInventory';

interface AdminInventoryProps {
  products: Product[];
  tenantId?: string;
  user?: { name?: string; avatar?: string } | null;
}

const AdminInventory: React.FC<AdminInventoryProps> = ({ products, tenantId, user }) => {
  return <FigmaInventory products={products} tenantId={tenantId} user={user} />;
};

export default AdminInventory;
