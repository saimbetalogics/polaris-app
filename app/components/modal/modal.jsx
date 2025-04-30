import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BlockStack, Box, Button, ButtonGroup, Divider, InlineStack, Select, TextField, Modal as PolarisModal
} from '@shopify/polaris';
import { ArrowLeftIcon, DeleteIcon, DuplicateIcon, EditIcon, XIcon } from '@shopify/polaris-icons';

import ImageModal from '../image-modal/image-modal';
import CollectionModal from '../collection-modal';

import { getElementData } from '../../utils/get-element-data';
import { duplicateSelectedItem, handleImageUpload, removeSelectedItem, saveItemChanges } from './modalHandlers';

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
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
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
      <PolarisModal
        open={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false)
          setImageUrl(null)
        }}
        title="Image"
        primaryAction={{
          content: 'Update',
          onAction: () => handleImageUpload(imageUrl, setFormData, setImageUrl, setIsImageModalOpen),
          disabled: !imageUrl
        }}
        secondaryActions={[
          {
            content: 'Cancel',
            onAction: () => {
              setImageUrl(null)
              setIsImageModalOpen(false)
            },
          },
        ]}
      >
        <PolarisModal.Section>
          <ImageModal image={imageUrl} setImage={setImageUrl} />
        </PolarisModal.Section>
      </PolarisModal>

      <PolarisModal
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
        <PolarisModal.Section>
          <CollectionModal
            selectedCollectionId={selectedCollectionId}
            collectionSearchTerm={collectionSearchTerm}
            setCollectionSearchTerm={setCollectionSearchTerm}
            toggleCollectionSelection={toggleCollectionSelection}
            filteredCollectionsOrProducts={filteredCollectionsOrProducts}
          />
        </PolarisModal.Section>
      </PolarisModal>

      <BlockStack gap="300">
        <InlineStack align="space-between">
          <Button
            icon={ArrowLeftIcon}
            onClick={navigateToParentItem}
            disabled={selectedElement?.classList.contains('main')}
          />
          <ButtonGroup>
            <Button variant="primary" icon={DuplicateIcon} onClick={() => duplicateSelectedItem(selectedElement, setParsedData, onItemSelect)}>
              Duplicate
            </Button>
            <Button variant="primary" tone="critical" icon={DeleteIcon} onClick={() => removeSelectedItem(selectedElement, setParsedData, onItemSelect)}>
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
              ) : key === 'src' ? (
                <TextField
                  key={key}
                  label={key.replace(/[_,-]/g, ' ').toUpperCase()}
                  value={value}
                  onFocus={() => setIsImageModalOpen(true)}
                  placeholder={`Enter ${key}`}
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
          <Button variant="primary" icon={EditIcon} onClick={() => saveItemChanges(selectedElement, formData, setParsedData, onItemSelect)}>
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