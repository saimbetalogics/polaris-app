import { useEffect, useState } from "react";
import {
  Page,
  Layout,
  BlockStack,
  Text,
  InlineStack,
  Button,
  Spinner,
} from "@shopify/polaris";
import { PlayIcon } from "@shopify/polaris-icons"
import { useLoaderData } from "@remix-run/react";

import MobileView from "../components/mobile-view/mobile-view";
import Modal from "../components/modal/modal";
import Textarea from "../components/textarea";

import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await fetch('http://localhost:5000/api/data');

  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }

  const data = await response.json();
  const homePage = data.home_page || []

  const collectionIds = homePage
    .filter(section => section.type === 'product_carousel')
    .map(section => ({ collection_id: `gid://shopify/Collection/${section.collection_id}` }))

  const collections = await Promise.all(collectionIds.map(async ({ collection_id }) => {
    const res = await admin.graphql(
      `#graphql
      query getCollectionProducts($id: ID!) {
        collection(id: $id) {
          id
          title
          products(first: 10) {
            edges {
              node {
                id
                title
                media(first: 1) {
                  edges {
                    node {
                      preview {
                        image {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
                variants(first: 1) {
                  edges {
                    node {
                      price
                    }
                  }
                }
              }
            }
          }
        }
      }`,
      { variables: { id: collection_id } }
    );
    const json = await res.json();
    const c = json.data.collection;

    return {
      id: c.id,
      title: c.title,
      products: c.products.edges.map(edge => edge.node)
    };
  }))

  return collections
};

export default function Index() {
  const collections = useLoaderData();

  const [data, setData] = useState('');
  const [parsedData, setParsedData] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedEl, setSelectedEl] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    try {
      const response = await fetch('http://localhost:5000/api/data');

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const jsonData = await response.json();
      const freshData = JSON.stringify(jsonData, null, 2);

      const container = document.querySelector('.mobile_view');
      if (container) {
        container.innerHTML = '';
      }

      setData(freshData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    try {
      const parsed = JSON.parse(data);
      setParsedData(parsed);
    } catch (err) {
      console.error('Error parsing JSON:', err);
    }
  }, [data]);

  async function handleUpdate() {
    const outputData = { home_page: [] };

    document.querySelectorAll('.main').forEach((mainEl) => {
      const itemData = getAttributes(mainEl);
      const imagesData = [];

      mainEl.querySelectorAll('.item').forEach((itemEl) => {
        const imageData = getAttributes(itemEl);
        imagesData.push(imageData);
      });

      if (imagesData.length) {
        itemData.images = imagesData;
      }

      outputData.home_page.push(itemData);
    });

    try {
      setLoading(true);

      const currentData = typeof data === 'string' ? JSON.parse(data) : data;
      const newData = {
        ...currentData,
        home_page: outputData.home_page,
      };

      const response = await fetch('http://localhost:5000/api/data/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ home_page: newData.home_page }),
      });

      if (!response.ok) {
        throw new Error('Failed to update home page');
      }

      await response.json()

      window.location.reload();
    } catch (err) {
      console.error('Failed to update home page:', err);
    } finally {
      setLoading(false);
    }
  }

  function getAttributes(element) {
    const data = {};
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-')) {
        let key = attr.name.replace('data-', '');
        let value = attr.value || '';

        if (key === 'background-color') {
          value = value.includes(',') ? value.split(',').map((c) => c.trim()) : [value];
        } else if (key === 'font-size') {
          value = Number(value);
        }

        if (key !== 'slick-index') {
          data[key] = value;
        }
      }
    });

    return data;
  }

  const handleSelect = (item, itemEl, mainEl) => {
    setSelectedItem(item);
    setSelectedEl(itemEl || mainEl);
  };

  return (
    <Page fullWidth>
      <BlockStack gap="500">
        <Layout>

          {/* JSON Editor Section */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd">JSON Editor</Text>
                <Button
                  variant="primary"
                  icon={!loading && PlayIcon}
                  onClick={handleUpdate}
                  disabled={loading}
                >
                  {loading ? <Spinner size="small" /> : 'Update'}
                </Button>
              </InlineStack>
              <Textarea data={data} setData={setData} />
            </BlockStack>
          </Layout.Section>

          {/* Modal Section */}
          <Layout.Section variant="oneThird">
            <Modal
              item={selectedItem}
              itemEl={selectedEl}
              onClick={handleSelect}
              location_list={parsedData?.location_list}
              setParsedData={setParsedData}
              setSelectedItem={setSelectedItem}
            />
          </Layout.Section>

          {/* Mobile Preview Section */}
          <Layout.Section variant="oneThird">
            <MobileView
              data={parsedData}
              onSelect={handleSelect}
              collections={collections}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}