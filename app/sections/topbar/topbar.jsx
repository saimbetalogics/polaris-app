import styles from './topbar.module.css'

const Topbar = ({ text }) => {
  return (
    <div className={`${styles.topbar}`}>
      <div className={styles.scroll}>{text}</div>
    </div>
  )
}

export default Topbar