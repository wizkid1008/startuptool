export type SmeatDimensionKey =
  | "customer"
  | "people"
  | "operations"
  | "finance"
  | "analytics"
  | "risk"
  | "impact";

export type SmeatSubdimension = {
  key: string;
  label: string;
};

export type SmeatDimension = {
  key: SmeatDimensionKey;
  label: string;
  description: string;
  subdimensions: SmeatSubdimension[];
};

export const SMEAT_DIMENSIONS: SmeatDimension[] = [
  {
    key: "customer",
    label: "Customer",
    description: "Products, markets, acquisition, sales, pricing, and experience.",
    subdimensions: [
      { key: "products_markets_channels", label: "Products, Markets & Channels" },
      { key: "marketing_branding", label: "Marketing and Branding" },
      { key: "sales_pricing", label: "Sales and Pricing" },
      { key: "customer_experience", label: "Customer Experience" }
    ]
  },
  {
    key: "people",
    label: "People",
    description: "Capability, leadership, performance, innovation, and rewards.",
    subdimensions: [
      { key: "capability", label: "Capability" },
      { key: "performance_management", label: "Performance Management" },
      { key: "innovation", label: "Innovation" },
      { key: "leadership", label: "Leadership" },
      { key: "rewards", label: "Rewards" }
    ]
  },
  {
    key: "operations",
    label: "Operations",
    description: "Supply chain, operations assets, logistics, strategy, and excellence.",
    subdimensions: [
      { key: "sourcing_supply_chain", label: "Sourcing & Supply Chain" },
      { key: "internal_operations_assets", label: "Internal Operations & Assets" },
      { key: "distribution_logistics", label: "Distribution & Logistics" },
      { key: "operations_strategy", label: "Operations Strategy" },
      { key: "operational_excellence", label: "Operational Excellence" }
    ]
  },
  {
    key: "finance",
    label: "Finance",
    description: "Controls, stakeholders, finance organization, data, and funding growth.",
    subdimensions: [
      { key: "finance_process_control", label: "Finance Process & Control" },
      { key: "stakeholder_management", label: "Stakeholder Management" },
      { key: "people_organization", label: "People & Organization" },
      { key: "data_technology", label: "Data and Technology" },
      { key: "funding_growth", label: "Funding Growth" }
    ]
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Digital enterprise, analytics maturity, security, and privacy.",
    subdimensions: [
      { key: "digital_enterprise", label: "Digital Enterprise" },
      { key: "data_analytics", label: "Data and Analytics" },
      { key: "security_privacy", label: "Security and Privacy" }
    ]
  },
  {
    key: "risk",
    label: "Risk",
    description: "Governance, risk management, compliance, and stakeholder controls.",
    subdimensions: [
      { key: "governance", label: "Governance" },
      { key: "risk_management", label: "Risk Management" },
      { key: "policy_compliance", label: "Policy & Compliance" },
      { key: "stakeholder_management", label: "Stakeholder Management" }
    ]
  },
  {
    key: "impact",
    label: "Impact",
    description: "Impact metrics, technology, analytics, and design.",
    subdimensions: [
      { key: "impact_metrics", label: "Impact Metrics" },
      { key: "technology", label: "Technology" },
      { key: "data_analytics", label: "Data and Analytics" },
      { key: "design", label: "Design" }
    ]
  }
];

export function findSubdimension(dimensionKey: string, subdimensionKey: string) {
  return SMEAT_DIMENSIONS.find((dimension) => dimension.key === dimensionKey)
    ?.subdimensions.find((subdimension) => subdimension.key === subdimensionKey);
}
