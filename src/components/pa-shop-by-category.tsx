import { useCategories } from '@/framework/category';
import { Image } from '@/components/ui/image';
import Link from '@/components/ui/link';

interface Props {
  variables: any;
}

function getEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('succulent') || n.includes('cactus') || n.includes('cacti')) return '🌵';
  if (n.includes('flower') || n.includes('bloom') || n.includes('rose')) return '🌸';
  if (n.includes('herb') || n.includes('spice') || n.includes('basil') || n.includes('mint')) return '🌿';
  if (n.includes('tree') || n.includes('palm') || n.includes('outdoor')) return '🌳';
  if (n.includes('indoor') || n.includes('foliage') || n.includes('tropical')) return '🪴';
  if (n.includes('climbing') || n.includes('vine') || n.includes('creeper')) return '🍃';
  if (n.includes('ground') || n.includes('grass') || n.includes('cover')) return '🌾';
  if (n.includes('vegetable') || n.includes('veggie')) return '🥦';
  if (n.includes('shrub') || n.includes('bush')) return '🌱';
  return '🌿';
}

const FALLBACK_COLORS = [
  'linear-gradient(135deg,#1B5E20,#2E7D32)',
  'linear-gradient(135deg,#0D3D14,#1B5E20)',
  'linear-gradient(135deg,#2E7D32,#43A047)',
  'linear-gradient(135deg,#1B5E20,#388E3C)',
  'linear-gradient(135deg,#004D40,#00695C)',
  'linear-gradient(135deg,#1A237E,#283593)',
  'linear-gradient(135deg,#4A148C,#6A1B9A)',
  'linear-gradient(135deg,#BF360C,#D84315)',
  'linear-gradient(135deg,#1B5E20,#558B2F)',
  'linear-gradient(135deg,#E65100,#EF6C00)',
];

const PaShopByCategory: React.FC<Props> = ({ variables }) => {
  const { categories, isLoading } = useCategories(variables);
  const rootCats = categories?.filter((c: any) => !c.parent_id)?.slice(0, 10) ?? [];

  if (isLoading || !rootCats.length) return null;

  return (
    <section className="pa-cat-section">
      <div className="pa-wrap">
        <div className="pa-sec-hdr">
          <span className="pa-pill">🌿 Collections</span>
          <h2 className="pa-sec-h2">
            Shop by <span className="pa-grad-text">Plant Type</span>
          </h2>
          <p className="pa-sec-sub">
            From air-purifying indoor plants to vibrant flowering varieties — find your perfect green companion.
          </p>
        </div>

        <div className="pa-cat-grid">
          {rootCats.map((cat: any, i: number) => (
            <Link
              key={cat.id}
              href={`/c/${cat.slug}`}
              className="pa-cat-card group"
            >
              {/* Background: real image or gradient fallback */}
              {cat.image?.original ? (
                <div className="pa-cat-img-wrap">
                  <Image
                    src={cat.image.original}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 520px) 50vw, (max-width: 800px) 33vw, 20vw"
                    className="pa-cat-img"
                  />
                  <div className="pa-cat-img-overlay" />
                </div>
              ) : (
                <div
                  style={{ position: 'absolute', inset: 0, background: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                  aria-hidden="true"
                />
              )}

              {/* Content */}
              <div className="pa-cat-body">
                <span className="pa-cat-emoji">{getEmoji(cat.name)}</span>
                <div className="pa-cat-name">{cat.name}</div>
                {cat.products_count > 0 && (
                  <div className="pa-cat-count">{cat.products_count} plants</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PaShopByCategory;
