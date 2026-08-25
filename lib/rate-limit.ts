/**
 * Rate limit de janela fixa, em memória.
 *
 * ponytail: o estado vive no processo. Com `output: "standalone"` numa VPS
 * única isso cobre o caso real. Teto: não vale entre réplicas nem sobrevive a
 * restart. Upgrade: mover o contador para Redis/Upstash se houver mais de uma
 * instância.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        // Limpeza preguiçosa: só varre quando o Map cresce demais.
        if (hits.size > 10_000) {
            for (const [k, v] of hits) if (now >= v.resetAt) hits.delete(k);
        }
        return true;
    }

    if (entry.count >= limit) return false;

    entry.count += 1;
    return true;
}

/** IP do cliente atrás do proxy reverso; cai para "unknown" quando ausente. */
export function clientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return request.headers.get("x-real-ip") || "unknown";
}
