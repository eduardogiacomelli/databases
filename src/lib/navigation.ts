import {
  Database,
  HardDrive,
  Layers,
  Search,
  Hash,
  FileText,
  BarChart3,
  GitBranch,
  TreePine,
  Grid3x3,
  Settings,
  BookOpen,
  Cog,
  Sparkles,
  Workflow,
  ArrowDownUp,
  Calculator,
  Shuffle,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  shortTitle?: string;
  url: string;
  icon?: LucideIcon;
  isSimulator?: boolean;
};

export type NavGroup = {
  title: string;
  shortTitle?: string;
  url: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const navigation: NavGroup[] = [
  {
    title: "Ch 16 — Disk Storage & File Structures",
    shortTitle: "Ch 16 · Storage",
    url: "/dashboard/chapter-16",
    icon: HardDrive,
    items: [
      {
        title: "Records & Record Types",
        shortTitle: "Records",
        url: "/dashboard/chapter-16/records-and-record-types",
        icon: FileText,
      },
      {
        title: "Files of Records",
        shortTitle: "Files",
        url: "/dashboard/chapter-16/files-of-records",
        icon: Layers,
      },
      {
        title: "Disk Storage & Access",
        shortTitle: "Disk Access",
        url: "/dashboard/chapter-16/disk-storage-and-access",
        icon: HardDrive,
      },
      {
        title: "Schema Builder",
        shortTitle: "Schema Builder",
        url: "/dashboard/chapter-16/schema-builder",
        icon: Database,
        isSimulator: true,
      },
      {
        title: "File Access Methods",
        shortTitle: "File Access",
        url: "/dashboard/chapter-16/file-access",
        icon: Search,
        isSimulator: true,
      },
      {
        title: "Retrieval & Update Ops",
        shortTitle: "Retrieval Ops",
        url: "/dashboard/chapter-16/retrieval-and-update",
        icon: BarChart3,
      },
      {
        title: "Primary Index & ISAM",
        shortTitle: "Primary & ISAM",
        url: "/dashboard/chapter-16/primary-index-sequential",
        icon: GitBranch,
      },
      {
        title: "Hashing",
        shortTitle: "Hashing",
        url: "/dashboard/chapter-16/hashing",
        icon: Hash,
        isSimulator: true,
      },
    ],
  },
  {
    title: "Ch 17 — Indexing & Physical Design",
    shortTitle: "Ch 17 · Indexing",
    url: "/dashboard/chapter-17",
    icon: TreePine,
    items: [
      {
        title: "Single-Level Ordered Indexes",
        shortTitle: "Single-Level",
        url: "/dashboard/chapter-17/single-level-indexes",
        icon: Layers,
      },
      {
        title: "Primary Indexes",
        shortTitle: "Primary",
        url: "/dashboard/chapter-17/primary-indexes",
        icon: GitBranch,
      },
      {
        title: "Clustering Indexes",
        shortTitle: "Clustering",
        url: "/dashboard/chapter-17/clustering-indexes",
        icon: Grid3x3,
      },
      {
        title: "Secondary Indexes",
        shortTitle: "Secondary",
        url: "/dashboard/chapter-17/secondary-indexes",
        icon: Search,
      },
      {
        title: "Index Properties Overview",
        shortTitle: "Properties",
        url: "/dashboard/chapter-17/index-properties",
        icon: BarChart3,
      },
      {
        title: "Multilevel Indexes",
        shortTitle: "Multilevel",
        url: "/dashboard/chapter-17/multilevel-indexes",
        icon: Layers,
        isSimulator: true,
      },
      {
        title: "B-Trees",
        shortTitle: "B-Trees",
        url: "/dashboard/chapter-17/b-trees",
        icon: TreePine,
        isSimulator: true,
      },
      {
        title: "B+ Trees",
        shortTitle: "B+ Trees",
        url: "/dashboard/chapter-17/b-plus-trees",
        icon: TreePine,
        isSimulator: true,
      },
      {
        title: "Multiple Key Indexes",
        shortTitle: "Multi-Key",
        url: "/dashboard/chapter-17/multiple-key-indexes",
        icon: Grid3x3,
      },
      {
        title: "Other Index Types",
        shortTitle: "Other Types",
        url: "/dashboard/chapter-17/other-index-types",
        icon: Hash,
      },
      {
        title: "General Indexing Issues",
        shortTitle: "Issues",
        url: "/dashboard/chapter-17/general-indexing-issues",
        icon: Settings,
      },
      {
        title: "Physical Database Design",
        shortTitle: "Physical Design",
        url: "/dashboard/chapter-17/physical-database-design",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Ch 18 — Query Execution",
    shortTitle: "Ch 18 · Execution",
    url: "/dashboard/chapter-18",
    icon: Cog,
    items: [
      {
        title: "SQL to Relational Algebra",
        shortTitle: "SQL → Algebra",
        url: "/dashboard/chapter-18/sql-to-relational-algebra",
        icon: GitBranch,
      },
      {
        title: "External Sorting",
        shortTitle: "External Sort",
        url: "/dashboard/chapter-18/external-sorting",
        icon: ArrowDownUp,
        isSimulator: true,
      },
      {
        title: "SELECT Algorithms",
        shortTitle: "SELECT",
        url: "/dashboard/chapter-18/select-algorithms",
        icon: Search,
        isSimulator: true,
      },
      {
        title: "JOIN Algorithms",
        shortTitle: "JOIN",
        url: "/dashboard/chapter-18/join-algorithms",
        icon: Shuffle,
        isSimulator: true,
      },
      {
        title: "Other Operations",
        shortTitle: "Other Ops",
        url: "/dashboard/chapter-18/other-operations",
        icon: Layers,
      },
      {
        title: "Pipelining",
        shortTitle: "Pipelining",
        url: "/dashboard/chapter-18/pipelining",
        icon: Workflow,
        isSimulator: true,
      },
    ],
  },
  {
    title: "Ch 19 — Query Optimization",
    shortTitle: "Ch 19 · Optimization",
    url: "/dashboard/chapter-19",
    icon: Sparkles,
    items: [
      {
        title: "Heuristic Rules",
        shortTitle: "Heuristics",
        url: "/dashboard/chapter-19/heuristic-optimization",
        icon: GitBranch,
        isSimulator: true,
      },
      {
        title: "Cost Estimation",
        shortTitle: "Cost Est.",
        url: "/dashboard/chapter-19/cost-estimation",
        icon: Calculator,
        isSimulator: true,
      },
      {
        title: "DP Join Ordering",
        shortTitle: "DP Ordering",
        url: "/dashboard/chapter-19/dp-optimization",
        icon: Grid3x3,
        isSimulator: true,
      },
      {
        title: "Semantic Optimization",
        shortTitle: "Semantic",
        url: "/dashboard/chapter-19/semantic-optimization",
        icon: BookOpen,
      },
      {
        title: "Worked Examples — reasoning & Big-O",
        shortTitle: "Walkthroughs",
        url: "/dashboard/chapter-19/worked-examples",
        icon: BookOpen,
        isSimulator: true,
      },
      {
        title: "Other SQL commands",
        shortTitle: "SQL variations",
        url: "/dashboard/chapter-19/sql-variations",
        icon: BookOpen,
      },
      {
        title: "Worked Example 1 — full tree",
        shortTitle: "Example 1",
        url: "/otimizacao-fisica",
        icon: FileText,
      },
      {
        title: "Worked Example 2 — full tree",
        shortTitle: "Example 2",
        url: "/otimizacao-fisica-2",
        icon: FileText,
      },
      {
        title: "Worked Example 3 — full tree",
        shortTitle: "Example 3",
        url: "/otimizacao-fisica-3",
        icon: FileText,
      },
      {
        title: "Worked Example 4 — full tree",
        shortTitle: "Example 4",
        url: "/otimizacao-fisica-4",
        icon: FileText,
      },
    ],
  },
];

export function getFlatNavItems(): NavItem[] {
  const items: NavItem[] = [];
  for (const group of navigation) {
    items.push({ title: group.title, url: group.url, icon: group.icon });
    for (const item of group.items) {
      items.push(item);
    }
  }
  return items;
}

export function getNavContext(pathname: string) {
  const flat = getFlatNavItems();
  const currentIndex = flat.findIndex((item) => item.url === pathname);

  const current = flat[currentIndex] ?? { title: "Dashboard", url: "/dashboard" };
  const prev = currentIndex > 0 ? flat[currentIndex - 1] : undefined;
  const next = currentIndex < flat.length - 1 ? flat[currentIndex + 1] : undefined;

  const breadcrumbs: { title: string; url: string }[] = [
    { title: "Database Internals", url: "/dashboard" },
  ];

  for (const group of navigation) {
    if (pathname.startsWith(group.url)) {
      breadcrumbs.push({ title: group.title, url: group.url });
      const item = group.items.find((i) => i.url === pathname);
      if (item) {
        breadcrumbs.push({ title: item.title, url: item.url });
      }
      break;
    }
  }

  return { current, prev, next, breadcrumbs };
}
