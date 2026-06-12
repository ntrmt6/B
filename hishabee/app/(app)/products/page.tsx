'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchProducts, updateProducts, type Product } from '@/lib/services/products';
import { formatCurrency } from '@/lib/tenant-config';
import { Package, Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { tenantId, tenantConfig } = useAuth();
  const fc = (n: number) => formatCurrency(n, tenantConfig.currency);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await fetchProducts(tenantId);
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (product: Product) => {
    if (!tenantId || !confirm('Delete this product?')) return;
    try {
      const updated = products.filter(p => (p._id || p.id) !== (product._id || product.id));
      await updateProducts(tenantId, updated);
      setProducts(updated);
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleSaveEdit = async () => {
    if (!tenantId || !editingProduct) return;
    try {
      const updated = products.map(p =>
        (p._id || p.id) === (editingProduct._id || editingProduct.id) ? editingProduct : p
      );
      await updateProducts(tenantId, updated);
      setProducts(updated);
      setEditingProduct(null);
      toast.success('Product updated');
    } catch {
      toast.error('Failed to update product');
    }
  };

  const handleAddProduct = async (newProduct: Partial<Product>) => {
    if (!tenantId) return;
    try {
      const product: Product = {
        id: Date.now(),
        name: newProduct.name || '',
        price: newProduct.price || 0,
        stock: newProduct.stock || 0,
        cost: newProduct.cost || 0,
        sku: newProduct.sku || '',
        status: 'publish',
      };
      const updated = [...products, product];
      await updateProducts(tenantId, updated);
      setProducts(updated);
      setShowAddForm(false);
      toast.success('Product added');
    } catch {
      toast.error('Failed to add product');
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package size={24} className="text-orange-500" />
            Products
          </h1>
          <p className="text-sm text-gray-500">{products.length} products total</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or SKU..."
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Add Form */}
      {showAddForm && <AddProductForm onSave={handleAddProduct} onCancel={() => setShowAddForm(false)} />}

      {/* Edit Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onChange={setEditingProduct}
          onSave={handleSaveEdit}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      {/* Product Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-4 animate-pulse flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white border rounded-lg">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{search ? 'No products match your search' : 'No products yet'}</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Product</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Price</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((product, idx) => (
                  <tr key={product._id || product.id || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          {product.image || product.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image || product.images?.[0]} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <Package size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                          {product.sku && <p className="text-xs text-gray-400">SKU: {product.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{fc(product.price)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fc(product.cost || 0)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${(product.stock || product.quantity || 0) <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                        {product.stock || product.quantity || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.status === 'publish' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.status || 'draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingProduct({ ...product })}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AddProductForm({ onSave, onCancel }: { onSave: (p: Partial<Product>) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 mb-3">Add New Product</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Product name *" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Price" type="number" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <input value={cost} onChange={e => setCost(e.target.value)} placeholder="Cost" type="number" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <input value={stock} onChange={e => setStock(e.target.value)} placeholder="Stock" type="number" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <input value={sku} onChange={e => setSku(e.target.value)} placeholder="SKU" className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => {
            if (!name.trim()) { toast.error('Product name is required'); return; }
            onSave({ name, price: Number(price), cost: Number(cost), stock: Number(stock), sku });
          }}
          className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          <Save size={14} /> Save
        </button>
        <button onClick={onCancel} className="flex items-center gap-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
          <X size={14} /> Cancel
        </button>
      </div>
    </div>
  );
}

function EditProductModal({ product, onChange, onSave, onCancel }: {
  product: Product;
  onChange: (p: Product) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Product</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input value={product.name} onChange={e => onChange({ ...product, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Price</label>
              <input value={product.price} onChange={e => onChange({ ...product, price: Number(e.target.value) })} type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Cost</label>
              <input value={product.cost || 0} onChange={e => onChange({ ...product, cost: Number(e.target.value) })} type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Stock</label>
              <input value={product.stock || 0} onChange={e => onChange({ ...product, stock: Number(e.target.value) })} type="number" className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">SKU</label>
              <input value={product.sku || ''} onChange={e => onChange({ ...product, sku: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onSave} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            <Save size={14} /> Save Changes
          </button>
          <button onClick={onCancel} className="flex items-center gap-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            <X size={14} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
