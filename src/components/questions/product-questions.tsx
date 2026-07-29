import { useTranslation } from 'next-i18next';
import { goToSignin } from '@/lib/go-to-signin';
import QuestionCard from '@/components/questions/question-card';
import Pagination from '@/components/ui/pagination';
import { useEffect, useState } from 'react';
import { useQuestions } from '@/framework/product';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { useUser } from '@/framework/user';
import isEmpty from 'lodash/isEmpty';
import Spinner from '@/components/ui/loaders/spinner/spinner';

type ProductQuestionsProps = {
  className?: any;
  productId: string;
  shopId: string;
  productType?: string;
};

/* ─── inline line icons (local, like the product card's own glyphs) ────── */
const SearchGlyph = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="h-[18px] w-[18px]"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const ChatGlyph = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    className="h-[18px] w-[18px] shrink-0"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const CARD_SHADOW =
  'shadow-[0_4px_10px_rgba(0,0,0,0.04),0_20px_40px_rgba(0,0,0,0.08)]';

const ProductQuestions: React.FC<ProductQuestionsProps> = ({
  productId,
  shopId,
}) => {
  const { t } = useTranslation('common');
  const [page, setPage] = useState(1);
  const { openModal } = useModalAction();
  const { isAuthorized } = useUser();

  // LOCAL search — the shared <Search/> wrote the global header-search
  // context and pushed ?text= into the URL (cross-filtering reviews). This
  // stays inside the component and goes straight to the questions query.
  // Initial state '' renders identically on server + first client paint.
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { questions, paginatorInfo, isLoading } = useQuestions({
    product_id: productId,
    limit: 5,
    page,
    ...(debouncedSearch && { question: debouncedSearch }),
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  function onPagination(current: number) {
    setPage(current);
  }

  const openQuestionModal = () => {
    if (!isAuthorized) {
      goToSignin();
      return;
    }
    openModal('QUESTION_FORM', { product_id: productId, shop_id: shopId });
  };

  // Only the very first load gets the full-card spinner — while a search is
  // active we keep the card (and the input's focus) mounted.
  if (isLoading && isEmpty(questions) && !debouncedSearch) {
    return (
      <section
        id="questions"
        className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-10"
      >
        <div
          className={`flex items-center justify-center rounded-[22px] border border-[#ECECEC] bg-white py-20 ${CARD_SHADOW}`}
        >
          <Spinner simple className="h-9 w-9" />
        </div>
      </section>
    );
  }

  const total =
    //@ts-ignore
    paginatorInfo?.total ?? 0;

  return (
    <section
      id="questions"
      className="mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-10"
    >
      <div
        className={`overflow-hidden rounded-[22px] border border-[#ECECEC] bg-white ${CARD_SHADOW}`}
      >
        {/* header — title + local search + ask-question CTA */}
        <div className="flex flex-col gap-6 border-b border-[#ECECEC] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="shrink-0">
            <p className="text-[12px] font-bold uppercase leading-none tracking-[0.14em] text-[#B58E39]">
              Plant Q&amp;A
            </p>
            <h2 className="mt-2.5 text-[24px] font-medium leading-tight text-[#184A31] sm:text-[28px]">
              {t('text-question-answers')}{' '}
              <span className="font-semibold text-[#8A8A8A]">
                ({total.toLocaleString('en-IN')})
              </span>
            </h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto lg:justify-end">
            <div className="relative w-full sm:max-w-[360px]">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8A8A]">
                <SearchGlyph />
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('text-question-search-placeholder')}
                aria-label={t('text-search-label')}
                className="h-12 w-full rounded-[14px] border border-[#ECECEC] bg-white pl-11 pr-4 text-[15px] text-[#333333] outline-none transition placeholder:text-[#A0A0A0] focus:border-[#14532D] focus:ring-2 focus:ring-[#14532D]/15"
              />
            </div>
            <button
              type="button"
              onClick={openQuestionModal}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2.5 rounded-[14px] bg-[#14532D] px-6 text-[15px] font-semibold text-white transition duration-300 hover:bg-[#0D4324] focus:outline-0"
            >
              <ChatGlyph />
              {t('text-ask-question')}
            </button>
          </div>
        </div>

        {/* question list */}
        {!isEmpty(questions) ? (
          <div className="px-6 sm:px-8">
            {questions?.map((question: any) => (
              <QuestionCard
                key={`question-no-${question.id}`}
                question={question}
              />
            ))}

            {/* Pagination */}
            {paginatorInfo && (
              <div className="flex items-center justify-between border-t border-[#ECECEC] py-4">
                <div className="text-[13px] text-[#8A8A8A]">
                  {t('text-page')}{' '}
                  {
                    //@ts-ignore
                    paginatorInfo.currentPage
                  }{' '}
                  {t('text-of')}{' '}
                  {Math.ceil(
                    //@ts-ignore
                    paginatorInfo.total / paginatorInfo.perPage,
                  )}
                </div>

                <div className="mb-2 flex items-center">
                  <Pagination
                    total={
                      //@ts-ignore
                      paginatorInfo.total
                    }
                    current={
                      //@ts-ignore
                      paginatorInfo.currentPage
                    }
                    pageSize={
                      //@ts-ignore
                      paginatorInfo.perPage
                    }
                    onChange={onPagination}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="text-[#24693E]/35">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="h-10 w-10"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </span>
            <h3 className="mt-4 text-[17px] font-medium text-[#184A31]">
              {t('text-no-question-found')}
            </h3>
            <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-[#8A8A8A]">
              {debouncedSearch
                ? 'No questions match your search — try a different word.'
                : 'Have a doubt about this plant? Ask away and our team will answer.'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductQuestions;
