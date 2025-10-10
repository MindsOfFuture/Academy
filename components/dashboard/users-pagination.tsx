"use client";
// UsersPagination: controles de navegação e ajuste de pageSize.
// Mantém UI desacoplada da lógica (callbacks recebidos via props).
import { Button } from "@/components/ui/button";

interface UsersPaginationProps {
    page: number;
    totalPages: number;
    total: number;
    pageSize: number;
    pageSizes?: number[];
    loading: boolean;
    canPrev: boolean;
    canNext: boolean;
    onChangePage: (p: number) => void;
    onChangePageSize: (s: number) => void;
    filtered: boolean;
}

export function UsersPagination({ page, totalPages, total, pageSize, pageSizes = [10, 25, 50], loading, canPrev, canNext, onChangePage, onChangePageSize, filtered }: UsersPaginationProps) {
    return (
        <>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                    Página {page} de {totalPages} — {total} usuário{total === 1 ? '' : 's'} {filtered ? '(filtrado)' : ''}
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Por página:</label>
                    <select
                        className="border rounded px-2 py-1 text-sm"
                        value={pageSize}
                        onChange={e => onChangePageSize(parseInt(e.target.value, 10))}
                        disabled={loading}
                    >
                        {pageSizes.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={!canPrev || loading} onClick={() => onChangePage(page - 1)}>Anterior</Button>
                    <Button variant="outline" size="sm" disabled={!canNext || loading} onClick={() => onChangePage(page + 1)}>Próxima</Button>
                </div>
            </div>
            {loading && <div className="text-xs text-gray-500 mt-2">Carregando...</div>}
        </>
    );
}
