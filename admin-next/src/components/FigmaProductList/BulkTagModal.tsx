import React, { useState, useMemo } from 'react';
import { Search, Tag, X } from 'lucide-react';

interface TagItem {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
}

interface BulkTagModalProps {
  selectedCount: number;
  availableTags: TagItem[];
  onApply: (tagNames: string[]) => void;
  onClose: () => void;
}

const BulkTagModal: React.FC<BulkTagModalProps> = ({
  selectedCount,
  availableTags,
  onApply,
  onClose,
}) => {
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const activeTags = useMemo(
    () => availableTags.filter(t => t.status === 'Active'),
    [availableTags]
  );

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return activeTags;
    const q = searchQuery.toLowerCase();
    return activeTags.filter(t => t.name.toLowerCase().includes(q));
  }, [activeTags, searchQuery]);

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.has(tagName) ? next.delete(tagName) : next.add(tagName);
      return next;
    });
  };

  const handleApply = () => {
    if (selectedTags.size === 0) return;
    onApply(Array.from(selectedTags));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 xxs:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 xxs:p-4 sm:p-6 w-full max-w-[350px] xxs:max-w-[420px] shadow-2xl">
        <div className="flex items-center justify-between mb-3 xxs:mb-4">
          <h3 className="text-base xxs:text-lg font-semibold dark:text-white flex items-center gap-2">
            <Tag size={18} />
            Assign Tags
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs xxs:text-sm text-gray-600 dark:text-gray-400 mb-3 xxs:mb-4">
          Assign tags to {selectedCount} selected product{selectedCount > 1 ? 's' : ''}
        </p>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="w-full h-9 xxs:h-10 border dark:border-gray-600 rounded-lg pl-8 pr-3 text-xs xxs:text-sm outline-none focus:border-[#ff6a00] bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Selected tags chips */}
        {selectedTags.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Array.from(selectedTags).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 bg-[#ff6a00]/10 text-[#ff6a00] px-2 py-1 rounded-full text-xs font-medium"
              >
                {tag}
                <button onClick={() => toggleTag(tag)} className="hover:text-[#e55d00]">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Tag list */}
        <div className="max-h-[200px] overflow-y-auto border dark:border-gray-600 rounded-lg">
          {filteredTags.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-400">No tags found</div>
          ) : (
            filteredTags.map(tag => (
              <label
                key={tag.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0 dark:border-gray-600"
              >
                <input
                  type="checkbox"
                  checked={selectedTags.has(tag.name)}
                  onChange={() => toggleTag(tag.name)}
                  className="rounded border-gray-300 text-[#ff6a00] focus:ring-[#ff6a00]"
                />
                <span className="text-xs xxs:text-sm dark:text-gray-200">{tag.name}</span>
              </label>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-3 xxs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={selectedTags.size === 0}
            className="px-3 xxs:px-4 py-1.5 xxs:py-2 text-xs xxs:text-sm bg-[#ff6a00] text-white rounded-lg hover:bg-[#e55d00] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign {selectedTags.size > 0 ? `(${selectedTags.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkTagModal;
