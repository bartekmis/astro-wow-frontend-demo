import { wpQuery, isMissingFieldError } from "./wp";
import { GET_PAGE_BY_URI, GET_PAGE_BY_URI_BASIC } from "./queries";
import type { PageData, WpPage } from "./types";

let bridgeAvailable: boolean | null = null;

/**
 * Fetch a Page by URI. Tries the full query (with Carbon Fields sections);
 * if the bridge mu-plugin isn't deployed yet, falls back to a basic query
 * that omits sectionsJson/headerJson.
 */
export async function loadPage(uri: string): Promise<WpPage | null> {
  if (bridgeAvailable !== false) {
    try {
      const { nodeByUri } = await wpQuery<PageData>(GET_PAGE_BY_URI, { uri });
      bridgeAvailable = true;
      return nodeByUri;
    } catch (err) {
      if (!isMissingFieldError(err)) throw err;
      bridgeAvailable = false;
      console.warn(
        "[wp] Carbon Fields bridge not detected on WordPress. " +
          "Deploy backend/web/app/mu-plugins/wpgraphql-carbon-fields.php to render sections.",
      );
    }
  }

  const { nodeByUri } = await wpQuery<PageData>(GET_PAGE_BY_URI_BASIC, { uri });

  if (nodeByUri) {
    nodeByUri.sectionsJson = null;
    nodeByUri.headerJson = null;
  }

  return nodeByUri;
}
