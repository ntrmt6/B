import { useState } from "react";

interface SizeProps {
    sizes?: string[];
    selectedSize?: string;
    onSizeChange?: (size: string) => void;
}

export default function Size({ sizes = [], selectedSize: externalSelected, onSizeChange }: SizeProps) {
    const [internalSelected, setInternalSelected] = useState<string>(sizes[0] || "");
    const selectedSize = externalSelected !== undefined ? externalSelected : internalSelected;

    if (sizes.length === 0) return null;

    const handleSelect = (size: string) => {
        setInternalSelected(size);
        onSizeChange?.(size);
    };

    return (
        <div className="w-full">
            <h2 className="mb-3 text-[16px] font-lato font-normal text-black leading-[125%]">Size</h2>
            <div className="flex items-center gap-4">
                {sizes.map((size) => (
                    <button
                        key={size}
                        onClick={() => handleSelect(size)}
                        className="flex items-center gap-2"
                    >
                        <div className={`flex h-6 w-6 font-lato items-center justify-center rounded-full border transition-all duration-200 border-black`}>
                            {selectedSize === size && (
                                <span className="text-sm font-bold text-black">&#10003;</span>
                            )}
                        </div>
                        <span className="text-[12px] font-medium font-lato text-black">{size}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
