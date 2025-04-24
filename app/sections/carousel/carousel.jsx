import { useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Text } from '@shopify/polaris';

import styles from './carousel.module.css';

const Carousel = ({ items}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'start' });

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.reInit();
  }, [emblaApi, items]); 

  return (
    <div className={`${styles.embla} carousel`} ref={emblaRef}>
      <div className={styles.embla__container}>
        {items.map((item, index) => (
          <div
            key={index}
            className={`item ${styles.embla__slide}`}
            {...Object.entries(item).reduce((acc, [key, value]) => {
              acc[`data-${key}`] = value;
              return acc;
            }, {})}
          >
            <div className={styles.imageWrapper}>
              <img src={item.src} alt={item.label} className={styles.image} />
            </div>
            <Text variant="bodyXs" alignment="center" fontWeight='bold'>
              {item.label}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;


