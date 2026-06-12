import React, { memo, useState, useMemo } from 'react';
import { ChevronRight, Package } from 'lucide-react';
import type { Product } from '../../../types';
import { slugify } from '../storefrontShared';
import { SF2ProductCard } from './SF2ProductCard';
import { C } from './constants';

export const CategorySection = memo(
  ({
    categories,
    products,
    onCategoryClick,
    onProductClick,
    onAddToCart,
    onBuyNow,
  }: {
    categories: any[];
    products: Product[];
    onCategoryClick?: (slug: string) => void;
    onProductClick: (p: Product) => void;
    onAddToCart?: (p: Product) => void;
    onBuyNow?: (p: Product) => void;
  }) => {
    const activeCategories = categories
      .filter((c) => c.status === 'Active' || !c.status)
      .slice(0, 8);

    const [selected, setSelected] = useState<string | null>(null);

    const filteredProducts = useMemo(() => {
      if (!selected) return products.slice(0, 12);
      return products
        .filter(
          (p) =>
            p.category?.toLowerCase() === selected.toLowerCase() ||
            slugify(p.category || '') === selected
        )
        .slice(0, 12);
    }, [selected, products]);

    const handleCatSelect = (name: string) => {
      const slug = slugify(name);
      if (selected === slug) {
        setSelected(null);
        onCategoryClick?.('');
      } else {
        setSelected(slug);
        onCategoryClick?.(slug);
      }
    };

    if (products.length === 0 && categories.length === 0) return null;

    return (
      <section className="py-12" style={{ backgroundColor: C.secondaryBg }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar categories */}
            {activeCategories.length > 0 && (
              <aside className="md:w-48 flex-shrink-0">
                <h3 className="font-extrabold text-lg mb-4" style={{ color: C.primary }}>
                  Categories
                </h3>
                <ul className="space-y-1 md:space-y-0.5">
                  <li>
                    <button
                      onClick={() => { setSelected(null); onCategoryClick?.(''); }}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${selected === null ? 'text-white' : 'text-gray-700 hover:bg-white'}`}
                      style={selected === null ? { backgroundColor: C.primary } : {}}
                    >
                      All Products
                    </button>
                  </li>
                  {activeCategories.map((cat) => {
                    const slug = slugify(cat.name);
                    const active = selected === slug;
                    return (
                      <li key={cat.id || cat.name}>
                        <button
                          onClick={() => handleCatSelect(cat.name)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${active ? 'text-white' : 'text-gray-700 hover:bg-white'}`}
                          style={active ? { backgroundColor: C.accent } : {}}
                        >
                          <span>{cat.name}</span>
                          <ChevronRight size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Mobile pill scroll */}
                <div className="md:hidden flex gap-2 overflow-x-auto pb-1 mt-2" style={{ scrollbarWidth: 'none' }}>
                  {activeCategories.map((cat) => {
                    const slug = slugify(cat.name);
                    const active = selected === slug;
                    return (
                      <button
                        key={cat.id || cat.name}
                        onClick={() => handleCatSelect(cat.name)}
                        className="flex-none px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border"
                        style={
                          active
                            ? { backgroundColor: C.accent, color: '#fff', borderColor: C.accent }
                            : { backgroundColor: '#fff', color: C.textMain, borderColor: C.borderLight }
                        }
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            {/* Product grid */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((p) => (
                  <SF2ProductCard
                    key={p.id}
                    product={p}
                    onClick={() => onProductClick(p)}
                    onAddToCart={() => onAddToCart?.(p)}
                    onBuyNow={() => onBuyNow?.(p)}
                  />
                ))}
                {filteredProducts.length === 0 && (
                  <div className="col-span-full py-16 text-center text-gray-400">
                    <Package size={48} className="mx-auto mb-3 opacity-30" />
                    <p>No products in this category yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);
CategorySection.displayName = 'CategorySection';
