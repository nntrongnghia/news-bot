import type { Synthesis as SynthesisType } from '../api/client';

interface Props {
  synthesis: SynthesisType;
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-gray-700 dark:text-gray-300 text-sm pl-4 border-l-2 border-gray-300 dark:border-gray-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Synthesis({ synthesis }: Props) {
  return (
    <div className="space-y-5">
      <Section title="Diễn Biến Chính" items={synthesis.keyDevelopments} />
      <Section title="Yếu Tố Giá" items={synthesis.priceDrivers} />
      <Section title="Tín Hiệu Cung Cầu" items={synthesis.supplyDemandSignals} />
      <Section title="Yếu Tố Địa Chính Trị" items={synthesis.geopoliticalFactors} />
      {synthesis.outlook && (
        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-2">
            Triển Vọng
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm">{synthesis.outlook}</p>
        </div>
      )}
    </div>
  );
}
