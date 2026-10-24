import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * The renderer opens pages that came from users, so it must not become a way to reach the internal
 * network (databases, the API, cloud metadata). Every request is checked against the address its host
 * resolves to. Hosts listed in ALLOWED_PRIVATE_HOSTS may be private on purpose, e.g. a local staging
 * server. A DNS answer can change between this check and the browser's own lookup; the container also
 * runs on its own network, which is the second line of defence.
 */
const PRIVATE_IPV4_RANGES = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

function ipv4ToNumber(address) {
  return address.split('.').reduce((total, part) => total * 256 + Number(part), 0);
}

function isPrivateIpv4(address) {
  const value = ipv4ToNumber(address);

  return PRIVATE_IPV4_RANGES.some(([base, bits]) => {
    const size = 2 ** (32 - bits);
    const start = ipv4ToNumber(base);

    return value >= start && value < start + size;
  });
}

export function isPrivateAddress(address) {
  if (net.isIPv4(address)) {
    return isPrivateIpv4(address);
  }

  const normalized = address.toLowerCase();
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);

  if (mapped) {
    return isPrivateIpv4(mapped[1]);
  }

  return normalized === '::' || normalized === '::1' || /^f[cd]/.test(normalized) || /^fe[89ab]/.test(normalized);
}

export function createNetworkGuard({ allowedPrivateHosts = [], lookup = dns.lookup } = {}) {
  const allowed = new Set(allowedPrivateHosts.map((host) => host.trim().toLowerCase()).filter(Boolean));
  const cache = new Map();

  async function isBlockedHost(hostname) {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

    if (allowed.has(host)) {
      return false;
    }

    if (net.isIP(host)) {
      return isPrivateAddress(host);
    }

    if (!cache.has(host)) {
      cache.set(
        host,
        lookup(host, { all: true })
          .then((records) => records.length === 0 || records.some((record) => isPrivateAddress(record.address)))
          .catch(() => true),
      );
    }

    return cache.get(host);
  }

  /** True when the browser may load this URL. Only http(s), data and blob URLs are ever allowed. */
  async function isAllowedUrl(rawUrl) {
    let url;

    try {
      url = new URL(rawUrl);
    } catch {
      return false;
    }

    if (url.protocol === 'data:' || url.protocol === 'blob:') {
      return true;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    return !(await isBlockedHost(url.hostname));
  }

  return { isAllowedUrl, isBlockedHost };
}
