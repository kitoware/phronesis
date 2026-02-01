import { Id } from "../../convex/_generated/dataModel";

export type EmployeeCount =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "501-1000"
  | "1000+";

export type FundingStage =
  | "pre-seed"
  | "seed"
  | "series-a"
  | "series-b"
  | "series-c"
  | "series-d+"
  | "public"
  | "acquired";

export type SourceType = "manual" | "crunchbase" | "linkedin" | "other";

export interface Startup {
  _id: Id<"startups">;
  name: string;
  description: string;
  website?: string;
  linkedinUrl?: string;
  crunchbaseUrl?: string;
  foundedYear?: number;
  headquartersLocation?: string;
  employeeCount?: EmployeeCount;
  fundingStage?: FundingStage;
  totalFunding?: number;
  industries: string[];
  technologies: string[];
  sourceType: SourceType;
  sourceUrl?: string;
  lastUpdated: number;
  createdAt: number;
}

export interface FounderEducation {
  institution: string;
  degree?: string;
  field?: string;
  year?: number;
}

export interface Founder {
  _id: Id<"founders">;
  name: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  email?: string;
  bio?: string;
  startupIds: Id<"startups">[];
  expertise: string[];
  education: FounderEducation[];
  previousCompanies: string[];
  createdAt: number;
  updatedAt: number;
}

export type SignalType =
  | "job-posting"
  | "blog-post"
  | "social-media"
  | "press-release"
  | "funding-announcement"
  | "partnership"
  | "product-update"
  | "other";

export interface ImplicitSignal {
  _id: Id<"implicitSignals">;
  startupId: Id<"startups">;
  problemId?: Id<"startupProblems">;
  signalType: SignalType;
  title: string;
  content: string;
  sourceUrl: string;
  publishedAt?: string;
  inferredIntent?: string;
  confidence: number;
  keywords: string[];
  detectedAt: number;
}
