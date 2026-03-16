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
  domesticPolicy: string[];
  pvnOperations: string[];
  electricitySupplyDemand: string;
  coalImports: string;
  lngProjects: string;
  renewableTransition: string;
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
          messages: [
            {
              role: 'system',
              content: `Ngày hôm nay: ${today}

Bạn là chuyên gia phân tích cấp cao (senior analyst) tại ngân hàng đầu tư quốc tế, chuyên về thị trường năng lượng (dầu thô, khí đốt, LNG, nhiên liệu). Tóm tắt bài viết sau trong 8-12 câu bằng tiếng Việt.

Quy tắc:
- THÔNG TIN QUAN TRỌNG NHẤT TRƯỚC: Viết theo cấu trúc kim tự tháp ngược — thông tin có tác động lớn nhất đến thị trường đặt ở đầu, chi tiết bổ sung sau.
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
- Nếu bài viết về thị trường năng lượng Việt Nam (PetroVietnam, PVN, EVN, PV Gas, Petrolimex, PDP8, QHĐ8, điện lực, dầu khí Việt Nam), phân tích chi tiết và thêm tiền tố [VN] vào đầu tóm tắt.
- Nếu bài viết không liên quan trực tiếp đến thị trường năng lượng, chỉ ghi: "Bài viết không liên quan trực tiếp đến thị trường năng lượng."
- Nếu nội dung bài quá ngắn hoặc không rõ, tóm tắt dựa trên tiêu đề và ghi chú "[dựa trên tiêu đề]".
- Không suy đoán hay thêm thông tin ngoài bài viết. Giữ giọng văn chuyên nghiệp, khách quan.`,
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
      const contentSection = s.content ? `\nNội dung gốc:\n${s.content}` : '';
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
    messages: [
      {
        role: 'system',
        content: `Ngày phân tích: ${today}

Bạn là Trưởng Bộ Phận Phân Tích Thị Trường Năng Lượng (Head of Energy Market Analysis) tại ngân hàng đầu tư quốc tế. Phân tích các bài viết dưới đây (bao gồm tóm tắt và nội dung gốc) và tạo báo cáo tình báo thị trường chất lượng đầu tư (investment-grade) bằng tiếng Việt.

Quy tắc phân tích:
- Ưu tiên thông tin có số liệu cụ thể (giá, sản lượng, tồn kho) hơn nhận định chung chung.
- Khi các nguồn mâu thuẫn, nêu cả hai góc nhìn và ĐÁNH GIÁ ĐỘ TIN CẬY của từng nguồn.
- Bỏ qua bài viết được đánh dấu "không liên quan đến thị trường năng lượng".
- PHÂN BIỆT RÕ giữa DỮ KIỆN (fact) và DỰ BÁO (forecast). Dữ kiện dùng thì quá khứ/hiện tại, dự báo phải ghi rõ nguồn dự báo.
- KẾT NỐI CÁC SỰ KIỆN: Không phân tích từng tin riêng lẻ — hãy kết nối các sự kiện thành bức tranh tổng thể của thị trường.
- ƯU TIÊN TIN MỚI NHẤT: Ngày phân tích là ${today}. Tin đăng trong 24 giờ gần nhất được ưu tiên CAO NHẤT. Tin cũ hơn 24 giờ chỉ dùng làm bối cảnh bổ sung, KHÔNG đưa vào keyDevelopments trừ khi vẫn đang tác động thị trường. Nêu rõ mốc thời gian của từng sự kiện.
- Nếu chỉ có 1-2 bài, giới hạn mỗi mục 1-2 điểm; nếu mục nào không có dữ liệu, để mảng rỗng [] hoặc chuỗi rỗng "".

QUAN TRỌNG: Mỗi điểm trong keyDevelopments, priceDrivers, supplyDemandSignals, geopoliticalFactors PHẢI bao gồm chi tiết cụ thể từ bài viết gốc — con số cụ thể (giá, khối lượng, %), tên quan chức/chuyên gia được trích dẫn, ngày tháng, và nguồn tin. Không viết tổng hợp chung chung mà phải là tình báo chi tiết.

TRÍCH DẪN NGUỒN: Mỗi điểm phân tích PHẢI kèm số tham chiếu nguồn bài viết dạng [1], [2], [3]... tương ứng với số thứ tự bài viết được cung cấp. Người đọc cần biết thông tin đến từ bài viết nào để kiểm chứng. VD: "Giá Brent tăng 2.1% lên $82.4/thùng sau quyết định cắt giảm của OPEC+ [1][3]."

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
    "domesticPolicy": ["..."],
    "pvnOperations": ["..."],
    "electricitySupplyDemand": "...",
    "coalImports": "...",
    "lngProjects": "...",
    "renewableTransition": "..."
  }
}

Hướng dẫn từng mục:
- title: Tiêu đề báo cáo ngắn gọn 10-15 từ bằng tiếng Việt, kiểu tiêu đề báo chí, tóm tắt diễn biến thị trường quan trọng nhất. VD: "Giá dầu Brent vượt $85 sau quyết định cắt giảm sản lượng của OPEC+"
- keyDevelopments: 3-5 sự kiện quan trọng nhất, mỗi điểm 2-3 câu với số liệu cụ thể và nguồn tham chiếu (VD: "OPEC+ quyết định cắt giảm 1.2 triệu thùng/ngày từ tháng 4, theo tuyên bố của Tổng thư ký Haitham Al Ghais ngày 15/3 (Reuters). Quyết định này vượt kỳ vọng thị trường và đẩy giá Brent tăng 3.2%."). Bắt đầu bằng hành động cụ thể.
- priceDrivers: Yếu tố đang đẩy giá lên (↑) hoặc xuống (↓), nêu rõ hướng tác động. Phân biệt yếu tố ngắn hạn vs cấu trúc. Trích dẫn biến động giá cụ thể (VD: "Brent +2.1% lên $82.4/thùng").
- supplyDemandSignals: Bao gồm cả tín hiệu thị trường vật chất (physical) và thị trường giấy (paper/derivatives) nếu có. Kèm số liệu cụ thể.
- geopoliticalFactors: Chỉ nêu yếu tố địa chính trị CÓ ẢNH HƯỞNG TRỰC TIẾP đến năng lượng. Kèm đánh giá mức độ rủi ro (CAO/TRUNG BÌNH/THẤP). Để mảng rỗng nếu không có.
- outlook: 3-4 câu về triển vọng ngắn hạn (1-2 tuần). Câu đầu nêu xu hướng chính, câu sau nêu khoảng giá dự kiến nếu có dữ liệu, và các yếu tố rủi ro cần theo dõi.
- expertAnalysis: 1 đoạn văn 5-8 câu phân tích chuyên sâu — kết nối các sự kiện riêng lẻ thành bức tranh tổng thể, xác định xu hướng chủ đạo (dominant narrative) của thị trường hiện tại. Nêu rõ các tín hiệu ngược chiều (contrarian signals) nếu có — ví dụ thị trường đang bullish nhưng có dấu hiệu cảnh báo. Đánh giá tác động tổng hợp lên thị trường. Đây là phần thể hiện tư duy phân tích cấp cao nhất.
- predictions: Dự báo có cấu trúc dựa trên dữ liệu hiện có:
  + shortTerm: Dự báo 1-2 tuần tới. Nêu 3 kịch bản: cơ sở (base case, xác suất cao nhất), tăng giá (bull case), giảm giá (bear case). Kèm mức độ tin cậy (confidence) định tính.
  + mediumTerm: Dự báo 1-3 tháng, kèm các yếu tố có thể thay đổi kịch bản (catalysts). Nêu rõ xu hướng cấu trúc vs biến động ngắn hạn.
  + keyLevels: Các mức hỗ trợ/kháng cự quan trọng nếu có dữ liệu giá (VD: "Brent hỗ trợ $78, kháng cự $85").
- riskAssessment: 2-4 rủi ro chính kèm xác suất định tính (VD: "Rủi ro gián đoạn nguồn cung từ Trung Đông — xác suất TRUNG BÌNH, tác động CAO nếu xảy ra").
- vietnamMarket: Phần phân tích riêng cho thị trường năng lượng Việt Nam. Chỉ điền khi có bài viết liên quan đến Việt Nam (có tiền tố [VN]). Nếu không có dữ liệu, để mảng rỗng [] và chuỗi rỗng "".
  + domesticPolicy: Chính sách năng lượng trong nước (QHĐ8/PDP8, quy hoạch điện, giá điện, cơ chế mua bán điện trực tiếp DPPA, v.v.)
  + pvnOperations: Hoạt động của PetroVietnam và các công ty con (PV Gas, PVOIL, PVPower, Petrolimex) — sản lượng, doanh thu, dự án mới.
  + electricitySupplyDemand: Tình hình cung cầu điện, công suất phát điện, tình trạng thiếu điện nếu có.
  + lngProjects: Tiến độ các dự án LNG (Thị Vải, Sơn Mỹ, Bạc Liêu, Cà Ná) và nhập khẩu LNG.
- KẾT NỐI TOÀN CẦU - VIỆT NAM: Khi phân tích vietnamMarket, liên hệ các sự kiện toàn cầu tác động đến Việt Nam (VD: giá dầu thế giới tăng → chi phí nhập khẩu nhiên liệu của Việt Nam, quyết định OPEC+ → giá xăng nội địa).`,
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
      domesticPolicy: [],
      pvnOperations: [],
      electricitySupplyDemand: '',
      coalImports: '',
      lngProjects: '',
      renewableTransition: '',
    },
    sources: [],
  };

  return { ...defaultSynthesis, ...parsed, sources } satisfies Synthesis;
}
