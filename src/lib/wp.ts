const endpoint = import.meta.env.WP_GRAPHQL_URL;

if (!endpoint) {
  throw new Error("WP_GRAPHQL_URL is not set. Copy .env.example to .env.");
}

export type GraphQLError = { message: string };

export class WpQueryError extends Error {
  constructor(public errors: GraphQLError[]) {
    super(`WPGraphQL errors: ${errors.map((e) => e.message).join(", ")}`);
  }
}

export async function wpQuery<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`WPGraphQL ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data?: T; errors?: GraphQLError[] };

  if (json.errors?.length) {
    throw new WpQueryError(json.errors);
  }

  if (!json.data) {
    throw new Error("WPGraphQL returned no data");
  }

  return json.data;
}

/**
 * True when a GraphQL error means a queried field doesn't exist on the schema -
 * usually because the wpgraphql-carbon-fields mu-plugin isn't deployed yet.
 */
export function isMissingFieldError(err: unknown): boolean {
  return err instanceof WpQueryError && err.errors.some((e) => /Cannot query field/.test(e.message));
}

export function rewriteWpUrl(url: string | null | undefined): string {
  if (!url) return "/";
  const wpHome = import.meta.env.WP_PUBLIC_URL;
  if (wpHome && url.startsWith(wpHome)) {
    return url.slice(wpHome.length) || "/";
  }
  return url;
}
