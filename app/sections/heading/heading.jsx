import { Text } from "@shopify/polaris"

import styles from "./heading.module.css"

const Heading = ({ title, style }) => {
  return <div className={`${styles.heading}`} style={style}>
    <Text variant="headingMd" fontWeight="medium">{title}</Text>
  </div>
}

export default Heading