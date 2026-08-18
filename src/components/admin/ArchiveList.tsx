/**
 * Vowly ArchiveList
 * -----------------
 * Section on the dashboard:
 *   - "TO'YLAR ARXIVI" title + subtitle.
 *   - search bar on the right.
 *   - paginated grid of <ArchiveCard />.
 *   - pagination footer (< 1 2 3 … N >).
 */
import { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/i18n/LanguageContext';
import { useArchive } from '@/hooks/useWeddings';
import ArchiveCard from './ArchiveCard';

interface Props { hallId: string; }

const PAGE_SIZE = 6;

export default function ArchiveList({ hallId }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useArchive(hallId, {
    search,
    page,
    pageSize: PAGE_SIZE,
  });
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const pages = useMemo(() => buildPageList(page, pageCount), [page, pageCount]);

  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-3 border-b border-neutral-100 pb-5 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0">
          <h3
            className="font-display text-[18px] font-medium uppercase tracking-[0.16em] text-neutral-800 md:text-[19px]"
            style={{ fontFamily: '"Inter",sans-serif', letterSpacing: '0.14em', color: '#3a3a3a' }}
          >
            {t('admin.archive.title')}
          </h3>
          <p className="mt-1 text-[13px] text-neutral-500 md:text-[13.5px]">
            {t('admin.archive.subtitle')}
          </p>
        </div>
        <div className="relative w-full md:w-[280px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            placeholder={t('admin.archive.searchPh')}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="h-10 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-[13.5px] text-neutral-800 outline-none transition focus:border-[#3a4530]"
          />
        </div>
      </div>

      <div className="space-y-4 pt-5">
        {isLoading && (
          <div className="grid place-items-center rounded-lg bg-neutral-50 py-12 text-[13px] text-neutral-500">{t('admin.archive.loading')}</div>
        )}

        {!isLoading && (data?.rows?.length ?? 0) === 0 && (
          <div className="grid place-items-center rounded-lg bg-neutral-50 py-14 text-center">
            <p className="text-[14px] font-medium text-neutral-700">{t('admin.archive.emptyTitle')}</p>
            <p className="mt-1 text-[12.5px] text-neutral-500">{t('admin.archive.emptyDesc')}</p>
          </div>
        )}

        {data?.rows?.map((w) => (
          <ArchiveCard key={w.id} wedding={w} />
        ))}
      </div>

      {pageCount > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1 text-[13px]">
          <PageBtn disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </PageBtn>
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`e-${i}`} className="px-2 text-neutral-400">...</span>
            ) : (
              <PageBtn key={p} active={p === page} onClick={() => setPage(p)}>
                {p}
              </PageBtn>
            ),
          )}
          <PageBtn disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
            <ChevronRight className="h-4 w-4" />
          </PageBtn>
        </div>
      )}

      {isFetching && !isLoading && (
        <p className="mt-3 text-center text-[11px] text-neutral-400">{t('admin.archive.fetching')}</p>
      )}
    </section>
  );
}

function PageBtn({
  children, active, disabled, onClick,
}: { children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'grid h-9 w-9 place-items-center rounded-md transition',
        active ? 'bg-[#3a4530] text-white' : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/** Compact pagination: 1 2 3 … N, with ellipses for long ranges. */
function buildPageList(page: number, total: number): (number | '...')[] {
  const list: (number | '...')[] = [];
  if (total <= 7) {
    for (let i = 1; i <= total; i++) list.push(i);
    return list;
  }
  // 1 2 … (page-1) page (page+1) … N
  const head = [1, 2];
  const tail = [total - 1, total];
  const around: number[] = [];
  for (let p = page - 1; p <= page + 1; p++) {
    if (p > 2 && p < total - 1) around.push(p);
  }
  let cursor = 1;
  const next = () => {
    if (cursor >= total - 1) return null;
    cursor += 1;
    return cursor;
  };
  void next;
  // simple algorithm
  const all = Array.from(new Set([...head, ...around, ...tail])).sort((a, b) => a - b);
  for (let i = 0; i < all.length; i++) {
    if (i > 0 && all[i] - all[i - 1] > 1) list.push('...');
    list.push(all[i]);
  }
  void page;
  return list;
}
