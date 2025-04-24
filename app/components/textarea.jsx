const Textarea = ({ data, setData }) => {
  return <textarea
    value={data}
    onChange={value => setData(value.target.value)}
    style={{ width: '100%', height: '100%', borderRadius: "8px", whiteSpace: "pre", background: 'black', color: '#8f9d6a' }}
    rows={31}
  />
}

export default Textarea