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

export interface Synthesis {
  keyDevelopments: string[];
  priceDrivers: string[];
  supplyDemandSignals: string[];
  geopoliticalFactors: string[];
  outlook: string;
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
              content: `Bạn là chuyên gia phân tích thị trường năng lượng (dầu thô, khí đốt, LNG, nhiên liệu). Tóm tắt bài viết sau trong 3-4 câu bằng tiếng Việt.

Quy tắc:
- Tập trung vào: biến động giá, sản lượng, tồn kho, quyết định OPEC+, tín hiệu cung/cầu, rủi ro địa chính trị ảnh hưởng năng lượng.
- Nêu rõ các CON SỐ cụ thể (giá, %, sản lượng barrel/ngày) nếu bài viết cung cấp.
- Nếu bài viết không liên quan trực tiếp đến thị trường năng lượng, chỉ ghi: "Bài viết không liên quan trực tiếp đến thị trường năng lượng."
- Nếu nội dung bài quá ngắn hoặc không rõ, tóm tắt dựa trên tiêu đề và ghi chú "[dựa trên tiêu đề]".
- Không suy đoán hay thêm thông tin ngoài bài viết. Giữ giọng văn chuyên nghiệp, khách quan.`,
            },
            {
              role: 'user',
              content: `Title: ${article.title}\nSource: ${article.source ?? 'Unknown'}\n\n${article.content ?? 'No content available.'}`,
            },
          ],
          max_tokens: 300,
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
        content: `Bạn là chuyên gia phân tích thị trường năng lượng. Phân tích các tóm tắt bài viết dưới đây và tạo báo cáo tình báo thị trường bằng tiếng Việt.

Quy tắc phân tích:
- Ưu tiên thông tin có số liệu cụ thể (giá, sản lượng, tồn kho) hơn nhận định chung chung.
- Khi các nguồn mâu thuẫn, nêu cả hai góc nhìn thay vì chọn một bên.
- Bỏ qua bài viết được đánh dấu "không liên quan đến thị trường năng lượng".
- Không suy đoán ngoài dữ liệu được cung cấp.
- Nếu chỉ có 1-2 bài, giới hạn mỗi mục 1-2 điểm; nếu mục nào không có dữ liệu, để mảng rỗng [].

Trả lời bằng JSON đúng cấu trúc sau:
{
  "keyDevelopments": ["..."],
  "priceDrivers": ["..."],
  "supplyDemandSignals": ["..."],
  "geopoliticalFactors": ["..."],
  "outlook": "..."
}

Hướng dẫn từng mục:
- keyDevelopments: 2-4 sự kiện quan trọng nhất, mỗi điểm 1 câu, bắt đầu bằng hành động (VD: "OPEC+ quyết định cắt giảm...", "Tồn kho Mỹ giảm...").
- priceDrivers: Yếu tố đang đẩy giá lên hoặc xuống, nêu rõ hướng tác động.
- supplyDemandSignals: Tín hiệu thay đổi cung hoặc cầu, kèm số liệu nếu có.
- geopoliticalFactors: Chỉ nêu yếu tố địa chính trị CÓ ẢNH HƯỞNG TRỰC TIẾP đến năng lượng. Để mảng rỗng nếu không có.
- outlook: 2-3 câu về triển vọng ngắn hạn (1-2 tuần). Câu đầu nêu xu hướng chính, câu sau nêu rủi ro hoặc yếu tố cần theo dõi.`,
      },
      {
        role: 'user',
        content: articleBlock,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content ?? '{}';
  return JSON.parse(content) as Synthesis;
}
