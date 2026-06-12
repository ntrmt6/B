import React, { useMemo, useState } from 'react';
import { CheckSquare, Copy, Download, ExternalLink, Image as ImageIcon, LayoutGrid, Package2, Plus, Search, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '../types';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface AdminProductMediaCenterProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onAddProduct: () => void;
}

interface ProductMediaItem {
  id: string;
  product: Product;
  imageUrl: string;
  imageIndex: number;
  totalImages: number;
  isPrimary: boolean;
}

const getProductImages = (product: Product): string[] => {
  const imageSet = new Set<string>();

  if (product.image) {
    imageSet.add(product.image);
  }

  (product.galleryImages || []).forEach((image) => {
    if (image) {
      imageSet.add(image);
    }
  });

  return Array.from(imageSet);
};

const AdminProductMediaCenter: React.FC<AdminProductMediaCenterProps> = ({
  products,
  onEditProduct,
  onAddProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [groupBy, setGroupBy] = useState<'none' | 'product' | 'category'>('product');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category).filter(Boolean))),
    [products]
  );

  const mediaItems = useMemo<ProductMediaItem[]>(() => {
    return products.flatMap((product) => {
      const images = getProductImages(product);

      return images.map((imageUrl, imageIndex) => ({
        id: `${product.id}-${imageIndex}-${imageUrl}`,
        product,
        imageUrl,
        imageIndex,
        totalImages: images.length,
        isPrimary: imageIndex === 0,
      }));
    });
  }, [products]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return mediaItems.filter((item) => {
      const matchesCategory = categoryFilter === 'all' || item.product.category === categoryFilter;
      const matchesSearch = !query || [
        item.product.name,
        item.product.sku,
        item.product.category,
        item.product.brand,
      ].some((value) => String(value || '').toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, mediaItems, searchQuery]);

  const productsWithImages = useMemo(
    () => products.filter((product) => getProductImages(product).length > 0).length,
    [products]
  );

  const selectedItems = useMemo(
    () => filteredItems.filter((item) => selectedIds.has(item.id)),
    [filteredItems, selectedIds]
  );

  const groupedItems = useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', label: 'All Product Images', items: filteredItems }];
    }

    const groups = new Map<string, ProductMediaItem[]>();

    filteredItems.forEach((item) => {
      const rawKey = groupBy === 'product'
        ? item.product.name || 'Untitled Product'
        : item.product.category || 'Uncategorized';
      const groupItems = groups.get(rawKey) || [];
      groupItems.push(item);
      groups.set(rawKey, groupItems);
    });

    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: key,
      items,
    }));
  }, [filteredItems, groupBy]);

  const handleCopyImageUrl = async (imageUrl: string) => {
    try {
      await navigator.clipboard.writeText(normalizeImageUrl(imageUrl));
      toast.success('Image URL copied');
    } catch {
      toast.error('Failed to copy image URL');
    }
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAllVisible = () => {
    const allVisibleSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id));

    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(filteredItems.map((item) => item.id)));
  };

  const handleBulkDownload = () => {
    if (selectedItems.length === 0) {
      toast.error('Select images first');
      return;
    }

    selectedItems.forEach((item, index) => {
      const anchor = document.createElement('a');
      anchor.href = normalizeImageUrl(item.imageUrl);
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = `${item.product.name || 'product-image'}-${index + 1}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    });

    toast.success(`Opened ${selectedItems.length} images`);
  };

  const handleEditSelected = () => {
    if (selectedItems.length === 0) {
      toast.error('Select images first');
      return;
    }

    if (selectedItems.length > 1) {
      toast.success(`Opened the first product from ${selectedItems.length} selected images`);
    }

    onEditProduct(selectedItems[0].product);
  };

  return (
    <div className="mx-1 xxs:mx-2 sm:mx-4 md:mx-6 space-y-5 font-['Roboto']">
      <section className="rounded-3xl border border-[#eef2f6] bg-white px-4 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4eb] px-3 py-1 text-xs font-semibold text-[#ff6a00]">
              <LayoutGrid size={14} />
              Product Media Center
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#023337] sm:text-2xl">Media Center</h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                All product images in one clean grid. Browse, search, and jump straight into product editing from here.
              </p>
            </div>
          </div>

          <button
            onClick={onAddProduct}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(30,144,255,0.24)] transition hover:translate-y-[-1px]"
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#eef2f6] bg-[#f8fafc] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Total Images</div>
            <div className="mt-2 text-2xl font-bold text-[#023337]">{mediaItems.length}</div>
          </div>
          <div className="rounded-2xl border border-[#eef2f6] bg-[#f8fafc] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Products With Media</div>
            <div className="mt-2 text-2xl font-bold text-[#023337]">{productsWithImages}</div>
          </div>
          <div className="rounded-2xl border border-[#eef2f6] bg-[#f8fafc] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Categories</div>
            <div className="mt-2 text-2xl font-bold text-[#023337]">{categories.length}</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#eef2f6] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by product name, SKU, category"
              className="w-full rounded-2xl border border-[#e8edf3] bg-[#f8fafc] py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#ff6a00] focus:bg-white"
            />
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-2xl border border-[#e8edf3] bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff6a00]"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <div className="inline-flex items-center justify-center rounded-2xl border border-[#e8edf3] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-slate-500">
              {filteredItems.length} images found
            </div>

            <select
              value={groupBy}
              onChange={(event) => setGroupBy(event.target.value as 'none' | 'product' | 'category')}
              className="rounded-2xl border border-[#e8edf3] bg-[#f8fafc] px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff6a00]"
            >
              <option value="product">Group by Product</option>
              <option value="category">Group by Category</option>
              <option value="none">No Grouping</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#eef2f6] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#f8fafc] px-4 py-3 font-medium text-slate-600">
              <LayoutGrid size={15} />
              {groupedItems.length} groups
            </span>
            <span className="inline-flex items-center gap-2 rounded-2xl bg-[#f8fafc] px-4 py-3 font-medium text-slate-600">
              {selectedItems.length} selected
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleToggleAllVisible}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e8edf3] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
            >
              {filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id)) ? <CheckSquare size={15} /> : <Square size={15} />}
              {filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id)) ? 'Clear Visible' : 'Select Visible'}
            </button>
            <button
              onClick={handleBulkDownload}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#e8edf3] bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
            >
              <Download size={15} />
              Download Selected
            </button>
            <button
              onClick={handleEditSelected}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#fff4eb] px-4 py-3 text-sm font-semibold text-[#ff6a00] transition hover:bg-[#ffe7d4]"
            >
              Edit Selected
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#eef2f6] bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-6">
        {filteredItems.length > 0 ? (
          <div className="space-y-8">
            {groupedItems.map((group) => (
              <div key={group.key} className="space-y-4">
                {groupBy !== 'none' && (
                  <div className="flex items-center justify-between border-b border-[#eef2f6] pb-3">
                    <div>
                      <h2 className="text-base font-bold text-[#023337]">{group.label}</h2>
                      <p className="mt-1 text-xs text-slate-500">{group.items.length} images</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {group.items.map((item) => {
                    const isSelected = selectedIds.has(item.id);

                    return (
                      <article
                        key={item.id}
                        className={`group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] ${isSelected ? 'border-[#fb923c] ring-2 ring-[#fdba74]/50' : 'border-[#eef2f6]'}`}
                      >
                        <div className="relative aspect-square overflow-hidden bg-[#f8fafc]">
                          <img
                            src={normalizeImageUrl(item.imageUrl)}
                            alt={item.product.name}
                            className="h-full w-full object-contain transition duration-300 group-hover:scale-[1.03]"
                            loading="lazy"
                          />

                          <button
                            onClick={() => handleToggleSelection(item.id)}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm transition hover:text-[#ff6a00]"
                          >
                            {isSelected ? <CheckSquare size={17} className="text-[#ff6a00]" /> : <Square size={17} />}
                          </button>

                          <div className="absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-2 pr-10">
                            {item.isPrimary && (
                              <span className="rounded-full bg-[#023337] px-2.5 py-1 text-[11px] font-semibold text-white">
                                Cover
                              </span>
                            )}
                            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
                              {item.imageIndex + 1}/{item.totalImages}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3 p-4">
                          <div>
                            <h3 className="line-clamp-2 text-sm font-bold leading-5 text-[#023337]">{item.product.name}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              {item.product.category && (
                                <span className="rounded-full bg-[#f8fafc] px-2.5 py-1 font-medium text-slate-600">
                                  {item.product.category}
                                </span>
                              )}
                              {item.product.sku && <span>SKU: {item.product.sku}</span>}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => handleCopyImageUrl(item.imageUrl)}
                              className="inline-flex items-center justify-center gap-1 rounded-2xl border border-[#e8edf3] bg-[#f8fafc] px-2 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
                            >
                              <Copy size={13} />
                              Copy
                            </button>
                            <button
                              onClick={() => window.open(normalizeImageUrl(item.imageUrl), '_blank', 'noopener,noreferrer')}
                              className="inline-flex items-center justify-center gap-1 rounded-2xl border border-[#e8edf3] bg-[#f8fafc] px-2 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#ff6a00] hover:text-[#ff6a00]"
                            >
                              <ExternalLink size={13} />
                              View
                            </button>
                            <button
                              onClick={() => onEditProduct(item.product)}
                              className="inline-flex items-center justify-center gap-1 rounded-2xl bg-[#fff4eb] px-2 py-2 text-xs font-semibold text-[#ff6a00] transition hover:bg-[#ffe7d4]"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#d8e0ea] bg-[#fafcff] px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fff4eb] text-[#ff6a00]">
              {mediaItems.length === 0 ? <Package2 size={28} /> : <ImageIcon size={28} />}
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#023337]">
              {mediaItems.length === 0 ? 'No product images yet' : 'No images match this filter'}
            </h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              {mediaItems.length === 0
                ? 'Add products with cover images or gallery images and they will appear here automatically.'
                : 'Try a different product name, SKU, or category to find the image you want.'}
            </p>
            {mediaItems.length === 0 && (
              <button
                onClick={onAddProduct}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#38bdf8] to-[#1e90ff] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(30,144,255,0.24)]"
              >
                <Plus size={16} />
                Add Product
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminProductMediaCenter;