export const CONFIG = {
  search: {
    resultsPerQuery: 50,
    delayBetweenQueries: 500,
    domains: {
      social: [
        "reddit.com",
        "news.ycombinator.com",
        "twitter.com",
        "x.com",
        "linkedin.com",
      ],
      reviews: ["g2.com", "capterra.com", "trustpilot.com", "producthunt.com"],
      developer: ["stackoverflow.com", "github.com", "dev.to", "medium.com"],
    },
  },

  extraction: {
    batchSize: 10,
    confidenceThreshold: 0.6,
    model: "anthropic/claude-3.5-sonnet",
    temperature: 0.3,
  },

  implicit: {
    confidenceThreshold: 0.7,
    patterns: {
      build_vs_buy: [
        /we\s+built\s+our\s+own/gi,
        /had\s+to\s+write\s+custom/gi,
        /ended\s+up\s+building/gi,
        /rolled\s+our\s+own/gi,
      ],
      excessive_hiring: [
        /hiring\s+(\w+\s+)?for\s+the\s+same\s+role/gi,
        /can't\s+keep\s+(\w+\s+)?position\s+filled/gi,
        /constantly\s+hiring/gi,
        /high\s+turnover/gi,
      ],
      workaround_sharing: [
        /here's\s+how\s+we\s+hack/gi,
        /workaround\s+for/gi,
        /hacky\s+solution/gi,
        /ugly\s+fix/gi,
        /temporary\s+solution/gi,
      ],
      migration_announcement: [
        /switched\s+from\s+\w+\s+to/gi,
        /migrating\s+from/gi,
        /moving\s+away\s+from/gi,
        /replaced\s+\w+\s+with/gi,
      ],
      open_source_creation: [
        /open\s+sourced\s+our/gi,
        /released\s+as\s+open\s+source/gi,
        /created\s+(\w+\s+)?library/gi,
        /published\s+(\w+\s+)?package/gi,
      ],
      integration_complaint: [
        /integration\s+nightmare/gi,
        /doesn't\s+integrate\s+with/gi,
        /no\s+(\w+\s+)?api\s+for/gi,
        /integration\s+issues/gi,
      ],
      scale_breakpoint: [
        /broke\s+at\s+scale/gi,
        /couldn't\s+handle\s+(\w+\s+)?load/gi,
        /scaling\s+issues/gi,
        /performance\s+degraded/gi,
      ],
      manual_process: [
        /manually\s+do/gi,
        /tedious\s+process/gi,
        /by\s+hand/gi,
        /manual\s+work/gi,
        /time-consuming/gi,
      ],
    },
  },

  clustering: {
    minClusterSize: 3,
    minSamples: 2,
    minProblemsForClustering: 5,
    model: "anthropic/claude-3.5-sonnet",
  },

  crunchbase: {
    minFunding: 5000000,
    minFoundedYear: 2019,
    employeeRange: { min: 20, max: 500 },
    fundingStages: ["series-a", "series-b", "series-c"],
  },

  rateLimit: {
    exa: { requestsPerMinute: 100, delayMs: 500 },
    openrouter: { baseDelayMs: 100, maxRetries: 3 },
    crunchbase: { requestsPerDay: 200 },
  },
} as const;

export const QUERY_TEMPLATES = {
  explicit: [
    "{industry} startup challenges pain points problems",
    "SaaS {industry} common frustrations founders",
    "B2B {industry} bottlenecks inefficiencies",
    "enterprise {industry} integration issues",
  ],
  implicit: [
    "{industry} built our own solution because",
    "{industry} switched from migrated away",
    "{industry} workaround hack temporary fix",
    "open sourced {industry} tool library",
  ],
  reviews: [
    'site:g2.com "{industry}" cons limitations',
    'site:capterra.com "{industry}" software drawbacks',
    '{industry} "wish it could" "missing feature"',
  ],
  hiring: [
    "{industry} hiring engineers scaling team",
    '{industry} startup "looking for" senior lead',
    "{industry} engineering challenges hiring",
  ],
  founder: [
    "{industry} founder lessons learned mistakes",
    "{industry} startup postmortem failure analysis",
    "{industry} YC startup advice challenges",
  ],
} as const;

export const DEFAULT_INDUSTRIES = [
  "fintech",
  "healthtech",
  "edtech",
  "devtools",
  "cybersecurity",
  "AI/ML",
  "e-commerce",
  "logistics",
  "proptech",
  "legaltech",
];
