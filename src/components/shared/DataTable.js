"use client";

import { useMemo, useState } from "react";
import Button from "./Button";
import Input from "./Input";

export default function DataTable({ columns, data, searchable = false, searchPlaceholder = "Search...", actions, onRowClick, rowClassName, getSearchValue }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!searchable || !search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = typeof getSearchValue === "function"
          ? getSearchValue(row, col)
          : typeof col.searchValue === "function"
            ? col.searchValue(row)
            : col.accessor
              ? row[col.accessor]
              : "";
        return String(value ?? "").toLowerCase().includes(q);
      })
    );
  }, [columns, data, getSearchValue, search, searchable]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortDir, sortKey]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div>
      {searchable && (
        <div className="mb-4">
          <Input placeholder={searchPlaceholder} value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th key={col.accessor || col.header} className={`px-4 py-3 text-left font-medium text-gray-600 ${col.sortable ? "cursor-pointer hover:text-gray-900" : ""}`} onClick={() => col.sortable && handleSort(col.accessor)}>
                  {col.header} {sortKey === col.accessor ? (sortDir === "asc" ? "↑" : "↓") : ""}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginated.map((row, i) => (
              <tr key={row.id || i} className={`hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""} ${typeof rowClassName === "function" ? rowClassName(row) : rowClassName || ""}`} onClick={() => onRowClick?.(row)}>
                {columns.map((col) => (
                  <td key={col.accessor || col.header} className="px-4 py-3 text-gray-700">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
                {actions && <td className="px-4 py-3">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
