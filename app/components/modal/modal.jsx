import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BlockStack, Box, Button, ButtonGroup, Divider, InlineStack, Select, TextField, Modal as CollectionModal, Text, InlineGrid,
} from '@shopify/polaris';
import { ArrowLeftIcon, DeleteIcon, DuplicateIcon, EditIcon, XIcon } from '@shopify/polaris-icons';

import { getElementData } from '../../utils/get-element-data';

const Modal = ({
  selectedItem = {},
  selectedElement,
  onItemSelect,
  availableLocations = [],
  setParsedData,
  availableCollections = [],
  availableProducts = []
}) => {
  const [formData, setFormData] = useState({});
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collectionSearchTerm, setCollectionSearchTerm] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [isProductLocation, setIsProductLocation] = useState(false);

  useEffect(() => {
    setFormData(selectedItem);
  }, [selectedItem]);

  useEffect(() => {
    const clearSelectionBorders = () => {
      document.querySelectorAll('.main, .item').forEach((el) => {
        el.style.border = 'none';
      });
    };

    clearSelectionBorders();

    if (selectedElement) {
      selectedElement.style.border = '2px solid #3b82f6';
      selectedElement.style.borderRadius = '5px';
    } else if (selectedItem && Object.keys(selectedItem).length) {
      const selector = Object.entries(selectedItem)
        .map(([key, val]) => `[data-${key}="${val}"]`)
        .join('');
      const mainElement = document.querySelector(`.main${selector}`);
      if (mainElement) {
        mainElement.style.border = '2px solid #3b82f6';
        mainElement.style.borderRadius = '5px';
      }
    }

    return clearSelectionBorders;
  }, [selectedElement, selectedItem]);

  useEffect(() => {
    if (isCollectionModalOpen && formData) {
      if (formData.collection_id) {
        const ids = formData.collection_id
          .split(',')
          .map(id => id.trim())
          .filter(Boolean)
          .map(id => `gid://shopify/Collection/${id}`);
        setSelectedCollectionId(ids);
      }
    }

    if (!isCollectionModalOpen) {
      setSelectedCollectionId('');
    }
  }, [isCollectionModalOpen, formData]);

  const locationOptions = useMemo(
    () =>
      availableLocations.map((location) => ({
        label: location.toUpperCase(),
        value: location,
      })),
    [availableLocations]);

  const handleFormFieldChange = useCallback(
    (fieldName) => (newValue) => setFormData((prev) => ({ ...prev, [fieldName]: newValue })), []);

  const duplicateSelectedItem = useCallback(() => {
    if (!selectedElement) return;

    const isItem = selectedElement.classList.contains('item');
    const parentElement = selectedElement.closest('.main');
    if (!parentElement) return;

    const itemData = getElementData(selectedElement);

    setParsedData((prev) => {
      const newData = structuredClone(prev);

      if (!newData.home_page) return prev;

      const allMainElements = Array.from(document.querySelectorAll('.main'));
      const domSectionIndex = allMainElements.indexOf(parentElement);

      if (domSectionIndex === -1) return prev;

      const section = newData.home_page[domSectionIndex];

      if (isItem && Array.isArray(section.images)) {
        const clickedItemIndex = section.images.findIndex((img) =>
          Object.entries(itemData).every(
            ([key, val]) => String(img?.[key] ?? '') === String(val ?? '')
          ))

        if (clickedItemIndex !== -1) {
          const newItem = { ...section.images[clickedItemIndex] };
          section.images.splice(clickedItemIndex + 1, 0, newItem);

          setTimeout(() => {
            const allItems = parentElement.querySelectorAll('.item');
            const newSelectedElement = allItems[clickedItemIndex + 1];
            if (newSelectedElement) {
              newSelectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              onItemSelect?.(getElementData(newSelectedElement), newSelectedElement, parentElement);
            }
          }, 0);
        }
      } else {
        const newMain = structuredClone(section);
        newData.home_page.splice(domSectionIndex + 1, 0, newMain);

        setTimeout(() => {
          const allMains = document.querySelectorAll('.main');
          const newSelectedMain = allMains[domSectionIndex + 1];
          if (newSelectedMain) {
            newSelectedMain.scrollIntoView({ behavior: 'smooth', block: 'center' });
            onItemSelect?.(getElementData(newSelectedMain), null, newSelectedMain);
          }
        }, 0);
      }

      return newData;
    });
  }, [selectedElement, setParsedData, onItemSelect]);

  const removeSelectedItem = useCallback(() => {
    if (!selectedElement) return;

    const isItem = selectedElement.classList.contains('item');
    const parentElement = selectedElement.closest('.main');
    if (!parentElement) return;

    const allMainElements = Array.from(document.querySelectorAll('.main'));
    const sectionIndex = allMainElements.indexOf(parentElement);

    if (sectionIndex === -1) return;

    setParsedData(prev => {
      const newData = structuredClone(prev);

      if (!Array.isArray(newData.home_page)) return prev;
      if (!newData.home_page[sectionIndex]) return prev;

      const section = newData.home_page[sectionIndex];

      if (isItem && Array.isArray(section.images)) {
        const allItems = parentElement.querySelectorAll('.item');
        const itemIndex = Array.from(allItems).indexOf(selectedElement);

        if (itemIndex !== -1) {
          section.images.splice(itemIndex, 1);
        }

        if (section.images.length === 0) {
          newData.home_page.splice(sectionIndex, 1);
        }
      } else {
        newData.home_page.splice(sectionIndex, 1);
      }

      return newData;
    });

    onItemSelect?.(null, null, null);
  }, [selectedElement, setParsedData, onItemSelect]);

  const navigateToParentItem = useCallback(() => {
    if (!selectedElement) return;

    if (selectedElement.classList.contains('main')) return;

    const parentElement = selectedElement.closest('.main');
    if (!parentElement) return;

    const parentData = getElementData(parentElement);
    onItemSelect?.(parentData, null, parentElement);
  }, [selectedElement, onItemSelect]);

  const cancelSelection = useCallback(() => {
    onItemSelect?.(null, null, null);
    document.querySelectorAll('.main, .item').forEach((el) => {
      el.style.border = 'none';
    });
  }, [onItemSelect]);

  const saveItemChanges = useCallback(() => {
    if (!selectedElement) return;
    const parentElement = selectedElement.closest('.main');
    if (!parentElement) return;

    const allMainElements = Array.from(document.querySelectorAll('.main'));
    const sectionIndex = allMainElements.indexOf(parentElement);
    if (sectionIndex === -1) return;

    setParsedData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const section = newData.home_page[sectionIndex];

      if (selectedElement.classList.contains('item') && Array.isArray(section.images)) {
        const allItems = Array.from(parentElement.querySelectorAll('.item'));
        const itemIndex = allItems.indexOf(selectedElement);
        if (itemIndex === -1) return prev;

        section.images[itemIndex] = {
          ...section.images[itemIndex],
          ...formData,
        };
      } else {
        newData.home_page[sectionIndex] = {
          ...section,
          ...formData,
        };
      }

      return newData;
    });

    Object.entries(formData).forEach(([key, value]) => {
      selectedElement.setAttribute(`data-${key}`, value);
    });

    const updatedData = getElementData(selectedElement);
    onItemSelect?.(updatedData, selectedElement, parentElement);
  }, [selectedElement, formData, setParsedData, onItemSelect]);

  const filteredCollectionsOrProducts = useMemo(() => {
    if (formData) {
      setIsProductLocation(formData.location_type === 'product')
    }
    const items = isProductLocation ? availableProducts : availableCollections;
    if (!collectionSearchTerm) return items;
    const lowercasedSearch = collectionSearchTerm.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(lowercasedSearch)
    );
  }, [availableCollections, availableProducts, formData, collectionSearchTerm, isProductLocation]);

  const toggleCollectionSelection = collectionId => {
    if (selectedCollectionId.includes(collectionId)) {
      setSelectedCollectionId('')
    } else {
      setSelectedCollectionId(collectionId)
    }
  }

  const updateSelectedCollection = () => {
    let updatedCollectionId = '';
    if (selectedCollectionId) {
      updatedCollectionId = selectedCollectionId.split('/').pop()
    }

    handleFormFieldChange('collection_id')(updatedCollectionId);

    setIsCollectionModalOpen(false);
    setCollectionSearchTerm('');
    setSelectedCollectionId('')
  }

  if (!selectedItem && !selectedElement) {
    return (
      <Box padding="600">
        <div
          style={{
            height: '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Select an item or row
        </div>
      </Box>
    );
  }

  return (
    <>
      <CollectionModal
        open={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        title="Collections"
        primaryAction={{
          content: 'Update',
          onAction: updateSelectedCollection,
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => {
              setIsCollectionModalOpen(false)
              setCollectionSearchTerm('')
            },
          },
        ]}
      >
        <CollectionModal.Section>
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
        </CollectionModal.Section>
      </CollectionModal>

      <BlockStack gap="300">
        <InlineStack align="space-between">
          <Button
            icon={ArrowLeftIcon}
            onClick={navigateToParentItem}
            disabled={selectedElement?.classList.contains('main')}
          />
          <ButtonGroup>
            <Button variant="primary" icon={DuplicateIcon} onClick={duplicateSelectedItem}>
              Duplicate
            </Button>
            <Button variant="primary" tone="critical" icon={DeleteIcon} onClick={removeSelectedItem}>
              Remove
            </Button>
          </ButtonGroup>
        </InlineStack>

        <Divider borderColor="border" />

        <BlockStack gap="300">
          {formData &&
            Object.entries(formData).map(([key, value]) =>
              key === 'location_type' ? (
                <Select
                  key={key}
                  label="LOCATION TYPE"
                  options={locationOptions}
                  value={value}
                  onChange={handleFormFieldChange(key)}
                  placeholder="Select location type"
                />
              ) : key === 'collection_id' ? (
                <TextField
                  key={key}
                  label={isProductLocation ? 'PRODUCT ID' : 'COLLECTION ID'}
                  value={value}
                  onFocus={() => setIsCollectionModalOpen(true)}
                  placeholder="Click to select collection"
                  autoComplete="off"
                />
              ) : (
                <TextField
                  key={key}
                  label={key.replace(/[_,-]/g, ' ').toUpperCase()}
                  value={value}
                  onChange={handleFormFieldChange(key)}
                  placeholder={`Enter ${key}`}
                  autoComplete="off"
                />
              )
            )}
        </BlockStack>

        <ButtonGroup>
          <Button variant="primary" icon={EditIcon} onClick={saveItemChanges}>
            Modify
          </Button>
          <Button icon={XIcon} onClick={cancelSelection}>
            Close
          </Button>
        </ButtonGroup>
      </BlockStack>
    </>
  );
};

export default Modal;