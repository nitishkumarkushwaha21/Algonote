import {
  BrainCircuit,
  ClipboardList,
  FolderKanban,
  FolderPlus,
  Link2,
  ListChecks,
  ScanSearch,
  SquareCheckBig,
  Sparkles,
  SquarePen,
  Youtube,
} from "lucide-react";

export const workflowSteps = [
  {
    id: "capture",
    title: "Bring in what you already have",
    description:
      "Start from a playlist, a sheet link, or pasted problem text instead of rebuilding your prep from scratch.",
    icon: Link2,
  },
  {
    id: "structure",
    title: "Turn it into a revision-ready set",
    description:
      "Algo Note organizes messy inputs into folders and problem files that are actually usable for practice.",
    icon: Sparkles,
  },
  {
    id: "revise",
    title: "Practice inside the same system",
    description:
      "Solve, save notes, and revisit the same workspace later when revision day comes back around.",
    icon: ListChecks,
  },
];

export const workspaceArchitectureSteps = [
  {
    id: "paste-link",
    order: "01",
    title: "Paste Link",
    label: "Input",
    description: "Problem source",
    icon: Link2,
    accent: "rgba(96,165,250,0.92)",
  },
  {
    id: "build-sheet",
    order: "02",
    title: "Build Sheet",
    label: "Structure",
    description: "Revision layout",
    icon: FolderPlus,
    accent: "rgba(56,189,248,0.92)",
  },
  {
    id: "fetch-context",
    order: "03",
    title: "Fetch Context",
    label: "Auto Fetch",
    description: "Statement + metadata",
    icon: ScanSearch,
    accent: "rgba(125,211,252,0.95)",
  },
  {
    id: "paste-solution",
    order: "04",
    title: "Add Solution",
    label: "Solve",
    description: "Code + notes",
    icon: SquarePen,
    accent: "rgba(167,139,250,0.95)",
  },
  {
    id: "revision-set",
    order: "05",
    title: "Revision Set",
    label: "Result",
    description: "Ready to revisit",
    icon: SquareCheckBig,
    accent: "rgba(52,211,153,0.95)",
  },
];

export const productPillars = [
  {
    id: "workspace",
    eyebrow: "Core Workspace",
    title: "One place for code, notes, and revision context.",
    description:
      "Your imported sets do not disappear into a dead list. They stay attached to folders you can keep using over time.",
    icon: FolderKanban,
  },
  {
    id: "inputs",
    eyebrow: "Flexible Input",
    title: "Built for the messy way people actually collect problems.",
    description:
      "Pull from links, YouTube playlists, and raw copied text without forcing every source into the same manual workflow.",
    icon: ClipboardList,
  },
  {
    id: "loop",
    eyebrow: "Revision Loop",
    title: "Designed for returning, not just storing.",
    description:
      "The product is centered on repeat practice, so your prep system stays useful after the first import is done.",
    icon: BrainCircuit,
  },
];

export const inputChannels = [
  {
    id: "links",
    title: "Problem Links",
    description: "Turn saved links into a structured practice set.",
    icon: Link2,
    accent: "rgba(96,165,250,0.9)",
  },
  {
    id: "playlists",
    title: "YouTube Playlists",
    description: "Convert curated video paths into revision sheets.",
    icon: Youtube,
    accent: "rgba(155,140,255,0.9)",
  },
  {
    id: "raw-text",
    title: "Raw Problem Lists",
    description: "Paste mixed text and clean it into a usable workspace.",
    icon: ClipboardList,
    accent: "rgba(101,214,255,0.92)",
  },
];
