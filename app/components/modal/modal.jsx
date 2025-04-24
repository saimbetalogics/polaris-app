import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Divider,
  InlineStack,
  Select,
  TextField,
} from '@shopify/polaris';
import { ArrowLeftIcon, DeleteIcon, DuplicateIcon, EditIcon, XIcon } from '@shopify/polaris-icons';

import { getElementData } from '../../utils/get-element-data';

const Modal = ({ item = {}, itemEl, onClick, location_list = [], setParsedData }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    setFormData(item);
  }, [item]);

  useEffect(() => {
    const clearBorders = () => {
      document.querySelectorAll('.main, .item').forEach((el) => {
        el.style.border = 'none';
      });
    };

    clearBorders();

    if (itemEl) {
      itemEl.style.border = '2px solid #3b82f6';
      itemEl.style.borderRadius = '5px';
    } else if (item && Object.keys(item).length) {
      const selector = Object.entries(item)
        .map(([key, val]) => `[data-${key}="${val}"]`)
        .join('');
      const mainEl = document.querySelector(`.main${selector}`);
      if (mainEl) {
        mainEl.style.border = '2px solid #3b82f6';
        mainEl.style.borderRadius = '5px';
      }
    }

    return clearBorders;
  }, [itemEl, item]);

  const locationOptions = useMemo(
    () =>
      location_list.map((loc) => ({
        label: loc.toUpperCase(),
        value: loc,
      })),
    [location_list]);

  const handleChange = useCallback(
    (key) => (value) => setFormData((prev) => ({ ...prev, [key]: value })), []);

  const handleDuplicate = useCallback(() => {
    if (!itemEl) return;

    const isItem = itemEl.classList.contains('item');
    const mainEl = itemEl.closest('.main');
    if (!mainEl) return;

    const itemData = getElementData(itemEl);

    setParsedData((prev) => {
      const newData = structuredClone(prev);

      if (!newData.home_page) return prev;

      // Important: Get correct section index based on DOM
      const allMainEls = Array.from(document.querySelectorAll('.main'));
      const domSectionIndex = allMainEls.indexOf(mainEl);

      if (domSectionIndex === -1) return prev;

      const section = newData.home_page[domSectionIndex];

      if (isItem && Array.isArray(section.images)) {
        const clickedItemIndex = section.images.findIndex((img) =>
          Object.entries(itemData).every(
            ([key, val]) => String(img?.[key] ?? '') === String(val ?? '')
          )
        );

        if (clickedItemIndex !== -1) {
          const newItem = { ...section.images[clickedItemIndex] };
          section.images.splice(clickedItemIndex + 1, 0, newItem);

          // Select the newly duplicated item
          setTimeout(() => {
            const allItems = mainEl.querySelectorAll('.item');
            const newSelectedEl = allItems[clickedItemIndex + 1];
            if (newSelectedEl) {
              newSelectedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              onClick?.(getElementData(newSelectedEl), newSelectedEl, mainEl);
            }
          }, 0);
        }
      } else {
        // Duplicate the entire main section
        const newMain = structuredClone(section);
        newData.home_page.splice(domSectionIndex + 1, 0, newMain);

        // Select the newly duplicated section
        setTimeout(() => {
          const allMains = document.querySelectorAll('.main');
          const newSelectedMain = allMains[domSectionIndex + 1];
          if (newSelectedMain) {
            newSelectedMain.scrollIntoView({ behavior: 'smooth', block: 'center' });
            onClick?.(getElementData(newSelectedMain), null, newSelectedMain);
          }
        }, 0);
      }

      return newData;
    });

  }, [itemEl, setParsedData, onClick]);

  const handleRemove = useCallback(() => {
    if (!itemEl) return;

    const isItem = itemEl.classList.contains('item');
    const mainEl = itemEl.closest('.main');
    if (!mainEl) return;

    const allMainEls = Array.from(document.querySelectorAll('.main'));
    const sectionIndex = allMainEls.indexOf(mainEl);

    if (sectionIndex === -1) return;

    setParsedData(prev => {
      const newData = structuredClone(prev);

      if (!Array.isArray(newData.home_page)) return prev;
      if (!newData.home_page[sectionIndex]) return prev;

      const section = newData.home_page[sectionIndex];

      if (isItem && Array.isArray(section.images)) {
        const allItems = mainEl.querySelectorAll('.item');
        const itemIndex = Array.from(allItems).indexOf(itemEl);

        if (itemIndex !== -1) {
          section.images.splice(itemIndex, 1);
        }

        // If no images left, remove whole section
        if (section.images.length === 0) {
          newData.home_page.splice(sectionIndex, 1);
        }
      } else {
        // Remove the entire section
        newData.home_page.splice(sectionIndex, 1);
      }

      return newData;
    });

    onClick?.(null, null, null);

  }, [itemEl, setParsedData, onClick]);

  const handleBackClick = useCallback(() => {
    if (!itemEl) return;

    if (itemEl.classList.contains('main')) return;

    const mainEl = itemEl.closest('.main');
    if (!mainEl) return;

    const parentData = getElementData(mainEl);
    onClick?.(parentData, null, mainEl);
  }, [itemEl, onClick]);

  const handleCancel = useCallback(() => {
    onClick?.(null, null, null);
    document.querySelectorAll('.main, .item').forEach((el) => {
      el.style.border = 'none';
    });
  }, [onClick]);


  const handleModify = useCallback(() => {
    if (!itemEl) return;
    const mainEl = itemEl.closest('.main');
    if (!mainEl) return;

    // 1) Figure out which section number this is:
    const allMainEls = Array.from(document.querySelectorAll('.main'));
    const sectionIndex = allMainEls.indexOf(mainEl);
    if (sectionIndex === -1) return;

    // 2) Build new data with a deep clone:
    setParsedData(prev => {
      const newData = JSON.parse(JSON.stringify(prev));
      const section = newData.home_page[sectionIndex];

      if (itemEl.classList.contains('item') && Array.isArray(section.images)) {
        // 3a) We're in an image: find the right item index
        const allItems = Array.from(mainEl.querySelectorAll('.item'));
        const itemIndex = allItems.indexOf(itemEl);
        if (itemIndex === -1) return prev;

        // 4a) Overwrite just that image
        section.images[itemIndex] = {
          ...section.images[itemIndex],
          ...formData,
        };
      } else {
        // 3b) We're modifying the whole section
        newData.home_page[sectionIndex] = {
          ...section,
          ...formData,
        };
      }

      return newData;
    });

    // 5) Now sync the DOM attributes & callback
    Object.entries(formData).forEach(([key, value]) => {
      itemEl.setAttribute(`data-${key}`, value);
      // …and update <img> or <p> etc. exactly as you already do…
    });

    const updatedData = getElementData(itemEl);
    onClick?.(updatedData, itemEl, mainEl);
  }, [itemEl, formData, setParsedData, onClick]);


  if (!item && !itemEl) {
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
    <BlockStack gap="300">
      <InlineStack align="space-between">
        <Button
          icon={ArrowLeftIcon}
          onClick={handleBackClick}
          disabled={itemEl?.classList.contains('main')}
        />
        <ButtonGroup>
          <Button variant="primary" icon={DuplicateIcon} onClick={handleDuplicate}>
            Duplicate
          </Button>
          <Button variant="primary" tone="critical" icon={DeleteIcon} onClick={handleRemove}>
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
                onChange={handleChange(key)}
                placeholder="Select location type"
              />
            ) : (
              <TextField
                key={key}
                label={key.replace(/[_,-]/g, ' ').toUpperCase()}
                value={value}
                onChange={handleChange(key)}
                placeholder={`Enter ${key}`}
                autoComplete="off"
              />
            )
          )}
      </BlockStack>

      <ButtonGroup>
        <Button variant="primary" icon={EditIcon} onClick={handleModify}>
          Modify
        </Button>
        <Button icon={XIcon} onClick={handleCancel}>
          Cancel
        </Button>
      </ButtonGroup>
    </BlockStack>
  );
};

export default Modal;

// const handleModify = () => {
//   if (!itemEl) return;

//   const mainEl = itemEl.closest('.main');
//   if (!mainEl) return;

//   // YEH dekho -- oldData capture karo BEFORE modifying DOM
//   const oldItemData = getElementData(itemEl);
//   const oldMainData = getElementData(mainEl);

//   // 1. Ab DOM me data-attributes set karo
//   Object.entries(formData).forEach(([key, value]) => {
//     itemEl.setAttribute(`data-${key}`, value);
//   });

//   Object.entries(formData).forEach(([key, value]) => {
//     if (key === 'label') {
//       const p = itemEl.querySelector('p');
//       if (p) p.textContent = value;
//     } else if (key === 'src') {
//       const img = itemEl.querySelector('img');
//       if (img) img.src = value;
//     } else if (key === 'title') {
//       const img = itemEl.querySelector('img');
//       const p = itemEl.querySelector('p');
//       if (img) img.alt = value;
//       if (p) p.textContent = value.length > 15 ? value.slice(0, 15) + '...' : value;
//     } else {
//       const el = itemEl.querySelector(`.${key}`);
//       if (!el) return;

//       const tag = el.tagName.toLowerCase();
//       if (tag === 'img') {
//         el.src = value;
//       } else if (tag === 'a') {
//         el.href = value;
//         el.textContent = value;
//       } else {
//         el.textContent = value;
//       }
//     }
//   });

//   // 2. Now parsedData me update karo using oldItemData
//   setParsedData((prev) => {
//     const newData = structuredClone(prev);

//     const sectionIndex = newData.home_page.findIndex(sec => sec.type === oldMainData.type);
//     if (sectionIndex === -1) return prev;

//     const section = newData.home_page[sectionIndex];

//     if (itemEl.classList.contains('item')) {
//       const itemIndex = section.images?.findIndex(img =>
//         Object.entries(oldItemData).every(([key, val]) => String(img?.[key] ?? '') === String(val ?? ''))
//       );

//       if (itemIndex !== -1) {
//         section.images[itemIndex] = { ...section.images[itemIndex], ...formData };
//       }
//     } else {
//       // Main section update
//       newData.home_page[sectionIndex] = { ...section, ...formData };
//     }

//     return newData;
//   });

//   // 3. Callback
//   const updatedData = getElementData(itemEl);
//   onClick?.(updatedData, itemEl, mainEl);
// };


// const handleRemove = useCallback(() => {
//   if (!itemEl?.remove) {
//     console.warn('itemEl not removable');
//     return;
//   }

//   const prevItemEl = itemEl.previousElementSibling;

//   itemEl.remove();

//   if (prevItemEl) {
//     const prevItemData = getElementData(prevItemEl);
//     const mainEl = prevItemEl.closest('.main');
//     onClick?.(prevItemData, prevItemEl, mainEl);
//   } else {
//     onClick?.(null, null, null);
//   }
// }, [itemEl, onClick]);
