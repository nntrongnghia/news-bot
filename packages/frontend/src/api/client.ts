const BASE_URL = '/api';

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
  const res = await fetch(`${BASE_URL}/reports/latest`);
  const data = await res.json();
  if (data.error) return null;
  return data;
}

export async function fetchReport(id: number): Promise<Report | null> {
  const res = await fetch(`${BASE_URL}/reports/${id}`);
  const data = await res.json();
  if (data.error) return null;
  return data;
}

export async function fetchReportsByDate(date: string): Promise<Report[]> {
  const res = await fetch(`${BASE_URL}/reports?date=${date}`);
  return res.json();
}

export async function fetchTodaysReports(): Promise<Report[]> {
  const today = new Date().toISOString().slice(0, 10);
  return fetchReportsByDate(today);
}

export async function triggerPipeline(): Promise<Report> {
  const res = await fetch(`${BASE_URL}/pipeline/run`, { method: 'POST' });
  return res.json();
}
