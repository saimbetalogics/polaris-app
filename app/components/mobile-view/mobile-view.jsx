import { useRef } from 'react';
import { BlockStack } from '@shopify/polaris';

import Banner from '../../sections/banner/banner';
import Carousel from '../../sections/carousel/carousel';
import Heading from '../../sections/heading/heading';
import Topbar from '../../sections/topbar/topbar';
import ProductCarousel from '../../sections/product-carousel/product-carousel';
import Main from '../main';

import { getElementData } from '../../utils/get-element-data';

import styles from './mobile-view.module.css';

const MobileView = ({data, onSelect, collections = [] }) => {
  const home_page = data.home_page;
  const containerRef = useRef(null);

  function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
  }

  const filteredKeys = ['type', 'text', 'onClick', 'id'];

  function styleProps(section) {
    return Object.entries(section).reduce((acc, [key, value]) => {
      if (filteredKeys.includes(key)) return acc;

      if (Array.isArray(value) && key === 'background-color') {
        acc['background'] = `linear-gradient(${value.join(", ")})`;
      } else {
        acc[toCamelCase(key)] = value;
      }
      return acc;
    }, {});
  }

  const handleContainerClick = (e) => {
    const item = e.target.closest('.item');
    const main = e.target.closest('.main');

    if (item) {
      const parentMain = item.closest('.main');
      const itemData = getElementData(item);
      onSelect?.(itemData, item, parentMain);
    } else if (main) {
      const parentMain = main.closest('.main');
      const mainData = getElementData(main);
      onSelect?.(mainData, main, parentMain);
    }
  };

  return (
    <div ref={containerRef} className={styles.mobile_view} onClick={handleContainerClick}>
      <BlockStack gap="300">
        {home_page?.map((section, index) => {
          const matchedCollection = collections.find(
            (c) => c.id === `gid://shopify/Collection/${section.collection_id}`
          );

          return (
            <Main key={index} attributes={section} uniqueId={index}>
              {section.type === 'topbar' && <Topbar text={section.text} />}
              {section.type === 'carousel' && <Carousel items={section.images} />}
              {section.type === 'banner' && <Banner items={section.images} />}
              {section.type === 'heading' && <Heading title={section.text} style={styleProps(section)} />}
              {section.type === 'product_carousel' && (
                <ProductCarousel products={matchedCollection?.products || []} />
              )}
            </Main>
          );
        })}
      </BlockStack>
    </div>
  );
};

export default MobileView;