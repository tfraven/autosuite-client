import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 20,
  onPageChange,
  onLimitChange
}) {
  const { isRomanUrdu } = useLanguage();

  if (totalItems === 0) return null;

  const startItem = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers array with ellipsis
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="pagination-bar no-print">
      <div className="pagination-info text-xs text-muted">
        {isRomanUrdu ? (
          <span>
            Kul <strong>{totalItems}</strong> mein se <strong>{startItem}-{endItem}</strong> dikhaye ja rahe hain
          </span>
        ) : (
          <span>
            Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> entries
          </span>
        )}
      </div>

      <div className="pagination-controls">
        {onLimitChange && (
          <div className="pagination-limit-select">
            <span className="text-xs text-muted mr-1">
              {isRomanUrdu ? 'Tadad:' : 'Rows:'}
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="form-select select-xs"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}

        <div className="pagination-buttons">
          <button
            className="pagination-btn icon-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="pagination-pages">
            {getPageNumbers().map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                  onClick={() => onPageChange(Number(p))}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            className="pagination-btn icon-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
