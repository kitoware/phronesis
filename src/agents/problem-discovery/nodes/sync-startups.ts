import type { ProblemDiscoveryStateType } from "../state";
import { CONFIG } from "../config";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const CRUNCHBASE_API_URL =
  "https://crunchbase-crunchbase-v1.p.rapidapi.com/odm-organizations";

interface CrunchbaseOrganization {
  properties: {
    identifier: { uuid: string; permalink: string };
    short_description?: string;
    founded_on?: string;
    num_employees_enum?: string;
    funding_total?: { value_usd: number };
    last_funding_type?: string;
    categories?: Array<{ name: string }>;
    location_identifiers?: Array<{ location_type: string; value: string }>;
    website_url?: string;
    linkedin_url?: string;
  };
}

type EmployeeCount =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "501-1000"
  | "1000+"
  | undefined;

type FundingStage =
  | "pre-seed"
  | "seed"
  | "series-a"
  | "series-b"
  | "series-c"
  | "series-d+"
  | "public"
  | "acquired"
  | undefined;

function mapEmployeeCount(enumValue?: string): EmployeeCount {
  if (!enumValue) return undefined;

  const mapping: Record<string, EmployeeCount> = {
    c_00001_00010: "1-10",
    c_00011_00050: "11-50",
    c_00051_00100: "51-200",
    c_00101_00250: "51-200",
    c_00251_00500: "201-500",
    c_00501_01000: "501-1000",
    c_01001_05000: "1000+",
    c_05001_10000: "1000+",
    c_10001_max: "1000+",
  };

  return mapping[enumValue];
}

function mapFundingStage(fundingType?: string): FundingStage {
  if (!fundingType) return undefined;

  const mapping: Record<string, FundingStage> = {
    pre_seed: "pre-seed",
    seed: "seed",
    series_a: "series-a",
    series_b: "series-b",
    series_c: "series-c",
    series_d: "series-d+",
    series_e: "series-d+",
    series_f: "series-d+",
    ipo: "public",
    acquired: "acquired",
  };

  return mapping[fundingType.toLowerCase()];
}

async function fetchCrunchbaseStartups(): Promise<CrunchbaseOrganization[]> {
  const apiKey = process.env.CRUNCHBASE_API_KEY;
  if (!apiKey) {
    throw new Error("CRUNCHBASE_API_KEY not configured");
  }

  const response = await fetch(
    `${CRUNCHBASE_API_URL}?query=startup&organization_types=company&funding_stage=series_a,series_b,series_c&location_uuids=united-states`,
    {
      headers: {
        "X-RapidAPI-Key": apiKey,
        "X-RapidAPI-Host": "crunchbase-crunchbase-v1.p.rapidapi.com",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Crunchbase API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.entities ?? [];
}

function filterStartups(
  orgs: CrunchbaseOrganization[]
): CrunchbaseOrganization[] {
  const currentYear = new Date().getFullYear();

  return orgs.filter((org) => {
    const props = org.properties;

    const fundingAmount = props.funding_total?.value_usd ?? 0;
    if (fundingAmount < CONFIG.crunchbase.minFunding) return false;

    const foundedYear = props.founded_on
      ? parseInt(props.founded_on.split("-")[0], 10)
      : currentYear;
    if (foundedYear < CONFIG.crunchbase.minFoundedYear) return false;

    const employeeEnum = props.num_employees_enum;
    if (employeeEnum) {
      const match = employeeEnum.match(/c_(\d+)_(\d+|max)/);
      if (match) {
        const minEmployees = parseInt(match[1], 10);
        if (
          minEmployees < CONFIG.crunchbase.employeeRange.min ||
          (match[2] !== "max" &&
            parseInt(match[2], 10) > CONFIG.crunchbase.employeeRange.max)
        ) {
          return false;
        }
      }
    }

    return true;
  });
}

export async function syncStartupsNode(
  state: ProblemDiscoveryStateType
): Promise<Partial<ProblemDiscoveryStateType>> {
  const errors: ProblemDiscoveryStateType["errors"] = [];
  let syncedCount = 0;

  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL not configured");
    }

    const client = new ConvexHttpClient(convexUrl);

    const existingStartups = await client.query(api.startups.list, {
      limit: 1000,
    });
    const existingUrls = new Set(
      existingStartups
        .filter((s) => s.crunchbaseUrl)
        .map((s) => s.crunchbaseUrl!.toLowerCase())
    );

    let crunchbaseOrgs: CrunchbaseOrganization[] = [];
    try {
      crunchbaseOrgs = await fetchCrunchbaseStartups();
    } catch (error) {
      errors.push({
        node: "sync_startups",
        error: `Crunchbase fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        recoverable: true,
        timestamp: Date.now(),
      });
    }

    const filteredOrgs = filterStartups(crunchbaseOrgs);

    for (const org of filteredOrgs) {
      const crunchbaseUrl = `https://www.crunchbase.com/organization/${org.properties.identifier.permalink}`;

      if (existingUrls.has(crunchbaseUrl.toLowerCase())) {
        continue;
      }

      const location = org.properties.location_identifiers?.find(
        (l) => l.location_type === "city"
      );

      await client.mutation(api.startups.create, {
        name: org.properties.identifier.permalink.replace(/-/g, " "),
        description: org.properties.short_description ?? "",
        website: org.properties.website_url,
        linkedinUrl: org.properties.linkedin_url,
        crunchbaseUrl,
        foundedYear: org.properties.founded_on
          ? parseInt(org.properties.founded_on.split("-")[0], 10)
          : undefined,
        headquartersLocation: location?.value,
        employeeCount: mapEmployeeCount(org.properties.num_employees_enum),
        fundingStage: mapFundingStage(org.properties.last_funding_type),
        totalFunding: org.properties.funding_total?.value_usd,
        industries:
          org.properties.categories?.map((c) => c.name).slice(0, 5) ?? [],
        technologies: [],
        sourceType: "crunchbase",
        sourceUrl: crunchbaseUrl,
      });

      syncedCount++;

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    errors.push({
      node: "sync_startups",
      error: error instanceof Error ? error.message : String(error),
      recoverable: true,
      timestamp: Date.now(),
    });
  }

  return {
    errors,
    status: "syncing",
    progress: {
      current: 2,
      total: 6,
      stage: `Synced ${syncedCount} startups from Crunchbase`,
    },
    metrics: {
      startTime: state.metrics.startTime,
      searchQueries: state.metrics.searchQueries,
      rawResults: state.metrics.rawResults,
      extractedProblems: 0,
      implicitSignals: 0,
      clusters: 0,
      apiCalls: 1,
      tokensUsed: 0,
    },
  };
}
