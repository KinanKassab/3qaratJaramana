import React, { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, FreeMode } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import type { PropertyImage } from '@shared/types/app.types';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';

interface PropertyImageSliderProps {
  images: PropertyImage[];
  title: string;
}

export function PropertyImageSlider({ images, title }: PropertyImageSliderProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);

  const sorted = [...images].sort((a, b) => {
    if (a.is_cover) return -1;
    if (b.is_cover) return 1;
    return a.sort_order - b.sort_order;
  });

  if (images.length === 0) {
    return (
      <div className="w-full h-80 bg-gradient-to-br from-dark-200 to-dark-300 dark:from-dark-700 dark:to-dark-600 rounded-2xl flex items-center justify-center">
        <span className="text-6xl">🏠</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main slider */}
      <Swiper
        modules={[Navigation, Pagination, Thumbs]}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        navigation
        pagination={{ clickable: true }}
        loop={sorted.length > 1}
        className="rounded-2xl overflow-hidden"
        style={{ height: '400px' }}
      >
        {sorted.map((img) => (
          <SwiperSlide key={img.id}>
            <img
              src={img.url}
              alt={title}
              className="w-full h-full object-cover"
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <Swiper
          modules={[FreeMode, Thumbs]}
          onSwiper={setThumbsSwiper}
          spaceBetween={8}
          slidesPerView={5}
          freeMode
          watchSlidesProgress
          breakpoints={{
            640: { slidesPerView: 6 },
            1024: { slidesPerView: 7 },
          }}
          className="thumbs-swiper"
        >
          {sorted.map((img) => (
            <SwiperSlide key={img.id} className="cursor-pointer rounded-lg overflow-hidden opacity-60 [&.swiper-slide-thumb-active]:opacity-100">
              <img src={img.url} alt="" className="w-full h-16 object-cover" />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}
