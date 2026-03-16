const BASE_URL = '/api';

async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
  });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Not authenticated');
  }
  return res;
}

export interface Article {
  id: number;
  url: string;
  title: string;
  source: string | null;
  published: string | null;
  fetchedAt: string;
  content: string | null;
  summary: string | null;
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
  title?: string;
  keyDevelopments: string[];
  priceDrivers: string[];
  supplyDemandSignals: string[];
  geopoliticalFactors: string[];
  outlook: string;
  expertAnalysis?: string;
  predictions?: PricePrediction;
  riskAssessment?: string[];
  vietnamMarket?: VietnamMarket;
  sources?: SourceRef[];
}

export interface Report {
  id: number;
  reportKey: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  articleCount: number | null;
  synthesis: Synthesis | null;
  articles: Article[];
}

export async function fetchLatestReport(): Promise<Report | null> {
  const res = await apiFetch(`${BASE_URL}/reports/latest`);
  const data = await res.json();
  if (data.error) return null;
  return data;
}

export async function fetchReport(id: number): Promise<Report | null> {
  const res = await apiFetch(`${BASE_URL}/reports/${id}`);
  const data = await res.json();
  if (data.error) return null;
  return data;
}

export async function fetchReportsByDate(date: string): Promise<Report[]> {
  const res = await apiFetch(`${BASE_URL}/reports?date=${date}`);
  return res.json();
}

export async function fetchTodaysReports(): Promise<Report[]> {
  const today = new Date().toISOString().slice(0, 10);
  return fetchReportsByDate(today);
}

export async function fetchRecentReports(limit: number = 20): Promise<Report[]> {
  const res = await apiFetch(`${BASE_URL}/reports?limit=${limit}`);
  return res.json();
}

export interface CrudePricePoint {
  date: string;
  price: number;
}

export interface CrudePriceData {
  symbol: string;
  currency: string;
  currentPrice: number;
  previousClose: number;
  prices: CrudePricePoint[];
}

export async function fetchCrudePrices(range: string = '1mo', symbol: string = 'CL=F'): Promise<CrudePriceData | null> {
  const res = await apiFetch(`${BASE_URL}/crude-prices?range=${range}&symbol=${encodeURIComponent(symbol)}`);
  const data = await res.json();
  if (data.error) return null;
  return data;
}

export interface FeedbackInput {
  name?: string;
  email?: string;
  category?: string;
  message: string;
}

export async function submitFeedback(input: FeedbackInput): Promise<{ id: number }> {
  const res = await apiFetch(`${BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to submit feedback');
  }
  return res.json();
}

export async function triggerPipeline(): Promise<Report> {
  const res = await apiFetch(`${BASE_URL}/pipeline/run`, { method: 'POST' });
  return res.json();
}

// Admin types and functions

export interface VisitStats {
  today: number;
  week: number;
  month: number;
  uniqueIpsToday: number;
}

export interface DailyVisits {
  date: string;
  count: number;
}

export interface TopPage {
  url: string;
  count: number;
}

export interface VisitData {
  daily: DailyVisits[];
  topPages: TopPage[];
}

export interface PipelineLogEntry {
  id: number;
  trigger: string;
  cronExpr: string | null;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  articleCount: number | null;
  reportId: number | null;
  error: string | null;
}

export async function fetchVisitStats(): Promise<VisitStats> {
  const res = await apiFetch(`${BASE_URL}/admin/visits/stats`);
  return res.json();
}

export async function fetchVisitData(days: number = 7): Promise<VisitData> {
  const res = await apiFetch(`${BASE_URL}/admin/visits?days=${days}`);
  return res.json();
}

export async function fetchPipelineLogs(limit: number = 50): Promise<PipelineLogEntry[]> {
  const res = await apiFetch(`${BASE_URL}/admin/pipeline-logs?limit=${limit}`);
  return res.json();
}
