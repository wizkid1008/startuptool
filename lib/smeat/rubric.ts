/**
 * SMEAT maturity rubric.
 *
 * Extracted programmatically from `reference/SMEAT Tool.xlsm`, Instructions
 * sheet, rows 22-63. Do not hand-edit: revise the workbook and re-extract, so
 * the workbook stays the single source of truth.
 *
 * 30 subdimensions x 4 levels. Level 1 is the most developed, level 4 the
 * least — the same direction as `maturityScale` in ./scoring.
 */

export type RubricLevel = {
  level: number;
  bullets: string[];
};

export type RubricEntry = {
  dimension_key: string;
  subdimension_key: string;
  label: string;
  levels: RubricLevel[];
};

export const MATURITY_RUBRIC: RubricEntry[] = [
    {
        "label":  "Products, Markets and Channels",
        "subdimension_key":  "products_markets_channels",
        "dimension_key":  "customer",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The business is expanding globally into diversified markets.",
                                           "It offers customized products and services for multichannel and distributors. It evaluates its business portfolio in a structured fashion, which drives strategy decision making.",
                                           "It uses advanced analytics to micro-segment its customer base and provide a tailored customer experience"
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The company is enhancing products for its existing customer base and exploring new markets for its existing products.",
                                           "Business is expanding",
                                           "Sales and distribution is multichannel",
                                           "Analytical methods are updated regularly and are based on macro-segments"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The business is focused on maximizing sales volume with current products and services with existing customers",
                                           "Markets are often just local",
                                           "The business has a few sales and distribution channels and its exploring further expansion.",
                                           "Basic segmentation is based on demographics and sales information."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The company has not yet fully developed its product line.",
                                           "The company has not yet been able to segement the market."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Marketing and Branding",
        "subdimension_key":  "marketing_branding",
        "dimension_key":  "customer",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The business is focused on developing deeper, long-term and continuous relationships.",
                                           "Brand value is a true differentiator and leads to increased margins.",
                                           "Increasingly innovative and responsive digital marketing is integrated with traditional methods"
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Marketing is focused on retention, cross-selling and up-selling.",
                                           "Pricing is based on customer life-time value.",
                                           "Leadership understand the value of the brand.",
                                           "The company is leveraging digital marketing to attract and retain customers."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Marketing is focused on products and services.",
                                           "Marketing is reliant on word of mouth, social media, or traditional media."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The enterprise does not yet have any marketing done for the company.",
                                           "As the company is nacent, the firm has limited word of mouth marketing opportunities."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Sales and Pricing",
        "subdimension_key":  "sales_pricing",
        "dimension_key":  "customer",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Brand and reputation generates sales.",
                                           "Rewards are based on long-term customer experiences.",
                                           "Pricing is based on customer lifetime value",
                                           "Competitor\u0027s activities and market trends are comprehensively evaluated to proactively evolve products and services."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Sales are managed through robust account management processes.",
                                           "Staff are rewarded for exceeding sales targets and customer satisfaction.",
                                           "Price and margins are set for specific customer segments or accounts.",
                                           "Knowledge of competitors is used to influence pricing and cost strategy."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Staff are rewarded for meeting sales targets.",
                                           "Price and margin are based on single-sale transactions",
                                           "The competitive environment is understood"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The competitive enviroment is not fully understood.",
                                           "There is no incentive mechanism in place for sales staff."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Customer Experience",
        "subdimension_key":  "customer_experience",
        "dimension_key":  "customer",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The quality of the consumer brand experience turns customers into advocates. They contribute ideas and insights that help the development of new products and services.",
                                           "Customer experience fulfills the brand promise.",
                                           "Quality of experience is personalized and consistent across all channels and touch points",
                                           "Solving customer issues before they arise is focus"
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The current portfolio of products and services meets existing customer needs.",
                                           "The quality of experience is consistent within, but not always across, all channels",
                                           "The business regularly measures customer satisfaction and attitude levels"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Individual product and service and channels drive customers experience.",
                                           "Customer experience is siloed and often different across touch points. The business periodically measures customer satisfaction."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The enterprise does not yet understand the customer\u0027s needs.",
                                           "The enterprise has no system in place to measure customer satisfaction."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Capability",
        "subdimension_key":  "capability",
        "dimension_key":  "people",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The culture and values of the business are primary drivers to attract and retain employees",
                                           "The People Plan plays a fundamental role in strategy and business performance by focusing on an agile workforce, diversity, and technology enablement",
                                           "Human resources planning is highly proactive and embraces technology and robotics to optimize productivity.",
                                           "Diversity, agility, and teamwork are embedded in the culture of the business and essential to achieving business goals."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Human resources are focused on meeting future deadlines and business objectives.",
                                           "Management and processes drive innovation and strong teamwork within and across the business.",
                                           "Skills gaps are minimized through a combination of outsourcing, offshoring, and flexible working."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Human Resources and focused on meeting current deadlines and business objectives.",
                                           "Individuals are clear about their personal roles and objectives",
                                           "The organizational and behavioral culture required to achieve business objectives is clearly understood."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The company does not have all of the human resources needed within the firm to be fully operational"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Performance Management",
        "subdimension_key":  "performance_management",
        "dimension_key":  "people",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "High performance is a fundamental value",
                                           "The business uses analytics to measure activity and outcomes of both the team and the individual",
                                           "Continuous feedback is provided throughout the year on performance, rewards, and succession planning.",
                                           "Performance is embedded into the organization\u0027s culture - reward, development and career opportunities.",
                                           "Values are understood by all. Behaviors are aligned to performance and linked to rewards."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "There is a framework for aligning performance management with business strategy",
                                           "Cascading business objectives and goals are linked to rewards",
                                           "Values are embedded in performance management"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Performance is managed on an individual basis",
                                           "Managers provide ad hoc feedback to employees",
                                           "Values exist but lack a clear link to performance management"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "There is no performance management system in place"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Innovation",
        "subdimension_key":  "innovation",
        "dimension_key":  "people",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Expansion into new product are or markets.",
                                           "Continuous growth is enabled by an agile workforce.",
                                           "The business gives employees time to explore novel concepts for ideas.",
                                           "The company may have groups or pods devoted to innovation.",
                                           "Innovation is tied to performance-managed rewards and succession: leaders are champions of innovation."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The business grows by exploiting the full market potential of existing products and services",
                                           "A focus on commercialization and operations drives significant changes in the organization, its culture and its workforce",
                                           "The organization develops innovation as a competency. It selects employees who have demonstrated innovation"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The business is oriented toward innovation and looks to disrupt established market dynamics",
                                           "There is a high distribution of technical know-how",
                                           "The business attracts talent to innovated and disrupt the market dynamics"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The business is not oriented toward innovation",
                                           "There is not a high distribution of technical know-how",
                                           "The business does not attract talent to innovate and disrupt market dynamics"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Leadership",
        "subdimension_key":  "leadership",
        "dimension_key":  "people",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Leadership is passionate and inspiring, sets a clear vision and leads by executive.",
                                           "A diverse leadership team embraces diversity to achieve the best business results.",
                                           "Leaders perceive themselves as people leaders not operational managers."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The business recognizes the need for broad skills to achieve market leadership.",
                                           "The company attracts, selects, develops, and retains future leaders."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Leadership understand and is passionate abut the business strategy and motivates people to achieve performance targets."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "Leadership does not have the ability to inspire and lead the company"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Rewards",
        "subdimension_key":  "rewards",
        "dimension_key":  "people",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Behaviors as well as outcomes are rewarded for both the team and the individual.",
                                           "The focus is on the total flexible rewards, not just compensation with a strong understanding of the total cost and value of the short and long term incentive programs.",
                                           "A strong employer brand is used to attract, motivate, and retain high performers.",
                                           "Behavior toward risk management is embedded in rewards structures"
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "There are value incentives and total rewards programs segmented to specific employee populations",
                                           "There is visible evidence of links between performance, rewards and achievement of business objectives"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Rewards are provided to attracts and retain individuals and business objectives",
                                           "Bonuses are used to reward high performance"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "There is no system in place to reward high performing individuals within the company"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Sourcing and Supply Chain",
        "subdimension_key":  "sourcing_supply_chain",
        "dimension_key":  "operations",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The abililty of the enteprise to create efficiencies within the supply chain creates a competitive advantage for the firm.",
                                           "The sourcing strategy plays a fundamental role in the overall strategy and business performance of the firm."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The enterprise has a diversified set of suppliers to the firm which lessons the business\u0027s risk.",
                                           "An understanding of the suppliers\u0027 business position is understood which aids the firm in de-risking its supply chain.",
                                           "The enterprise has been able to work favorable payment terms to suppliers which lessons the working capital need for the firm.",
                                           "The enterprise has efficient logistics in place to support transport from suppliers to operations of the firm"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The enterprise has one primary supplier of critical inputs into the business",
                                           "The enterprise has started to engage with suppliers to be able to extend purchasing on credit to extend working capital of the firm.",
                                           "The enterprise has established contracts with suppliers which are enforceable.",
                                           "The enterprise has functioning logistics to bring inputs to the firm but efficiencies could be strenthened within the supply chain"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The enterprise currently does not have established relationships with suppliers.",
                                           "The enterprise does not have an established supply chain operation"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Internal Operations and Assets",
        "subdimension_key":  "internal_operations_assets",
        "dimension_key":  "operations",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The internal operation strategy plays a fundmental rol in the overall strategy and business performance of the firm."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The enterprise\u0027s internal facilities give the firm a competitive advantage over the competition",
                                           "The enterprise has developed efficient operations which limit the amount of raw and finished product the enterprise has on hand."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The enterprise\u0027s facilities are adequat enough to satisfy the internal operation strategy the firm wants to achieve.",
                                           "The enterprise has production systems in place to monitor the overal quality and amount of products produced."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The firm does not yet have all the functions in place",
                                           "The enterprise has no tracking system in place to monitor overall production or quality of final goods or services produced."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Distribution and Logistics",
        "subdimension_key":  "distribution_logistics",
        "dimension_key":  "operations",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The abililty of the enteprise to create efficiencies within the outbound and distribution creates a competitive advantage for the firm.",
                                           "The distribution strategy plays a fundamental role in the overall strategy and business performance of the firm."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The enterprise has a diversified set of buyers to the firm which lessons the business\u0027s risk.",
                                           "An understanding of the buyers\u0027 business position is understood which aids the firm in de-risking its supply chain.",
                                           "The enterprise has been able to work favorable payment terms to suppliers which lessons the working capital need for the firm.",
                                           "The enterprise has efficient logistics in place to support transport from the firm to the buyer"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The enterprise has a limited number of primary buyers",
                                           "The enterprise has started to engage with buyers to be able to reduce purchasing on credit to extend working capital of the firm.",
                                           "The enterprise has established contracts with buyers which are enforceable.",
                                           "The enterprise has functioning logistics to bring outputs of the firm to market but efficiencies could be strenthened within the supply chain"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The enterprise currently does not have established relationships with buyers",
                                           "The enterprise does not have an established distribution operations in place"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Operations Strategy",
        "subdimension_key":  "operations_strategy",
        "dimension_key":  "operations",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Operational strategy embraces an innovative culture and drives distinct supply chain segemnts fully aligned with the different customer, product and service requirements.",
                                           "There is an optimal blend of outsourced shared services and in-house capability to meet different client and market needs",
                                           "The business fully considers the implications of working capital, tax, customs, and internationa trade on performance and reputation."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Operational strategy is integrated across functions to achieve superios outcomes.",
                                           "All functions share common measure of success, which drives increased customer and shareholder value and operating margin.",
                                           "The operations stragey takes into account incintives, talents, geopolitical climate, low cost and tax locations."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "There is an obsessive culture of creating customer value\u0027 however, the company\u0027s overheah dimishes shareholder value.",
                                           "Operational strategy is driven locally or within silos.",
                                           "Functional metrics are frequently seens as a driver of success."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "XX?"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Operational Excellence and Continuous Improvement",
        "subdimension_key":  "operational_excellence",
        "dimension_key":  "operations",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "There is highly effective internal and external collaboration, which includes customers and suppliers.",
                                           "A fully synchronized supply chain achievs market leadeing costs, cash and service levels and enables the businesss to be agile. The business achieves operational excellence by empowering its employees and having a transparent real time and integrated supply chain that effectivly anticipates and respons to market demand."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Cross functional collaboration optimizes total deliverd costs and service levels.",
                                           "Cost savings and service levls are improved though global and regional consideration of suply chain networks.",
                                           "The business uses fuly alinged cross functional KPIs",
                                           "There is a single point of contact for continuous improvement initiatives driving a common approach."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "There is a focus on operational excellence within silos.",
                                           "There is a developing culture of continuous improvement."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "There is not yet any culture of continuous improvement.",
                                           "Operational excellence is not yet a priority for the enterprise."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Finance Process and Control",
        "subdimension_key":  "finance_process_control",
        "dimension_key":  "finance",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Strategic and insightful financial and management reporting are real time and fundamental to strategic decision making.",
                                           "Financial policies, processes, and controls are consistent across the enterprise and are highly automated and strategic.",
                                           "Integrated financial and tax planning provisioning and compliance reduce financial and reputational risk."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Timely financial reporting and analysis are used to inform operational decision making.",
                                           "The finance and tax process is responsive.",
                                           "The business has robust financial controls, which are predominantly preventative."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The primary focus is on measuring and reporting.",
                                           "Financial and tax controls are detective rather than preventative. They are primarily maintained by executives."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The company does not have codified financial controls.",
                                           "The financial controls in place and rudimentary and ineffective."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Stakeholder Management",
        "subdimension_key":  "stakeholder_management",
        "dimension_key":  "finance",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Key stakeholders are banks, primary investors, regulators, people, policymakers, and communities.",
                                           "The business clearly articulates its whole corporate story and tailors it to individual stakeholders.",
                                           "There is a track record of consistent delivery against promises.",
                                           "The company is ready to explain its tax position to regulators and the public."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Key stakeholders are banks, primary investors, regulators and people.",
                                           "There are clearly defined roles and responsibilities to manage key stakeholders.",
                                           "The business understand stakeholder needs and is increasingly transparent in its communications."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Key stakeholders are banks and primary investors.",
                                           "The business builds trust with stakeholders by focusing on compliance and statutory requirements."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The business does not have good engagement or assigned responsibility to any stakeholder."
                                       ]
                       }
                   ]
    },
    {
        "label":  "People and Organization",
        "subdimension_key":  "people_organization",
        "dimension_key":  "finance",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The structure is highly efficient and effective.",
                                           "The structure is an optimal combination of shared services, outsourcing, and local capability which enables the group to provide consistent services.",
                                           "Finance is a reliable pipeline of leadership talent for the business."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The structure is highly effective or high effective but rarely both.",
                                           "Certain activities are centralized to manage costs.",
                                           "The business suits view the finance function as knowledgeable and relevant.",
                                           "Strong analytical capability drives business value."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "There are highly specialized functions which work in silos.",
                                           "Finance resources are effective at managing financial reporting and control."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "Financial functions are generic and lack specialty.",
                                           "Financial and operational controls are not codified."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Data and Technology",
        "subdimension_key":  "data_technology",
        "dimension_key":  "finance",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Efficient and effective financial systems enable most finance and tax resources to focus on enhancing business performance.",
                                           "Management produces financial forecasts that are comprehensive and reliable to making strategic business decisions.",
                                           "Financial data is an assets that is actively managed and highly valued."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Multiple legacy systems support financial and tax processes at a relatively high cost.",
                                           "Common financial data enables analysis across the enterprise"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Finance and tax teams rely heavily on basic systems of spreadsheets to compensate for underdeveloped core finance systems.",
                                           "Accuracy is the primacy focus of financial owners."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The importance of data for business decisions is not well understood by the firm.",
                                           "The firm does not collect relevant financial and operational data.",
                                           "The firm does not have systems in place to collect relevant financial and operational data."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Funding Growth",
        "subdimension_key":  "funding_growth",
        "dimension_key":  "finance",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The growth funding strategy supports the business strategy which includes:",
                                           "Established sources of optimal capital and associated costs.",
                                           "Working capital optimization as an asset, not a liability.",
                                           "Integrated assets management, acquisition and disposal and exit plans.",
                                           "Tax planning as a source of capital",
                                           "A capital allocation plan."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "There is access to multiple sources of capital to fund growth.",
                                           "The business knows how to improve working capital but hasn\u0027t fully implemented it yet.",
                                           "There are evolving functions to mange banks, investors, and other financial stakeholders"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Lack of funding constrains growth",
                                           "Leaders are focused on top-line growth and liquidity events.",
                                           "Capital sources are identified and evaluated.",
                                           "Leaders are aware of how working capital supports funding"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "Leaders are not aware of how working capital affects its business",
                                           "Capital sources are not identified",
                                           "Lack of funding constrains current operations and key business areas"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Digital Enterprise",
        "subdimension_key":  "digital_enterprise",
        "dimension_key":  "analytics",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The enterprise has become a digital business. Digital is at the heart of the way it does business, the products and services it offers, and how it interacts with customers, vendors, employees and other stakeholders.",
                                           "Digital innovation is strongly encouraged within the organization, which enhances the core capabilities of the enterprise and opens up new market opportunities.",
                                           "Emerging technologies are embraced and adopted within the business in an agile way.",
                                           "The enterprise values the data within and outside the organization and uses the latest advances analytic techniques to drive action"
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Key digital technologies are leveraged to support the existing business model.",
                                           "The business uses digital technologies to identify trends and impact market information.",
                                           "Innovation is limited to certain business functions.",
                                           "The organization waits to adopt new and emerging technologies until they are proven.",
                                           "The enterprise values data within the organization but uses external data in a restricted way"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "There is very limited thinking on how the digital experience should be structured",
                                           "The IT function drives digital applications in response to business requirements",
                                           "There is limited innovation with new business models or emerging technologies",
                                           "The enterprise is slow to adopt new technology",
                                           "The organization has challenges getting value from its own data"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The enterprise does not adopt to new technologies",
                                           "The organization does not have in place the ability to collect business level data"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Data and Analytics",
        "subdimension_key":  "data_analytics",
        "dimension_key":  "analytics",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The business has a data-driven culture where the use of techniques that fully leverage the internal and external data within the firm drive decision making.",
                                           "The business leverages advanced analytic techniques and big data to drive a competitive advantage.",
                                           "There is a culture and approach to experimentation through analytics that influences decisions making across the business."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The business recognizes the importance of quality data and has deployed tools and techniques to leverage its own internal data to drive business insight.",
                                           "Analytics is starting to be used in various parts of the business to improve decision making and business processes.",
                                           "The business has started to implement enterprise data, governance, and processes with the appropriate systems to support.",
                                           "There is limited experimentation with big data."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The business spends a lot of time fixing data quality issues in a tactical way and has limited time to generate real business value and insight from its own data.",
                                           "There is very limited use of external data.",
                                           "The focus of analytics is on reporting historical view of data and limited use of what if analysis",
                                           "Data management is ad hoc throughout the organization and there is limited capability to handle big data"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The enterprise has limited skills to be able to analyze any data collected.",
                                           "The enterprise has no data management procedures in place.",
                                           "The enterprise spends no time to analyze data because even collecting data for the firm currently has limitations."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Security and Privacy",
        "subdimension_key":  "security_privacy",
        "dimension_key":  "analytics",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Security is viewed as a critical component of the company\u0027s overall risk management.",
                                           "Security and primary strategies are driven by protection of the most critical digital assets and support of business growth drivers.",
                                           "Security efforts follow an active defense approach with proactive identification of issues driven from inside the company and consumption of external, sector relevant threat intelligence.",
                                           "The focus is on operating a resilient security and privacy capability."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Security architecture is in place that supports a defensive strategy. This provides layers of deterrence that limit attackers ability to access critical digital assets.",
                                           "The security function recognizes and regularly evaluates the ecosystem including reliance on third partied and business partnerships.",
                                           "Security is viewed as an IT issue but has oversight from and regular supporting to non IT stakeholders.",
                                           "The company recognizes and balances investment and operational effort between preventative controls and a strong monitoring and response capability."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The security focus is on building and or maintain perimeter controls and legacy end point controls.",
                                           "Compliance with regulatory requirements drives security efforts.",
                                           "Security issues are identified and addressed reactively.",
                                           "Security and privacy issues are driven bottom up in the organization"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The company does not have any security or privacy controls in place.",
                                           "The company does not internally have the capabilities to understand the security and privacy risks and has yet to outsource this function."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Governance",
        "subdimension_key":  "governance",
        "dimension_key":  "risk",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "There is a strong governance structure in place, including an independent board of directors with strong industry experience and other active committees.",
                                           "A model using leadership, risk management and internal audit is well defined and fully understood across the organization.",
                                           "Leadership set the risk culture and appetite in a tone from the top."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The board of directors and audit committee are actively involved in oversight.",
                                           "Independent risk and control functions\u0027 roles and responsibilities are clearly defined and documented and follow a model incorporating leadership, risk management, and internal audit."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "A board of directors or informal advisory board exists.",
                                           "Leaders of the business are responsible for governance and they tend to manage this in silos."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "There is no defined governance structure in place."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Risk Management",
        "subdimension_key":  "risk_management",
        "dimension_key":  "risk",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Efficient and effective enterprise-wide risk management delivers improved business performance, better profits, well-managed and secure growth and efficient use of capital.",
                                           "Risk management features regularly in investor and analyst dialog, attracts investment and drives a lower cost of capital.",
                                           "Risk strategy is clearly articulated and rigorously applied to promote decisions at all levels.",
                                           "Risk is embedded in the operational culture of the business.",
                                           "Key business risk are aligned to Key Performance Indicators and managed to ensure business objectives are met."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "There is a structured approach to identifying, monitoring and assessing key risks and controls.",
                                           "Risk management influences all key expenditures.",
                                           "Risk management is clearly articulated in all role descriptions and performance criteria.",
                                           "Risk relating to financial, tax, legal and other compliance activities are actively managed."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Management shared responsibility for identifying, documenting, and regularly reviewing key risks that are critical to achieving business objectives."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The company does not have a firm understanding of the key risks that affect the business",
                                           "The company is not fully aware of all regulatory and compliance activities that need to take place."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Policy and Compliance",
        "subdimension_key":  "policy_compliance",
        "dimension_key":  "risk",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "There is a comprehensive documented, group-wide policy framework to manage business risk with strong leadership tone from the top.",
                                           "The risk framework extends to external stakeholders in the value chain.",
                                           "The business contributes to the development of the regulatory landscape.",
                                           "Governance, risk and compliance technologies, such as software packages, are used in a coordinated and integrated manner to support risk activities across the organization."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Individual functions have formally documented policies and procedures. These are aligned to overall business strategies and objectives.",
                                           "There is an independent compliance function to manage internal and external regulations.",
                                           "Governance risk and compliance technologies are enabled to select risk activities."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Management leads the development and control of risk and procedures for major risks.",
                                           "The business has a reactive approach to complying with internal and external regulations.",
                                           "Microsoft Office and other products are used to enable risk activities."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The company does not have developed policies in place to account for the risk, financial, and operational aspects of the firm."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Stakeholder Management",
        "subdimension_key":  "stakeholder_management",
        "dimension_key":  "risk",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Effective risk management enhances reputation, brand, and stakeholder trust in the business and drives investor confidence.",
                                           "Risk management is a differentiating factor in stakeholder investment.",
                                           "The business publishes annual corporate social responsibility reports.",
                                           "The company proactively communicates its risk management program to regulators and the public."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The business effectively communicates risk and risk management in response to stakeholder inquires"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Management tells key stakeholders how they handle the most important risk"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "Management has limited ability to inform stakeholders on the risk management practices as these have not yet developed strategies around risk mitigation"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Impact Metrics",
        "subdimension_key":  "impact_metrics",
        "dimension_key":  "impact",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The enterprise has a robust grasp of the social impact that it creates through understanding the breath (how many), depth (by how much), and social inclusion (percent women, youth, lower poverty)."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The firm has a firm understanding on at least one but not all of the social impact that it creates through understanding the breath (how many), depth (by how much), and social inclusion (percent women, youth, lower poverty)."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The firm has started to have an understanding of the social impact in which it creates.",
                                           "The firm has developed initial metrics in which it tracks its social impact"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The firm does not understand what type of social impact that it creates through its business operations"
                                       ]
                       }
                   ]
    },
    {
        "label":  "Technology",
        "subdimension_key":  "technology",
        "dimension_key":  "impact",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "Efficient and effective social impact systems enable most impact resources to focus on enhancing the social impact of the business",
                                           "Management produces social impact forecasts that are comprehensive and reliable to making strategic business decisions which effect social impact",
                                           "Social impact data is an asset that is actively managed and highly valued."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Multiple legacy systems support social impact measurement processes at a relatively high cost.",
                                           "Common social impact data enables analysis across the enterprise"
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "Social impact teams rely heavily on basic systems of spreadsheets to compensate for underdeveloped social impact data collection systems.",
                                           "Accuracy is the primacy focus of people who monitor social impact data."
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The importance of social impact data for business decisions is not well understood by the firm.",
                                           "The firm does not collect relevant social impact data.",
                                           "The firm does not have systems in place to collect relevant social impact data."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Data and Analytics",
        "subdimension_key":  "data_analytics",
        "dimension_key":  "impact",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The business has a data-driven culture where the use of techniques that fully leverage the internal and external data within the firm to drive social impact decision making.",
                                           "The business leverages advanced analytic techniques and big data to understand the best ways to create more social impact",
                                           "There is a culture and approach to experimentation through analytics that influences decision making across the business."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "The business recognizes the importance of quality data and has deployed tools and techniques to leverage its own internal social impact data to drive business insight.",
                                           "Analytics is starting to be used social impact to improve decision making and business processes."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The business spends a lot of time fixing data quality issues in a tactile way and has limited time to generate real insight from its own data.",
                                           "There is very limited use of external data.",
                                           "The focus of analytics is on reporting historical view of data and limited use of what if analysis",
                                           "Data management is ad hoc throughout the organization and there is limited capability to handle big data"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The enterprise has limited skills to be able to analyze any social impact data collected.",
                                           "The enterprise has no data management procedures in place to collect social impact data",
                                           "The enterprise spends no time to analyze data because even collecting social impact data for the firm currently has limitations."
                                       ]
                       }
                   ]
    },
    {
        "label":  "Design",
        "subdimension_key":  "design",
        "dimension_key":  "impact",
        "levels":  [
                       {
                           "level":  1,
                           "bullets":  [
                                           "The firm has developed a business model in which its primary function is to create a sustainable business which maximizes the social impact that it can create.",
                                           "The enterprise utilizes social impact data to be able to refine the products, services, and business model to create more sustainable impact."
                                       ]
                       },
                       {
                           "level":  2,
                           "bullets":  [
                                           "Social impact is integrated into the business model of the enterprise",
                                           "The enterprise does not fully utilize social impact data to refine the business model of the firm."
                                       ]
                       },
                       {
                           "level":  3,
                           "bullets":  [
                                           "The firm does not adapt the business model to be able to maximize social impact"
                                       ]
                       },
                       {
                           "level":  4,
                           "bullets":  [
                                           "The business model of the enterprise has no forethought into the design of the model"
                                       ]
                       }
                   ]
    }
];

const BY_KEY = new Map(
  MATURITY_RUBRIC.map((entry) => [`${entry.dimension_key}:${entry.subdimension_key}`, entry])
);

/** The full four-level rubric for one subdimension. */
export function rubricFor(dimensionKey: string, subdimensionKey: string) {
  return BY_KEY.get(`${dimensionKey}:${subdimensionKey}`) ?? null;
}

/** The definition bullets for one subdimension at one maturity level. */
export function rubricLevel(dimensionKey: string, subdimensionKey: string, level: number) {
  return (
    rubricFor(dimensionKey, subdimensionKey)?.levels.find((l) => l.level === level) ?? null
  );
}