/**
 * Discovery questions, anchored to the maturity rubric.
 *
 * Every question is written so its answer places a company on the 1-4 scale
 * rather than inviting an open-ended description. `listenFor` maps each level
 * to what an answer at that level sounds like — used both by a human running
 * the conversation and by the discovery agent when reading documents.
 *
 * These replace the workbook's "Questions to Ask" blocks, which covered only
 * 15 of 30 subdimensions and were not ordered to discriminate between levels.
 * The originals remain in `./rubric` as `questions` for reference.
 *
 * Level 1 is the most developed, level 4 the least — matching `maturityScale`.
 */

export type DiscoveryQuestion = {
  /** Stable identifier: <dimension>.<subdimension>.<slug>. Answers key off this. */
  id: string;
  prompt: string;
  /** What an answer at each level sounds like. */
  listenFor: Record<1 | 2 | 3 | 4, string>;
};

export type DiscoverySet = {
  dimension_key: string;
  subdimension_key: string;
  questions: DiscoveryQuestion[];
};

export const DISCOVERY_QUESTIONS: DiscoverySet[] = [
  // ---------------------------------------------------------------- CUSTOMER
  {
    dimension_key: "customer",
    subdimension_key: "products_markets_channels",
    questions: [
      {
        id: "customer.products_markets_channels.segmentation",
        prompt: "How do you segment your customers, and what data drives that segmentation?",
        listenFor: {
          1: "Micro-segmentation from advanced analytics, tailored experience per segment",
          2: "Macro-segments, reviewed and updated on a regular cycle",
          3: "Basic segmentation from demographics and sales history",
          4: "No meaningful segmentation; customers treated as one group"
        }
      },
      {
        id: "customer.products_markets_channels.geography_channels",
        prompt:
          "Which geographies and channels do you sell through today, and which are you actively entering?",
        listenFor: {
          1: "Global and diversified, offering customised products per channel and distributor",
          2: "Multichannel and expanding, exploring new markets for existing products",
          3: "Largely local, a few channels, expansion still being explored",
          4: "Single channel or market; no expansion underway"
        }
      },
      {
        id: "customer.products_markets_channels.portfolio",
        prompt: "How settled is your product line, and what is still changing about it?",
        listenFor: {
          1: "Mature portfolio, evaluated in a structured way that drives strategy",
          2: "Enhancing products for the existing base while testing new markets",
          3: "Focused on selling more of what exists to who already buys",
          4: "Product line not yet fully defined"
        }
      },
      {
        id: "customer.products_markets_channels.investment_decisions",
        prompt: "How do you decide which products or markets to invest in, and which to exit?",
        listenFor: {
          1: "Structured portfolio review feeding strategic decisions",
          2: "Deliberate but informal; driven by leadership judgement plus some data",
          3: "Opportunistic; whatever is selling gets attention",
          4: "No process; decisions are reactive"
        }
      }
    ]
  },
  {
    dimension_key: "customer",
    subdimension_key: "marketing_branding",
    questions: [
      {
        id: "customer.marketing_branding.activity",
        prompt: "What marketing actually runs today, and through which channels?",
        listenFor: {
          1: "Digital integrated with traditional, innovative and responsive",
          2: "Digital marketing used deliberately to attract and retain",
          3: "Product-led; word of mouth, social, or traditional media",
          4: "None to speak of"
        }
      },
      {
        id: "customer.marketing_branding.orientation",
        prompt:
          "Is your marketing aimed at winning new customers or deepening the ones you have?",
        listenFor: {
          1: "Building deeper, long-term, continuous relationships",
          2: "Retention, cross-selling and up-selling",
          3: "Awareness of products and services",
          4: "No deliberate orientation"
        }
      },
      {
        id: "customer.marketing_branding.brand_value",
        prompt:
          "What does your brand let you charge or win that you could not without it?",
        listenFor: {
          1: "Brand is a true differentiator and demonstrably lifts margin",
          2: "Leadership understands and invests in brand value",
          3: "Brand is recognised but not priced in",
          4: "Brand carries no commercial weight yet"
        }
      },
      {
        id: "customer.marketing_branding.measurement",
        prompt: "How do you know whether marketing is working?",
        listenFor: {
          1: "Attribution to lifetime value and margin",
          2: "Tracked against retention and cross-sell outcomes",
          3: "Activity measured; outcomes inferred",
          4: "Not measured"
        }
      }
    ]
  },
  {
    dimension_key: "customer",
    subdimension_key: "sales_pricing",
    questions: [
      {
        id: "customer.sales_pricing.pricing_basis",
        prompt: "How do you set prices, and what are they based on?",
        listenFor: {
          1: "Customer lifetime value",
          2: "Segment or account-level margin targets",
          3: "Single-transaction margin",
          4: "Cost-plus or guesswork"
        }
      },
      {
        id: "customer.sales_pricing.incentives",
        prompt: "How is the sales team incentivised, and against what?",
        listenFor: {
          1: "Rewarded for long-term customer outcomes, not just closing",
          2: "Rewarded for exceeding targets and for customer satisfaction",
          3: "Rewarded for meeting sales targets",
          4: "No incentive structure in place"
        }
      },
      {
        id: "customer.sales_pricing.competitive_position",
        prompt:
          "What do you know about how competitors price, and how does that change what you do?",
        listenFor: {
          1: "Competitor activity and market trends comprehensively tracked and acted on",
          2: "Competitor knowledge actively influences pricing and cost strategy",
          3: "Competitive environment understood but not systematically used",
          4: "Competitive environment not well understood"
        }
      },
      {
        id: "customer.sales_pricing.demand_source",
        prompt: "Where does new business actually come from today?",
        listenFor: {
          1: "Brand and reputation generate inbound demand",
          2: "Managed accounts and structured pipeline",
          3: "Direct selling, relationship by relationship",
          4: "Ad hoc and unpredictable"
        }
      }
    ]
  },
  {
    dimension_key: "customer",
    subdimension_key: "customer_experience",
    questions: [
      {
        id: "customer.customer_experience.measurement",
        prompt: "How do you measure customer satisfaction, and how often?",
        listenFor: {
          1: "Continuously, and personalised by segment",
          2: "Regularly, with results acted on",
          3: "Periodically",
          4: "No system in place"
        }
      },
      {
        id: "customer.customer_experience.consistency",
        prompt:
          "Is the experience the same across every channel a customer might reach you through?",
        listenFor: {
          1: "Personalised and consistent across all channels and touchpoints",
          2: "Consistent within each channel, not always across them",
          3: "Siloed; experience differs by product and touchpoint",
          4: "Customer needs not yet understood"
        }
      },
      {
        id: "customer.customer_experience.problem_detection",
        prompt: "How do customer problems reach you — do you find them, or do customers tell you?",
        listenFor: {
          1: "Issues are anticipated and solved before they surface",
          2: "Detected quickly through active monitoring",
          3: "Customers raise them; you respond",
          4: "Problems surface only when someone leaves"
        }
      },
      {
        id: "customer.customer_experience.advocacy",
        prompt: "Do customers contribute ideas that shape what you build?",
        listenFor: {
          1: "Customers act as advocates and feed product development",
          2: "Feedback collected and considered in the roadmap",
          3: "Feedback collected but rarely used",
          4: "No mechanism"
        }
      }
    ]
  },

  // ------------------------------------------------------------------ PEOPLE
  {
    dimension_key: "people",
    subdimension_key: "capability",
    questions: [
      {
        id: "people.capability.attraction",
        prompt: "Why do people join and stay?",
        listenFor: {
          1: "Culture and values are the primary draw",
          2: "Clear development paths and a credible plan",
          3: "Competitive pay and available work",
          4: "No clear answer; hiring is reactive"
        }
      },
      {
        id: "people.capability.workforce_planning",
        prompt: "How far ahead do you plan for the skills the business will need?",
        listenFor: {
          1: "Proactive planning, using technology and automation to lift productivity",
          2: "Planned against known future deadlines and objectives",
          3: "Planned to meet current demand",
          4: "Not planned; gaps are filled when they hurt"
        }
      },
      {
        id: "people.capability.gaps",
        prompt: "Which capabilities do you not have today that the plan depends on?",
        listenFor: {
          1: "Known, quantified, and being closed deliberately",
          2: "Known and partly addressed",
          3: "Broadly known, not systematically addressed",
          4: "Not assessed"
        }
      }
    ]
  },
  {
    dimension_key: "people",
    subdimension_key: "performance_management",
    questions: [
      {
        id: "people.performance_management.cadence",
        prompt: "How often does someone hear how they are doing, and from whom?",
        listenFor: {
          1: "Continuous feedback through the year, covering performance, reward and succession",
          2: "A regular structured cycle",
          3: "Annual or ad hoc, individual by individual",
          4: "No system in place"
        }
      },
      {
        id: "people.performance_management.measurement",
        prompt: "What is performance actually measured against?",
        listenFor: {
          1: "Analytics covering both team and individual activity and outcomes",
          2: "A framework aligning individual goals to business objectives",
          3: "Manager judgement",
          4: "Nothing formal"
        }
      },
      {
        id: "people.performance_management.consequence",
        prompt: "What follows from a strong or weak review?",
        listenFor: {
          1: "Directly linked to reward, development and career opportunity; embedded in culture",
          2: "Linked to reward with some development follow-through",
          3: "Limited practical consequence",
          4: "None"
        }
      }
    ]
  },
  {
    dimension_key: "people",
    subdimension_key: "innovation",
    questions: [
      {
        id: "people.innovation.time_and_space",
        prompt: "Does anyone have time set aside to work on things that are not already committed?",
        listenFor: {
          1: "Explicit time, and groups or pods devoted to it",
          2: "Encouraged and occasionally resourced",
          3: "Only when capacity allows",
          4: "No; the business is not oriented toward it"
        }
      },
      {
        id: "people.innovation.growth_source",
        prompt: "Where has your growth come from in the last two years?",
        listenFor: {
          1: "Expansion into new products or markets",
          2: "Exploiting existing strengths in adjacent ways",
          3: "More of the same, sold harder",
          4: "Little or no growth"
        }
      },
      {
        id: "people.innovation.leadership_role",
        prompt: "How do leaders treat new ideas that do not work out?",
        listenFor: {
          1: "Leaders champion innovation; it is tied to reward and succession",
          2: "Tolerated and learned from",
          3: "Treated as a cost",
          4: "Discouraged in practice"
        }
      }
    ]
  },
  {
    dimension_key: "people",
    subdimension_key: "leadership",
    questions: [
      {
        id: "people.leadership.vision",
        prompt: "Could someone two levels down state the strategy in their own words?",
        listenFor: {
          1: "Yes; leadership sets a clear vision and leads by example",
          2: "Broadly; the direction is understood if not the detail",
          3: "Partially; leadership is passionate but the message is uneven",
          4: "No"
        }
      },
      {
        id: "people.leadership.self_conception",
        prompt: "Do your leaders see themselves as managers of work or leaders of people?",
        listenFor: {
          1: "People leaders, explicitly, not operational managers",
          2: "A recognised need, partly acted on",
          3: "Primarily operational managers",
          4: "Lacking the capability to lead"
        }
      },
      {
        id: "people.leadership.diversity",
        prompt: "How diverse is the leadership team, and is that deliberate?",
        listenFor: {
          1: "Diverse by design, treated as a driver of better results",
          2: "Recognised as important and being worked on",
          3: "Acknowledged, not acted on",
          4: "Not considered"
        }
      }
    ]
  },
  {
    dimension_key: "people",
    subdimension_key: "rewards",
    questions: [
      {
        id: "people.rewards.composition",
        prompt: "Beyond salary, what does someone get for working here?",
        listenFor: {
          1: "Total flexible rewards, with short and long-term incentives understood by cost and value",
          2: "Value incentives and a total-reward view",
          3: "Pay plus standard benefits, used to attract and retain",
          4: "No system to reward performance"
        }
      },
      {
        id: "people.rewards.behaviour_vs_outcome",
        prompt: "Are people rewarded for what they achieved, how they achieved it, or both?",
        listenFor: {
          1: "Both, for team and individual, including behaviour toward risk",
          2: "Mostly outcomes, with some behavioural weight",
          3: "Outcomes only",
          4: "Neither, formally"
        }
      },
      {
        id: "people.rewards.employer_brand",
        prompt: "Does your reputation as an employer help you hire?",
        listenFor: {
          1: "A strong employer brand attracts and retains high performers",
          2: "Reasonable reputation, used somewhat deliberately",
          3: "Neutral",
          4: "Not a factor"
        }
      }
    ]
  },

  // -------------------------------------------------------------- OPERATIONS
  {
    dimension_key: "operations",
    subdimension_key: "sourcing_supply_chain",
    questions: [
      {
        id: "operations.sourcing_supply_chain.supplier_base",
        prompt: "Who supplies you, and what happens if the largest one fails tomorrow?",
        listenFor: {
          1: "Diversified and actively managed; disruption is planned for",
          2: "A diversified set of suppliers, relationships managed",
          3: "One primary supplier with limited alternatives",
          4: "No established supply arrangements"
        }
      },
      {
        id: "operations.sourcing_supply_chain.terms",
        prompt: "How are supplier terms negotiated and reviewed?",
        listenFor: {
          1: "Strategic partnerships creating joint value",
          2: "Negotiated deliberately and reviewed on a cycle",
          3: "Set once and rarely revisited",
          4: "Ad hoc"
        }
      },
      {
        id: "operations.sourcing_supply_chain.visibility",
        prompt: "How much visibility do you have into cost and lead time across the chain?",
        listenFor: {
          1: "End-to-end visibility informing decisions",
          2: "Good visibility one tier deep",
          3: "Limited; reactive to problems",
          4: "None"
        }
      }
    ]
  },
  {
    dimension_key: "operations",
    subdimension_key: "internal_operations_assets",
    questions: [
      {
        id: "operations.internal_operations_assets.capacity",
        prompt: "Can your facilities and equipment support the plan for the next two years?",
        listenFor: {
          1: "Planned ahead; assets support the strategy deliberately",
          2: "Adequate, with known investment needed",
          3: "Adequate for today only",
          4: "Not yet in place"
        }
      },
      {
        id: "operations.internal_operations_assets.utilisation",
        prompt: "Do you know how well your assets are actually used?",
        listenFor: {
          1: "Measured and optimised",
          2: "Measured",
          3: "Roughly understood",
          4: "Not tracked"
        }
      },
      {
        id: "operations.internal_operations_assets.maintenance",
        prompt: "Is maintenance planned or reactive?",
        listenFor: {
          1: "Predictive, informed by data",
          2: "Planned preventive schedule",
          3: "Mostly reactive",
          4: "Only when something breaks"
        }
      }
    ]
  },
  {
    dimension_key: "operations",
    subdimension_key: "distribution_logistics",
    questions: [
      {
        id: "operations.distribution_logistics.routes",
        prompt: "How does your product physically reach customers, and through how many routes?",
        listenFor: {
          1: "Diversified and customised by channel",
          2: "A diversified set of routes",
          3: "A limited number of routes",
          4: "No established distribution"
        }
      },
      {
        id: "operations.distribution_logistics.reliability",
        prompt: "What proportion of deliveries arrive on time and complete, and do you measure it?",
        listenFor: {
          1: "Measured, high, and improving",
          2: "Measured",
          3: "Known anecdotally",
          4: "Not measured"
        }
      },
      {
        id: "operations.distribution_logistics.cost",
        prompt: "Do you know your cost to serve per customer or per channel?",
        listenFor: {
          1: "Known per channel and used in pricing",
          2: "Known in aggregate",
          3: "Estimated",
          4: "Unknown"
        }
      }
    ]
  },
  {
    dimension_key: "operations",
    subdimension_key: "operations_strategy",
    questions: [
      {
        id: "operations.operations_strategy.alignment",
        prompt: "How does the operating plan connect to the commercial strategy?",
        listenFor: {
          1: "Operational strategy embraces innovation and drives the commercial plan",
          2: "Integrated and aligned",
          3: "Loosely connected",
          4: "No articulated operations strategy"
        }
      },
      {
        id: "operations.operations_strategy.horizon",
        prompt: "How far ahead does operational planning look?",
        listenFor: {
          1: "Multi-year, scenario-based",
          2: "Annual with quarterly review",
          3: "Quarter to quarter",
          4: "Week to week"
        }
      },
      {
        id: "operations.operations_strategy.tradeoffs",
        prompt: "When cost, quality and speed conflict, how is that decided and by whom?",
        listenFor: {
          1: "An explicit, understood framework",
          2: "Consistent leadership judgement",
          3: "Case by case",
          4: "Whoever shouts loudest"
        }
      }
    ]
  },
  {
    dimension_key: "operations",
    subdimension_key: "operational_excellence",
    questions: [
      {
        id: "operations.operational_excellence.improvement_culture",
        prompt: "Who is expected to improve how the work gets done?",
        listenFor: {
          1: "Highly effective internal and external collaboration; everyone",
          2: "Cross-functional collaboration drives optimisation",
          3: "A focus exists but sits with a few people",
          4: "No culture of continuous improvement yet"
        }
      },
      {
        id: "operations.operational_excellence.measurement",
        prompt: "Which operational metrics does leadership look at weekly?",
        listenFor: {
          1: "A tight set, reviewed and acted on",
          2: "A defined set reviewed regularly",
          3: "Financials only",
          4: "None"
        }
      },
      {
        id: "operations.operational_excellence.standardisation",
        prompt: "Are core processes documented, and would two people do them the same way?",
        listenFor: {
          1: "Documented, followed, and improved",
          2: "Documented and largely followed",
          3: "Partly documented",
          4: "Held in individuals' heads"
        }
      }
    ]
  },

  // ----------------------------------------------------------------- FINANCE
  {
    dimension_key: "finance",
    subdimension_key: "finance_process_control",
    questions: [
      {
        id: "finance.finance_process_control.close",
        prompt: "How long after month end do you have numbers you trust?",
        listenFor: {
          1: "Days, with analysis that shapes decisions",
          2: "Two to three weeks, reliably",
          3: "Slow, and mainly backward-looking",
          4: "No codified process"
        }
      },
      {
        id: "finance.finance_process_control.controls",
        prompt: "What stops money leaving the business without the right approval?",
        listenFor: {
          1: "Designed controls, tested and monitored",
          2: "Documented approval limits, consistently applied",
          3: "Informal but understood",
          4: "Nothing formal"
        }
      },
      {
        id: "finance.finance_process_control.forecasting",
        prompt: "Do you forecast cash, and how far out with what accuracy?",
        listenFor: {
          1: "Rolling forecast, variances understood and used",
          2: "Regular forecast, reviewed against actuals",
          3: "Occasional and directional",
          4: "None"
        }
      }
    ]
  },
  {
    dimension_key: "finance",
    subdimension_key: "stakeholder_management",
    questions: [
      {
        id: "finance.stakeholder_management.who",
        prompt: "Who are the financial stakeholders you answer to, and how often do you speak?",
        listenFor: {
          1: "Broad set, engaged proactively and regularly",
          2: "Banks, investors and key partners, engaged on a cycle",
          3: "Banks and primary lenders, engaged when required",
          4: "Poor engagement; contact is reactive"
        }
      },
      {
        id: "finance.stakeholder_management.reporting",
        prompt: "What do they receive, and does it match what they actually want to know?",
        listenFor: {
          1: "Tailored, anticipating their questions",
          2: "Consistent reporting pack",
          3: "Statutory minimum",
          4: "Whatever is asked for, when asked"
        }
      },
      {
        id: "finance.stakeholder_management.bad_news",
        prompt: "How does bad news reach them?",
        listenFor: {
          1: "Early, with a plan attached",
          2: "Promptly and directly",
          3: "At the next scheduled point",
          4: "Late, or when unavoidable"
        }
      }
    ]
  },
  {
    dimension_key: "finance",
    subdimension_key: "people_organization",
    questions: [
      {
        id: "finance.people_organization.structure",
        prompt: "Who does the finance work, and what are they responsible for?",
        listenFor: {
          1: "Highly efficient structure with clear specialisation",
          2: "Effective structure with defined roles",
          3: "Specialised functions but siloed",
          4: "Generic; whoever is available"
        }
      },
      {
        id: "finance.people_organization.capability",
        prompt: "Does the team have the skills for where the business is going, not just where it is?",
        listenFor: {
          1: "Yes, and developed deliberately",
          2: "Mostly, with known gaps being addressed",
          3: "Adequate for today",
          4: "Significant gaps"
        }
      },
      {
        id: "finance.people_organization.key_person",
        prompt: "What happens if your most senior finance person leaves next month?",
        listenFor: {
          1: "Documented and covered",
          2: "Disruptive but manageable",
          3: "Serious disruption",
          4: "Critical single point of failure"
        }
      }
    ]
  },
  {
    dimension_key: "finance",
    subdimension_key: "data_technology",
    questions: [
      {
        id: "finance.data_technology.systems",
        prompt: "What systems hold your financial data, and how do they talk to each other?",
        listenFor: {
          1: "Efficient integrated systems supporting finance end to end",
          2: "Multiple legacy systems, integrated with effort",
          3: "Heavy reliance on spreadsheets",
          4: "The importance of financial data is not yet recognised"
        }
      },
      {
        id: "finance.data_technology.manual_effort",
        prompt: "How much of the monthly reporting is manual?",
        listenFor: {
          1: "Largely automated",
          2: "Partly automated",
          3: "Mostly manual",
          4: "Entirely manual"
        }
      },
      {
        id: "finance.data_technology.single_truth",
        prompt: "If two people pull the same number, do they get the same answer?",
        listenFor: {
          1: "Yes, from a single source",
          2: "Usually",
          3: "Often not",
          4: "Rarely"
        }
      }
    ]
  },
  {
    dimension_key: "finance",
    subdimension_key: "funding_growth",
    questions: [
      {
        id: "finance.funding_growth.strategy",
        prompt: "How is growth funded today, and how will it be funded next year?",
        listenFor: {
          1: "A funding strategy that actively supports the growth plan",
          2: "Access to multiple funding sources",
          3: "Lack of funding constrains growth",
          4: "No strategy; funding is opportunistic"
        }
      },
      {
        id: "finance.funding_growth.working_capital",
        prompt: "Do leaders understand how working capital moves with growth?",
        listenFor: {
          1: "Modelled and managed deliberately",
          2: "Understood and monitored",
          3: "Understood in principle",
          4: "Not understood; growth creates surprises"
        }
      },
      {
        id: "finance.funding_growth.readiness",
        prompt: "If you needed capital in ninety days, what would you have to build first?",
        listenFor: {
          1: "Nothing material; you are ready",
          2: "Some tidying, no structural gaps",
          3: "Significant preparation required",
          4: "Not investable in current shape"
        }
      }
    ]
  },

  // --------------------------------------------------------------- ANALYTICS
  {
    dimension_key: "analytics",
    subdimension_key: "digital_enterprise",
    questions: [
      {
        id: "analytics.digital_enterprise.adoption",
        prompt: "Which parts of the business have been changed by technology in the last two years?",
        listenFor: {
          1: "The enterprise has become digital in how it operates",
          2: "Key digital technologies leveraged in specific areas",
          3: "Very limited thinking about how technology could change the business",
          4: "Does not adopt new technology"
        }
      },
      {
        id: "analytics.digital_enterprise.ownership",
        prompt: "Who decides what technology the business adopts?",
        listenFor: {
          1: "A clear owner with a strategy tied to business goals",
          2: "Leadership decides deliberately",
          3: "IT decides, or whoever asks loudest",
          4: "Nobody"
        }
      },
      {
        id: "analytics.digital_enterprise.constraint",
        prompt: "Where does technology currently hold the business back?",
        listenFor: {
          1: "Known, prioritised and being addressed",
          2: "Known and partly addressed",
          3: "Felt but not diagnosed",
          4: "Not considered"
        }
      }
    ]
  },
  {
    dimension_key: "analytics",
    subdimension_key: "data_analytics",
    questions: [
      {
        id: "analytics.data_analytics.decisions",
        prompt: "Name a decision in the last quarter that data changed.",
        listenFor: {
          1: "A data-driven culture; examples come easily",
          2: "The importance of data is recognised and acted on",
          3: "Time is spent finding and fixing data rather than using it",
          4: "Limited skills to use data at all"
        }
      },
      {
        id: "analytics.data_analytics.access",
        prompt: "Who can get a number without asking someone else?",
        listenFor: {
          1: "Self-service across the business",
          2: "Managers can, for their area",
          3: "Only a few people",
          4: "Nobody reliably"
        }
      },
      {
        id: "analytics.data_analytics.quality",
        prompt: "How much time goes into reconciling or correcting data before it can be used?",
        listenFor: {
          1: "Little; quality is managed at source",
          2: "Some, and reducing",
          3: "A great deal",
          4: "Data is not trusted"
        }
      }
    ]
  },
  {
    dimension_key: "analytics",
    subdimension_key: "security_privacy",
    questions: [
      {
        id: "analytics.security_privacy.posture",
        prompt: "How is security treated — as a control function or a business risk?",
        listenFor: {
          1: "A critical business concern, owned at leadership level",
          2: "A security architecture is in place",
          3: "Focused on building basic defences",
          4: "No security capability"
        }
      },
      {
        id: "analytics.security_privacy.personal_data",
        prompt: "What personal data do you hold, and who is accountable for it?",
        listenFor: {
          1: "Mapped, minimised, with clear accountability",
          2: "Known, with an owner",
          3: "Broadly known",
          4: "Not known"
        }
      },
      {
        id: "analytics.security_privacy.incident_readiness",
        prompt: "What would you do in the first hour of a breach?",
        listenFor: {
          1: "A tested plan with named roles",
          2: "A documented plan",
          3: "An idea, undocumented",
          4: "No plan"
        }
      }
    ]
  },

  // -------------------------------------------------------------------- RISK
  {
    dimension_key: "risk",
    subdimension_key: "governance",
    questions: [
      {
        id: "risk.governance.structure",
        prompt: "Who holds the business to account, and how often do they meet?",
        listenFor: {
          1: "A strong governance structure operating consistently",
          2: "A board or audit committee meeting on a defined cycle",
          3: "A board or informal advisory group meeting occasionally",
          4: "No defined governance structure"
        }
      },
      {
        id: "risk.governance.decision_rights",
        prompt: "Which decisions need approval beyond the executive team?",
        listenFor: {
          1: "Clearly defined and observed",
          2: "Defined",
          3: "Understood informally",
          4: "Undefined"
        }
      },
      {
        id: "risk.governance.independence",
        prompt: "Is there anyone in governance who will tell the founder they are wrong?",
        listenFor: {
          1: "Yes, and it happens",
          2: "Yes, in principle",
          3: "Rarely",
          4: "No"
        }
      }
    ]
  },
  {
    dimension_key: "risk",
    subdimension_key: "risk_management",
    questions: [
      {
        id: "risk.risk_management.identification",
        prompt: "What are the three risks most likely to stop the plan, and who owns each?",
        listenFor: {
          1: "Efficient enterprise-wide identification with clear ownership",
          2: "A structured approach to identifying and assessing risk",
          3: "Management shares responsibility informally",
          4: "No firm understanding of the risks faced"
        }
      },
      {
        id: "risk.risk_management.register",
        prompt: "Is there a risk register, and when was it last changed?",
        listenFor: {
          1: "Live and driving decisions",
          2: "Maintained and reviewed",
          3: "Exists but stale",
          4: "None"
        }
      },
      {
        id: "risk.risk_management.appetite",
        prompt: "How much risk is the business willing to take, and has anyone said so out loud?",
        listenFor: {
          1: "Articulated and used in decisions",
          2: "Broadly understood by leadership",
          3: "Implicit",
          4: "Never discussed"
        }
      }
    ]
  },
  {
    dimension_key: "risk",
    subdimension_key: "policy_compliance",
    questions: [
      {
        id: "risk.policy_compliance.coverage",
        prompt: "Which policies exist, and would staff know where to find them?",
        listenFor: {
          1: "Comprehensive, documented and accessible",
          2: "Individual functions have formally defined policies",
          3: "Management leads policy development ad hoc",
          4: "No developed policies"
        }
      },
      {
        id: "risk.policy_compliance.obligations",
        prompt: "Which regulations apply to you, and who tracks changes to them?",
        listenFor: {
          1: "Mapped, owned and monitored",
          2: "Known with an owner",
          3: "Broadly known",
          4: "Not mapped"
        }
      },
      {
        id: "risk.policy_compliance.evidence",
        prompt: "If a regulator asked for evidence of compliance tomorrow, how long would it take?",
        listenFor: {
          1: "Readily available",
          2: "A few days",
          3: "Weeks of assembly",
          4: "Could not be produced"
        }
      }
    ]
  },
  {
    dimension_key: "risk",
    subdimension_key: "stakeholder_management",
    questions: [
      {
        id: "risk.stakeholder_management.communication",
        prompt: "How do stakeholders learn how risk is being managed?",
        listenFor: {
          1: "Effective risk management actively enhances their confidence",
          2: "Communicated effectively and regularly",
          3: "Management tells them when asked",
          4: "Limited ability to inform them"
        }
      },
      {
        id: "risk.stakeholder_management.trust",
        prompt: "Has a stakeholder ever been surprised by something they should have known earlier?",
        listenFor: {
          1: "No; surprises are pre-empted",
          2: "Rarely",
          3: "Occasionally",
          4: "Frequently"
        }
      }
    ]
  },

  // ------------------------------------------------------------------ IMPACT
  {
    dimension_key: "impact",
    subdimension_key: "impact_metrics",
    questions: [
      {
        id: "impact.impact_metrics.definition",
        prompt: "What change does this business exist to create, and how would you know it happened?",
        listenFor: {
          1: "A robust grasp of the impact created, measured deliberately",
          2: "A firm understanding of what impact means here",
          3: "Beginning to understand it",
          4: "No understanding of what type of impact is created"
        }
      },
      {
        id: "impact.impact_metrics.measurement",
        prompt: "Which impact numbers do you report, and to whom?",
        listenFor: {
          1: "A defined set, reported to stakeholders on a cycle",
          2: "Measured internally",
          3: "Collected inconsistently",
          4: "Not measured"
        }
      },
      {
        id: "impact.impact_metrics.decision_use",
        prompt: "Has an impact number ever changed a commercial decision?",
        listenFor: {
          1: "Yes, routinely",
          2: "Yes, occasionally",
          3: "Rarely",
          4: "Never"
        }
      }
    ]
  },
  {
    dimension_key: "impact",
    subdimension_key: "technology",
    questions: [
      {
        id: "impact.technology.systems",
        prompt: "What systems capture impact data, and are they the same ones running the business?",
        listenFor: {
          1: "Efficient and effective systems supporting social impact",
          2: "Multiple legacy systems support it with effort",
          3: "Teams rely heavily on manual collection",
          4: "No systems"
        }
      },
      {
        id: "impact.technology.integration",
        prompt: "Is impact data collected as work happens, or gathered afterwards?",
        listenFor: {
          1: "Captured as part of normal operations",
          2: "Partly integrated",
          3: "Gathered retrospectively",
          4: "Not gathered"
        }
      }
    ]
  },
  {
    dimension_key: "impact",
    subdimension_key: "data_analytics",
    questions: [
      {
        id: "impact.data_analytics.culture",
        prompt: "Who looks at impact data, and how often?",
        listenFor: {
          1: "A data-driven culture extending to impact",
          2: "The importance is recognised and acted on",
          3: "Time goes into fixing the data rather than using it",
          4: "Limited skills to use it"
        }
      },
      {
        id: "impact.data_analytics.attribution",
        prompt: "How confident are you that the change you measure was caused by you?",
        listenFor: {
          1: "Attribution tested and evidenced",
          2: "Reasoned, with acknowledged limits",
          3: "Assumed",
          4: "Not considered"
        }
      }
    ]
  },
  {
    dimension_key: "impact",
    subdimension_key: "design",
    questions: [
      {
        id: "impact.design.business_model",
        prompt: "Is impact created by how the business makes money, or alongside it?",
        listenFor: {
          1: "The business model itself has been designed to create impact",
          2: "Impact is integrated into the model",
          3: "The model does not adapt to serve impact",
          4: "Impact sits outside the business model entirely"
        }
      },
      {
        id: "impact.design.tradeoffs",
        prompt: "When impact and margin conflict, what happens?",
        listenFor: {
          1: "An explicit principle, consistently applied",
          2: "Considered case by case with leadership involvement",
          3: "Margin wins by default",
          4: "The conflict is not recognised"
        }
      }
    ]
  }
];

const BY_SUBDIMENSION = new Map(
  DISCOVERY_QUESTIONS.map((set) => [`${set.dimension_key}:${set.subdimension_key}`, set])
);

export const ALL_QUESTIONS: DiscoveryQuestion[] = DISCOVERY_QUESTIONS.flatMap(
  (set) => set.questions
);

export function discoveryQuestionsFor(dimensionKey: string, subdimensionKey: string) {
  return BY_SUBDIMENSION.get(`${dimensionKey}:${subdimensionKey}`)?.questions ?? [];
}
