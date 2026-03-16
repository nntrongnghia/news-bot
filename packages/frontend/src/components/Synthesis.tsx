import { useState, type ReactNode } from 'react';
import type { Synthesis as SynthesisType, VietnamMarket, SourceRef } from '../api/client';

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

function renderWithCitations(text: string, sources?: SourceRef[]): ReactNode {
  if (!sources || sources.length === 0) return text;
  const parts = text.split(/(\[\d+\])/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) return part;
    const idx = parseInt(match[1], 10);
    const source = sources.find((s) => s.index === idx);
    if (!source) return part;
    return (
      <a
        key={i}
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline text-[0.75em] align-super font-medium"
        title={source.title}
      >
        [{idx}]
      </a>
    );
  });
}

function TextBlock({ label, text, sources }: { label: string; text?: string; sources?: SourceRef[] }) {
  if (!text) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.1em] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
        {label}
      </p>
      <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">{renderWithCitations(text, sources)}</p>
    </div>
  );
}

function hasVietnamContent(vm?: VietnamMarket): boolean {
  if (!vm) return false;
  return (
    (vm.fuelPricing?.length > 0) ||
    (vm.supplyChain?.length > 0) ||
    (vm.governmentPolicy?.length > 0) ||
    !!vm.marketDemand ||
    !!vm.marginAnalysis ||
    !!vm.importPrices
  );
}

function CompactList({ title, items, sources }: { title: string; items?: string[]; sources?: SourceRef[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {renderWithCitations(item, sources)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Synthesis({ synthesis: raw }: Props) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
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
              {renderWithCitations(synthesis.keyDevelopments[0], synthesis.sources)}
            </p>
            {synthesis.keyDevelopments.length > 1 && (
              <ul className="space-y-1.5">
                {synthesis.keyDevelopments.slice(1).map((item, i) => (
                  <li key={i} className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed">
                    {renderWithCitations(item, synthesis.sources)}
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
            {renderWithCitations(synthesis.expertAnalysis, synthesis.sources)}
          </p>
        </div>
      )}

      {/* Compact dense lists */}
      <CompactList title="Yếu Tố Giá" items={synthesis.priceDrivers} sources={synthesis.sources} />
      <CompactList title="Tín Hiệu Cung Cầu" items={synthesis.supplyDemandSignals} sources={synthesis.sources} />
      <CompactList title="Yếu Tố Địa Chính Trị" items={synthesis.geopoliticalFactors} sources={synthesis.sources} />

      {/* Vietnam Market */}
      {hasVietnamContent(synthesis.vietnamMarket) && (
        <div>
          <SectionLabel>Thị Trường Xăng Dầu Việt Nam</SectionLabel>
          <div className="space-y-4">
            <CompactList title="Giá Xăng Dầu Bán Lẻ" items={synthesis.vietnamMarket!.fuelPricing} sources={synthesis.sources} />
            <CompactList title="Chuỗi Cung Ứng" items={synthesis.vietnamMarket!.supplyChain} sources={synthesis.sources} />
            <CompactList title="Chính Sách & Thuế" items={synthesis.vietnamMarket!.governmentPolicy} sources={synthesis.sources} />
            <TextBlock label="Nhu Cầu Tiêu Thụ" text={synthesis.vietnamMarket!.marketDemand} sources={synthesis.sources} />
            <TextBlock label="Biên Lợi Nhuận Bán Lẻ" text={synthesis.vietnamMarket!.marginAnalysis} sources={synthesis.sources} />
            <TextBlock label="Giá Nhập Khẩu & Crack Spread" text={synthesis.vietnamMarket!.importPrices} sources={synthesis.sources} />
          </div>
        </div>
      )}

      {/* Predictions — panel with uppercase labels */}
      {synthesis.predictions && (synthesis.predictions.shortTerm || synthesis.predictions.mediumTerm || synthesis.predictions.keyLevels) && (
        <div>
          <SectionLabel>Dự Báo</SectionLabel>
          <div className="bg-stone-100 dark:bg-neutral-900 rounded-lg p-5 space-y-4">
            <TextBlock label="Ngắn hạn (1-2 tuần)" text={synthesis.predictions.shortTerm} sources={synthesis.sources} />
            <TextBlock label="Trung hạn (1-3 tháng)" text={synthesis.predictions.mediumTerm} sources={synthesis.sources} />
            <TextBlock label="Mức giá quan trọng" text={synthesis.predictions.keyLevels} sources={synthesis.sources} />
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
                <span className="text-neutral-600 dark:text-neutral-400 mr-2">—</span>{renderWithCitations(item, synthesis.sources)}
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
              {renderWithCitations(synthesis.outlook, synthesis.sources)}
            </p>
          </blockquote>
        </div>
      )}

      {/* Sources — collapsible */}
      {synthesis.sources && synthesis.sources.length > 0 && (
        <div>
          <button
            onClick={() => setSourcesOpen(!sourcesOpen)}
            className="w-full flex items-center gap-2 pt-6 pb-3 border-t border-neutral-200 dark:border-neutral-800 cursor-pointer"
          >
            <svg
              className={`w-3 h-3 text-neutral-500 transition-transform ${sourcesOpen ? 'rotate-90' : ''}`}
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M4 1l6 5-6 5V1z" />
            </svg>
            <span className="text-xs uppercase tracking-[0.1em] font-semibold text-neutral-700 dark:text-neutral-300">
              Nguồn Tham Chiếu ({synthesis.sources.length})
            </span>
          </button>
          {sourcesOpen && (
            <ol className="space-y-1">
              {synthesis.sources.map((ref) => (
                <li key={ref.index} className="text-sm text-neutral-600 dark:text-neutral-400">
                  <span className="font-medium">[{ref.index}]</span>{' '}
                  <a href={ref.url} target="_blank" rel="noopener noreferrer"
                     className="hover:underline">{ref.title}</a>
                  {ref.source && <span className="ml-1">— {ref.source}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
