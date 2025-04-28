import React, { useCallback, useEffect, useState } from "react";
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

  const collectionsWithProducts = await Promise.all(collectionIds.map(async ({ collection_id }) => {
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

  const getAllCollections = await admin.graphql(
    `#graphql
    query getAllCollections {
      collections(first: 20) {
        edges {
          node {
            id
            title
            image {
              url
              altText
            }
          }
        }
      }
    }
    `
  );

  const allCollectionJson = await getAllCollections.json()
  const allCollections = allCollectionJson.data.collections.edges.map(edge => edge.node)

  return { collectionsWithProducts, allCollections }
};

const MemoizedModal = React.memo(Modal)
const MemoizedMobileView = React.memo(MobileView)
const MemoizedTextarea = React.memo(Textarea)

export default function Index() {
  const {collectionsWithProducts, allCollections} = useLoaderData();

  const [parsedData, setParsedData] = useState({});
  const [data, setData] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedEl, setSelectedEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/data');
      if (!response.ok) throw new Error('Failed to fetch data');

      const jsonData = await response.json();

      setData(JSON.stringify(jsonData, null, 2))
      setParsedData(jsonData)
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [])

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let timeout = setTimeout(() => {
      try {
        const parsed = JSON.parse(data);
        setParsedData(parsed);
      } catch (err) {
        console.error('Error parsing JSON:', err.message);
      }
    }, 300); 
  
    return () => clearTimeout(timeout);
  }, [data]);

  const handleUpdate = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:5000/api/data/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home_page: parsedData.home_page }),
      });
      if (!response.ok) throw new Error('Failed to update home page');

      await response.json();
      window.location.reload();
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [parsedData]);

  const handleSelect = useCallback((item, itemEl, mainEl) => {
    setSelectedItem(item);
    setSelectedEl(itemEl || mainEl);
  }, []);

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
              <MemoizedTextarea data={data} setData={setData} />
            </BlockStack>
          </Layout.Section>

          {/* Modal Section */}
          <Layout.Section variant="oneThird">
            <MemoizedModal
              item={selectedItem}
              itemEl={selectedEl}
              onClick={handleSelect}
              location_list={parsedData?.location_list}
              setParsedData={setParsedData}
              setSelectedItem={setSelectedItem}
              allCollections={allCollections}
            />
          </Layout.Section>

          {/* Mobile Preview Section */}
          <Layout.Section variant="oneThird">
            <MemoizedMobileView
              data={parsedData}
              onSelect={handleSelect}
              collections={collectionsWithProducts}
            />
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}