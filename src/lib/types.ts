export type MenuItem = {
  id: string;
  label: string;
  url: string;
  path: string;
  target: string | null;
  parentId: string | null;
};

export type Menu = {
  name: string;
  slug: string;
  menuItems: { nodes: MenuItem[] };
};

export type GeneralSettings = {
  title: string;
  description: string;
  url: string;
};

export type LayoutData = {
  generalSettings: GeneralSettings;
  primary: { nodes: Menu[] };
  footerProducts: { nodes: Menu[] };
  footerCompany: { nodes: Menu[] };
};

export type WpImage = {
  sourceUrl: string;
  altText: string | null;
  mediaDetails: { width: number; height: number } | null;
};

/** Output of the bridge mu-plugin (resolve_image()). */
export type ResolvedImage = {
  url: string;
  alt: string;
  width: number;
  height: number;
};

export type ResolvedButton = {
  title?: string;
  url?: string;
  style?: string | number;
  is_open_in?: string | number;
  style_class?: string;
  target?: "_blank" | "_self";
};

export type SectionData = Record<string, unknown>;

export type Section = {
  type: string;
  data: SectionData;
};

export type WpPage = {
  __typename: "Page";
  id: string;
  databaseId: number;
  title: string;
  uri: string;
  isFrontPage: boolean;
  sectionsJson: string | null;
  headerJson: string | null;
  featuredImage: { node: WpImage } | null;
};

export type PageData = {
  nodeByUri: WpPage | null;
};
