export type ProductImageGalleryProps = {
  variant: "single" | "gallery";
  mainImageSrc: string;
  mainImageAlt: string;
  discountLabel?: string;
  iconSrc?: string;
  galleryImages?: { src: string; alt: string }[];
  outerClassVariant: string;
  innerContainerClass: string;
  selectedImageIndex?: number;
  onThumbnailHover?: (index: number) => void;
  onThumbnailClick?: (index: number) => void;
  onMainImageClick?: () => void;
};

export const ProductImageGallery = (props: ProductImageGalleryProps) => {
  if (props.variant === "single") {
    return (
      <div
        className="group/zoom cursor-zoom-in relative border border-neutral-200 rounded-2xl overflow-hidden bg-white"
        onClick={props.onMainImageClick}
      >
        <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
          <img
            alt={props.mainImageAlt}
            src={props.mainImageSrc}
            className="w-full h-full object-contain p-2 sm:p-4 transition-transform duration-300 group-hover/zoom:scale-110 rounded-2xl"
          />
        </div>
        {/* Zoom icon overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/zoom:opacity-100 transition-opacity duration-200 pointer-events-none rounded-2xl">
          <div className="bg-black/40 rounded-full p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zm-6-3v6m-3-3h6" />
            </svg>
          </div>
        </div>
        {props.discountLabel && (
          <div className="absolute top-3 left-3 text-green-600 text-[11px] font-extrabold bg-green-100 px-2.5 py-1 rounded-md">
            {props.discountLabel}
          </div>
        )}
        {props.iconSrc && (
          <button className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-white transition-colors" onClick={(e) => e.stopPropagation()}>
            <img src={props.iconSrc} alt="Icon" className="h-5 w-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {props.galleryImages &&
          props.galleryImages.map((image, index) => (
            <div
              key={index}
              onMouseEnter={() => props.onThumbnailHover?.(index)}
              onClick={() => props.onThumbnailClick?.(index)}
              className={`cursor-pointer flex-shrink-0 w-[65px] h-[65px] sm:w-[75px] sm:h-[75px] overflow-hidden rounded-xl border-2 transition-all duration-150 ${
                props.selectedImageIndex === index
                  ? 'border-lime-500 shadow-md'
                  : 'border-gray-200 hover:border-lime-300'
              }`}
            >
              <img
                alt={image.alt}
                src={image.src}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
      </div>
    </div>
  );
};
