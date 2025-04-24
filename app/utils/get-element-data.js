export const getElementData = (element) => {
  return Object.fromEntries(
    Array.from(element.attributes)
      .filter((attr) => attr.name.startsWith('data-') && attr.name !== 'data-temp_id')
      .map((attr) => [attr.name.replace('data-', ''), attr.value])
  );
};