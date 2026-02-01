import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { ToolResult } from "../types";
import { wrapToolError, wrapToolSuccess } from "../utils";

const RAPIDAPI_CRUNCHBASE_URL =
  "https://crunchbase-crunchbase-v1.p.rapidapi.com";

interface CrunchbaseCompany {
  uuid: string;
  name: string;
  shortDescription?: string;
  fullDescription?: string;
  foundedOn?: string;
  homepageUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  headquartersLocation?: string;
  numEmployeesEnum?: string;
  fundingTotal?: number;
  fundingRounds?: number;
  lastFundingType?: string;
  lastFundingAmount?: number;
  lastFundingDate?: string;
  categories?: string[];
  status?: string;
}

interface CrunchbaseSearchResponse {
  count: number;
  entities: CrunchbaseCompany[];
}

function getRapidApiKey(): string {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY environment variable is not set");
  }
  return apiKey;
}

const CrunchbaseSearchSchema = z.object({
  query: z.string().describe("Company name or keyword to search for"),
  limit: z.number().int().min(1).max(50).optional().default(10),
  location: z
    .string()
    .optional()
    .describe("Filter by location (e.g., 'San Francisco')"),
  category: z
    .string()
    .optional()
    .describe("Filter by industry category (e.g., 'Artificial Intelligence')"),
  fundingType: z
    .enum([
      "seed",
      "series_a",
      "series_b",
      "series_c",
      "series_d",
      "private_equity",
      "ipo",
    ])
    .optional()
    .describe("Filter by last funding type"),
  minFunding: z
    .number()
    .optional()
    .describe("Minimum total funding in USD"),
  maxFunding: z
    .number()
    .optional()
    .describe("Maximum total funding in USD"),
});

export const crunchbaseSearchTool = tool(
  async (input): Promise<ToolResult<CrunchbaseSearchResponse>> => {
    const startTime = Date.now();
    try {
      const apiKey = getRapidApiKey();

      const params = new URLSearchParams({
        query: input.query,
        page_size: String(input.limit),
      });

      if (input.location) {
        params.append("locations", input.location);
      }
      if (input.category) {
        params.append("categories", input.category);
      }
      if (input.fundingType) {
        params.append("funding_type", input.fundingType);
      }
      if (input.minFunding) {
        params.append("min_funding", String(input.minFunding));
      }
      if (input.maxFunding) {
        params.append("max_funding", String(input.maxFunding));
      }

      const response = await fetch(
        `${RAPIDAPI_CRUNCHBASE_URL}/odm-organizations?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "crunchbase-crunchbase-v1.p.rapidapi.com",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Crunchbase API error: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();

      const entities: CrunchbaseCompany[] = (
        data.entities || []
      ).map((entity: Record<string, unknown>) => {
        const props = entity.properties as Record<string, unknown> | undefined;
        return {
          uuid: entity.uuid as string,
          name: props?.name as string,
          shortDescription: props?.short_description as string | undefined,
          fullDescription: props?.description as string | undefined,
          foundedOn: props?.founded_on as string | undefined,
          homepageUrl: props?.homepage_url as string | undefined,
          linkedinUrl: props?.linkedin_url as string | undefined,
          twitterUrl: props?.twitter_url as string | undefined,
          facebookUrl: props?.facebook_url as string | undefined,
          headquartersLocation: props?.headquarters_location as string | undefined,
          numEmployeesEnum: props?.num_employees_enum as string | undefined,
          fundingTotal: props?.funding_total_usd as number | undefined,
          fundingRounds: props?.num_funding_rounds as number | undefined,
          lastFundingType: props?.last_funding_type as string | undefined,
          lastFundingAmount: props?.last_funding_total_usd as number | undefined,
          lastFundingDate: props?.last_funding_at as string | undefined,
          categories: props?.categories as string[] | undefined,
          status: props?.status as string | undefined,
        };
      });

      return wrapToolSuccess(
        {
          count: data.count || entities.length,
          entities,
        },
        startTime,
        { source: "crunchbase" }
      );
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "crunchbase_search",
    description:
      "Searches Crunchbase for startups and companies with funding information",
    schema: CrunchbaseSearchSchema,
  }
);

const CrunchbaseGetDetailsSchema = z.object({
  identifier: z
    .string()
    .describe(
      "Company identifier: UUID or permalink (e.g., 'openai' or 'anthropic')"
    ),
});

export const crunchbaseGetDetailsTool = tool(
  async (input): Promise<ToolResult<CrunchbaseCompany | null>> => {
    const startTime = Date.now();
    try {
      const apiKey = getRapidApiKey();

      const response = await fetch(
        `${RAPIDAPI_CRUNCHBASE_URL}/odm-organizations/${input.identifier}`,
        {
          method: "GET",
          headers: {
            "X-RapidAPI-Key": apiKey,
            "X-RapidAPI-Host": "crunchbase-crunchbase-v1.p.rapidapi.com",
          },
        }
      );

      if (response.status === 404) {
        return wrapToolSuccess(null, startTime, { source: "crunchbase" });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Crunchbase API error: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      const props = data.properties || {};

      const company: CrunchbaseCompany = {
        uuid: data.uuid,
        name: props.name,
        shortDescription: props.short_description,
        fullDescription: props.description,
        foundedOn: props.founded_on,
        homepageUrl: props.homepage_url,
        linkedinUrl: props.linkedin_url,
        twitterUrl: props.twitter_url,
        facebookUrl: props.facebook_url,
        headquartersLocation: props.headquarters_location,
        numEmployeesEnum: props.num_employees_enum,
        fundingTotal: props.funding_total_usd,
        fundingRounds: props.num_funding_rounds,
        lastFundingType: props.last_funding_type,
        lastFundingAmount: props.last_funding_total_usd,
        lastFundingDate: props.last_funding_at,
        categories: props.categories,
        status: props.status,
      };

      return wrapToolSuccess(company, startTime, { source: "crunchbase" });
    } catch (error) {
      return wrapToolError(error, startTime);
    }
  },
  {
    name: "crunchbase_get_details",
    description:
      "Gets detailed information about a specific company from Crunchbase",
    schema: CrunchbaseGetDetailsSchema,
  }
);

export const crunchbaseTools = [crunchbaseSearchTool, crunchbaseGetDetailsTool];
