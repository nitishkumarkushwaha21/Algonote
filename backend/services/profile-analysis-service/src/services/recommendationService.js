const { QUESTION_BANK, toLeetCodeUrl } = require("../data/dsaQuestionBank");

function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normaliseTopic(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

// Maps the frontend's heuristic topics to the curated bank topics.
const TOPIC_MAP = {
  graph: ["Graphs", "BFS", "DFS"],
  trie: ["Design Data Structure"],
  backtracking: ["Backtracking"],
  "dynamic programming": ["Dynamic Programming"],
  tree: ["Trees"],
  "depth-first search": ["DFS"],
  "binary search": ["Modified Binary Search"],
  array: ["Two Pointers", "Sliding Window", "Prefix Sum"],
  string: ["Sliding Window", "Two Pointers"],
  "hash table": ["Sliding Window", "Prefix Sum"],
};

function pickTopicsFromWeakAreas(weakAreas) {
  const desired = [];
  for (const area of weakAreas || []) {
    const mapped = TOPIC_MAP[normaliseTopic(area)];
    if (mapped?.length) desired.push(...mapped);
  }
  return Array.from(new Set(desired));
}

function indexBank() {
  const byTopic = new Map();
  for (const bucket of QUESTION_BANK) {
    byTopic.set(bucket.topic, bucket);
  }
  return byTopic;
}

/**
 * Returns grouped recommendations in the same shape used by the UI:
 * {
 *   [topic]: Array<{ name, difficulty, leetcodeUrl, comment }>
 * }
 */
function getTopicWiseRecommendations({ weakAreas = [], limit = 20 } = {}) {
  const byTopic = indexBank();

  const topics = pickTopicsFromWeakAreas(weakAreas);
  const topicsToUse = topics.length ? topics : Array.from(byTopic.keys());

  const chosen = new Set();
  const grouped = {};

  // Pre-shuffle each topic's list so we don't always return the same order.
  const topicQueues = topicsToUse
    .map((t) => byTopic.get(t))
    .filter(Boolean)
    .map((bucket) => ({
      topic: bucket.topic,
      description: bucket.description,
      queue: shuffle(bucket.problems),
    }));

  // Round-robin across topics until we hit limit.
  let safety = 0;
  while (chosen.size < limit && topicQueues.length && safety < 10_000) {
    safety += 1;
    let progressed = false;

    for (const tq of topicQueues) {
      if (chosen.size >= limit) break;
      const next = tq.queue.pop();
      if (!next) continue;

      const key = `${tq.topic}::${next.name}`.toLowerCase();
      if (chosen.has(key)) continue;

      progressed = true;
      chosen.add(key);

      const problem = {
        name: next.name,
        problemName: next.name,
        difficulty: next.difficulty || "Medium",
        leetcodeUrl: toLeetCodeUrl(next),
        comment: tq.description,
      };

      if (!grouped[tq.topic]) grouped[tq.topic] = [];
      grouped[tq.topic].push(problem);
    }

    if (!progressed) break;
  }

  // Ensure at most `limit` total if a topic got extra (shouldn't happen, but safe).
  let count = 0;
  for (const topic of Object.keys(grouped)) {
    const remaining = limit - count;
    if (remaining <= 0) {
      delete grouped[topic];
      continue;
    }
    if (grouped[topic].length > remaining)
      grouped[topic] = grouped[topic].slice(0, remaining);
    count += grouped[topic].length;
  }

  return grouped;
}

function getQuestionBankForTopic(topic) {
  if (!topic) return null;
  const byTopic = indexBank();
  const bucket = byTopic.get(String(topic).trim());
  if (!bucket) return null;

  return {
    topic: bucket.topic,
    description: bucket.description,
    problems: bucket.problems.map((problem) => ({
      name: problem.name,
      problemName: problem.name,
      difficulty: problem.difficulty || "Medium",
      leetcodeUrl: toLeetCodeUrl(problem),
      comment: bucket.description,
    })),
  };
}

module.exports = {
  getQuestionBankForTopic,
  getTopicWiseRecommendations,
};
