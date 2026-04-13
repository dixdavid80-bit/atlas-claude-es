import { BookOpen, Wrench, Plug, Layers, Rocket } from 'lucide-react';

interface PathCardProps {
  title: string;
  description: string;
  href: string;
  icon: 'book' | 'wrench' | 'plug' | 'layers' | 'rocket';
  accentColor?: string;
  accentBg?: string;
}

const icons = {
  book: BookOpen,
  wrench: Wrench,
  plug: Plug,
  layers: Layers,
  rocket: Rocket,
};

export default function PathCard({
  title,
  description,
  href,
  icon,
  accentColor = 'var(--sl-color-accent)',
  accentBg = 'var(--sl-color-accent-low)',
}: PathCardProps) {
  const Icon = icons[icon];

  return (
    <a
      href={href}
      className="atlas-path-card"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        padding: '1.75rem',
        borderRadius: '12px',
        border: '1px solid var(--atlas-card-border)',
        background: 'var(--atlas-card-bg)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        // CSS custom property for hover
        '--card-accent': accentColor,
        '--card-accent-bg': accentBg,
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = accentColor;
        el.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
        el.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--atlas-card-border)';
        el.style.boxShadow = 'none';
        el.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '8px',
            background: accentBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} color={accentColor} strokeWidth={2} />
        </div>
        <h3 style={{
          fontFamily: "'Libre Baskerville', Georgia, serif",
          fontSize: '1.15rem',
          fontWeight: 700,
          margin: 0,
          letterSpacing: '-0.01em',
          color: 'var(--sl-color-white)',
        }}>
          {title}
        </h3>
      </div>
      <p style={{
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: 'var(--atlas-card-text)',
        margin: 0,
      }}>
        {description}
      </p>
      <div style={{
        marginTop: '1rem',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: accentColor,
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
      }}>
        Explorar →
      </div>
    </a>
  );
}
