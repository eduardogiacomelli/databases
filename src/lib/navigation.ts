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
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isSimulator?: boolean;
};

export type NavGroup = {
  title: string;
  url: string;
  icon: LucideIcon;
  items: NavItem[];
};

export const navigation: NavGroup[] = [
  {
    title: "Ch 16 — Disk Storage & File Structures",
    url: "/dashboard/chapter-16",
    icon: HardDrive,
    items: [
      {
        title: "Records & Record Types",
        url: "/dashboard/chapter-16/records-and-record-types",
        icon: FileText,
      },
      {
        title: "Files of Records",
        url: "/dashboard/chapter-16/files-of-records",
        icon: Layers,
      },
      {
        title: "Disk Storage & Access",
        url: "/dashboard/chapter-16/disk-storage-and-access",
        icon: HardDrive,
      },
      {
        title: "Schema Builder",
        url: "/dashboard/chapter-16/schema-builder",
        icon: Database,
        isSimulator: true,
      },
      {
        title: "File Access Methods",
        url: "/dashboard/chapter-16/file-access",
        icon: Search,
        isSimulator: true,
      },
      {
        title: "Retrieval & Update Ops",
        url: "/dashboard/chapter-16/retrieval-and-update",
        icon: BarChart3,
      },
      {
        title: "Primary Index & ISAM",
        url: "/dashboard/chapter-16/primary-index-sequential",
        icon: GitBranch,
      },
      {
        title: "Hashing",
        url: "/dashboard/chapter-16/hashing",
        icon: Hash,
        isSimulator: true,
      },
    ],
  },
  {
    title: "Ch 17 — Indexing & Physical Design",
    url: "/dashboard/chapter-17",
    icon: TreePine,
    items: [
      {
        title: "Single-Level Ordered Indexes",
        url: "/dashboard/chapter-17/single-level-indexes",
        icon: Layers,
      },
      {
        title: "Primary Indexes",
        url: "/dashboard/chapter-17/primary-indexes",
        icon: GitBranch,
      },
      {
        title: "Clustering Indexes",
        url: "/dashboard/chapter-17/clustering-indexes",
        icon: Grid3x3,
      },
      {
        title: "Secondary Indexes",
        url: "/dashboard/chapter-17/secondary-indexes",
        icon: Search,
      },
      {
        title: "Index Properties Overview",
        url: "/dashboard/chapter-17/index-properties",
        icon: BarChart3,
      },
      {
        title: "Multilevel Indexes",
        url: "/dashboard/chapter-17/multilevel-indexes",
        icon: Layers,
        isSimulator: true,
      },
      {
        title: "B-Trees",
        url: "/dashboard/chapter-17/b-trees",
        icon: TreePine,
        isSimulator: true,
      },
      {
        title: "B+ Trees",
        url: "/dashboard/chapter-17/b-plus-trees",
        icon: TreePine,
        isSimulator: true,
      },
      {
        title: "Multiple Key Indexes",
        url: "/dashboard/chapter-17/multiple-key-indexes",
        icon: Grid3x3,
      },
      {
        title: "Other Index Types",
        url: "/dashboard/chapter-17/other-index-types",
        icon: Hash,
      },
      {
        title: "General Indexing Issues",
        url: "/dashboard/chapter-17/general-indexing-issues",
        icon: Settings,
      },
      {
        title: "Physical Database Design",
        url: "/dashboard/chapter-17/physical-database-design",
        icon: BookOpen,
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

  // Build breadcrumbs from path segments
  const breadcrumbs: { title: string; url: string }[] = [
    { title: "Database Internals", url: "/dashboard" },
  ];

  // Find parent group
  for (const group of navigation) {
    if (pathname.startsWith(group.url)) {
      breadcrumbs.push({ title: group.title, url: group.url });
      // Find current item
      const item = group.items.find((i) => i.url === pathname);
      if (item) {
        breadcrumbs.push({ title: item.title, url: item.url });
      }
      break;
    }
  }

  return { current, prev, next, breadcrumbs };
}
