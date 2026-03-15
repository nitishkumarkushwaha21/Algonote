// Topic-wise question bank for recommendations.
// Keep this file as the single source of truth for curated practice lists.

function slugifyLeetCodeTitle(title) {
  return String(title)
    .trim()
    .toLowerCase()
    .replace(/\s*\([^)]*\)\s*/g, " ") // drop parenthetical notes
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toLeetCodeUrl(problem) {
  if (problem.leetcodeUrl) return problem.leetcodeUrl;
  const slug = problem.titleSlug || slugifyLeetCodeTitle(problem.name);
  return `https://leetcode.com/problems/${slug}/`;
}

const DEFAULT_DIFFICULTY = "Medium";

/**
 * Format:
 * {
 *   topic: string,
 *   description: string,
 *   problems: Array<{ name: string, difficulty?: 'Easy'|'Medium'|'Hard', titleSlug?: string, leetcodeUrl?: string }>
 * }
 */
const QUESTION_BANK = [
  {
    topic: "Fast and Slow Pointer",
    description:
      "Two pointers moving at different speeds; great for cycles/middle/palindrome checks.",
    problems: [
      { name: "Linked List Cycle II", difficulty: "Medium" },
      { name: "Remove Nth Node From End of List", difficulty: "Medium" },
      { name: "Find the Duplicate Number", difficulty: "Medium" },
      { name: "Palindrome Linked List", difficulty: "Easy" },
    ],
  },
  {
    topic: "Overlapping Intervals",
    description: "Sort + merge/insert; interval scheduling style patterns.",
    problems: [
      { name: "Merge Intervals", difficulty: "Medium" },
      { name: "Insert Interval", difficulty: "Medium" },
      { name: "My Calendar II", difficulty: "Medium" },
      {
        name: "Minimum Number of Arrows to Burst Balloons",
        difficulty: "Medium",
      },
      { name: "Non-overlapping Intervals", difficulty: "Medium" },
    ],
  },
  {
    topic: "Prefix Sum",
    description:
      "Cumulative sums/products to answer subarray range queries fast.",
    problems: [
      { name: "Find the Middle Index in Array", difficulty: "Easy" },
      { name: "Product of Array Except Self", difficulty: "Medium" },
      { name: "Maximum Product Subarray", difficulty: "Medium" },
      { name: "Number of Ways to Split Array", difficulty: "Medium" },
      { name: "Range Sum Query 2D - Immutable", difficulty: "Medium" },
    ],
  },
  {
    topic: "Sliding Window",
    description: "Maintain a window invariant; fixed/variable windows in O(n).",
    problems: [
      {
        name: "Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold",
        difficulty: "Medium",
      },
      { name: "Repeated DNA Sequences", difficulty: "Medium" },
      { name: "Permutation in String", difficulty: "Medium" },
      { name: "Sliding Subarray Beauty", difficulty: "Hard" },
      { name: "Sliding Window Maximum", difficulty: "Hard" },
      {
        name: "Longest Substring Without Repeating Characters",
        difficulty: "Medium",
      },
      { name: "Minimum Size Subarray Sum", difficulty: "Medium" },
      { name: "Subarray Product Less Than K", difficulty: "Medium" },
      { name: "Max Consecutive Ones", difficulty: "Easy" },
      { name: "Fruit Into Baskets", difficulty: "Medium" },
      { name: "Count Number of Nice Subarrays", difficulty: "Medium" },
      { name: "Minimum Window Substring", difficulty: "Hard" },
    ],
  },
  {
    topic: "Two Pointers",
    description:
      "Move two indices to satisfy constraints; often sorting helps.",
    problems: [
      { name: "Two Sum II - Input Array Is Sorted", difficulty: "Medium" },
      { name: "Sort Colors", difficulty: "Medium" },
      { name: "Next Permutation", difficulty: "Medium" },
      { name: "Bag of Tokens", difficulty: "Medium" },
      { name: "Container With Most Water", difficulty: "Medium" },
      { name: "Trapping Rain Water", difficulty: "Hard" },
    ],
  },
  {
    topic: "Cyclic Sort",
    description:
      "Index-based placement; great for missing/duplicate range problems.",
    problems: [
      { name: "Missing Number", difficulty: "Easy" },
      { name: "Find All Numbers Disappeared in an Array", difficulty: "Easy" },
      { name: "Set Mismatch", difficulty: "Easy" },
      { name: "First Missing Positive", difficulty: "Hard" },
    ],
  },
  {
    topic: "Reversal of Linked List",
    description: "In-place list reversal; k-groups and pair swaps.",
    problems: [
      { name: "Reverse Linked List", difficulty: "Easy" },
      { name: "Reverse Nodes in k-Group", difficulty: "Hard" },
      { name: "Swap Nodes in Pairs", difficulty: "Medium" },
    ],
  },
  {
    topic: "Matrix Manipulation",
    description: "2D traversal and in-place transforms.",
    problems: [
      { name: "Rotate Image", difficulty: "Medium" },
      { name: "Spiral Matrix", difficulty: "Medium" },
      { name: "Set Matrix Zeroes", difficulty: "Medium" },
      { name: "Game of Life", difficulty: "Medium" },
    ],
  },
  {
    topic: "BFS",
    description: "Level-order traversal; shortest path in unweighted graphs.",
    problems: [
      { name: "Shortest Path in Binary Matrix", difficulty: "Medium" },
      { name: "Rotting Oranges", difficulty: "Medium" },
      { name: "As Far from Land as Possible", difficulty: "Medium" },
      { name: "Word Ladder", difficulty: "Hard" },
    ],
  },
  {
    topic: "DFS",
    description:
      "Explore deep; islands/regions/boundaries and graph traversal.",
    problems: [
      { name: "Number of Closed Islands", difficulty: "Medium" },
      { name: "Coloring a Border", difficulty: "Medium" },
      { name: "Number of Enclaves", difficulty: "Medium" },
      { name: "Time Needed to Inform All Employees", difficulty: "Medium" },
      { name: "Find Eventual Safe States", difficulty: "Medium" },
    ],
  },
  {
    topic: "Backtracking",
    description:
      "Try choices, recurse, undo; combinations/permutations/search.",
    problems: [
      { name: "Permutations II", difficulty: "Medium" },
      { name: "Combination Sum", difficulty: "Medium" },
      { name: "Generate Parentheses", difficulty: "Medium" },
      { name: "N-Queens", difficulty: "Hard" },
      { name: "Sudoku Solver", difficulty: "Hard" },
      { name: "Palindrome Partitioning", difficulty: "Medium" },
      { name: "Word Search", difficulty: "Medium" },
    ],
  },
  {
    topic: "Modified Binary Search",
    description:
      "Binary search variations for rotated/special arrays and constraints.",
    problems: [
      { name: "Search in Rotated Sorted Array", difficulty: "Medium" },
      { name: "Find Minimum in Rotated Sorted Array", difficulty: "Medium" },
      { name: "Find Peak Element", difficulty: "Medium" },
      { name: "Single Element in a Sorted Array", difficulty: "Medium" },
      { name: "Minimum Time to Arrive on Time", difficulty: "Medium" },
      { name: "Capacity To Ship Packages Within D Days", difficulty: "Medium" },
      { name: "Koko Eating Bananas", difficulty: "Medium" },
      { name: "Find in Mountain Array", difficulty: "Hard" },
      { name: "Median of Two Sorted Arrays", difficulty: "Hard" },
    ],
  },
  {
    topic: "Bitwise XOR",
    description: "XOR tricks for pairing/singletons and prefix XOR.",
    problems: [
      { name: "Missing Number", difficulty: "Easy" },
      { name: "Single Number II", difficulty: "Medium" },
      { name: "Single Number III", difficulty: "Medium" },
      { name: "Find the Original Array of Prefix XOR", difficulty: "Medium" },
      { name: "XOR Queries of a Subarray", difficulty: "Medium" },
    ],
  },
  {
    topic: "Top K Elements",
    description: "Heap/quickselect for k-th and frequent elements.",
    problems: [
      { name: "Top K Frequent Elements", difficulty: "Medium" },
      { name: "Kth Largest Element in an Array", difficulty: "Medium" },
      { name: "Ugly Number II", difficulty: "Medium" },
      { name: "K Closest Points to Origin", difficulty: "Medium" },
    ],
  },
  {
    topic: "K-way Merge",
    description: "Merge k sorted lists/arrays using a heap.",
    problems: [
      { name: "Find K Pairs with Smallest Sums", difficulty: "Medium" },
      { name: "Kth Smallest Element in a Sorted Matrix", difficulty: "Medium" },
      { name: "Merge k Sorted Lists", difficulty: "Hard" },
      {
        name: "Smallest Range Covering Elements from K Lists",
        difficulty: "Hard",
      },
    ],
  },
  {
    topic: "Two Heaps",
    description: "Maintain median / split distribution with min+max heaps.",
    problems: [
      { name: "Find Median from Data Stream", difficulty: "Hard" },
      { name: "Sliding Window Median", difficulty: "Hard" },
      { name: "IPO", difficulty: "Hard" },
    ],
  },
  {
    topic: "Monotonic Stack",
    description: "Next greater/smaller and histogram rectangle patterns.",
    problems: [
      { name: "Next Greater Element II", difficulty: "Medium" },
      { name: "Next Greater Node In Linked List", difficulty: "Medium" },
      { name: "Daily Temperatures", difficulty: "Medium" },
      { name: "Online Stock Span", difficulty: "Medium" },
      { name: "Maximum Width Ramp", difficulty: "Medium" },
      { name: "Largest Rectangle in Histogram", difficulty: "Hard" },
    ],
  },
  {
    topic: "Trees",
    description:
      "Core binary tree traversals, construction, LCA, and path sums.",
    problems: [
      { name: "Binary Tree Level Order Traversal", difficulty: "Medium" },
      {
        name: "Binary Tree Zigzag Level Order Traversal",
        difficulty: "Medium",
      },
      { name: "Even Odd Tree", difficulty: "Medium" },
      { name: "Reverse Odd Levels of Binary Tree", difficulty: "Medium" },
      { name: "Deepest Leaves Sum", difficulty: "Medium" },
      { name: "Add One Row to Tree", difficulty: "Medium" },
      { name: "Maximum Width of Binary Tree", difficulty: "Medium" },
      { name: "All Nodes Distance K in Binary Tree", difficulty: "Medium" },
      {
        name: "Construct Binary Tree from Preorder and Inorder Traversal",
        difficulty: "Medium",
      },
      {
        name: "Construct Binary Tree from Inorder and Postorder Traversal",
        difficulty: "Medium",
      },
      { name: "Maximum Binary Tree", difficulty: "Medium" },
      {
        name: "Construct Binary Search Tree from Preorder Traversal",
        difficulty: "Medium",
      },
      { name: "Maximum Depth of Binary Tree", difficulty: "Easy" },
      { name: "Balanced Binary Tree", difficulty: "Easy" },
      { name: "Diameter of Binary Tree", difficulty: "Easy" },
      { name: "Minimum Depth of Binary Tree", difficulty: "Easy" },
      { name: "Binary Tree Paths", difficulty: "Easy" },
      { name: "Path Sum II", difficulty: "Medium" },
      { name: "Sum Root to Leaf Numbers", difficulty: "Medium" },
      { name: "Smallest String Starting From Leaf", difficulty: "Medium" },
      {
        name: "Insufficient Nodes in Root to Leaf Paths",
        difficulty: "Medium",
      },
      {
        name: "Pseudo-Palindromic Paths in a Binary Tree",
        difficulty: "Medium",
      },
      { name: "Binary Tree Maximum Path Sum", difficulty: "Hard" },
      { name: "Lowest Common Ancestor of a Binary Tree", difficulty: "Medium" },
      {
        name: "Maximum Difference Between Node and Ancestor",
        difficulty: "Medium",
      },
      {
        name: "Lowest Common Ancestor of Deepest Leaves",
        difficulty: "Medium",
      },
      { name: "Kth Ancestor of a Tree Node", difficulty: "Hard" },
      { name: "Validate Binary Search Tree", difficulty: "Medium" },
      { name: "Range Sum of BST", difficulty: "Easy" },
      { name: "Minimum Absolute Difference in BST", difficulty: "Easy" },
      { name: "Insert into a Binary Search Tree", difficulty: "Medium" },
      {
        name: "Lowest Common Ancestor of a Binary Search Tree",
        difficulty: "Medium",
      },
    ],
  },
  {
    topic: "Dynamic Programming",
    description:
      "Optimization with overlapping subproblems; many classic patterns.",
    problems: [
      { name: "House Robber II", difficulty: "Medium" },
      { name: "Target Sum", difficulty: "Medium" },
      { name: "Partition Equal Subset Sum", difficulty: "Medium" },
      { name: "Ones and Zeroes", difficulty: "Medium" },
      { name: "Last Stone Weight II", difficulty: "Medium" },
      { name: "Coin Change", difficulty: "Medium" },
      { name: "Coin Change II", difficulty: "Medium" },
      { name: "Perfect Squares", difficulty: "Medium" },
      { name: "Minimum Cost For Tickets", difficulty: "Medium" },
      { name: "Longest Increasing Subsequence", difficulty: "Medium" },
      { name: "Largest Divisible Subset", difficulty: "Medium" },
      { name: "Maximum Length of Pair Chain", difficulty: "Medium" },
      {
        name: "Number of Longest Increasing Subsequence",
        difficulty: "Medium",
      },
      { name: "Longest String Chain", difficulty: "Medium" },
      { name: "Unique Paths II", difficulty: "Medium" },
      { name: "Minimum Path Sum", difficulty: "Medium" },
      { name: "Triangle", difficulty: "Medium" },
      { name: "Minimum Falling Path Sum", difficulty: "Medium" },
      { name: "Maximal Square", difficulty: "Medium" },
      { name: "Cherry Pickup", difficulty: "Hard" },
      { name: "Dungeon Game", difficulty: "Hard" },
      { name: "Longest Common Subsequence", difficulty: "Medium" },
      { name: "Longest Palindromic Subsequence", difficulty: "Medium" },
      { name: "Palindromic Substrings", difficulty: "Medium" },
      { name: "Longest Palindromic Substring", difficulty: "Medium" },
      { name: "Edit Distance", difficulty: "Hard" },
      {
        name: "Minimum ASCII Delete Sum for Two Strings",
        difficulty: "Medium",
      },
      { name: "Distinct Subsequences", difficulty: "Hard" },
      { name: "Shortest Common Supersequence", difficulty: "Hard" },
      { name: "Wildcard Matching", difficulty: "Hard" },
      { name: "Best Time to Buy and Sell Stock II", difficulty: "Medium" },
      { name: "Best Time to Buy and Sell Stock III", difficulty: "Hard" },
      { name: "Best Time to Buy and Sell Stock IV", difficulty: "Hard" },
      {
        name: "Best Time to Buy and Sell Stock with Cooldown",
        difficulty: "Medium",
      },
      {
        name: "Best Time to Buy and Sell Stock with Transaction Fee",
        difficulty: "Medium",
      },
      { name: "Partition Array for Maximum Sum", difficulty: "Medium" },
      { name: "Burst Balloons", difficulty: "Hard" },
      { name: "Minimum Cost to Cut a Stick", difficulty: "Hard" },
      { name: "Palindrome Partitioning II", difficulty: "Hard" },
    ],
  },
  {
    topic: "Graphs",
    description: "Topological sort, union-find, shortest paths, MST.",
    problems: [
      { name: "Course Schedule", difficulty: "Medium" },
      { name: "Course Schedule II", difficulty: "Medium" },
      {
        name: "Number of Operations to Make Network Connected",
        difficulty: "Medium",
      },
      { name: "Redundant Connection", difficulty: "Medium" },
      { name: "Accounts Merge", difficulty: "Medium" },
      { name: "Satisfiability of Equality Equations", difficulty: "Medium" },
      { name: "Min Cost to Connect All Points", difficulty: "Medium" },
      { name: "Cheapest Flights Within K Stops", difficulty: "Medium" },
      {
        name: "Find the City With the Smallest Number of Neighbors at a Threshold Distance",
        difficulty: "Medium",
      },
      { name: "Network Delay Time", difficulty: "Medium" },
    ],
  },
  {
    topic: "Greedy",
    description: "Local optimal choices; prove correctness with invariants.",
    problems: [
      { name: "Jump Game II", difficulty: "Medium" },
      { name: "Gas Station", difficulty: "Medium" },
      { name: "Bag of Tokens", difficulty: "Medium" },
      { name: "Boats to Save People", difficulty: "Medium" },
      { name: "Wiggle Subsequence", difficulty: "Medium" },
      { name: "Car Pooling", difficulty: "Medium" },
      { name: "Candy", difficulty: "Hard" },
    ],
  },
  {
    topic: "Design Data Structure",
    description: "Implement data structures with optimal operations.",
    problems: [
      { name: "Design Twitter", difficulty: "Medium" },
      { name: "Design Browser History", difficulty: "Medium" },
      { name: "Design Circular Deque", difficulty: "Medium" },
      { name: "Snapshot Array", difficulty: "Medium" },
      { name: "LRU Cache", difficulty: "Medium" },
      { name: "LFU Cache", difficulty: "Hard" },
    ],
  },
];

module.exports = {
  QUESTION_BANK,
  toLeetCodeUrl,
  slugifyLeetCodeTitle,
};
