/**
 * URL Parser & Security Validator for Social Media Inputs
 */

export const SUPPORTED_PLATFORMS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'X / Twitter',
  'Reddit',
  'Threads',
  'Pinterest',
  'Facebook',
] as const;

export type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

/**
 * Checks if a hostname matches a target domain or is a valid subdomain.
 * e.g., 'www.instagram.com' or 'instagram.com' matches 'instagram.com'.
 * 'evil.com' or 'instagram.com.evil.com' does NOT match.
 */
export function matchesDomain(hostname: string, targetDomain: string): boolean {
  if (!hostname || !targetDomain) return false;
  const h = hostname.toLowerCase().trim();
  const t = targetDomain.toLowerCase().trim();
  return h === t || h.endsWith('.' + t);
}

/**
 * Comprehensive check for harmful URI schemes, XSS vectors, malicious payloads,
 * private/loopback/metadata IP ranges, and dangerous executable file extensions.
 */
export function checkHarmfulInput(raw: string): { isHarmful: boolean; reason?: string } {
  if (!raw || typeof raw !== 'string') return { isHarmful: false };
  const trimmed = raw.trim();

  // 1. Dangerous or non-http URI schemes
  if (/^(javascript|data|file|blob|vbscript|about|chrome|view-source|intent|ws|wss):/i.test(trimmed)) {
    return {
      isHarmful: true,
      reason: 'Harmful or unsafe link scheme blocked.',
    };
  }

  // 2. Script injection, HTML injection, or XSS patterns
  if (
    /<[^>]*script/i.test(trimmed) ||
    /<\/?(iframe|object|embed|svg|img|link|meta|style|form|input|button)/i.test(trimmed) ||
    /onerror\s*=/i.test(trimmed) ||
    /onload\s*=/i.test(trimmed) ||
    /javascript:/i.test(trimmed) ||
    /eval\s*\(/i.test(trimmed) ||
    /alert\s*\(/i.test(trimmed) ||
    /document\.(cookie|location)/i.test(trimmed) ||
    /window\.(location|navigate)/i.test(trimmed)
  ) {
    return {
      isHarmful: true,
      reason: 'Harmful script or payload detected and blocked.',
    };
  }

  // 3. Null bytes or URL-encoded control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed) || /%00|%0d|%0a/i.test(trimmed)) {
    return {
      isHarmful: true,
      reason: 'Harmful control characters detected and blocked.',
    };
  }

  // 4. Executable or binary file extensions (malware prevention)
  if (/\.(exe|bat|cmd|sh|apk|msi|dll|vbs|ps1|scr|jar|pif|reg|bin|dmg|iso)(\?.*)?$/i.test(trimmed)) {
    return {
      isHarmful: true,
      reason: 'Dangerous executable file link blocked.',
    };
  }

  // 5. Hostname & IP checks (SSRF and local network protection)
  try {
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
    const parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();

    // Loopback / Localhost
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '[::1]' ||
      host === '::1'
    ) {
      return {
        isHarmful: true,
        reason: 'Local or internal network address blocked.',
      };
    }

    // Cloud metadata endpoints (AWS, GCP, Azure: 169.254.169.254)
    if (host === '169.254.169.254' || host === 'metadata.google.internal') {
      return {
        isHarmful: true,
        reason: 'Internal cloud metadata address blocked.',
      };
    }

    // Private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, etc.)
    if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)/.test(host)) {
      return {
        isHarmful: true,
        reason: 'Private network address blocked.',
      };
    }

    // Pathname check for executables
    if (/\.(exe|bat|cmd|sh|apk|msi|dll|vbs|ps1|scr|jar|pif|reg|bin|dmg|iso)$/i.test(parsed.pathname)) {
      return {
        isHarmful: true,
        reason: 'Dangerous executable file link blocked.',
      };
    }
  } catch {
    // If it cannot be parsed as a URL, it's not a dangerous network address
  }

  return { isHarmful: false };
}

/**
 * Validates whether the given URL belongs to one of the 8 supported social media platforms.
 * Uses strict hostname parsing to prevent domain-spoofing and query string bypasses.
 */
export function getSocialPlatform(url: string): SupportedPlatform | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Add https:// scheme if missing for reliable URL parsing
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
  let parsed: URL;
  try {
    parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  // Must use standard web protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  const host = parsed.hostname.toLowerCase();

  // Hostname must contain at least one dot (reject plain words like "test", "myvideo")
  if (!host.includes('.')) return null;

  // 1. Instagram: instagram.com, instagr.am
  if (matchesDomain(host, 'instagram.com') || matchesDomain(host, 'instagr.am')) {
    return 'Instagram';
  }

  // 2. TikTok: tiktok.com (handles www, vm, vt, m subdomains)
  if (matchesDomain(host, 'tiktok.com')) {
    return 'TikTok';
  }

  // 3. YouTube: youtube.com, youtu.be (handles www, m, music subdomains)
  if (matchesDomain(host, 'youtube.com') || matchesDomain(host, 'youtu.be')) {
    return 'YouTube';
  }

  // 4. X / Twitter: x.com, twitter.com, t.co
  if (matchesDomain(host, 'x.com') || matchesDomain(host, 'twitter.com') || matchesDomain(host, 't.co')) {
    return 'X / Twitter';
  }

  // 5. Reddit: reddit.com, redd.it (handles www, old, v, i, sh subdomains)
  if (matchesDomain(host, 'reddit.com') || matchesDomain(host, 'redd.it')) {
    return 'Reddit';
  }

  // 6. Threads: threads.net, threads.com
  if (matchesDomain(host, 'threads.net') || matchesDomain(host, 'threads.com')) {
    return 'Threads';
  }

  // 7. Pinterest: pin.it, pinimg.com, or any regional pinterest.* domain (pinterest.com, pinterest.co.uk, etc.)
  if (
    matchesDomain(host, 'pin.it') ||
    matchesDomain(host, 'pinimg.com') ||
    /^([a-z0-9-]+\.)?pinterest\.[a-z.]+$/i.test(host)
  ) {
    return 'Pinterest';
  }

  // 8. Facebook: facebook.com, fb.watch, fb.com
  if (matchesDomain(host, 'facebook.com') || matchesDomain(host, 'fb.watch') || matchesDomain(host, 'fb.com')) {
    return 'Facebook';
  }

  return null;
}

export function isSocialMediaUrl(url: string): boolean {
  return getSocialPlatform(url) !== null;
}

export interface ValidationResult {
  isValid: boolean;
  isHarmful: boolean;
  errorMessage?: string;
  cleanUrl?: string;
  platform?: SupportedPlatform;
}

/**
 * Validates user input before allowing paste or submit in the link paste bar.
 * Distinguishes between:
 * 1. Harmful links (XSS, scripts, local IPs, executables) -> BLOCKED
 * 2. Plain text (words, sentences, search queries) -> BLOCKED
 * 3. Unsupported links (Google, Amazon, personal sites) -> BLOCKED
 * 4. Valid social media links (Instagram, TikTok, YouTube, etc.) -> ALLOWED
 */
export function validateSocialMediaInput(raw: string): ValidationResult {
  if (!raw || typeof raw !== 'string') {
    return {
      isValid: false,
      isHarmful: false,
      errorMessage: 'Please enter a valid social media link.',
    };
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      isValid: false,
      isHarmful: false,
      errorMessage: 'Please enter a valid social media link.',
    };
  }

  // 1. Harmful link or payload check
  const harmfulCheck = checkHarmfulInput(trimmed);
  if (harmfulCheck.isHarmful) {
    return {
      isValid: false,
      isHarmful: true,
      errorMessage: harmfulCheck.reason || 'Harmful or unsafe link blocked.',
    };
  }

  // 2. Reject inputs that have spaces within a single URL candidate (plain text / sentence)
  if (trimmed.includes(' ') && !trimmed.includes('\n')) {
    return {
      isValid: false,
      isHarmful: false,
      errorMessage: 'Text detected. Only social media links can be pasted in this bar.',
    };
  }

  // 3. Parse as URL
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed);
  let parsed: URL;
  try {
    parsed = new URL(hasScheme ? trimmed : `https://${trimmed}`);
  } catch {
    return {
      isValid: false,
      isHarmful: false,
      errorMessage: 'Text detected. Only social media links can be pasted in this bar.',
    };
  }

  const host = parsed.hostname.toLowerCase();

  // If host has no dot or contains invalid characters, it's not a URL
  if (!host.includes('.')) {
    return {
      isValid: false,
      isHarmful: false,
      errorMessage: 'Text detected. Only social media links can be pasted in this bar.',
    };
  }

  // 4. Check if host matches supported social media platforms
  const platform = getSocialPlatform(trimmed);
  if (!platform) {
    return {
      isValid: false,
      isHarmful: false,
      errorMessage:
        'Only social media links (Instagram, TikTok, YouTube, X, Reddit, Threads, Pinterest, Facebook) are supported.',
    };
  }

  const cleanUrl = hasScheme ? trimmed : `https://${trimmed}`;

  return {
    isValid: true,
    isHarmful: false,
    cleanUrl,
    platform,
  };
}

/**
 * Extracts and strictly validates multiple social media URLs (for multi-URL paste / textarea).
 * Strips out text and unsupported links, blocks harmful payloads.
 */
export function extractAndValidateSocialUrls(text: string): {
  validUrls: string[];
  skippedCount: number;
  hasHarmful: boolean;
  harmfulReason?: string;
} {
  if (!text || typeof text !== 'string') {
    return { validUrls: [], skippedCount: 0, hasHarmful: false };
  }

  // Check for general harmful payload in full text
  const generalHarmful = checkHarmfulInput(text);
  if (generalHarmful.isHarmful) {
    return {
      validUrls: [],
      skippedCount: 0,
      hasHarmful: true,
      harmfulReason: generalHarmful.reason,
    };
  }

  // Split lines
  const lines = text
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const validUrls: string[] = [];
  let skippedCount = 0;
  let detectedHarmful = false;
  let harmfulReason = '';

  for (const line of lines) {
    // If a line contains whitespace, split tokens
    const tokens = line.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      const hCheck = checkHarmfulInput(token);
      if (hCheck.isHarmful) {
        detectedHarmful = true;
        harmfulReason = hCheck.reason || 'Harmful link detected.';
        skippedCount++;
        continue;
      }

      const val = validateSocialMediaInput(token);
      if (val.isValid && val.cleanUrl) {
        if (!validUrls.includes(val.cleanUrl)) {
          validUrls.push(val.cleanUrl);
        }
      } else {
        skippedCount++;
      }
    }
  }

  return {
    validUrls,
    skippedCount,
    hasHarmful: detectedHarmful && validUrls.length === 0,
    harmfulReason,
  };
}

/**
 * Extracts URLs from raw text.
 */
export const extractUrls = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
};

/**
 * Platform detector utilizing secure hostname matching.
 */
export const detectPlatform = (url: string): string => {
  const platform = getSocialPlatform(url);
  if (platform) return platform;

  // Fallback for direct media
  const lower = url.toLowerCase();
  if (lower.match(/\.(mp4|webm|mp3|wav|jpg|jpeg|png|webp|gif|avif)(\?|$)/i)) return 'Direct Media';
  return 'Direct URL';
};
