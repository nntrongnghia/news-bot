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
  domesticPolicy: string[];
  pvnOperations: string[];
  electricitySupplyDemand: string;
  coalImports: string;
  lngProjects: string;
  renewableTransition: string;
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
