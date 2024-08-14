/**
 * Splat route to fix 404 FOUC/hydration errors.
 *
 * @link {@see https://github.com/remix-run/remix/discussions/5186#discussioncomment-4748778}
 */

import { json } from "@vercel/remix";

/**
 * Create a response receiving a JSON object with the status code 404.
 * @example
 * export async function loader({ request, params }: LoaderArgs) {
 *   let user = await getUser(request);
 *   if (!db.exists(params.id)) throw notFound<BoundaryData>({ user });
 * }
 */
function notFound<T = unknown>(data: T, init?: Omit<ResponseInit, "status">) {
  return json<T>(data, { ...init, status: 404 });
}

export async function loader() {
  throw notFound(null);
}

export default function NotFound() {
  return null;
}
