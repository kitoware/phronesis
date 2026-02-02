import { XMLParser } from "fast-xml-parser";
import type { ArxivPaper, ArxivAuthor } from "../types";

const ARXIV_API_URL = "https://export.arxiv.org/api/query";
const RATE_LIMIT_DELAY_MS = 3000;

let lastRequestTime = 0;

async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_DELAY_MS) {
    const delayNeeded = RATE_LIMIT_DELAY_MS - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, delayNeeded));
  }

  lastRequestTime = Date.now();
}

// Create XML parser with options for arXiv's XML format
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  isArray: (name) => ["entry", "author", "category", "link"].includes(name),
});

interface ArxivXmlAuthor {
  name?: string;
  "arxiv:affiliation"?: string | string[];
}

interface ArxivXmlCategory {
  "@_term"?: string;
}

interface ArxivXmlEntry {
  id?: string;
  title?: string;
  summary?: string;
  published?: string;
  updated?: string;
  author?: ArxivXmlAuthor[];
  category?: ArxivXmlCategory[];
  "arxiv:primary_category"?: { "@_term"?: string };
  "arxiv:doi"?: string;
  "arxiv:journal_ref"?: string;
  "arxiv:comment"?: string;
}

interface ArxivXmlFeed {
  feed?: {
    entry?: ArxivXmlEntry[];
  };
}

function parseAuthors(authors: ArxivXmlAuthor[] | undefined): ArxivAuthor[] {
  if (!authors) return [];

  return authors.map((author) => {
    const name = author.name || "Unknown";
    const affiliationData = author["arxiv:affiliation"];
    let affiliations: string[] | undefined;

    if (affiliationData) {
      if (Array.isArray(affiliationData)) {
        affiliations = affiliationData;
      } else {
        affiliations = [affiliationData];
      }
    }

    return { name, affiliations };
  });
}

function parseCategories(categories: ArxivXmlCategory[] | undefined): string[] {
  if (!categories) return [];
  return categories
    .map((c) => c["@_term"])
    .filter((term): term is string => term !== undefined);
}

function parsePaper(entry: ArxivXmlEntry): ArxivPaper | null {
  const id = entry.id;
  if (!id) return null;

  const arxivId = id.replace("http://arxiv.org/abs/", "").replace(/v\d+$/, "");
  const title = (entry.title || "").replace(/\s+/g, " ").trim();
  const abstract = (entry.summary || "").replace(/\s+/g, " ").trim();
  const authors = parseAuthors(entry.author);
  const categories = parseCategories(entry.category);
  const primaryCategory =
    entry["arxiv:primary_category"]?.["@_term"] || categories[0] || "";
  const publishedDate = entry.published?.split("T")[0] || "";
  const updatedDate = entry.updated?.split("T")[0];
  const pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
  const doi = entry["arxiv:doi"] || undefined;
  const journalRef = entry["arxiv:journal_ref"] || undefined;
  const comments = entry["arxiv:comment"] || undefined;

  return {
    arxivId,
    title,
    abstract,
    authors,
    categories,
    primaryCategory,
    publishedDate,
    updatedDate,
    pdfUrl,
    doi,
    journalRef,
    comments,
  };
}

export interface FetchOptions {
  categories: string[];
  maxResults: number;
  daysBack?: number;
  startIndex?: number;
}

export async function fetchArxivPapers(
  options: FetchOptions
): Promise<ArxivPaper[]> {
  await enforceRateLimit();

  const { categories, maxResults, daysBack = 7, startIndex = 0 } = options;

  // Build category query: (cat:cs.AI OR cat:cs.LG OR cat:cs.CL)
  const categoryQuery = categories.map((c) => `cat:${c}`).join("+OR+");
  const searchQuery = `(${categoryQuery})`;

  const params = new URLSearchParams({
    search_query: searchQuery,
    start: startIndex.toString(),
    max_results: maxResults.toString(),
    sortBy: "submittedDate",
    sortOrder: "descending",
  });

  const url = `${ARXIV_API_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Phronesis/1.0 (research-agent; contact@phronesis.ai)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `arXiv API request failed: ${response.status} ${response.statusText}`
    );
  }

  const xmlText = await response.text();
  const parsed: ArxivXmlFeed = xmlParser.parse(xmlText);

  const entries = parsed.feed?.entry || [];
  const papers: ArxivPaper[] = [];

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  for (const entry of entries) {
    const paper = parsePaper(entry);
    if (!paper) continue;

    // Filter by date
    const paperDate = new Date(paper.publishedDate);
    if (paperDate >= cutoffDate) {
      papers.push(paper);
    }
  }

  return papers;
}

export async function fetchPaperById(
  arxivId: string
): Promise<ArxivPaper | null> {
  await enforceRateLimit();

  const cleanId = arxivId.replace(/v\d+$/, "");
  const url = `${ARXIV_API_URL}?id_list=${cleanId}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Phronesis/1.0 (research-agent; contact@phronesis.ai)",
    },
  });

  if (!response.ok) {
    throw new Error(`arXiv API request failed: ${response.status}`);
  }

  const xmlText = await response.text();
  const parsed: ArxivXmlFeed = xmlParser.parse(xmlText);

  const entries = parsed.feed?.entry || [];
  if (entries.length === 0) return null;

  return parsePaper(entries[0]);
}
