import type { OverviewItem } from '../types/crypto';

type OverviewGridProps = {
  items: OverviewItem[];
};

function OverviewGrid({ items }: OverviewGridProps) {
  return (
    <div className="overview-grid">
      {items.map((item) => (
        <article key={item.label} className="overview-card">
          <h3>{item.label}</h3>
          <p>{item.info}</p>
        </article>
      ))}
    </div>
  );
}

export default OverviewGrid;
