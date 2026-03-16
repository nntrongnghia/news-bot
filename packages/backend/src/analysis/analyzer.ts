import OpenAI from 'openai';
import { config } from '../config.js';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: config.openrouterApiKey,
});

interface ArticleForAnalysis {
  id: number;
  title: string;
  content: string | null;
  source: string | null;
  published: Date | null;
}

interface ArticleSummary {
  id: number;
  summary: string;
}

export interface PricePrediction {
  shortTerm: string;
  mediumTerm: string;
  keyLevels: string;
}

export interface VietnamMarket {
  fuelPricing: string[];
  supplyChain: string[];
  governmentPolicy: string[];
  marketDemand: string;
  marginAnalysis: string;
  importPrices: string;
}

export interface SourceRef {
  index: number;
  title: string;
  source: string | null;
  url: string;
  published: string | null;
}

export interface Synthesis {
  title: string;
  keyDevelopments: string[];
  priceDrivers: string[];
  supplyDemandSignals: string[];
  geopoliticalFactors: string[];
  outlook: string;
  expertAnalysis: string;
  predictions: PricePrediction;
  riskAssessment: string[];
  vietnamMarket?: VietnamMarket;
  sources: SourceRef[];
}

export async function summarizeArticles(
  articles: ArticleForAnalysis[]
): Promise<ArticleSummary[]> {
  const summaries: ArticleSummary[] = [];

  // Process in batches of 5 to avoid rate limits
  for (let i = 0; i < articles.length; i += 5) {
    const batch = articles.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (article) => {
        const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const pubDate = article.published ? new Date(article.published).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Không rõ';
        const response = await openai.chat.completions.create({
          model: config.models.summarize,
          temperature: 0.3,
          // @ts-ignore - OpenRouter reasoning parameter
          extra_body: {
            reasoning: { effort: "low" }
          },
          messages: [
            {
              role: 'system',
              content: `Ngày hôm nay: ${today}

Bạn là chuyên gia phân tích cấp cao thị trường năng lượng (dầu thô, khí đốt, LNG, nhiên liệu). Tóm tắt bài viết sau trong 5-8 câu bằng tiếng Việt.

### NGÔN NGỮ:
Viết hoàn toàn bằng tiếng Việt. Không dùng từ tiếng Anh trừ tên riêng (OPEC+, Brent, WTI) và đơn vị đo ($, %). Thay thế: "bullish" → "xu hướng tăng", "bearish" → "xu hướng giảm", "futures" → "hợp đồng kỳ hạn", "spot" → "giá giao ngay", "spread" → "chênh lệch giá", "contango" → "thị trường xuôi", "backwardation" → "thị trường ngược", "crack spread" → "chênh lệch giá chế biến".

### QUY TẮC:
- Viết theo cấu trúc kim tự tháp ngược — thông tin tác động lớn nhất đặt ở đầu.
- Tập trung vào: biến động giá, sản lượng, tồn kho, quyết định OPEC+, tín hiệu cung/cầu, rủi ro địa chính trị.
- Nêu rõ CON SỐ cụ thể (giá, %, sản lượng thùng/ngày) và mốc thời gian nếu có.
- Ghi lại trích dẫn từ quan chức, chuyên gia nếu có. So sánh với kỳ trước nếu bài cung cấp.
- Phân tích nhân quả: TẠI SAO xảy ra và TÁC ĐỘNG THẾ NÀO đến thị trường.
- Kết thúc bằng 1 câu đánh giá mức độ ảnh hưởng (cao/trung bình/thấp).
- Nếu bài về thị trường năng lượng Việt Nam (PVN, EVN, Petrolimex...), thêm tiền tố [VN].
- Nếu không liên quan đến năng lượng, chỉ ghi: "Bài viết không liên quan trực tiếp đến thị trường năng lượng."
- Nếu nội dung quá ngắn, tóm tắt dựa trên tiêu đề và ghi "[dựa trên tiêu đề]".
- Không suy đoán ngoài bài viết. Giọng văn chuyên nghiệp, khách quan.`,
            },
            {
              role: 'user',
              content: `Title: ${article.title}\nSource: ${article.source ?? 'Unknown'}\nPublished: ${pubDate}\n\n${article.content ?? 'No content available.'}`,
            },
          ],
          max_tokens: 2000,
        });

        return {
          id: article.id,
          summary: response.choices[0]?.message?.content ?? 'Summary unavailable.',
        };
      })
    );
    summaries.push(...results);
  }

  return summaries;
}

export async function synthesizeReport(
  summaries: { title: string; summary: string; content: string | null; source: string | null; url: string; published: Date | null }[]
): Promise<Synthesis> {
  const articleBlock = summaries
    .map((s, i) => {
      const date = s.published ? new Date(s.published).toISOString().slice(0, 16).replace('T', ' ') : 'N/A';
      const contentSection = s.content ? `\nNội dung gốc:\n${s.content.slice(0, 1500)}` : '';
      return `[${i + 1}] ${s.title} (${s.source ?? 'Unknown'} — ${date})\nURL: ${s.url}\nTóm tắt:\n${s.summary}${contentSection}`;
    })
    .join('\n\n---\n\n');

  const sources: SourceRef[] = summaries.map((s, i) => ({
    index: i + 1,
    title: s.title,
    source: s.source,
    url: s.url,
    published: s.published?.toISOString() ?? null,
  }));

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const response = await openai.chat.completions.create({
    model: config.models.chat,
    temperature: 0.4,
    // @ts-ignore - OpenRouter reasoning parameter
    extra_body: {
      reasoning: { effort: "high" }
    },
    messages: [
      {
        role: 'system',
        content: `Ngày phân tích: ${today}

Bạn là Trưởng Bộ Phận Phân Tích Thị Trường Năng Lượng tại ngân hàng đầu tư quốc tế. Phân tích các bài viết dưới đây và tạo báo cáo tổng hợp thị trường bằng tiếng Việt.

### NGÔN NGỮ:
Viết hoàn toàn bằng tiếng Việt. KHÔNG dùng từ tiếng Anh trừ tên riêng (OPEC+, Brent, WTI, EIA, IEA) và đơn vị đo ($, %). Bảng thay thế bắt buộc: "bullish" → "xu hướng tăng", "bearish" → "xu hướng giảm", "premium" → "phần bù", "crack spread" → "chênh lệch giá chế biến", "futures" → "hợp đồng kỳ hạn", "spot" → "giá giao ngay", "base case" → "kịch bản cơ sở", "bull case" → "kịch bản tăng", "bear case" → "kịch bản giảm", "force majeure" → "bất khả kháng", "loadings" → "bốc xếp", "offshore" → "ngoài khơi", "onshore" → "trên bờ", "contango" → "thị trường xuôi", "backwardation" → "thị trường ngược", "forward curve" → "đường cong kỳ hạn".

### ĐỘ DÀI:
Viết cho lãnh đạo bận rộn — đọc lướt 3 phút nắm được toàn cảnh. Mỗi điểm súc tích, ưu tiên kết luận và số liệu, bỏ diễn giải dài dòng.

### CHIẾN LƯỢC TỔNG HỢP:
1. ĐỐI CHIẾU NGUỒN: Khi các bài mâu thuẫn → phân tích nguyên nhân (kỳ hạn/khu vực/sản phẩm khác nhau?).
2. KẾT NỐI SỰ KIỆN: Liên kết tin địa chính trị + tồn kho + OPEC+ + giá giao ngay thành bức tranh nhất quán.
3. LỌC NHIỄU: Loại tin cũ, ưu tiên dữ liệu trong 24h. Ngày phân tích: ${today}.

### QUY TẮC:
- Ưu tiên số liệu cụ thể hơn nhận định chung. Phân biệt rõ dữ kiện vs dự báo.
- Bỏ qua bài "không liên quan đến thị trường năng lượng".
- Nếu chỉ có 1-2 bài, giới hạn mỗi mục 1-2 điểm; không có dữ liệu → mảng rỗng [] hoặc chuỗi rỗng "".
- TRÍCH DẪN NGUỒN: Mỗi điểm PHẢI kèm [1], [2]... tương ứng số thứ tự bài viết. VD: "Giá Brent tăng 2.1% lên $82.4/thùng [1][3]."

Trả lời bằng JSON đúng cấu trúc sau:
{
  "title": "...",
  "keyDevelopments": ["..."],
  "priceDrivers": ["..."],
  "supplyDemandSignals": ["..."],
  "geopoliticalFactors": ["..."],
  "outlook": "...",
  "expertAnalysis": "...",
  "predictions": {
    "shortTerm": "...",
    "mediumTerm": "...",
    "keyLevels": "..."
  },
  "riskAssessment": ["..."],
  "vietnamMarket": {
    "fuelPricing": ["..."],
    "supplyChain": ["..."],
    "governmentPolicy": ["..."],
    "marketDemand": "...",
    "marginAnalysis": "...",
    "importPrices": "..."
  }
}

Hướng dẫn từng mục:
- title: Tiêu đề báo chí 10-15 từ, tóm tắt diễn biến quan trọng nhất.
- keyDevelopments: 3-4 sự kiện quan trọng nhất, mỗi điểm 1-2 câu với số liệu then chốt và nguồn tham chiếu [n]. Bắt đầu bằng hành động cụ thể.
- priceDrivers: Tối đa 4 điểm, mỗi điểm 1 câu với số liệu và ký hiệu ↑/↓. VD: "↑ OPEC+ cắt giảm 1.2 triệu thùng/ngày đẩy Brent +2.1% [1]."
- supplyDemandSignals: Tối đa 4 điểm, mỗi điểm 1-2 câu kèm số liệu cụ thể.
- geopoliticalFactors: Tối đa 3 điểm, mỗi điểm 1 câu + mức rủi ro (CAO/TRUNG BÌNH/THẤP). Để mảng rỗng nếu không có.
- outlook: 2-3 câu về triển vọng 1-2 tuần: xu hướng chính, khoảng giá dự kiến, yếu tố rủi ro cần theo dõi.
- expertAnalysis: 3-4 câu phân tích chuyên sâu — kết nối sự kiện thành bức tranh tổng thể, nêu xu hướng chủ đạo và tín hiệu ngược chiều nếu có.
- predictions:
  + shortTerm: Mỗi kịch bản 1 câu với khoảng giá — kịch bản cơ sở, kịch bản tăng, kịch bản giảm.
  + mediumTerm: 2-3 câu dự báo 1-3 tháng, nêu yếu tố có thể thay đổi kịch bản.
  + keyLevels: Các mức hỗ trợ/kháng cự nếu có dữ liệu giá.
- riskAssessment: 2-3 rủi ro chính, mỗi cái 1 câu kèm xác suất và mức tác động.
- vietnamMarket: Chỉ điền khi có bài [VN]. Nếu không có → mảng rỗng [] và chuỗi rỗng "". Phân tích cho nhà quản lý chuỗi cây xăng, mỗi điểm trong fuelPricing/supplyChain/governmentPolicy tối đa 2 câu.
  + fuelPricing: Giá bán lẻ hiện tại (RON95-III, E5RON92, DO 0.05S), mức điều chỉnh gần nhất, so sánh kỳ trước.
  + supplyChain: Tình hình nhập khẩu, tồn kho, phân phối của Petrolimex, PVOIL, PV Oil.
  + governmentPolicy: Chính sách thuế, quỹ bình ổn giá, quy định mới.
  + marketDemand: Nhu cầu tiêu thụ nội địa, xu hướng mùa vụ.
  + marginAnalysis: Biên lợi nhuận bán lẻ, mức chiết khấu đại lý, chi phí vận hành.
  + importPrices: Giá nhập khẩu thành phẩm, chênh lệch giá chế biến Singapore, chênh lệch CIF vs giá cơ sở.
- KẾT NỐI TOÀN CẦU - VIỆT NAM: Liên hệ giá dầu thô thế giới → giá thành phẩm Singapore → giá cơ sở VN → giá bán lẻ → biên lợi nhuận cây xăng.`,
      },
      {
        role: 'user',
        content: articleBlock,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  let parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    parsed = parsed[0] ?? {};
  }

  const defaultSynthesis: Synthesis = {
    title: '',
    keyDevelopments: [],
    priceDrivers: [],
    supplyDemandSignals: [],
    geopoliticalFactors: [],
    outlook: '',
    expertAnalysis: '',
    predictions: { shortTerm: '', mediumTerm: '', keyLevels: '' },
    riskAssessment: [],
    vietnamMarket: {
      fuelPricing: [],
      supplyChain: [],
      governmentPolicy: [],
      marketDemand: '',
      marginAnalysis: '',
      importPrices: '',
    },
    sources: [],
  };

  return { ...defaultSynthesis, ...parsed, sources } satisfies Synthesis;
}
