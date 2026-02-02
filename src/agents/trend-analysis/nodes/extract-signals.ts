/**
 * Extract Signals Node
 * Extracts keywords, topics, and entities from papers using TF-IDF and LLM
 */

import type { TrendAnalysisStateType } from "../state";
import type {
  Paper,
  TrendSignals,
  KeywordSignal,
  TopicSignal,
  EntitySignal,
  TemporalBin,
} from "../../tools/types";
import {
  batchGenerateEmbeddings,
  cosineSimilarity,
} from "../../tools/embedding";
import { openrouter } from "../../tools/llm/openrouter";
import { z } from "zod";

// Stop words to filter out of TF-IDF
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "been",
  "be",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "we",
  "our",
  "they",
  "their",
  "them",
  "which",
  "what",
  "who",
  "whom",
  "how",
  "when",
  "where",
  "why",
  "each",
  "all",
  "both",
  "any",
  "such",
  "more",
  "most",
  "other",
  "some",
  "only",
  "also",
  "than",
  "very",
  "just",
  "about",
  "into",
  "over",
  "after",
  "before",
  "between",
  "through",
  "during",
  "without",
  "under",
  "within",
  "along",
  "across",
  "behind",
  "beyond",
  "plus",
  "except",
  "since",
  "using",
  "used",
  "paper",
  "papers",
  "study",
  "work",
  "propose",
  "proposed",
  "show",
  "shown",
  "results",
  "method",
  "methods",
  "approach",
]);

/**
 * Compute TF-IDF scores for documents
 */
function computeTFIDF(documents: string[]): Map<string, number> {
  const termFreq = new Map<string, number>();
  const docFreq = new Map<string, Set<number>>();

  documents.forEach((doc, docIdx) => {
    const words = doc
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w));
    const uniqueWords = new Set(words);

    words.forEach((word) => {
      termFreq.set(word, (termFreq.get(word) || 0) + 1);
    });

    uniqueWords.forEach((word) => {
      if (!docFreq.has(word)) docFreq.set(word, new Set());
      docFreq.get(word)!.add(docIdx);
    });
  });

  const tfidf = new Map<string, number>();
  const N = documents.length;

  termFreq.forEach((tf, term) => {
    const df = docFreq.get(term)?.size || 1;
    const idf = Math.log(N / df);
    tfidf.set(term, tf * idf);
  });

  return tfidf;
}

/**
 * Cluster and label topics using embeddings and LLM
 */
async function clusterAndLabelTopics(
  papers: Paper[],
  embeddings: number[][]
): Promise<TopicSignal[]> {
  if (papers.length === 0 || embeddings.length === 0) {
    return [];
  }

  // Simple clustering using cosine similarity
  const clusters = new Map<number, number[]>();
  const assigned = new Set<number>();

  // Greedy clustering with 0.75 similarity threshold
  for (let i = 0; i < embeddings.length; i++) {
    if (assigned.has(i)) continue;

    const cluster = [i];
    assigned.add(i);

    for (let j = i + 1; j < embeddings.length; j++) {
      if (assigned.has(j)) continue;

      const similarity = cosineSimilarity(embeddings[i], embeddings[j]);
      if (similarity > 0.75) {
        cluster.push(j);
        assigned.add(j);
      }
    }

    if (cluster.length >= 3) {
      clusters.set(clusters.size, cluster);
    }
  }

  // Label clusters using LLM
  const topics: TopicSignal[] = [];

  for (const [clusterId, paperIndices] of Array.from(clusters.entries())) {
    if (topics.length >= 10) break; // Limit to 10 topics

    const clusterPapers = paperIndices.map((i: number) => papers[i]);
    const titles = clusterPapers.map((p: Paper) => p.title).slice(0, 5);

    try {
      const response = await openrouter.chat({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "user",
            content: `These research papers belong to the same topic cluster. Provide a short topic label (3-5 words) and 5 key keywords.

Paper titles:
${titles.map((t) => `- ${t}`).join("\n")}

Respond with JSON: { "label": "...", "keywords": ["...", "..."] }`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      const label = parsed.label || `Topic ${clusterId}`;
      const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : [];

      topics.push({
        topicId: `topic-${clusterId}`,
        label,
        keywords: keywords.slice(0, 5),
        paperCount: paperIndices.length,
        coherenceScore: 0.8, // Simplified
      });
    } catch (error) {
      console.error(
        `[extract_signals] Failed to label topic ${clusterId}:`,
        error
      );
      topics.push({
        topicId: `topic-${clusterId}`,
        label: `Topic ${clusterId}`,
        keywords: [],
        paperCount: paperIndices.length,
        coherenceScore: 0.5,
      });
    }
  }

  return topics;
}

// Entity extraction schema
const EntityExtractionSchema = z.object({
  methods: z.array(z.string()).describe("ML/AI methods mentioned"),
  datasets: z.array(z.string()).describe("Datasets mentioned"),
  metrics: z.array(z.string()).describe("Evaluation metrics mentioned"),
  models: z.array(z.string()).describe("Model architectures mentioned"),
});

/**
 * Extract entities from papers using LLM
 */
async function extractEntities(papers: Paper[]): Promise<EntitySignal[]> {
  if (papers.length === 0) return [];

  const allEntities: EntitySignal[] = [];

  // Process in batches of 10
  for (let i = 0; i < papers.length; i += 10) {
    const batch = papers.slice(i, i + 10);
    const abstracts = batch.map((p) => p.abstract).join("\n\n---\n\n");

    try {
      const response = await openrouter.chat({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          {
            role: "user",
            content: `Extract ML/AI entities from these paper abstracts.

${abstracts}

Return JSON with arrays: { "methods": [...], "datasets": [...], "metrics": [...], "models": [...] }`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      });

      const parsed = JSON.parse(response.choices[0].message.content);
      const extracted = EntityExtractionSchema.safeParse(parsed);

      if (extracted.success) {
        // Aggregate methods
        extracted.data.methods.forEach((m) => {
          const existing = allEntities.find(
            (e) =>
              e.entity.toLowerCase() === m.toLowerCase() && e.type === "method"
          );
          if (existing) existing.frequency++;
          else
            allEntities.push({
              entity: m,
              type: "method",
              frequency: 1,
              papers: [],
            });
        });

        // Aggregate datasets
        extracted.data.datasets.forEach((d) => {
          const existing = allEntities.find(
            (e) =>
              e.entity.toLowerCase() === d.toLowerCase() && e.type === "dataset"
          );
          if (existing) existing.frequency++;
          else
            allEntities.push({
              entity: d,
              type: "dataset",
              frequency: 1,
              papers: [],
            });
        });

        // Aggregate metrics
        extracted.data.metrics.forEach((m) => {
          const existing = allEntities.find(
            (e) =>
              e.entity.toLowerCase() === m.toLowerCase() && e.type === "metric"
          );
          if (existing) existing.frequency++;
          else
            allEntities.push({
              entity: m,
              type: "metric",
              frequency: 1,
              papers: [],
            });
        });

        // Aggregate models
        extracted.data.models.forEach((m) => {
          const existing = allEntities.find(
            (e) =>
              e.entity.toLowerCase() === m.toLowerCase() && e.type === "model"
          );
          if (existing) existing.frequency++;
          else
            allEntities.push({
              entity: m,
              type: "model",
              frequency: 1,
              papers: [],
            });
        });
      }
    } catch (error) {
      console.error("[extract_signals] Entity extraction batch failed:", error);
    }
  }

  return allEntities.sort((a, b) => b.frequency - a.frequency).slice(0, 50);
}

/**
 * Compute temporal bins for time series analysis
 */
function computeTemporalBins(
  papers: Paper[],
  period: "daily" | "weekly" | "monthly"
): TemporalBin[] {
  if (papers.length === 0) return [];

  const binSize = period === "daily" ? 1 : period === "weekly" ? 1 : 7;
  const bins = new Map<string, Paper[]>();

  papers.forEach((paper) => {
    const date = new Date(paper.publishedDate);
    const binKey = `${date.getFullYear()}-${date.getMonth()}-${Math.floor(date.getDate() / binSize)}`;

    if (!bins.has(binKey)) bins.set(binKey, []);
    bins.get(binKey)!.push(paper);
  });

  return Array.from(bins.entries())
    .map(([, binPapers]) => ({
      startDate: binPapers[0].publishedDate,
      endDate: binPapers[binPapers.length - 1].publishedDate,
      paperCount: binPapers.length,
      avgCitations:
        binPapers.reduce((sum, p) => sum + (p.citationCount || 0), 0) /
        binPapers.length,
      topKeywords: [], // Would be computed from TF-IDF per bin
    }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Extract signals node implementation
 */
export async function extractSignalsNode(
  state: TrendAnalysisStateType
): Promise<Partial<TrendAnalysisStateType>> {
  console.log(
    `[extract_signals] Extracting signals from ${state.papers.length} papers...`
  );

  if (state.papers.length === 0) {
    return {
      signals: { keywords: [], topics: [], entities: [], temporalBins: [] },
      status: "computing_metrics",
      progress: {
        ...state.progress,
        currentNode: "extract_signals",
        signalsExtracted: 0,
      },
    };
  }

  try {
    // 1. Keyword extraction using TF-IDF
    const abstracts = state.papers.map((p) => p.abstract);
    const tfidfScores = computeTFIDF(abstracts);

    // Get top keywords
    const sortedKeywords = Array.from(tfidfScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);

    // Compare with previous period for trend direction
    const prevAbstracts = state.previousPeriodPapers.map((p) => p.abstract);
    const prevTfidf = computeTFIDF(prevAbstracts);

    const keywords: KeywordSignal[] = sortedKeywords.map(([keyword, score]) => {
      const prevScore = prevTfidf.get(keyword) || 0;
      const trend =
        score > prevScore * 1.2
          ? "rising"
          : score < prevScore * 0.8
            ? "falling"
            : "stable";
      return {
        keyword,
        score,
        frequency: state.papers.filter((p) =>
          p.abstract.toLowerCase().includes(keyword.toLowerCase())
        ).length,
        trend,
      };
    });

    // 2. Topic clustering using embeddings + LLM labeling
    const papersForClustering = state.papers.slice(0, 100);
    let topics: TopicSignal[] = [];

    try {
      const embeddings = await batchGenerateEmbeddings(
        papersForClustering.map((p) => p.abstract)
      );
      topics = await clusterAndLabelTopics(papersForClustering, embeddings);
    } catch (error) {
      console.error("[extract_signals] Topic clustering failed:", error);
    }

    // 3. Entity extraction using LLM
    const entities = await extractEntities(state.papers.slice(0, 50));

    // 4. Temporal binning
    const temporalBins = computeTemporalBins(state.papers, state.period);

    const signals: TrendSignals = {
      keywords,
      topics,
      entities,
      temporalBins,
    };

    console.log(
      `[extract_signals] Extracted ${keywords.length} keywords, ${topics.length} topics, ${entities.length} entities`
    );

    return {
      signals,
      status: "computing_metrics",
      progress: {
        ...state.progress,
        currentNode: "extract_signals",
        signalsExtracted: keywords.length + topics.length + entities.length,
      },
    };
  } catch (error) {
    console.error("[extract_signals] Signal extraction failed:", error);
    return {
      signals: { keywords: [], topics: [], entities: [], temporalBins: [] },
      status: "computing_metrics",
      progress: {
        ...state.progress,
        currentNode: "extract_signals",
        signalsExtracted: 0,
      },
      errors: [
        {
          node: "extract_signals",
          error: `Signal extraction failed: ${error}`,
          timestamp: new Date(),
          recoverable: true,
        },
      ],
    };
  }
}
