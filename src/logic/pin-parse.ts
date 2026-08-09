/**
 * docs/decisions/0002. Parsing only -- no network I/O. Fetching a URL
 * to verify it, or calling a hosting provider's API, is the consuming
 * application's business logic (which provider, which auth, which
 * rate limits), not this library's concern (docs/decisions/0010).
 *
 * GitHub-only at this pass -- a real limitation, not an oversight.
 */

const COMMIT_URL_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/commit\/([0-9a-f]{7,40})\/?$/i;
const PR_URL_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/i;
const REPO_URL_RE = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/i;

export function parseCommitUrl(url: string): { owner: string; repo: string; sha: string } | null {
  const m = COMMIT_URL_RE.exec(url.trim());
  if (!m) return null;
  return { owner: m[1], repo: m[2], sha: m[3] };
}

export function parseMergedPrUrl(url: string): { owner: string; repo: string; prNumber: number } | null {
  const m = PR_URL_RE.exec(url.trim());
  if (!m) return null;
  return { owner: m[1], repo: m[2], prNumber: Number(m[3]) };
}

export function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const m = REPO_URL_RE.exec(url.trim());
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}
