import { Text } from '@shopify/polaris'

import styles from './banner.module.css'

const Banner = ({ items }) => {
  return (
    <div className={styles.banner}>
      {
        items?.map((item, index) => (
          <div 
            className={`item ${styles.banner_item}`} 
            key={index}
            {...Object.entries(item).reduce((acc, [key, value]) => {
              acc[`data-${key}`] = value;
              return acc;
            }, {})}
          >
            <img src={item.src} alt="An image" />
            {item.label ? <Text fontWeight='bold'>{item.label}</Text> : null}
          </div>
        ))
      }
    </div>
  )
}

export default Banner
