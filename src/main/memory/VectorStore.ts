export interface VectorEntry {
  id: string;
  text: string;
  category: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  createdAt: number;
}

export class VectorStore {
  private entries: Map<string, VectorEntry> = new Map();

  constructor() {}

  public cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  // Lightweight pseudo-embedding for deterministic local fallback
  public generateSimpleEmbedding(text: string, dimensions = 64): number[] {
    const vector = new Array(dimensions).fill(0);
    const cleaned = text.toLowerCase().trim();
    for (let i = 0; i < cleaned.length; i++) {
      const code = cleaned.charCodeAt(i);
      const index = (code * 31 + i) % dimensions;
      vector[index] += 1 / (1 + i);
    }
    // Normalize
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return norm > 0 ? vector.map((v) => v / norm) : vector;
  }

  public addEntry(entry: {
    id: string;
    text: string;
    category: string;
    metadata?: Record<string, unknown>;
    embedding?: number[];
  }): VectorEntry {
    const embedding = entry.embedding && entry.embedding.length > 0
      ? entry.embedding
      : this.generateSimpleEmbedding(entry.text);

    const record: VectorEntry = {
      id: entry.id,
      text: entry.text,
      category: entry.category,
      metadata: entry.metadata || {},
      embedding,
      createdAt: Date.now(),
    };

    this.entries.set(entry.id, record);
    return record;
  }

  public search(
    query: string,
    options: {
      topK?: number;
      category?: string;
      threshold?: number;
      queryEmbedding?: number[];
    } = {}
  ): Array<{ entry: VectorEntry; score: number }> {
    const topK = options.topK ?? 5;
    const threshold = options.threshold ?? 0.1;
    const queryVec = options.queryEmbedding && options.queryEmbedding.length > 0
      ? options.queryEmbedding
      : this.generateSimpleEmbedding(query);

    const matches: Array<{ entry: VectorEntry; score: number }> = [];

    for (const entry of this.entries.values()) {
      if (options.category && entry.category !== options.category) {
        continue;
      }
      const score = this.cosineSimilarity(queryVec, entry.embedding);
      if (score >= threshold) {
        matches.push({ entry, score });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  }

  public delete(id: string): boolean {
    return this.entries.delete(id);
  }

  public getAll(): VectorEntry[] {
    return Array.from(this.entries.values());
  }

  public clear(): void {
    this.entries.clear();
  }
}
