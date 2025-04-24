import useEmblaCarousel from 'embla-carousel-react';

import Product from "../../components/product/product";
import styles from "./product-carousel.module.css";
import { useEffect } from 'react';

const ProductCarousel = ({ products, onApi }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    slidesToScroll: 1,
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  useEffect(() => {
    if (emblaApi && onApi) {
      onApi(emblaApi);
    }
  }, [emblaApi, onApi]);


  return (
    <div ref={emblaRef} className={`${styles.product_carousel} embla ${styles.embla}`}>
      <div className={`embla__container ${styles.embla__container}`} style={{ display: 'flex' }}>
        {products.map((product) => (
          <div
            key={product.title}
            className={`embla__slide ${styles.embla__slide}`}
            style={{ flex: '0 0 45%', paddingRight: '10px' }}
          >
            <Product data={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;