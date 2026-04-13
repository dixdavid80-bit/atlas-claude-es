import { BookOpen, Wrench, Plug, Layers, Rocket } from 'lucide-react';

interface PathCardProps {
  title: string;
  description: string;
  href: string;
  icon: 'book' | 'wrench' | 'plug' | 'layers' | 'rocket';
  accent?: string;
}

const icons = {
  book: BookOpen,
  wrench: Wrench,
  plug: Plug,
  layers: Layers,
  rocket: Rocket,
};

export default function PathCard({ title, description, href, icon, accent = '#d97706' }: PathCardProps) {
  const Icon = icons[icon];

  return (
    <a
      href={href}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        padding: '1.75rem',
        borderRadius: '12px',
        border: '1px solid var(--sl-color-gray-2)',
        background: 'var(--sl-color-white)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = accent;
        el.style.boxShadow = `0 8px 24px ${accent}18`;
        el.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = 'var(--sl-color-gray-2)';
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
            background: `${accent}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={accent} strokeWidth={2} />
        </div>
        <h3 style={{
          fontFamily: "'Libre Baskerville', Georgia, serif",
          fontSize: '1.15rem',
          fontWeight: 700,
          margin: 0,
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h3>
      </div>
      <p style={{
        fontSize: '0.95rem',
        lineHeight: 1.6,
        color: 'var(--sl-color-gray-4)',
        margin: 0,
      }}>
        {description}
      </p>
      <div style={{
        marginTop: '1rem',
        fontSize: '0.9rem',
        fontWeight: 600,
        color: accent,
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
      }}>
        Explorar →
      </div>
    </a>
  );
}
