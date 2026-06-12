
import { useState } from "react";

import { Swiper, SwiperSlide } from "swiper/react";
import { Thumbs } from "swiper/modules";

import "swiper/css";
import "swiper/css/thumbs";
import { Product } from "../../@types/IProduct.type";

export default function ImageMain({ product }: { product: Product }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

    return (
        <div className="lg:basis-1/2 flex-shrink-0 mb-4 lg:mb-0 min-w-0">
            {/* MAIN IMAGE */}
            <div className="bg-gray-200 rounded-2xl aspect-square overflow-hidden mb-3 relative">
                <Swiper
                    modules={[Thumbs]}
                    thumbs={{
                        swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
                    }}
                    spaceBetween={12}
                    className="h-full w-full"
                    grabCursor
                >
                    {product?.images?.map((img: string, i: number) => (
                        <SwiperSlide key={i}>
                            <img
                                src={img}
                                width={800}
                                height={800}
                                alt={product?.title || "product"}
                                className="w-full h-full object-cover"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* THUMBNAILS */}
            <Swiper
                modules={[Thumbs]}
                onSwiper={setThumbsSwiper}
                spaceBetween={8}
                slidesPerView={4}
                watchSlidesProgress
                className="w-full"
            >
                {product?.images?.map((img: string, i: number) => (
                    <SwiperSlide key={i}>
                        <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-200">
                            <img
                                src={img}
                                alt={`thumb-${i}`}
                                width={200}
                                height={200}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
