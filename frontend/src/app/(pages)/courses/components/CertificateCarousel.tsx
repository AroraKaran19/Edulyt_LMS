import React from "react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Image from "next/image";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const CertificateCarousel = () => {
  const certificates = [
    "/course-certificates/certificate-1.svg",
    "/course-certificates/certificate-2.svg",
    "/course-certificates/certificate-3.svg",
    "/course-certificates/certificate-4.svg",
  ];

  return (
    <Swiper
      pagination={{
        type: "fraction",
      }}
      autoplay={{
        delay: 2500,
        disableOnInteraction: false,
      }}
      navigation={true}
      modules={[Pagination, Navigation, Autoplay]}
      className="mySwiper !h-full bg-white pb-2 rounded-2xl"
      style={
        {
          "--swiper-navigation-color": "#F77124",
          "--swiper-navigation-hover-color": "#F77124",
        } as React.CSSProperties
      }
    >
      {certificates.map((certificate, index) => (
        <SwiperSlide key={index} className="relative h-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <Zoom>
              <Image
                src={certificate}
                alt="Certificate"
                width={100}
                height={100}
                className="w-max mx-auto object-contain select-none max-h-[570px] bg-white"
              />
            </Zoom>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
};

export default CertificateCarousel;
