import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/*
 * Illustrations for the tool cards. Every tool gets its own small inline SVG scene,
 * so there are no image requests and nothing to optimise. Format-to-format tools
 * share one composition (two file icons joined by an arrow) that is unique per pair
 * because each format has its own colour, label and glyph.
 */

export type FormatId =
  | 'jpg' | 'png' | 'svg' | 'webp' | 'heic' | 'avif' | 'gif'
  | 'pdf' | 'docx' | 'epub' | 'mobi'
  | 'mp3' | 'wav' | 'mp4' | 'avi';

export type SceneId =
  | 'resize' | 'passport' | 'compress-image'
  | 'merge' | 'split' | 'compress-pdf' | 'images-to-pdf' | 'organize'
  | 'rotate' | 'crop' | 'page-numbers' | 'watermark';

export type ToolVisualSpec =
  | { type: 'convert'; from: FormatId; to: FormatId }
  | { type: 'scene'; scene: SceneId };

export type Tone = 'blue' | 'rose' | 'emerald';

type Kind = 'image' | 'doc' | 'video' | 'audio' | 'book' | 'vector';

const FORMATS: Record<FormatId, { label: string; kind: Kind; color: string }> = {
  jpg: { label: 'JPG', kind: 'image', color: '#D97706' },
  png: { label: 'PNG', kind: 'image', color: '#2563EB' },
  svg: { label: 'SVG', kind: 'vector', color: '#059669' },
  webp: { label: 'WEBP', kind: 'image', color: '#0891B2' },
  heic: { label: 'HEIC', kind: 'image', color: '#DB2777' },
  avif: { label: 'AVIF', kind: 'image', color: '#7C3AED' },
  gif: { label: 'GIF', kind: 'image', color: '#0D9488' },
  pdf: { label: 'PDF', kind: 'doc', color: '#DC2626' },
  docx: { label: 'DOCX', kind: 'doc', color: '#2563EB' },
  epub: { label: 'EPUB', kind: 'book', color: '#16A34A' },
  mobi: { label: 'MOBI', kind: 'book', color: '#EA580C' },
  mp3: { label: 'MP3', kind: 'audio', color: '#C026D3' },
  wav: { label: 'WAV', kind: 'audio', color: '#4F46E5' },
  mp4: { label: 'MP4', kind: 'video', color: '#0284C7' },
  avi: { label: 'AVI', kind: 'video', color: '#9333EA' },
};

const ACCENT: Record<Tone, string> = { blue: '#2563EB', rose: '#E11D48', emerald: '#059669' };

const BACKDROP: Record<Tone, string> = {
  blue: 'from-blue-50 via-indigo-50 to-violet-100 dark:from-blue-950/70 dark:via-indigo-950/60 dark:to-violet-950/60',
  rose: 'from-rose-50 via-orange-50 to-amber-100 dark:from-rose-950/60 dark:via-orange-950/40 dark:to-amber-950/40',
  emerald: 'from-emerald-50 via-teal-50 to-cyan-100 dark:from-emerald-950/60 dark:via-teal-950/50 dark:to-cyan-950/40',
};

const SURFACE = 'fill-white stroke-slate-200 dark:fill-slate-800 dark:stroke-slate-600';
const INK = 'fill-slate-200 dark:fill-slate-600';

/** A white page. Children are drawn in the page's own coordinates. */
function Page({
  x, y, w = 56, h = 72, rotate = 0, children,
}: { x: number; y: number; w?: number; h?: number; rotate?: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} ${w / 2} ${h / 2})`}>
      <rect width={w} height={h} rx={6} className={SURFACE} strokeWidth={1.5} />
      {children}
    </g>
  );
}

function Lines({ x, y, w, rows, gap = 7 }: { x: number; y: number; w: number; rows: number; gap?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <rect key={i} x={x} y={y + i * gap} width={i === rows - 1 ? w * 0.6 : w} height={3} rx={1.5} className={INK} />
      ))}
    </>
  );
}

function Pill({ x, y, w, label, color, size = 9 }: { x: number; y: number; w: number; label: string; color: string; size?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={size + 6} rx={(size + 6) / 2} fill={color} />
      <text x={x + w / 2} y={y + size + 1} textAnchor="middle" fontSize={size} fontWeight={700} fill="#fff" className="font-sans">
        {label}
      </text>
    </g>
  );
}

function Mountains({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={4} fill={color} fillOpacity={0.16} />
      <circle cx={x + w * 0.72} cy={y + h * 0.28} r={h * 0.12} fill={color} fillOpacity={0.7} />
      <path
        d={`M${x} ${y + h} L${x + w * 0.34} ${y + h * 0.4} L${x + w * 0.58} ${y + h * 0.72} L${x + w * 0.74} ${y + h * 0.55} L${x + w} ${y + h} Z`}
        fill={color}
        fillOpacity={0.75}
      />
    </g>
  );
}

function Glyph({ kind, color, id }: { kind: Kind; color: string; id: FormatId }) {
  switch (kind) {
    case 'image':
      return <Mountains x={8} y={9} w={40} h={34} color={color} />;
    case 'doc':
      return (
        <>
          <rect x={8} y={9} width={40} height={4} rx={2} fill={color} fillOpacity={0.8} />
          <Lines x={8} y={19} w={40} rows={4} gap={6} />
        </>
      );
    case 'video':
      return (
        <>
          <rect x={8} y={9} width={40} height={34} rx={5} fill={color} fillOpacity={0.9} />
          <path d="M24 19 L35 26 L24 33 Z" fill="#fff" />
        </>
      );
    case 'audio': {
      const heights = id === 'wav' ? [10, 22, 14, 30, 18, 26, 12, 20, 8] : [8, 16, 26, 12, 22, 10, 18];
      const step = 40 / heights.length;
      return (
        <>
          {heights.map((height, i) => (
            <rect key={i} x={9 + i * step} y={26 - height / 2} width={Math.min(3.4, step - 1.6)} height={height} rx={1.6} fill={color} fillOpacity={0.85} />
          ))}
        </>
      );
    }
    case 'book':
      return (
        <>
          <path d="M8 13 C16 9 22 10 28 15 C34 10 40 9 48 13 V41 C40 37 34 38 28 43 C22 38 16 37 8 41 Z" fill={color} fillOpacity={0.16} stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M28 15 V43" stroke={color} strokeWidth={1.5} />
        </>
      );
    case 'vector':
      return (
        <>
          <path d="M10 38 C18 8 30 8 28 26 S40 40 46 14" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
          {[[10, 38], [28, 26], [46, 14]].map(([cx, cy]) => (
            <rect key={`${cx}-${cy}`} x={cx - 3} y={cy - 3} width={6} height={6} rx={1.5} className="fill-white dark:fill-slate-800" stroke={color} strokeWidth={1.5} />
          ))}
        </>
      );
  }
}

function FileIcon({ format, x, y, rotate = 0 }: { format: FormatId; x: number; y: number; rotate?: number }) {
  const { label, kind, color } = FORMATS[format];
  return (
    <Page x={x} y={y} rotate={rotate}>
      <Glyph kind={kind} color={color} id={format} />
      <Pill x={8} y={50} w={40} label={label} color={color} />
    </Page>
  );
}

function ArrowBadge({ x, y, color = '#4F46E5' }: { x: number; y: number; color?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={14} fill={color} />
      <path d="M-6 0H6M2 -5l5 5-5 5" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function Arrow({ d, color }: { d: string; color: string }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />;
}

function Scene({ scene, accent }: { scene: SceneId; accent: string }) {
  switch (scene) {
    case 'resize':
      return (
        <>
          <rect x={34} y={14} width={132} height={92} rx={8} fill="none" stroke={accent} strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="5 4" />
          <rect x={52} y={26} width={96} height={68} rx={7} className={SURFACE} strokeWidth={1.5} />
          <Mountains x={58} y={32} w={84} h={56} color={accent} />
          {[[52, 26], [148, 26], [52, 94], [148, 94]].map(([cx, cy]) => (
            <rect key={`${cx}-${cy}`} x={cx - 4.5} y={cy - 4.5} width={9} height={9} rx={2.5} fill="#fff" stroke={accent} strokeWidth={2} />
          ))}
          <Arrow d="M152 98 L166 108 M158 108 H166 V100" color={accent} />
          <Pill x={62} y={2} w={76} label="1920 × 1080" color={accent} size={8} />
        </>
      );
    case 'passport':
      return (
        <>
          <g transform="translate(26 30) rotate(-8 30 36)">
            <rect width={60} height={72} rx={6} className={SURFACE} strokeWidth={1.5} />
            {[0, 1].flatMap((col) => [0, 1].map((row) => (
              <rect key={`${col}${row}`} x={8 + col * 25} y={8 + row * 30} width={20} height={25} rx={3} fill={accent} fillOpacity={0.18} />
            )))}
          </g>
          <rect x={92} y={14} width={64} height={86} rx={7} className={SURFACE} strokeWidth={1.5} />
          <rect x={98} y={20} width={52} height={62} rx={4} fill={accent} fillOpacity={0.2} />
          <path d="M104 82 C104 66 114 62 124 62 C134 62 144 66 144 82 Z" fill={accent} fillOpacity={0.85} />
          <circle cx={124} cy={46} r={12} fill={accent} fillOpacity={0.85} />
          <ellipse cx={124} cy={46} rx={19} ry={25} fill="none" stroke="#fff" strokeWidth={1.8} strokeDasharray="4 3" />
          <Pill x={102} y={86} w={44} label="35×45" color={accent} size={8} />
        </>
      );
    case 'compress-image':
      return (
        <>
          <rect x={20} y={28} width={78} height={62} rx={7} className={SURFACE} strokeWidth={1.5} />
          <Mountains x={26} y={34} w={66} h={50} color={accent} />
          <Arrow d="M104 50 L116 60 L104 70" color={accent} />
          <Arrow d="M148 50 L136 60 L148 70" color={accent} />
          <rect x={128} y={44} width={50} height={40} rx={6} className={SURFACE} strokeWidth={1.5} />
          <Mountains x={133} y={49} w={40} h={30} color={accent} />
          <Pill x={134} y={86} w={38} label="−70%" color={accent} size={9} />
        </>
      );
    case 'merge':
      return (
        <>
          <Page x={18} y={36} w={40} h={52} rotate={-10}><Lines x={7} y={9} w={26} rows={4} gap={6} /></Page>
          <Page x={30} y={30} w={40} h={52} rotate={-2}><Lines x={7} y={9} w={26} rows={4} gap={6} /></Page>
          <Page x={42} y={24} w={40} h={52} rotate={8}><Lines x={7} y={9} w={26} rows={4} gap={6} /></Page>
          <Arrow d="M92 60 H110 M104 54 L110 60 L104 66" color={accent} />
          <Page x={120} y={22} w={58} h={76}>
            <rect x={8} y={9} width={42} height={5} rx={2.5} fill={accent} />
            <Lines x={8} y={22} w={42} rows={6} gap={7} />
            <Pill x={10} y={62} w={38} label="1 PDF" color={accent} size={8} />
          </Page>
        </>
      );
    case 'split':
      return (
        <>
          <path d="M44 24 H92 V96 H44 Q38 96 38 90 V30 Q38 24 44 24 Z" className={SURFACE} strokeWidth={1.5} />
          <Lines x={46} y={36} w={36} rows={5} gap={8} />
          <path d="M108 24 H156 Q162 24 162 30 V90 Q162 96 156 96 H108 Z" className={SURFACE} strokeWidth={1.5} />
          <Lines x={116} y={36} w={36} rows={5} gap={8} />
          <path d="M100 12 V108" stroke={accent} strokeWidth={2.4} strokeDasharray="5 4" strokeLinecap="round" />
          <circle cx={100} cy={12} r={9} fill={accent} />
          <path d="M96 9 L104 15 M104 9 L96 15" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
        </>
      );
    case 'compress-pdf':
      return (
        <>
          <Arrow d="M30 60 H52 M44 52 L52 60 L44 68" color={accent} />
          <Arrow d="M170 60 H148 M156 52 L148 60 L156 68" color={accent} />
          <Page x={72} y={20} w={56} h={80}>
            <rect x={8} y={9} width={40} height={5} rx={2.5} fill={accent} />
            <Lines x={8} y={22} w={40} rows={5} gap={7} />
            <Pill x={8} y={62} w={40} label="PDF" color={accent} />
          </Page>
          <Pill x={110} y={86} w={46} label="−60%" color="#0F172A" size={9} />
        </>
      );
    case 'images-to-pdf':
      return (
        <>
          <Page x={16} y={34} w={44} h={52} rotate={-10}><Mountains x={6} y={6} w={32} h={40} color="#D97706" /></Page>
          <Page x={30} y={28} w={44} h={52} rotate={2}><Mountains x={6} y={6} w={32} h={40} color="#2563EB" /></Page>
          <ArrowBadge x={96} y={60} color={accent} />
          <FileIcon format="pdf" x={118} y={22} />
        </>
      );
    case 'organize':
      return (
        <>
          {[0, 1, 2].flatMap((col) => [0, 1].map((row) => {
            const n = col * 2 + row + 1;
            const lifted = n === 3;
            return (
              <g key={n} transform={lifted ? 'translate(0 -5)' : undefined}>
                <Page x={30 + col * 46} y={10 + row * 52} w={38} h={46} rotate={lifted ? 6 : 0}>
                  {lifted && <rect width={38} height={46} rx={6} fill="none" stroke={accent} strokeWidth={2.2} />}
                  <Lines x={7} y={9} w={24} rows={3} gap={6} />
                  <text x={19} y={40} textAnchor="middle" fontSize={9} fontWeight={700} fill={lifted ? accent : '#94A3B8'} className="font-sans">{n}</text>
                </Page>
              </g>
            );
          }))}
        </>
      );
    case 'rotate':
      return (
        <>
          <Page x={72} y={22} w={56} h={76} rotate={0}><g opacity={0.5}><rect width={56} height={76} rx={6} fill="none" stroke={accent} strokeWidth={1.5} strokeDasharray="4 3" /></g></Page>
          <Page x={72} y={22} w={56} h={76} rotate={-16}>
            <rect x={8} y={9} width={40} height={5} rx={2.5} fill={accent} />
            <Lines x={8} y={22} w={40} rows={6} gap={7} />
          </Page>
          <path d="M150 44 A42 42 0 0 0 100 12" fill="none" stroke={accent} strokeWidth={3.4} strokeLinecap="round" transform="translate(0 0)" />
          <path d="M92 14 L103 6 L104 20 Z" fill={accent} transform="rotate(-10 100 12)" />
        </>
      );
    case 'crop':
      return (
        <>
          <Page x={68} y={16} w={64} h={88}>
            <Lines x={9} y={14} w={46} rows={9} gap={8} />
          </Page>
          <path d="M68 16 H132 V104 H68 Z M82 34 V80 H118 V34 Z" fillRule="evenodd" fill="#0F172A" fillOpacity={0.07} />
          <rect x={82} y={34} width={36} height={46} fill="none" stroke={accent} strokeWidth={1.5} strokeDasharray="4 3" />
          {[[82, 34, 1, 1], [118, 34, -1, 1], [82, 80, 1, -1], [118, 80, -1, -1]].map(([cx, cy, dx, dy]) => (
            <path key={`${cx}-${cy}`} d={`M${cx + dx * 9} ${cy} H${cx} V${cy + dy * 9}`} fill="none" stroke={accent} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </>
      );
    case 'page-numbers':
      return (
        <>
          <Page x={92} y={16} w={56} h={76} rotate={8}>
            <Lines x={8} y={10} w={40} rows={6} gap={7} />
            <circle cx={28} cy={64} r={7} fill={accent} fillOpacity={0.5} />
          </Page>
          <Page x={52} y={24} w={56} h={76}>
            <rect x={8} y={9} width={40} height={5} rx={2.5} fill={accent} fillOpacity={0.7} />
            <Lines x={8} y={22} w={40} rows={5} gap={7} />
            <circle cx={28} cy={64} r={8} fill={accent} />
            <text x={28} y={67.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff" className="font-sans">1</text>
          </Page>
        </>
      );
    case 'watermark':
      return (
        <>
          <Page x={62} y={16} w={76} h={90}>
            <rect x={10} y={10} width={56} height={5} rx={2.5} fill={accent} fillOpacity={0.7} />
            <Lines x={10} y={24} w={56} rows={8} gap={8} />
            <text x={38} y={58} textAnchor="middle" fontSize={17} fontWeight={800} letterSpacing={2} fill={accent} fillOpacity={0.42} transform="rotate(-32 38 52)" className="font-sans">DRAFT</text>
          </Page>
        </>
      );
  }
}

export function ToolVisual({
  spec,
  tone,
  className,
}: {
  spec: ToolVisualSpec;
  tone: Tone;
  className?: string;
}) {
  const accent = ACCENT[tone];
  return (
    <div className={cn('relative aspect-[5/3] w-full overflow-hidden bg-gradient-to-br', BACKDROP[tone], className)} aria-hidden="true">
      <svg viewBox="0 0 200 120" className="absolute inset-0 h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.04]" preserveAspectRatio="xMidYMid meet" focusable="false">
        <circle cx={168} cy={14} r={34} fill={accent} fillOpacity={0.07} />
        <circle cx={18} cy={108} r={30} fill={accent} fillOpacity={0.07} />
        {spec.type === 'convert' ? (
          <>
            <FileIcon format={spec.from} x={22} y={24} rotate={-4} />
            <ArrowBadge x={100} y={60} color={accent} />
            <FileIcon format={spec.to} x={122} y={24} rotate={4} />
          </>
        ) : (
          <Scene scene={spec.scene} accent={accent} />
        )}
      </svg>
    </div>
  );
}
