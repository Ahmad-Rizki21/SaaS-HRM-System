import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  lastPage,
  total,
  onPageChange,
}: PaginationProps) {
  if (lastPage <= 1) return null;

  const pages = [];
  const maxTabs = 5;
  let start = Math.max(1, currentPage - Math.floor(maxTabs / 2));
  let end = start + maxTabs - 1;

  if (end > lastPage) {
    end = lastPage;
    start = Math.max(1, end - maxTabs + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-4 px-2 select-none border-t border-gray-100">
      <div className="text-xs font-medium text-gray-500">
        Total data: <span className="font-bold text-gray-800">{total}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={16} />
        </button>

        {start > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-gray-600 hover:bg-gray-50 border border-transparent transition"
            >
              1
            </button>
            {start > 2 && <span className="text-gray-400 text-xs tracking-widest px-1">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold transition ${
              page === currentPage
                ? "bg-[#8B0000] text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-50 border border-transparent"
            }`}
          >
            {page}
          </button>
        ))}

        {end < lastPage && (
          <>
            {end < lastPage - 1 && <span className="text-gray-400 text-xs tracking-widest px-1">...</span>}
            <button
              onClick={() => onPageChange(lastPage)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-xs font-bold text-gray-600 hover:bg-gray-50 border border-transparent transition"
            >
              {lastPage}
            </button>
          </>
        )}

        <button
          disabled={currentPage === lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
