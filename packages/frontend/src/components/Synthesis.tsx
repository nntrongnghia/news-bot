import type { Synthesis as SynthesisType } from '../api/client';

interface Props {
  synthesis: SynthesisType | string;
}

function parseSynthesis(raw: SynthesisType | string): SynthesisType | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as SynthesisType;
    } catch {
      console.error('Failed to parse synthesis string:', raw);
      return null;
    }
  }
  // Handle bad shape: {"0": {actual data}, "keyDevelopments": [], ...}
  if (raw && typeof raw === 'object' && '0' in raw && typeof (raw as Record<string, unknown>)['0'] === 'object') {
    return (raw as Record<string, unknown>)['0'] as SynthesisType;
  }
  return raw;
}

function Section({ title, items }: { title: string; items?: string[] }) {
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

export default function Synthesis({ synthesis: raw }: Props) {
  const synthesis = parseSynthesis(raw);

  if (!synthesis) {
    return <p className="text-gray-400 dark:text-gray-500 text-sm">Chưa có dữ liệu phân tích.</p>;
  }

  const hasContent =
    synthesis.keyDevelopments?.length ||
    synthesis.priceDrivers?.length ||
    synthesis.supplyDemandSignals?.length ||
    synthesis.geopoliticalFactors?.length ||
    synthesis.outlook ||
    synthesis.expertAnalysis ||
    synthesis.predictions ||
    synthesis.riskAssessment?.length;

  if (!hasContent) {
    return <p className="text-gray-400 dark:text-gray-500 text-sm">Chưa có dữ liệu phân tích.</p>;
  }

  return (
    <div className="space-y-5">
      <Section title="Diễn Biến Chính" items={synthesis.keyDevelopments} />

      {synthesis.expertAnalysis && (
        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-2">
            Phân Tích Chuyên Gia
          </h3>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
            {synthesis.expertAnalysis}
          </p>
        </div>
      )}

      <Section title="Yếu Tố Giá" items={synthesis.priceDrivers} />
      <Section title="Tín Hiệu Cung Cầu" items={synthesis.supplyDemandSignals} />
      <Section title="Yếu Tố Địa Chính Trị" items={synthesis.geopoliticalFactors} />

      {synthesis.predictions && (synthesis.predictions.shortTerm || synthesis.predictions.mediumTerm || synthesis.predictions.keyLevels) && (
        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-2">
            Dự Báo
          </h3>
          <ul className="space-y-1">
            {synthesis.predictions.shortTerm && (
              <li className="text-gray-700 dark:text-gray-300 text-sm pl-4 border-l-2 border-blue-400 dark:border-blue-600">
                <span className="font-medium text-blue-500 dark:text-blue-400">Ngắn hạn (1-2 tuần):</span> {synthesis.predictions.shortTerm}
              </li>
            )}
            {synthesis.predictions.mediumTerm && (
              <li className="text-gray-700 dark:text-gray-300 text-sm pl-4 border-l-2 border-blue-400 dark:border-blue-600">
                <span className="font-medium text-blue-500 dark:text-blue-400">Trung hạn (1-3 tháng):</span> {synthesis.predictions.mediumTerm}
              </li>
            )}
            {synthesis.predictions.keyLevels && (
              <li className="text-gray-700 dark:text-gray-300 text-sm pl-4 border-l-2 border-blue-400 dark:border-blue-600">
                <span className="font-medium text-blue-500 dark:text-blue-400">Mức giá quan trọng:</span> {synthesis.predictions.keyLevels}
              </li>
            )}
          </ul>
        </div>
      )}

      <Section title="Đánh Giá Rủi Ro" items={synthesis.riskAssessment ?? []} />

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
