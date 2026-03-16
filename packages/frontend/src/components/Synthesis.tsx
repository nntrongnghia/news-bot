import type { Synthesis as SynthesisType, VietnamMarket } from '../api/client';

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
    <h3 className="text-xs uppercase tracking-[0.1em] font-semibold text-neutral-700 dark:text-neutral-300 pt-6 pb-3 border-t border-neutral-200 dark:border-neutral-800">
      {children}
    </h3>
  );
}

function TextBlock({ label, text }: { label: string; text?: string }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.1em] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
        {label}
      </p>
      <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">{text}</p>
    </div>
  );
}

function hasVietnamContent(vm?: VietnamMarket): boolean {
  if (!vm) return false;
  return (
    (vm.domesticPolicy?.length > 0) ||
    (vm.pvnOperations?.length > 0) ||
    !!vm.electricitySupplyDemand ||
    !!vm.coalImports ||
    !!vm.lngProjects ||
    !!vm.renewableTransition
  );
}

function CompactList({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">
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
    return <p className="text-neutral-700 dark:text-neutral-300 text-lg">Chưa có dữ liệu phân tích.</p>;
  }

  const hasContent =
    synthesis.keyDevelopments?.length ||
    synthesis.priceDrivers?.length ||
    synthesis.supplyDemandSignals?.length ||
    synthesis.geopoliticalFactors?.length ||
    synthesis.outlook ||
    synthesis.expertAnalysis ||
    synthesis.predictions ||
    synthesis.riskAssessment?.length ||
    hasVietnamContent(synthesis.vietnamMarket);

  if (!hasContent) {
    return <p className="text-neutral-700 dark:text-neutral-300 text-lg">Chưa có dữ liệu phân tích.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Key Developments — lead story pattern */}
      {synthesis.keyDevelopments && synthesis.keyDevelopments.length > 0 && (
        <div>
          <SectionLabel>Diễn Biến Chính</SectionLabel>
          <div className="space-y-3">
            <p className="text-2xl font-semibold text-neutral-800 dark:text-neutral-200 leading-snug">
              {synthesis.keyDevelopments[0]}
            </p>
            {synthesis.keyDevelopments.length > 1 && (
              <ul className="space-y-1.5">
                {synthesis.keyDevelopments.slice(1).map((item, i) => (
                  <li key={i} className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">
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
          <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-300">
            {synthesis.expertAnalysis}
          </p>
        </div>
      )}

      {/* Compact dense lists */}
      <CompactList title="Yếu Tố Giá" items={synthesis.priceDrivers} />
      <CompactList title="Tín Hiệu Cung Cầu" items={synthesis.supplyDemandSignals} />
      <CompactList title="Yếu Tố Địa Chính Trị" items={synthesis.geopoliticalFactors} />

      {/* Vietnam Market */}
      {hasVietnamContent(synthesis.vietnamMarket) && (
        <div>
          <SectionLabel>Thị Trường Năng Lượng Việt Nam</SectionLabel>
          <div className="space-y-4">
            <CompactList title="Chính Sách Năng Lượng" items={synthesis.vietnamMarket!.domesticPolicy} />
            <CompactList title="Hoạt Động PVN & Công Ty Con" items={synthesis.vietnamMarket!.pvnOperations} />
            <TextBlock label="Cung Cầu Điện" text={synthesis.vietnamMarket!.electricitySupplyDemand} />
            <TextBlock label="Nhập Khẩu Than" text={synthesis.vietnamMarket!.coalImports} />
            <TextBlock label="Dự Án LNG" text={synthesis.vietnamMarket!.lngProjects} />
            <TextBlock label="Chuyển Dịch Năng Lượng Tái Tạo" text={synthesis.vietnamMarket!.renewableTransition} />
          </div>
        </div>
      )}

      {/* Predictions — panel with uppercase labels */}
      {synthesis.predictions && (synthesis.predictions.shortTerm || synthesis.predictions.mediumTerm || synthesis.predictions.keyLevels) && (
        <div>
          <SectionLabel>Dự Báo</SectionLabel>
          <div className="bg-stone-100 dark:bg-neutral-900 rounded-lg p-5 space-y-4">
            <TextBlock label="Ngắn hạn (1-2 tuần)" text={synthesis.predictions.shortTerm} />
            <TextBlock label="Trung hạn (1-3 tháng)" text={synthesis.predictions.mediumTerm} />
            <TextBlock label="Mức giá quan trọng" text={synthesis.predictions.keyLevels} />
          </div>
        </div>
      )}

      {/* Risk Assessment — dash-prefixed */}
      {synthesis.riskAssessment && synthesis.riskAssessment.length > 0 && (
        <div>
          <SectionLabel>Đánh Giá Rủi Ro</SectionLabel>
          <ul className="space-y-1.5">
            {synthesis.riskAssessment.map((item, i) => (
              <li key={i} className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">
                <span className="text-neutral-600 dark:text-neutral-400 mr-2">—</span>{item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Outlook — pull-quote style */}
      {synthesis.outlook && (
        <div>
          <SectionLabel>Triển Vọng</SectionLabel>
          <blockquote className="border-l-4 border-neutral-800 dark:border-neutral-200 pl-6">
            <p className="font-serif text-2xl text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {synthesis.outlook}
            </p>
          </blockquote>
        </div>
      )}
    </div>
  );
}
