/**
 * Banco em memória com o pedaço do query builder do Supabase que as rotas
 * usam (`select`/`eq`/`in`/`limit`/`order`/`maybeSingle`/`update`/`insert`/`delete`). Para testar
 * regra de autorização que depende de linhas reais, sem montar uma fila de
 * respostas na ordem exata das chamadas.
 */
type Row = Record<string, unknown>;

export function createFakeDb(tables: Record<string, Row[]>) {
    const updates: Array<{ table: string; values: Row; filters: Row }> = [];
    const writes: Array<{ table: string; op: "insert" | "delete"; values?: unknown; filters?: Row }> = [];

    function from(table: string) {
        const filters: Array<(row: Row) => boolean> = [];
        const eqs: Row = {};
        let max = Infinity;
        let pendingUpdate: Row | null = null;
        let pendingDelete = false;

        const rows = () => (tables[table] ?? []).filter((row) => filters.every((f) => f(row))).slice(0, max);
        const run = () => {
            if (pendingDelete) {
                writes.push({ table, op: "delete", filters: { ...eqs } });
                return { data: null, error: null };
            }
            if (pendingUpdate) {
                updates.push({ table, values: pendingUpdate, filters: { ...eqs } });
                return { data: null, error: null };
            }
            return { data: rows(), error: null };
        };

        const builder = {
            select: () => builder,
            order: () => builder,
            eq: (key: string, value: unknown) => {
                eqs[key] = value;
                filters.push((row) => row[key] === value);
                return builder;
            },
            in: (key: string, values: unknown[]) => {
                filters.push((row) => values.includes(row[key]));
                return builder;
            },
            limit: (n: number) => {
                max = n;
                return builder;
            },
            insert: async (values: unknown) => {
                writes.push({ table, op: "insert", values });
                return { data: null, error: null };
            },
            delete: () => {
                pendingDelete = true;
                return builder;
            },
            update: (values: Row) => {
                pendingUpdate = values;
                return builder;
            },
            maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
            then: (resolve: (value: ReturnType<typeof run>) => unknown, reject?: (e: unknown) => unknown) =>
                Promise.resolve(run()).then(resolve, reject),
        };
        return builder;
    }

    return { from, updates, writes };
}
