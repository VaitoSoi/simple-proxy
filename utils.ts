import net from 'node:net';

function ipv4ToInt(ip: string) {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    return parts.reduce((acc, p) => (acc << 8) + (parseInt(p, 10) & 0xFF), 0) >>> 0;
}

function cidrContainsIPv4(cidr: string, ipInt: number) {
    const [net, bitsStr] = cidr.split('/');
    const maskBits = parseInt(bitsStr!, 10);
    const netInt = ipv4ToInt(net!);
    if (netInt === null) return false;
    if (maskBits === 0) return true;
    const mask = maskBits === 32 ? 0xFFFFFFFF >>> 0 : ((0xFFFFFFFF << (32 - maskBits)) >>> 0);
    return (netInt & mask) === (ipInt & mask);
}

function ipv6ToBigInt(addr: string) {
    if (addr.includes('.')) {
        const last = addr.split(':').pop()!;
        const ipv4 = last.includes('.') ? last : null;
        if (ipv4) {
            const ipv4int = ipv4ToInt(ipv4)!;
            const high = (ipv4int >>> 16) & 0xffff;
            const low = ipv4int & 0xffff;
            addr = addr.replace(/(.+:)?([^:]+\.[^:]+)$/, `$1${high.toString(16)}:${low.toString(16)}`);
        }
    }

    const parts = addr.split('::');
    let left = [], right = [];
    if (parts.length === 2) {
        left = parts[0] === '' ? [] : parts[0]!.split(':');
        right = parts[1] === '' ? [] : parts[1]!.split(':');
        const missing = 8 - (left.length + right.length);
        const mid = Array(missing).fill('0');
        const full = [...left, ...mid, ...right];
        return BigInt('0x' + full.map(h => h || '0').map(h => h.padStart(4, '0')).join(''));
    } else {
        const full = addr.split(':').map(h => h || '0');
        return BigInt('0x' + full.map(h => h.padStart(4, '0')).join(''));
    }
}

function cidrContainsIPv6(cidr: string, ipBigInt: bigint) {
    const [net, bitsStr] = cidr.split('/');
    const maskBits = parseInt(bitsStr!, 10);
    const netBig = ipv6ToBigInt(net!);
    if (maskBits === 0) return true;
    const shift = 128 - maskBits;
    const mask = ((BigInt(1) << BigInt(128 - shift)) - BigInt(1)) << BigInt(shift);
    return (netBig & mask) === (ipBigInt & mask);
}

const BLOCKED_IPV4_CIDRS = [
    '0.0.0.0/8',         // "This" / unspecified
    '10.0.0.0/8',        // RFC1918
    '100.64.0.0/10',     // Carrier-grade NAT
    '127.0.0.0/8',       // Loopback
    '169.254.0.0/16',    // Link-local
    '172.16.0.0/12',     // RFC1918
    '192.0.0.0/24',      // IETF protocol assignments / special
    '192.0.2.0/24',      // TEST-NET-1 (documentation)
    '192.88.99.0/24',    // 6to4 relay (historical/special)
    '192.168.0.0/16',    // RFC1918
    '198.18.0.0/15',     // Benchmarking
    '198.51.100.0/24',   // TEST-NET-2
    '203.0.113.0/24',    // TEST-NET-3
    '224.0.0.0/4',       // Multicast
    '240.0.0.0/4',       // Reserved for future use
    '255.255.255.255/32' // Limited broadcast
];

const BLOCKED_IPV6_CIDRS = [
    '::/128',            // Unspecified
    '::1/128',           // Loopback
    '::ffff:0:0/96',     // IPv4-mapped IPv6 prefix
    '64:ff9b::/96',      // IPv4/IPv6 translation
    '100::/64',          // Discard-Only Prefix? (various special)
    '2001:db8::/32',     // Documentation
    '2001::/23',         // Various special uses (e.g. Teredo, etc.)
    '2001:2::/48',       // ORCHIDv2 (experimental)
    'fc00::/7',          // Unique local addresses (ULA)
    'fe80::/10',         // Link-local
    'fec0::/10',         // Site-local (deprecated)
    'ff00::/8'           // Multicast
];

export function isIpAllowed(ip: string) {
    const ipFamily = net.isIP(ip);
    if (ipFamily == 4) {
        const ipV4Int = ipv4ToInt(ip);
        if (ipV4Int === null) return false;
        return BLOCKED_IPV4_CIDRS.every((blocked) => !cidrContainsIPv4(blocked, ipV4Int));
    } else if (ipFamily == 6) {
        const ipV6Int = ipv6ToBigInt(ip);
        if (ipV6Int === null) return false;
        return BLOCKED_IPV6_CIDRS.every((blocked) => !cidrContainsIPv6(blocked, ipV6Int));
    } else return false;
}
