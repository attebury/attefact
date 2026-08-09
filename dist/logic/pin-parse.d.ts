/**
 * docs/decisions/0002. Parsing only -- no network I/O. Fetching a URL
 * to verify it, or calling a hosting provider's API, is the consuming
 * application's business logic (which provider, which auth, which
 * rate limits), not this library's concern (docs/decisions/0010).
 *
 * GitHub-only at this pass -- a real limitation, not an oversight.
 */
export declare function parseCommitUrl(url: string): {
    owner: string;
    repo: string;
    sha: string;
} | null;
export declare function parseMergedPrUrl(url: string): {
    owner: string;
    repo: string;
    prNumber: number;
} | null;
export declare function parseRepoUrl(url: string): {
    owner: string;
    repo: string;
} | null;
