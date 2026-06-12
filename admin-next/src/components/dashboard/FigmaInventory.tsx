import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Product, ProductVariantStock } from '../../types';
import toast from 'react-hot-toast';
import { getAuthHeader } from '../../services/authService';
import InventoryStatsCards from './inventory/InventoryStatsCards';
import InventoryControls from './inventory/InventoryControls';
import InventoryLowStockTable, { StockDisplayLimit } from './inventory/InventoryLowStockTable';
import InventoryExpiryTable from './inventory/InventoryExpiryTable';
import InventoryAlertsPanel from './inventory/InventoryAlertsPanel';
import InventoryStockUpdateModal, { InventoryUpdatePayload } from './inventory/InventoryStockUpdateModal';

interface FigmaInventoryProps {
  products: Product[];
  tenantId?: string;
  user?: { name?: string; avatar?: string } | null;
  onUpdateProduct?: (product: Product) => void;
}

interface ExpiryProduct extends Product {
  expireDays: number;
}

const FigmaInventory: React.FC<FigmaInventoryProps> = ({ products, tenantId, onUpdateProduct }) => {
  const [inventoryProducts, setInventoryProducts] = useState<Product[]>(products);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('stock-low-high');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [expireThreshold, setExpireThreshold] = useState(10);
  const [stockDisplayLimit, setStockDisplayLimit] = useState<StockDisplayLimit>(10);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInventoryProducts(products);
  }, [products]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const closeDropdownOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('click', closeDropdownOnOutsideClick);
    return () => document.removeEventListener('click', closeDropdownOnOutsideClick);
  }, []);

  useEffect(() => {
    const loadThresholds = async () => {
      if (!tenantId) return;
      try {
        const response = await fetch(`/api/tenant-data/${tenantId}/inventory_settings`);
        if (!response.ok) return;
        const result = await response.json();
        if (!result.data) return;
        if (result.data.lowStockThreshold) setLowStockThreshold(result.data.lowStockThreshold);
        if (result.data.expireThreshold) setExpireThreshold(result.data.expireThreshold);
      } catch (error) {
        console.error('Failed to load inventory settings:', error);
      }
    };

    loadThresholds();
  }, [tenantId]);

  const saveThresholds = useCallback(async (lowStock: number, expire: number) => {
    if (!tenantId) {
      console.warn('Cannot save thresholds: tenantId is undefined');
      return;
    }

    try {
      const response = await fetch(`/api/tenant-data/${tenantId}/inventory_settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          data: {
            lowStockThreshold: lowStock,
            expireThreshold: expire,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save settings:', errorData);
        toast.error('Failed to save settings');
        return;
      }

      toast.success('Threshold settings saved');
    } catch (error) {
      console.error('Failed to save inventory settings:', error);
      toast.error('Failed to save settings');
    }
  }, [tenantId]);

  const handleLowStockChange = (value: number) => {
    setLowStockThreshold(value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveThresholds(value, expireThreshold), 1000);
  };

  const handleExpireThresholdChange = (value: number) => {
    setExpireThreshold(value);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveThresholds(lowStockThreshold, value), 1000);
  };

  const inventoryStats = useMemo(() => {
    const totalProducts = inventoryProducts.length;
    const totalUnits = inventoryProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockCount = inventoryProducts.filter((p) => (p.stock || 0) < lowStockThreshold).length;
    const outOfStockCount = inventoryProducts.filter((p) => (p.stock || 0) === 0).length;
    const inventoryValue = inventoryProducts.reduce((sum, p) => sum + ((p.costPrice || 0) * (p.stock || 0)), 0);
    const inventorySaleValue = inventoryProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);

    return {
      totalProducts,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      inventoryValue,
      inventorySaleValue,
    };
  }, [inventoryProducts, lowStockThreshold]);

  const lowStockProducts = useMemo(() => {
    let filtered = inventoryProducts.filter((p) => (p.stock || 0) < lowStockThreshold);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => (
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      ));
    }

    switch (sortBy) {
      case 'stock-low-high':
        filtered.sort((a, b) => (a.stock || 0) - (b.stock || 0));
        break;
      case 'stock-high-low':
        filtered.sort((a, b) => (b.stock || 0) - (a.stock || 0));
        break;
      case 'price-low-high':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high-low':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [inventoryProducts, lowStockThreshold, searchQuery, sortBy]);

  const displayedLowStockProducts = useMemo(() => {
    if (stockDisplayLimit === 'all') return lowStockProducts;
    return lowStockProducts.slice(0, stockDisplayLimit);
  }, [lowStockProducts, stockDisplayLimit]);

  const expiryProducts = useMemo(() => {
    return inventoryProducts
      .filter((p: any) => p.expiryDate)
      .map((p: any) => {
        const expireDate = new Date(p.expiryDate);
        const today = new Date();
        const diffTime = expireDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...p,
          expireDays: diffDays > 0 ? diffDays : 0,
        } as ExpiryProduct;
      })
      .slice(0, 5);
  }, [inventoryProducts]);

  const isInventoryHealthy = inventoryStats.lowStockCount === 0;
  const hasExpiryAlerts = expiryProducts.filter((p) => p.expireDays <= expireThreshold).length > 0;

  const sortOptions = [
    { value: 'stock-low-high', label: 'Stock low to high' },
    { value: 'stock-high-low', label: 'Stock high to low' },
    { value: 'price-low-high', label: 'Price low to high' },
    { value: 'price-high-low', label: 'Price high to low' },
  ];

  const saveProductStockUpdate = useCallback(async (payload: InventoryUpdatePayload) => {
    if (!selectedProduct) return;

    const updatedProduct: Product = {
      ...selectedProduct,
      stock: payload.stock,
      initialSoldCount: payload.initialSoldCount,
      variantStock: payload.variantStock,
      price: payload.price,
      deliveryCharge: payload.deliveryCharge,
      useDefaultDelivery: payload.useDefaultDelivery,
    };

    const nextProducts = inventoryProducts.map((product) => (
      product.id === selectedProduct.id ? updatedProduct : product
    ));

    setInventoryProducts(nextProducts);

    if (!tenantId) {
      toast.error('Unable to save changes: tenant is missing');
      return;
    }

    setSaveInProgress(true);

    try {
      const response = await fetch(`/api/tenant-data/${tenantId}/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ data: nextProducts }),
      });

      if (!response.ok) {
        throw new Error('Failed to save product stock updates');
      }

      toast.success('Stock updated successfully');
      setSelectedProduct(null);
      // Notify parent so app-level state stays in sync
      if (onUpdateProduct) onUpdateProduct(updatedProduct);
    } catch (error) {
      console.error('Stock update failed:', error);
      toast.error('Failed to update stock');
      setInventoryProducts(products);
    } finally {
      setSaveInProgress(false);
    }
  }, [tenantId, selectedProduct, inventoryProducts, products]);

  return (
    <div className="bg-white min-h-screen font-['Roboto']">
      <div className="px-5 py-5">
        <h1 className="text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-lg sm:text-xl lg:text-[22px] font-bold text-[#023337] tracking-[0.11px] font-['Lato'] mb-5">
          Inventory
        </h1>

        <InventoryStatsCards stats={inventoryStats} lowStockThreshold={lowStockThreshold} />

        <InventoryControls
          searchQuery={searchQuery}
          sortBy={sortBy}
          lowStockThreshold={lowStockThreshold}
          expireThreshold={expireThreshold}
          showSortDropdown={showSortDropdown}
          sortOptions={sortOptions}
          onSearchChange={setSearchQuery}
          onSortByChange={setSortBy}
          onLowStockThresholdChange={handleLowStockChange}
          onExpireThresholdChange={handleExpireThresholdChange}
          onToggleSortDropdown={() => setShowSortDropdown((prev) => !prev)}
          onCloseSortDropdown={() => setShowSortDropdown(false)}
        />

        <div className="flex flex-col xl:flex-row gap-3 sm:gap-4 lg:gap-6">
          <div className="flex-1">
            <InventoryLowStockTable
              lowStockProducts={lowStockProducts}
              displayedLowStockProducts={displayedLowStockProducts}
              stockDisplayLimit={stockDisplayLimit}
              onDisplayLimitChange={setStockDisplayLimit}
              onRowClick={setSelectedProduct}
            />
            <InventoryExpiryTable expiryProducts={expiryProducts} />
          </div>

          <InventoryAlertsPanel
            isInventoryHealthy={isInventoryHealthy}
            lowStockCount={inventoryStats.lowStockCount}
            outOfStockCount={inventoryStats.outOfStockCount}
            hasExpiryAlerts={hasExpiryAlerts}
            expireThreshold={expireThreshold}
          />
        </div>
      </div>

      <InventoryStockUpdateModal
        product={selectedProduct}
        isSaving={saveInProgress}
        onClose={() => setSelectedProduct(null)}
        onSave={saveProductStockUpdate}
      />
    </div>
  );
};

export default FigmaInventory;
