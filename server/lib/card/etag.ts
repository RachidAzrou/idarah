import { createHash } from 'crypto';

/**
 * Generate a stable ETag for card data
 * The ETag changes when any visible card information changes
 * Used for cache invalidation and client-side updates
 */
export function makeCardETag(
  memberData: {
    id: string;
    firstName: string;
    lastName: string;
    memberNumber: string;
    category: string;
    votingRights: boolean;
  },
  tenantBranding: {
    name: string;
    logoUrl: string | null;
    primaryColor: string;
  },
  cardStatus: string,
  validUntil: Date | null,
  badges: string[],
  version?: number
): string {
  // Create a deterministic string representation of all card data
  const cardDataString = JSON.stringify({
    member: {
      id: memberData.id,
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      memberNumber: memberData.memberNumber,
      category: memberData.category,
      votingRights: memberData.votingRights,
    },
    tenant: {
      name: tenantBranding.name,
      logoUrl: tenantBranding.logoUrl,
      primaryColor: tenantBranding.primaryColor,
    },
    status: cardStatus,
    validUntil: validUntil?.toISOString() || null,
    badges: badges.sort(), // Sort badges for consistent ordering
    version: version || 1,
    // Include timestamp rounded to hour to force refresh periodically
    timeGroup: Math.floor(Date.now() / (1000 * 60 * 60)),
  });
  
  // Generate SHA-256 hash and take first 12 characters
  const hash = createHash('sha256')
    .update(cardDataString)
    .digest('hex')
    .substring(0, 12);
  
  return `"${hash}"`;
}

/**
 * Generate a simple version-based ETag
 * Useful for simple incrementing version tracking
 */
export function makeVersionETag(version: number): string {
  return `"v${version}"`;
}

/**
 * Generate ETag based on last modified timestamp
 */
export function makeTimestampETag(lastModified: Date): string {
  const timestamp = lastModified.getTime();
  const hash = createHash('sha256')
    .update(timestamp.toString())
    .digest('hex')
    .substring(0, 12);
  
  return `"${hash}"`;
}

/**
 * Extract version number from version-based ETag
 */
export function parseVersionFromETag(etag: string): number | null {
  const match = etag.match(/^"v(\d+)"$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Check if ETag indicates a weak validator (W/ prefix)
 */
export function isWeakETag(etag: string): boolean {
  return etag.startsWith('W/');
}

/**
 * Create a weak ETag (for content that changes frequently)
 */
export function makeWeakETag(content: string): string {
  const hash = createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 12);
  
  return `W/"${hash}"`;
}

/**
 * Compare two ETags for equality
 * Handles both strong and weak validators
 */
export function compareETags(etag1: string, etag2: string): boolean {
  // Remove W/ prefix for weak validators
  const clean1 = etag1.replace(/^W\//, '');
  const clean2 = etag2.replace(/^W\//, '');
  
  return clean1 === clean2;
}