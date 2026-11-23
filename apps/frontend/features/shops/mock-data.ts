// Placeholder data for the dashboard UI. Replace with the real API later.
export type ShopStatus = "active" | "blocked";
export type ShopIcon = "store" | "pill" | "alert" | "cross" | "building";

export type RecentShop = {
  id: string;
  name: string;
  subtitle: string;
  warning?: boolean;
  code: string;
  adminName: string;
  contact: string;
  createdAt: string;
  status: ShopStatus;
  icon: ShopIcon;
};

export const RECENT_SHOPS: RecentShop[] = [
  { id: "1", name: "Apex Care Pharmacy", subtitle: "Retail Dispensary • Ward 4", code: "SHP-8041", adminName: "Dr. Elena Vance", contact: "+1 (555) 234-8901", createdAt: "14/05/2028", status: "active", icon: "store" },
  { id: "2", name: "BioHealth Meds", subtitle: "Cold-Chain Compounding Hub", code: "SHP-7922", adminName: "Marcus Brody", contact: "+1 (555) 456-7890", createdAt: "12/05/2028", status: "active", icon: "pill" },
  { id: "3", name: "St. Jude Clinical Chemist", subtitle: "License Expired • Pending Review", warning: true, code: "SHP-7810", adminName: "Sarah Jenkins", contact: "+1 (555) 789-0123", createdAt: "09/05/2028", status: "blocked", icon: "alert" },
  { id: "4", name: "CurePoint Central", subtitle: "Metropolitan Outpatient Branch", code: "SHP-7754", adminName: "Dr. David Kim", contact: "+1 (555) 912-3456", createdAt: "04/05/2028", status: "active", icon: "building" },
  { id: "5", name: "Metro Rx Express", subtitle: "24/7 Automated Dispensing Unit", code: "SHP-7629", adminName: "Rachel Adams", contact: "+1 (555) 678-9012", createdAt: "28/04/2028", status: "active", icon: "cross" },
];

export const TOTAL_SHOPS = 128;

export type DashboardStat = {
  key: string;
  label: string;
  value: number;
  hint: string;
  icon: "shops" | "active" | "blocked" | "new";
  /** Matches a semantic color token: team, attendance, danger, approval. */
  tone: "team" | "attendance" | "danger" | "approval";
};

export const DASHBOARD_STATS: DashboardStat[] = [
  { key: "total", label: "Total Shops", value: 128, hint: "Across the network", icon: "shops", tone: "team" },
  { key: "active", label: "Active Shops", value: 119, hint: "Operating normally", icon: "active", tone: "attendance" },
  { key: "blocked", label: "Blocked Shops", value: 9, hint: "Need review", icon: "blocked", tone: "danger" },
  { key: "new", label: "New This Month", value: 14, hint: "Recently registered", icon: "new", tone: "approval" },
];
