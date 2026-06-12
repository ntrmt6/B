import { useState } from "react";

interface ColorProps {
    images?: string[];
    selectedIndex?: number;
    onColorChange?: (index: number) => void;
}

export default function Color({ images = [], selectedIndex: externalIndex, onColorChange }: ColorProps) {
    const [internalIndex, setInternalIndex] = useState<number>(0);
    const selectedIndex = externalIndex !== undefined ? externalIndex : internalIndex;

    if (images.length === 0) return null;

    const handleSelect = (index: number) => {
        setInternalIndex(index);
        onColorChange?.(index);
    };

    return (
        <div className="w-full">
            <h2 className="mb-3 text-[16px] font-lato font-normal text-black leading-[125%]">Colour</h2>
            <div className="flex gap-2">
                {images.slice(0, 4).map((img, index) => (
                    <button
                        key={index}
                        onClick={() => handleSelect(index)}
                        className={`relative h-[60px] w-[60px] overflow-hidden rounded-sm transition-all duration-200`}
                    >
                        <img
                            src={img}
                            alt={`Color ${index + 1}`}
                            className="object-cover w-full h-full absolute inset-0"
                        />
                        {selectedIndex === index && (
                            <div className="absolute left-1 top-1">
                                <img
                                    src='https://details-snit.vercel.app/images/check.svg'
                                    alt="check"
                                    width={12}
                                    height={12}
                                />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
