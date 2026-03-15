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

export interface Synthesis {
  keyDevelopments: string[];
  priceDrivers: string[];
  supplyDemandSignals: string[];
  geopoliticalFactors: string[];
  outlook: string;
  expertAnalysis: string;
  predictions: PricePrediction;
  riskAssessment: string[];
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
        const response = await openai.chat.completions.create({
          model: config.models.chat,
          messages: [
            {
              role: 'system',
              content: `Bạn là chuyên gia phân tích cấp cao (senior analyst) tại ngân hàng đầu tư quốc tế, chuyên về thị trường năng lượng (dầu thô, khí đốt, LNG, nhiên liệu). Tóm tắt bài viết sau trong 8-12 câu bằng tiếng Việt.

Quy tắc:
- Tập trung vào: biến động giá, sản lượng, tồn kho, quyết định OPEC+, tín hiệu cung/cầu, rủi ro địa chính trị ảnh hưởng năng lượng.
- Nêu rõ các CON SỐ cụ thể (giá, %, sản lượng barrel/ngày, spread, contango/backwardation) nếu bài viết cung cấp.
- Ghi lại phát biểu/trích dẫn từ quan chức, chuyên gia, nhà phân tích nếu có trong bài.
- Nêu rõ mốc thời gian, ngày cụ thể được đề cập trong bài.
- So sánh với kỳ trước (tuần/tháng/năm trước) nếu bài viết cung cấp dữ liệu so sánh.
- Ghi nhận dự báo hoặc phản ứng thị trường nếu có.
- PHÂN TÍCH NHÂN QUẢ: Giải thích TẠI SAO sự kiện xảy ra và NÓ TÁC ĐỘNG THẾ NÀO đến thị trường năng lượng. Không chỉ mô tả mà phải phân tích chuỗi tác động.
- BỐI CẢNH RỘNG: Liên hệ với xu hướng hiện tại của thị trường, chu kỳ kinh tế, hoặc các sự kiện liên quan gần đây.
- CẤU TRÚC VI MÔ THỊ TRƯỜNG: Nếu có dữ liệu về hợp đồng tương lai (futures), chênh lệch giá (spreads), đường cong kỳ hạn (forward curve), ghi nhận rõ.
- ĐÁNH GIÁ MỨC ĐỘ QUAN TRỌNG: Kết thúc bằng 1 câu đánh giá mức độ ảnh hưởng của tin này đến thị trường (cao/trung bình/thấp).
- Nếu bài viết không liên quan trực tiếp đến thị trường năng lượng, chỉ ghi: "Bài viết không liên quan trực tiếp đến thị trường năng lượng."
- Nếu nội dung bài quá ngắn hoặc không rõ, tóm tắt dựa trên tiêu đề và ghi chú "[dựa trên tiêu đề]".
- Không suy đoán hay thêm thông tin ngoài bài viết. Giữ giọng văn chuyên nghiệp, khách quan.`,
            },
            {
              role: 'user',
              content: `Title: ${article.title}\nSource: ${article.source ?? 'Unknown'}\n\n${article.content ?? 'No content available.'}`,
            },
          ],
          max_tokens: 900,
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
  summaries: { title: string; summary: string; source: string | null }[]
): Promise<Synthesis> {
  const articleBlock = summaries
    .map((s, i) => `[${i + 1}] ${s.title} (${s.source ?? 'Unknown'})\n${s.summary}`)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: config.models.chat,
    messages: [
      {
        role: 'system',
        content: `Bạn là Trưởng Bộ Phận Phân Tích Thị Trường Năng Lượng (Head of Energy Market Analysis) tại ngân hàng đầu tư quốc tế. Phân tích các tóm tắt bài viết dưới đây và tạo báo cáo tình báo thị trường chất lượng đầu tư (investment-grade) bằng tiếng Việt.

Quy tắc phân tích:
- Ưu tiên thông tin có số liệu cụ thể (giá, sản lượng, tồn kho) hơn nhận định chung chung.
- Khi các nguồn mâu thuẫn, nêu cả hai góc nhìn và ĐÁNH GIÁ ĐỘ TIN CẬY của từng nguồn.
- Bỏ qua bài viết được đánh dấu "không liên quan đến thị trường năng lượng".
- PHÂN BIỆT RÕ giữa DỮ KIỆN (fact) và DỰ BÁO (forecast). Dữ kiện dùng thì quá khứ/hiện tại, dự báo phải ghi rõ nguồn dự báo.
- KẾT NỐI CÁC SỰ KIỆN: Không phân tích từng tin riêng lẻ — hãy kết nối các sự kiện thành bức tranh tổng thể của thị trường.
- Nếu chỉ có 1-2 bài, giới hạn mỗi mục 1-2 điểm; nếu mục nào không có dữ liệu, để mảng rỗng [] hoặc chuỗi rỗng "".

QUAN TRỌNG: Mỗi điểm trong keyDevelopments, priceDrivers, supplyDemandSignals, geopoliticalFactors PHẢI bao gồm chi tiết cụ thể từ bài viết gốc — con số cụ thể (giá, khối lượng, %), tên quan chức/chuyên gia được trích dẫn, ngày tháng, và nguồn tin. Không viết tổng hợp chung chung mà phải là tình báo chi tiết.

Trả lời bằng JSON đúng cấu trúc sau:
{
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
  "riskAssessment": ["..."]
}

Hướng dẫn từng mục:
- keyDevelopments: 3-5 sự kiện quan trọng nhất, mỗi điểm 2-3 câu với số liệu cụ thể và nguồn tham chiếu (VD: "OPEC+ quyết định cắt giảm 1.2 triệu thùng/ngày từ tháng 4, theo tuyên bố của Tổng thư ký Haitham Al Ghais ngày 15/3 (Reuters). Quyết định này vượt kỳ vọng thị trường và đẩy giá Brent tăng 3.2%."). Bắt đầu bằng hành động cụ thể.
- priceDrivers: Yếu tố đang đẩy giá lên (↑) hoặc xuống (↓), nêu rõ hướng tác động. Phân biệt yếu tố ngắn hạn vs cấu trúc. Trích dẫn biến động giá cụ thể (VD: "Brent +2.1% lên $82.4/thùng").
- supplyDemandSignals: Bao gồm cả tín hiệu thị trường vật chất (physical) và thị trường giấy (paper/derivatives) nếu có. Kèm số liệu cụ thể.
- geopoliticalFactors: Chỉ nêu yếu tố địa chính trị CÓ ẢNH HƯỞNG TRỰC TIẾP đến năng lượng. Kèm đánh giá mức độ rủi ro (CAO/TRUNG BÌNH/THẤP). Để mảng rỗng nếu không có.
- outlook: 3-4 câu về triển vọng ngắn hạn (1-2 tuần). Câu đầu nêu xu hướng chính, câu sau nêu khoảng giá dự kiến nếu có dữ liệu, và các yếu tố rủi ro cần theo dõi.
- expertAnalysis: 1 đoạn văn 4-6 câu phân tích chuyên sâu — kết nối các sự kiện riêng lẻ thành bức tranh tổng thể, xác định các xu hướng ngầm, đánh giá tác động tổng hợp lên thị trường. Đây là phần thể hiện tư duy phân tích cấp cao nhất.
- predictions: Dự báo có cấu trúc dựa trên dữ liệu hiện có:
  + shortTerm: Dự báo 1-2 tuần tới, kèm kịch bản cơ sở (base case).
  + mediumTerm: Dự báo 1-3 tháng, kèm các yếu tố có thể thay đổi kịch bản.
  + keyLevels: Các mức hỗ trợ/kháng cự quan trọng nếu có dữ liệu giá (VD: "Brent hỗ trợ $78, kháng cự $85").
- riskAssessment: 2-4 rủi ro chính kèm xác suất định tính (VD: "Rủi ro gián đoạn nguồn cung từ Trung Đông — xác suất TRUNG BÌNH, tác động CAO nếu xảy ra").`,
      },
      {
        role: 'user',
        content: articleBlock,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  let parsed = JSON.parse(content);
  if (Array.isArray(parsed)) {
    parsed = parsed[0] ?? {};
  }

  const defaultSynthesis: Synthesis = {
    keyDevelopments: [],
    priceDrivers: [],
    supplyDemandSignals: [],
    geopoliticalFactors: [],
    outlook: '',
    expertAnalysis: '',
    predictions: { shortTerm: '', mediumTerm: '', keyLevels: '' },
    riskAssessment: [],
  };

  return { ...defaultSynthesis, ...parsed } satisfies Synthesis;
}
