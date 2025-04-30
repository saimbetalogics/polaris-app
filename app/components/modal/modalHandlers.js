import { getElementData } from "../../utils/get-element-data";

export const duplicateSelectedItem = (selectedElement, setParsedData, onItemSelect) => {
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
};

export const removeSelectedItem = (selectedElement, setParsedData, onItemSelect) => {
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
}

export const saveItemChanges = (selectedElement, formData, setParsedData, onItemSelect) => {
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
}

export const handleImageUpload = async (imageUrl, setFormData, setImageUrl, setIsImageModalOpen) => {
  if (!imageUrl || !imageUrl.url) return;

  if (typeof imageUrl.url === 'string') {
    setFormData((prev) => ({ ...prev, src: imageUrl.url }));
    setIsImageModalOpen(false);
    return;
  }

  const formData = new FormData();
  formData.append('image', imageUrl.url);

  try {
    const res = await fetch('http://localhost:5000/api/image/upload', {
      method: 'POST',
      body: formData,
    });

    const { url, error } = await res.json();

    if (res.ok) {
      setImageUrl({ url });
      setFormData((prev) => ({ ...prev, src: url }));
      setIsImageModalOpen(false);
    } else {
      console.error('Upload failed:', error);
    }
  } catch (err) {
    console.error('Upload error:', err);
  }
};
