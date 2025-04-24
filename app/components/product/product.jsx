import 'keen-slider/keen-slider.min.css'

import styles from './product.module.css'
import { BlockStack, Text } from '@shopify/polaris'

const Product = ({ data }) => {
  const url = data.media.edges[0]?.node?.preview.image.url
  const price = data.variants.edges[0].node.price ?? 'N/A'

  return (
    <div className={`keen-slider__slide ${styles.product}`}>
      <div>
        <img src={url} alt="" className={styles.product_img} />
      </div>
      <BlockStack>
        <Text>{data.title}</Text>
        <Text fontWeight='bold'>{price}</Text>
      </BlockStack>
    </div>
  )
}

export default Product