export {
  getSession,
  seal,
  unseal,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/entities/viewer/model/session";
export type { Session } from "@/entities/viewer/model/session";

export { fetchViewerIdentity } from "@/entities/viewer/api/fetch-viewer-identity";
