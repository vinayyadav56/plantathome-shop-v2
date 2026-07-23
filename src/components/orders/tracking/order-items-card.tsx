import usePrice from '@/lib/use-price';
import Link from '@/components/ui/link';
import { Image } from '@/components/ui/image';
import { Routes } from '@/config/routes';
import { productPlaceholder } from '@/lib/placeholders';
import { useModalAction } from '@/components/ui/modal/modal.context';
import { isAlreadyReviewedInThisOrder, reviewSystem } from '@/lib/get-review';
import { OrderStatus } from '@/types';

function ItemRow({
  record,
  orderId,
  orderStatus,
  refund,
  settings,
}: {
  record: any;
  orderId: any;
  orderStatus: string;
  refund: boolean;
  settings: any;
}) {
  const { openModal } = useModalAction();
  const { price } = usePrice({ amount: record?.pivot?.subtotal ?? 0 });

  const variationTitle = record?.pivot?.variation_option_id
    ? record?.variation_options?.find(
        (vo: any) => vo?.id === record?.pivot?.variation_option_id,
      )?.title
    : null;
  const subline = [record?.unit, variationTitle].filter(Boolean).join('  |  ');

  const canReview = orderStatus === OrderStatus.COMPLETED && !refund;
  const alreadyReviewed = canReview
    ? isAlreadyReviewedInThisOrder(record, orderId, settings)
    : false;

  function openReviewModal() {
    openModal('REVIEW_RATING', {
      product_id: record.id,
      shop_id: record.shop_id,
      order_id: orderId,
      name: record.name,
      image: record.image,
      my_review: reviewSystem(record, settings),
      ...(record.pivot?.variation_option_id && {
        variation_option_id: record.pivot?.variation_option_id,
      }),
    });
  }

  return (
    <li className="flex items-center gap-4 py-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F3F1EA]">
        <Image
          src={record?.image?.thumbnail ?? productPlaceholder}
          alt={record?.name ?? 'Item'}
          fill
          sizes="64px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={Routes.product(record?.slug)}
          className="block truncate text-sm font-semibold text-forest-900 transition-colors hover:text-[var(--ds-accent-ink,#2E5E2A)]"
        >
          {record?.name}
        </Link>
        {subline ? <p className="mt-0.5 truncate text-[12px] text-[#9B998F]">{subline}</p> : null}
        {canReview ? (
          <button
            type="button"
            onClick={openReviewModal}
            disabled={alreadyReviewed}
            className="mt-1 text-[12px] font-semibold text-[var(--ds-accent-ink,#2E5E2A)] hover:underline disabled:cursor-not-allowed disabled:text-[#B8B6AD] disabled:no-underline"
          >
            {alreadyReviewed ? 'Reviewed' : 'Write a review'}
          </button>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-4 text-right sm:gap-10">
        <p className="text-[13px] text-[#8C8A81]">Qty: {record?.pivot?.order_quantity ?? 1}</p>
        <p className="min-w-[72px] text-sm font-semibold text-forest-900">{price}</p>
      </div>
    </li>
  );
}

/** "Order Items (N)" card — one row per line item. */
export default function OrderItemsCard({
  order,
  settings,
  refund,
}: {
  order: any;
  settings: any;
  refund: boolean;
}) {
  const products: any[] = order?.products ?? [];

  return (
    <div className="rounded-2xl border border-[#E7E5DC] bg-white px-5 py-5 shadow-sm sm:px-6">
      <h3 className="text-base font-semibold text-forest-900">
        Order Items ({products.length})
      </h3>
      <ul className="mt-1 divide-y divide-[#F0EEE5]">
        {products.map((record: any) => (
          <ItemRow
            key={record?.pivot?.variation_option_id ?? `${record?.id}`}
            record={record}
            orderId={order?.id}
            orderStatus={order?.order_status}
            refund={refund}
            settings={settings}
          />
        ))}
      </ul>
    </div>
  );
}
