import { BlockStack, InlineGrid, Text, TextField } from "@shopify/polaris"

const CollectionModal = ({
  selectedCollectionId,
  collectionSearchTerm,
  setCollectionSearchTerm,
  filteredCollectionsOrProducts,
  toggleCollectionSelection
}) => {
  return (
    <BlockStack gap="400">
      <TextField
        placeholder="Search"
        value={collectionSearchTerm}
        onChange={setCollectionSearchTerm}
      />

      <div style={{ minHeight: "100px", width: "100%" }}>
        {filteredCollectionsOrProducts.length > 0 ? (
          <InlineGrid columns={{ sm: 6 }} gap="100">
            {filteredCollectionsOrProducts.map((item) => (
              <div
                key={item.id}
                style={{
                  borderRadius: '10px',
                  border: selectedCollectionId.includes(item.id)
                    ? '1px solid #000000'
                    : '1px solid lightgray',
                  position: 'relative',
                  cursor: 'pointer',
                  padding: '8px',
                  backgroundColor: 'white',
                }}
                onClick={() => toggleCollectionSelection(item.id)}
              >
                <img
                  src={item.image?.url || item.media?.edges[0]?.node?.preview?.image?.url || "https://placehold.co/500x500?text=No+Image"}
                  alt={item.image?.altText || item.media?.edges[0]?.node?.preview?.image?.altText || `Image`}
                  width="100%"
                  style={{ borderRadius: "10px", objectFit: "cover" }}
                />
                {selectedCollectionId.includes(item.id) && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      backgroundColor: "#000000",
                      color: "#fff",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    ✓
                  </div>
                )}
                <Text alignment="center" fontWeight="medium">
                  {item.title}
                </Text>
              </div>
            ))}
          </InlineGrid>
        ) : (
          <Text alignment="center">{`No Found`}</Text>
        )}
      </div>
    </BlockStack>
  )
}

export default CollectionModal