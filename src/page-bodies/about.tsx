'use client';

import Breadcrumb from '@/components/ui/breadcrumb';
import Seo from '@/components/seo/seo';
import Link from '@/components/ui/link';
import { Routes } from '@/config/routes';
import { getLayoutWithFooter } from '@/components/layouts/layout-with-footer';

/**
 * /about — the company page.
 *
 * Built because AWS Activate rejected the credits application on the grounds
 * that "your website does not reflect the company name you provided": the
 * operating entity appeared only inside the body text of /terms, /privacy and
 * /data-deletion, and /about was a soft 404 (HTTP 200 serving the not-found
 * page). Reviewers, payment gateways and app stores all look for a page that
 * names the entity and makes it verifiable.
 *
 * LLPIN and the registered address are public record on mca.gov.in, so they
 * belong here. PAN and TAN are deliberately NOT published — they are tax
 * identifiers, nobody verifying a business needs them, and exposing them
 * invites impersonation.
 */

const COMPANY = [
  { label: 'Registered name', value: 'Silvestrix Green LLP' },
  { label: 'Trading as', value: 'PlantAtHome' },
  { label: 'LLP Identification Number', value: 'ACP-3683' },
  { label: 'Incorporated', value: '24 June 2025, under the Limited Liability Partnership Act, 2008' },
  { label: 'Registered office', value: 'C/O Chotte Lal, Dhani Shobha Buroli, Ahrod, Police Station Khol, Rewari 123102, Haryana, India' },
  { label: 'Jurisdiction', value: 'Registrar of Companies, Central Registration Centre, Manesar' },
];

const WHAT_WE_DO = [
  {
    title: 'Plants, chosen and checked',
    body: 'Indoor and outdoor plants sourced from nurseries we buy from directly. Every plant is inspected before it is packed, and listings carry the real light, water and care requirements rather than stock copy.',
  },
  {
    title: 'Pots, soil and the rest',
    body: 'Ceramic and designer planters, potting mixes, fertilisers and tools — the things a plant needs after it arrives, from the same order.',
  },
  {
    title: 'Care that continues after delivery',
    body: 'Every plant bought is added to a personal care plan with watering and feeding reminders. Plant Doctor diagnoses a sick plant from a photograph and returns a treatment plan for the pests and deficiencies common in Indian homes.',
  },
  {
    title: 'Delivery built for living things',
    body: 'Plants travel badly through ordinary parcel networks. Orders are routed through partners suited to the distance and the plant, and the delivery method for a pin code is shown before payment.',
  },
];

export default function AboutPage() {
  return (
    <>
      <Seo title="About PlantAtHome" url="about" />
      <Breadcrumb
        className="mx-auto w-full max-w-7xl px-5 pt-4 sm:px-8"
        items={[{ label: 'Home', href: Routes.home }, { label: 'About' }]}
      />

      <div className="w-full g-light-a">
        <div className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 xl:py-14">
          <h1 className="mb-4 font-cormorant text-3xl font-medium text-forest-900 md:text-4xl">
            About PlantAtHome
          </h1>
          <p className="mb-4 text-base leading-loose text-body-dark">
            PlantAtHome is an online plant company serving homes across India. We sell healthy
            indoor and outdoor plants, the pots and soil that go with them, and the care advice
            that keeps them alive once they arrive.
          </p>
          <p className="mb-10 text-base leading-loose text-body-dark">
            The business is operated by <strong className="text-forest-900">Silvestrix Green LLP</strong>,
            a limited liability partnership registered in Haryana, India. PlantAtHome is the
            brand it trades under.
          </p>

          <h2 className="mb-5 font-cormorant text-2xl font-medium text-forest-900">
            What we do
          </h2>
          <div className="mb-12 grid gap-4 sm:grid-cols-2">
            {WHAT_WE_DO.map((it) => (
              <div
                key={it.title}
                className="rounded-xl border border-forest-900/10 bg-white p-5"
              >
                <h3 className="mb-2 text-base font-semibold text-forest-900">{it.title}</h3>
                <p className="text-sm leading-relaxed text-body-dark">{it.body}</p>
              </div>
            ))}
          </div>

          <h2 className="mb-2 font-cormorant text-2xl font-medium text-forest-900">
            Company details
          </h2>
          <p className="mb-5 text-sm leading-relaxed text-body-dark">
            Our registration can be verified on the Ministry of Corporate Affairs portal at{' '}
            <a
              href="https://www.mca.gov.in"
              target="_blank"
              rel="noreferrer noopener"
              className="text-forest-700 underline underline-offset-2"
            >
              mca.gov.in
            </a>{' '}
            using the LLPIN below.
          </p>
          <dl className="mb-12 overflow-hidden rounded-xl border border-forest-900/10 bg-white">
            {COMPANY.map((row, i) => (
              <div
                key={row.label}
                className={`flex flex-col gap-1 px-5 py-4 sm:flex-row sm:gap-6 ${
                  i > 0 ? 'border-t border-forest-900/10' : ''
                }`}
              >
                <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-body sm:w-56">
                  {row.label}
                </dt>
                <dd className="text-sm leading-relaxed text-forest-900">{row.value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mb-3 font-cormorant text-2xl font-medium text-forest-900">
            Get in touch
          </h2>
          <p className="text-base leading-loose text-body-dark">
            For orders and plant care, write to{' '}
            <a href="mailto:hello@plantathome.in" className="text-forest-700 underline underline-offset-2">
              hello@plantathome.in
            </a>{' '}
            or use the{' '}
            <Link href="/contact" className="text-forest-700 underline underline-offset-2">
              contact form
            </Link>
            . For privacy and data requests, write to{' '}
            <a href="mailto:data@plantathome.in" className="text-forest-700 underline underline-offset-2">
              data@plantathome.in
            </a>{' '}
            — our{' '}
            <Link href="/data-deletion" className="text-forest-700 underline underline-offset-2">
              data deletion policy
            </Link>{' '}
            explains what we keep and for how long.
          </p>
        </div>
      </div>
    </>
  );
}

AboutPage.getLayout = getLayoutWithFooter;

/* ── App Router body wrapper (mirrors the other page-bodies) ── */
export function PageBody(props: any) {
  const page = <AboutPage {...props} />;
  const withLayout = (AboutPage as any).getLayout ? (AboutPage as any).getLayout(page) : page;
  return withLayout;
}
