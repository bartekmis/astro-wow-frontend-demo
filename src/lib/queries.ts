const MENU_FIELDS = /* GraphQL */ `
  fragment MenuFields on Menu {
    name
    slug
    menuItems(first: 100) {
      nodes {
        id
        label
        url
        path
        target
        parentId
      }
    }
  }
`;

export const GET_LAYOUT = /* GraphQL */ `
  ${MENU_FIELDS}
  query GetLayout {
    generalSettings {
      title
      description
      url
    }
    primary: menus(where: { slug: "primary-menu" }, first: 1) {
      nodes { ...MenuFields }
    }
    footerProducts: menus(where: { slug: "footer-products" }, first: 1) {
      nodes { ...MenuFields }
    }
    footerCompany: menus(where: { slug: "footer-company" }, first: 1) {
      nodes { ...MenuFields }
    }
  }
`;

export const GET_PAGE_SLUGS = /* GraphQL */ `
  query GetPageSlugs {
    pages(first: 200, where: { status: PUBLISH }) {
      nodes {
        uri
        isFrontPage
      }
    }
  }
`;

const PAGE_BASE_FIELDS = /* GraphQL */ `
  fragment PageBaseFields on Page {
    id
    databaseId
    title
    uri
    isFrontPage
    featuredImage {
      node {
        sourceUrl
        altText
        mediaDetails {
          width
          height
        }
      }
    }
  }
`;

/** Used when the wpgraphql-carbon-fields bridge is active. */
export const GET_PAGE_BY_URI = /* GraphQL */ `
  ${PAGE_BASE_FIELDS}
  query GetPageByUri($uri: String!) {
    nodeByUri(uri: $uri) {
      __typename
      ... on Page {
        ...PageBaseFields
        sectionsJson
        headerJson
      }
    }
  }
`;

/** Fallback: bridge mu-plugin not deployed yet. */
export const GET_PAGE_BY_URI_BASIC = /* GraphQL */ `
  ${PAGE_BASE_FIELDS}
  query GetPageByUriBasic($uri: String!) {
    nodeByUri(uri: $uri) {
      __typename
      ... on Page {
        ...PageBaseFields
      }
    }
  }
`;
