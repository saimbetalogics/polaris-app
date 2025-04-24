const Main = ({ attributes, children }) => {
  const dataAttributes = Object.entries(attributes).reduce((acc, [key, value]) => {
    if (key !== 'images') {
      acc[`data-${key}`] = value
    }
    return acc;
  }, {})

  return (
    <div {...dataAttributes} className={`main`}>
      {children}
    </div>
  )
}

export default Main