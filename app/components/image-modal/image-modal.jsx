import { useState, useCallback } from 'react';
import { DropZone, Image, Button, TextField, BlockStack } from '@shopify/polaris';
import { DeleteIcon } from '@shopify/polaris-icons';

import styles from './image-modal.module.css';

const ImageModal = ({ image, setImage }) => {
  const [urlInput, setUrlInput] = useState('')

  const handleDrop = useCallback((_droppedFiles, acceptedFiles) => {
    const newFile = acceptedFiles?.[0];
    if (newFile) {
      setImage({ url: newFile });
    }
  }, []);

  const handleUrlSave = () => {
    if (urlInput) {
      setImage({ url: urlInput });
    }
  };

  const isValidImageUrl = (url) => {
    try {
      const parsed = new URL(url);
      return (
        parsed.protocol === 'https:' &&
        /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)$/i.test(parsed.pathname)
      );
    } catch {
      return false;
    }
  };

  if (image) {
    return (
      <div
        key={image.id}
        className={styles.mediaItem}
        style={{ gridColumn: '1 / span 2', gridRow: '1 / span 2' }}
      >
        <div className={styles.mediaOverlay}>
          <div className={styles.deleteButton}>
            <Button
              size="micro"
              icon={DeleteIcon}
              tone="critical"
              onClick={() => setImage(null)}
            />
          </div>
        </div>
        <Image
          source={typeof image.url === 'string' ? image.url : URL.createObjectURL(image.url)}
          width="100%"
          height="100%"
          alt="Media image"
          className={styles.image}
        />
      </div>
    );
  }

  return (
    <BlockStack gap={'500'}>
      <TextField
        placeholder='example: https://placeholder.com/image.jpg'
        value={urlInput}
        onChange={value => setUrlInput(value)}
        connectedRight={
          <Button variant='primary' onClick={handleUrlSave} disabled={!isValidImageUrl(urlInput)} size='large'>
            Choose
          </Button>
        }
      />
      <DropZone accept='image/*' type='image' onDrop={handleDrop}>
        <DropZone.FileUpload />
      </DropZone>
    </BlockStack>
  );
};

export default ImageModal