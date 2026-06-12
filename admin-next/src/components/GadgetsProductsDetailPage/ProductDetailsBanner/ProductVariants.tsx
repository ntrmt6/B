interface ProductVariantsProps {
  variantGroups: Array<{
    title: string;
    isMandatory?: boolean;
    options: Array<{ attribute: string; extraPrice: number; image?: string }>;
  }>;
  selectedVariants: Record<string, string>;
  onVariantSelect: (groupTitle: string, attribute: string) => void;
}

export const ProductVariants = ({ variantGroups, selectedVariants, onVariantSelect }: ProductVariantsProps) => {
  return (
    <>
      {variantGroups.map((group) => (
        <div key={group.title} className="items-center box-border caret-transparent gap-x-2.5 flex flex-wrap gap-y-2.5 my-[15px]">
          <p className="text-zinc-500 text-sm font-semibold box-border caret-transparent min-h-[auto] min-w-[auto]">
            {group.title}:
          </p>
          {group.options.map((option) => {
            const isSelected = selectedVariants[group.title] === option.attribute;
            return (
              <div key={option.attribute} className="box-border caret-transparent min-h-[auto] min-w-[auto]">
                <button
                  onClick={() => onVariantSelect(group.title, option.attribute)}
                  className={`relative text-black/60 text-[15px] items-center bg-white caret-transparent gap-x-[5px] flex justify-start gap-y-[5px] text-center border px-2.5 py-1.5 rounded-[3px] ${isSelected ? 'border-lime-500' : 'border-black/10'} hover:border-lime-500`}
                >
                  {option.image && (
                    <picture className="items-center box-border caret-transparent flex min-h-[auto] min-w-[auto]">
                      <img
                        alt={option.attribute}
                        src={option.image}
                        className="box-border caret-transparent h-6 min-h-[auto] min-w-[auto] object-contain align-baseline w-6"
                      />
                    </picture>
                  )}
                  {option.attribute}{" "}
                  {isSelected && (
                    <span className="absolute text-white bottom-[-3px] box-border caret-transparent z-[1] -right-px">
                      ✓
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
};
