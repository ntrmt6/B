import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Search, Tag as TagIcon } from 'lucide-react';
import { Category, SubCategory, ChildCategory, Brand, Tag } from '../../types';

interface CatalogSidebarProps {
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  data: any;
  onChange: (data: any) => void;
  
}

// Reusable multi-select dropdown with chips
const MultiSelectChips = ({
  label,
  required,
  options,
  selected,
  onChange,
  placeholder,
  colorClass = 'blue'
}: {
  label: string;
  required?: boolean;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  colorClass?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter(
    o => o.name.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o.name)
  );

  const toggleItem = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter(s => s !== name));
    } else {
      onChange([...selected, name]);
    }
    setSearch('');
  };

  const removeItem = (name: string) => {
    onChange(selected.filter(s => s !== name));
  };

  const colors: Record<string, { chip: string; ring: string; bg: string }> = {
    blue: { chip: 'bg-blue-50 text-blue-700 border-blue-200', ring: 'focus-within:ring-blue-500 focus-within:border-blue-500', bg: 'hover:bg-blue-50' },
    purple: { chip: 'bg-purple-50 text-purple-700 border-purple-200', ring: 'focus-within:ring-purple-500 focus-within:border-purple-500', bg: 'hover:bg-purple-50' },
    emerald: { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', ring: 'focus-within:ring-emerald-500 focus-within:border-emerald-500', bg: 'hover:bg-emerald-50' },
    amber: { chip: 'bg-amber-50 text-amber-700 border-amber-200', ring: 'focus-within:ring-amber-500 focus-within:border-amber-500', bg: 'hover:bg-amber-50' },
    rose: { chip: 'bg-rose-50 text-rose-700 border-rose-200', ring: 'focus-within:ring-rose-500 focus-within:border-rose-500', bg: 'hover:bg-rose-50' },
  };
  const c = colors[colorClass] || colors.blue;

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Selected chips + input */}
      <div
        className={`min-h-[38px] px-2 py-1 border border-gray-300 rounded-lg flex flex-wrap items-center gap-1 cursor-text transition-all ${c.ring}`}
        onClick={() => setIsOpen(true)}
      >
        {selected.map(item => (
          <span
            key={item}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.chip}`}
          >
            {item}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeItem(item); }}
              className="hover:opacity-70 transition"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder={selected.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[60px] text-sm outline-none bg-transparent py-0.5"
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No options found</div>
          ) : (
            filtered.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => { toggleItem(option.name); }}
                className={`w-full text-left px-3 py-2 text-sm text-gray-700 ${c.bg} transition`}
              >
                {option.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const CatalogSidebar = ({
  categories,
  subCategories,
  childCategories,
  brands,
  tags,
  data,
  onChange
}: CatalogSidebarProps) => {
  const [showTags, setShowTags] = useState(false);

  // Get selected arrays (backward compat: fill from single strings if arrays empty)
  const selectedCategories: string[] = data.categories?.length ? data.categories : (data.category ? [data.category] : []);
  const selectedSubCategories: string[] = data.subCategories?.length ? data.subCategories : (data.subCategory ? [data.subCategory] : []);
  const selectedChildCategories: string[] = data.childCategories?.length ? data.childCategories : (data.childCategory ? [data.childCategory] : []);
  const selectedBrands: string[] = data.brands?.length ? data.brands : (data.brand ? [data.brand] : []);

  // Filter sub-categories based on ALL selected categories
  const filteredSubCategories = subCategories.filter(
    sc => selectedCategories.some(cat => sc.categoryId === cat || sc.categoryName === cat || 
      categories.find(c => c.name === cat)?.id === sc.categoryId)
  );

  // Filter child categories based on ALL selected sub-categories
  const filteredChildCategories = childCategories.filter(
    cc => selectedSubCategories.some(sub => cc.subCategoryId === sub || (cc as any).subCategoryName === sub ||
      subCategories.find(s => s.name === sub)?.id === cc.subCategoryId)
  );

  const handleCategoriesChange = (values: string[]) => {
    // When categories change, remove sub/child that are no longer valid
    const validSubCatIds = subCategories
      .filter(sc => values.some(cat => sc.categoryId === cat || sc.categoryName === cat || 
        categories.find(c => c.name === cat)?.id === sc.categoryId))
      .map(sc => sc.name);
    
    const newSubCategories = selectedSubCategories.filter(s => validSubCatIds.includes(s));
    
    const validChildCatIds = childCategories
      .filter(cc => newSubCategories.some(sub => cc.subCategoryId === sub || (cc as any).subCategoryName === sub ||
        subCategories.find(s => s.name === sub)?.id === cc.subCategoryId))
      .map(cc => cc.name);
    
    const newChildCategories = selectedChildCategories.filter(c => validChildCatIds.includes(c));

    onChange({
      category: values[0] || '',
      categories: values,
      subCategory: newSubCategories[0] || '',
      subCategories: newSubCategories,
      childCategory: newChildCategories[0] || '',
      childCategories: newChildCategories
    });
  };

  const handleSubCategoriesChange = (values: string[]) => {
    const validChildCatIds = childCategories
      .filter(cc => values.some(sub => cc.subCategoryId === sub || (cc as any).subCategoryName === sub ||
        subCategories.find(s => s.name === sub)?.id === cc.subCategoryId))
      .map(cc => cc.name);
    
    const newChildCategories = selectedChildCategories.filter(c => validChildCatIds.includes(c));

    onChange({
      subCategory: values[0] || '',
      subCategories: values,
      childCategory: newChildCategories[0] || '',
      childCategories: newChildCategories
    });
  };

  const handleChildCategoriesChange = (values: string[]) => {
    onChange({
      childCategory: values[0] || '',
      childCategories: values
    });
  };

  const handleBrandsChange = (values: string[]) => {
    onChange({
      brand: values[0] || '',
      brands: values
    });
  };

  const handleTagToggle = (tagName: string) => {
    const currentTags = data.tags || [];
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter((t: string) => t !== tagName)
      : [...currentTags, tagName];
    onChange({ tags: newTags });
  };

  const removeTag = (tagName: string) => {
    onChange({ tags: (data.tags || []).filter((t: string) => t !== tagName) });
  };

  return (
    <div className="sticky top-6 space-y-4">
      {/* Catalog & Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Catalog & Search</h3>

        <div className="space-y-4">
          {/* Categories - Multi-select */}
          <MultiSelectChips
            label="Categories"
            required
            options={categories.map(c => ({ id: c.id, name: c.name }))}
            selected={selectedCategories}
            onChange={handleCategoriesChange}
            placeholder="Select categories..."
            colorClass="blue"
          />

          {/* Sub Categories - Multi-select */}
          {filteredSubCategories.length > 0 && (
            <MultiSelectChips
              label="Sub Categories"
              options={filteredSubCategories.map(sc => ({ id: sc.id, name: sc.name }))}
              selected={selectedSubCategories}
              onChange={handleSubCategoriesChange}
              placeholder="Select subcategories..."
              colorClass="purple"
            />
          )}

          {/* Child Categories - Multi-select */}
          {filteredChildCategories.length > 0 && (
            <MultiSelectChips
              label="Child Categories"
              options={filteredChildCategories.map(cc => ({ id: cc.id, name: cc.name }))}
              selected={selectedChildCategories}
              onChange={handleChildCategoriesChange}
              placeholder="Select child categories..."
              colorClass="emerald"
            />
          )}

          {/* Brands - Multi-select */}
          <MultiSelectChips
            label="Brands"
            options={brands.map(b => ({ id: b.id, name: b.name }))}
            selected={selectedBrands}
            onChange={handleBrandsChange}
            placeholder="Select brands..."
            colorClass="amber"
          />

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Condition
            </label>
            <select
              value={data.condition}
              onChange={(e) => onChange({ condition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
            >
              <option value="New">New</option>
              <option value="Refurbished">Refurbished</option>
              <option value="Used">Used</option>
            </select>
          </div>

          {/* Tags & Deep Search */}
          <div>
            <button
              onClick={() => setShowTags(!showTags)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <TagIcon size={14} />
                Tags & Deep Search
                {(data.tags?.length || 0) > 0 && (
                  <span className="bg-rose-100 text-rose-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {data.tags.length}
                  </span>
                )}
              </span>
              <ChevronDown size={16} className={`transition ${showTags ? 'rotate-180' : ''}`} />
            </button>

            {showTags && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {/* Selected tag chips */}
                {(data.tags?.length || 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-gray-200">
                    {data.tags.map((tagName: string) => (
                      <span
                        key={tagName}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        #{tagName}
                        <button
                          type="button"
                          onClick={() => removeTag(tagName)}
                          className="hover:opacity-70"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {tags.map(tag => (
                    <label key={tag.id} className="flex items-center gap-2 cursor-pointer hover:bg-white px-1.5 py-1 rounded transition">
                      <input
                        type="checkbox"
                        checked={(data.tags || []).includes(tag.name)}
                        onChange={() => handleTagToggle(tag.name)}
                        className="w-3.5 h-3.5 text-rose-500 rounded border-gray-300 focus:ring-rose-400"
                      />
                      <span className="text-xs text-gray-700">{tag.name}</span>
                    </label>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No tags available</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogSidebar;
