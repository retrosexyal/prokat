import type { ObjectId } from "mongodb";

export type CategoryIndexingMode = "index" | "noindex";

export type CategoryFaqItem = {
  q: string;
  a: string;
};

export type CategoryDoc = {
  _id?: ObjectId;
  name: string;
  slug: string;

  parentId?: ObjectId | null;
  level: 1 | 2;

  isActive: boolean;
  sortOrder: number;
  indexingMode: CategoryIndexingMode;

  seoTitle?: string;
  seoDescription?: string;
  h1?: string;
  introText?: string;
  synonyms?: string[];
  faq?: CategoryFaqItem[];

  createdAt: Date;
  updatedAt: Date;
};

export type CategoryView = {
  _id?: string;
  name: string;
  slug: string;

  parentId: string | null;
  level: 1 | 2;

  isActive: boolean;
  sortOrder: number;
  indexingMode: CategoryIndexingMode;

  seoTitle: string;
  seoDescription: string;
  h1: string;
  introText: string;
  synonyms: string[];
  faq: CategoryFaqItem[];

  createdAt: string;
  updatedAt: string;
};

export type CreateCategoryInput = {
  name: string;
  slug?: string;
  parentId?: string | null;

  isActive?: boolean;
  sortOrder?: number;
  indexingMode?: CategoryIndexingMode;

  seoTitle?: string;
  seoDescription?: string;
  h1?: string;
  introText?: string;
  synonyms?: string[];
  faq?: CategoryFaqItem[];
};