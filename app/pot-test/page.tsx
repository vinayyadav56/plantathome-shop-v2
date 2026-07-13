// TEMPORARY (P8 verification) — PDP rendered with a mocked Size×Pot product.
import { PageBody } from '@/page-bodies/product';
import mock from '@/page-bodies/__pot-mock.json';

export default function PotTest() {
  return <PageBody product={mock as any} />;
}
