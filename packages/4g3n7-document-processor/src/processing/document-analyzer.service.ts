import { Injectable, Logger } from '@nestjs/common';
import * as natural from 'natural';
import * as sentiment from 'sentiment';
import { franc } from 'franc';

export interface DocumentAnalysis {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  paragraphCount: number;
  language: string;
  sentiment: {
    score: number;
    comparative: number;
    positive: string[];
    negative: string[];
  };
  readability: {
    flesch: number;
    grade: number;
  };
  keywords: string[];
  entities: {
    persons: string[];
    organizations: string[];
    locations: string[];
  };
  topics: string[];
}

@Injectable()
export class DocumentAnalyzerService {
  private readonly logger = new Logger(DocumentAnalyzerService.name);
  private readonly sentimentAnalyzer: any;
  private readonly tokenizer: any;

  constructor() {
    this.sentimentAnalyzer = new sentiment();
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Perform comprehensive document analysis
   */
  async analyzeDocument(text: string): Promise<DocumentAnalysis> {
    try {
      this.logger.log('Analyzing document...');

      const wordCount = this.countWords(text);
      const characterCount = text.length;
      const sentenceCount = this.countSentences(text);
      const paragraphCount = this.countParagraphs(text);
      const language = this.detectLanguage(text);
      const sentimentResult = this.analyzeSentiment(text);
      const readability = this.calculateReadability(text);
      const keywords = this.extractKeywords(text);
      const entities = this.extractEntities(text);
      const topics = await this.extractTopics(text);

      return {
        wordCount,
        characterCount,
        sentenceCount,
        paragraphCount,
        language,
        sentiment: sentimentResult,
        readability,
        keywords,
        entities,
        topics,
      };
    } catch (error) {
      this.logger.error(`Error analyzing document: ${error.message}`);
      throw new Error(`Failed to analyze document: ${error.message}`);
    }
  }

  /**
   * Analyze sentiment of text
   */
  private analyzeSentiment(text: string): any {
    const result = this.sentimentAnalyzer.analyze(text);
    return {
      score: result.score,
      comparative: result.comparative,
      positive: result.positive,
      negative: result.negative,
    };
  }

  /**
   * Detect language
   */
  private detectLanguage(text: string): string {
    try {
      const langCode = franc(text);
      return langCode || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Calculate readability scores
   */
  private calculateReadability(text: string): { flesch: number; grade: number } {
    const words = this.countWords(text);
    const sentences = this.countSentences(text);
    const syllables = this.countSyllables(text);

    // Flesch Reading Ease
    const flesch = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);

    // Flesch-Kincaid Grade Level
    const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;

    return {
      flesch: Math.max(0, Math.min(100, flesch)),
      grade: Math.max(0, grade),
    };
  }

  /**
   * Extract keywords using TF-IDF
   */
  private extractKeywords(text: string, limit = 10): string[] {
    try {
      const tfidf = new natural.TfIdf();
      tfidf.addDocument(text);

      const keywords: string[] = [];
      tfidf.listTerms(0).slice(0, limit).forEach((item: any) => {
        keywords.push(item.term);
      });

      return keywords;
    } catch (error) {
      this.logger.error(`Error extracting keywords: ${error.message}`);
      return [];
    }
  }

  /**
   * Extract named entities (basic implementation)
   */
  private extractEntities(text: string): {
    persons: string[];
    organizations: string[];
    locations: string[];
  } {
    // This is a basic implementation
    // For production, use a proper NER library or service
    return {
      persons: [],
      organizations: [],
      locations: [],
    };
  }

  /**
   * Extract topics from text
   */
  private async extractTopics(text: string): Promise<string[]> {
    // Basic topic extraction using keywords
    const keywords = this.extractKeywords(text, 5);
    return keywords;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Count sentences in text
   */
  private countSentences(text: string): number {
    if (!text) return 0;
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  }

  /**
   * Count paragraphs in text
   */
  private countParagraphs(text: string): number {
    if (!text) return 0;
    return text.split(/\n\n+/).filter(p => p.trim().length > 0).length;
  }

  /**
   * Count syllables (approximate)
   */
  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let count = 0;

    for (const word of words) {
      count += this.syllablesInWord(word);
    }

    return count;
  }

  /**
   * Count syllables in a word (approximate)
   */
  private syllablesInWord(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    const vowels = word.match(/[aeiouy]+/g);
    if (!vowels) return 1;

    let count = vowels.length;
    if (word.endsWith('e')) count--;
    if (word.endsWith('le') && word.length > 2) count++;

    return Math.max(1, count);
  }

  /**
   * Classify document by content
   */
  async classifyDocument(text: string): Promise<string[]> {
    const categories: string[] = [];

    // Simple keyword-based classification
    const keywords = this.extractKeywords(text);

    const categoryKeywords: Record<string, string[]> = {
      technical: ['software', 'code', 'system', 'data', 'algorithm'],
      business: ['revenue', 'profit', 'customer', 'market', 'sales'],
      legal: ['contract', 'agreement', 'terms', 'liability', 'clause'],
      medical: ['patient', 'treatment', 'diagnosis', 'medical', 'health'],
      financial: ['investment', 'financial', 'budget', 'expense', 'income'],
    };

    for (const [category, catKeywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter(k => catKeywords.includes(k.toLowerCase()));
      if (matches.length > 0) {
        categories.push(category);
      }
    }

    return categories.length > 0 ? categories : ['general'];
  }
}
