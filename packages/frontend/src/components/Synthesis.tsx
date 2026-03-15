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
  if (raw && typeof raw === 'object' && '0' in raw && typeof (raw as Record<string, unknown>)['0'] === 'object') {
    return (raw as Record<string, unknown>)['0'] as SynthesisType;
  }
  return raw;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 pt-6 pb-3 border-t border-gray-200 dark:border-gray-800">
      {children}
    </h3>
  );
}

function CompactList({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed pl-3 border-l border-gray-300 dark:border-gray-700">
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
    return <p className="text-gray-500 dark:text-gray-400 text-base">Chưa có dữ liệu phân tích.</p>;
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
    return <p className="text-gray-500 dark:text-gray-400 text-base">Chưa có dữ liệu phân tích.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Key Developments — lead story pattern */}
      {synthesis.keyDevelopments && synthesis.keyDevelopments.length > 0 && (
        <div>
          <SectionLabel>Diễn Biến Chính</SectionLabel>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-snug">
              {synthesis.keyDevelopments[0]}
            </p>
            {synthesis.keyDevelopments.length > 1 && (
              <ul className="space-y-1.5">
                {synthesis.keyDevelopments.slice(1).map((item, i) => (
                  <li key={i} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed pl-3 border-l border-gray-300 dark:border-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Expert Analysis — prose block */}
      {synthesis.expertAnalysis && (
        <div>
          <SectionLabel>Phân Tích Chuyên Gia</SectionLabel>
          <p className="text-base leading-relaxed max-w-[65ch] text-gray-700 dark:text-gray-300">
            {synthesis.expertAnalysis}
          </p>
        </div>
      )}

      {/* Compact dense lists */}
      <CompactList title="Yếu Tố Giá" items={synthesis.priceDrivers} />
      <CompactList title="Tín Hiệu Cung Cầu" items={synthesis.supplyDemandSignals} />
      <CompactList title="Yếu Tố Địa Chính Trị" items={synthesis.geopoliticalFactors} />

      {/* Predictions — panel with uppercase labels */}
      {synthesis.predictions && (synthesis.predictions.shortTerm || synthesis.predictions.mediumTerm || synthesis.predictions.keyLevels) && (
        <div>
          <SectionLabel>Dự Báo</SectionLabel>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-5 space-y-4">
            {synthesis.predictions.shortTerm && (
              <div>
                <p className="text-xs uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Ngắn hạn (1-2 tuần)
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{synthesis.predictions.shortTerm}</p>
              </div>
            )}
            {synthesis.predictions.mediumTerm && (
              <div>
                <p className="text-xs uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Trung hạn (1-3 tháng)
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{synthesis.predictions.mediumTerm}</p>
              </div>
            )}
            {synthesis.predictions.keyLevels && (
              <div>
                <p className="text-xs uppercase tracking-[0.12em] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  Mức giá quan trọng
                </p>
                <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">{synthesis.predictions.keyLevels}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Risk Assessment — dash-prefixed */}
      {synthesis.riskAssessment && synthesis.riskAssessment.length > 0 && (
        <div>
          <SectionLabel>Đánh Giá Rủi Ro</SectionLabel>
          <ul className="space-y-1.5">
            {synthesis.riskAssessment.map((item, i) => (
              <li key={i} className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="text-gray-400 dark:text-gray-500 mr-2">—</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Outlook — pull-quote style */}
      {synthesis.outlook && (
        <div>
          <SectionLabel>Triển Vọng</SectionLabel>
          <blockquote className="border-l-4 border-gray-900 dark:border-gray-100 pl-6">
            <p className="font-serif text-xl text-gray-900 dark:text-gray-100 leading-relaxed">
              {synthesis.outlook}
            </p>
          </blockquote>
        </div>
      )}
    </div>
  );
}
