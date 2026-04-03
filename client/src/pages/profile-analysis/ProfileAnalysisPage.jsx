import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/react";
import ProfileInput from "./ProfileInput";
import ProfileSummaryCards from "./ProfileSummaryCards";
import ChartsSection from "./ChartsSection";
import StrengthSection from "./StrengthSection";
import WeaknessSection from "./WeaknessSection";
import RecommendationSection from "./RecommendationSection";
import VerdictSection from "./VerdictSection";
import profileAnalysisApi from "../../services/profileAnalysisApi";

// ── Static topic data (LeetCode API doesn't provide topic breakdown) ──────────
const STATIC_TOPICS = [
  { name: "Array", solved: 0 },
  { name: "String", solved: 0 },
  { name: "Hash Table", solved: 0 },
  { name: "Dynamic Programming", solved: 0 },
  { name: "Tree", solved: 0 },
  { name: "Depth-First Search", solved: 0 },
  { name: "Binary Search", solved: 0 },
  { name: "Graph", solved: 0 },
  { name: "Trie", solved: 0 },
  { name: "Backtracking", solved: 0 },
];

// Distribute solved counts across topics based on difficulty breakdown
const buildTopics = (easy, medium, hard) => {
  const total = easy + medium + hard;
  if (total === 0) return STATIC_TOPICS;
  // Heuristic distribution based on problem ratios
  return [
    { name: "Array", solved: Math.round(easy * 0.6 + medium * 0.4) },
    { name: "String", solved: Math.round(easy * 0.4 + medium * 0.2) },
    { name: "Hash Table", solved: Math.round(medium * 0.25) },
    {
      name: "Dynamic Programming",
      solved: Math.round(medium * 0.3 + hard * 0.4),
    },
    { name: "Tree", solved: Math.round(easy * 0.2 + medium * 0.2) },
    {
      name: "Depth-First Search",
      solved: Math.round(medium * 0.15 + hard * 0.2),
    },
    { name: "Binary Search", solved: Math.round(medium * 0.1 + easy * 0.1) },
    { name: "Graph", solved: Math.round(medium * 0.1 + hard * 0.2) },
    { name: "Trie", solved: Math.round(hard * 0.1) },
    { name: "Backtracking", solved: Math.round(medium * 0.05 + hard * 0.1) },
  ];
};

const calculateVerdict = ({ easySolved, mediumSolved, hardSolved }) => {
  const rawScore = easySolved * 1 + mediumSolved * 2 + hardSolved * 3;
  const MAX_RAW_SCORE = 1500;
  const score = Math.min((rawScore / MAX_RAW_SCORE) * 100, 100);

  let level = "Beginner Level";
  let message =
    "Focus on building foundational knowledge. Solve more easy problems to grasp core concepts.";
  if (score >= 70) {
    level = "SDE Interview Ready";
    message =
      "You have a strong grasp of DSA! Focus on hard problems and mock interviews to sharpen your edge.";
  } else if (score >= 40) {
    level = "Intermediate Level";
    message =
      "Good progress! Start focusing on medium problems and topics like DP and Graphs to level up.";
  }
  return { score, level, message };
};

const PROFILE_ANALYSIS_STORAGE_PREFIX = "profile-analysis:last:";

// ─────────────────────────────────────────────────────────────────────────────
const ProfileAnalysisPage = () => {
  const { isSignedIn, userId } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [topics, setTopics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [revisionSheetRows, setRevisionSheetRows] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const storageKey = useMemo(
    () => (userId ? `${PROFILE_ANALYSIS_STORAGE_PREFIX}${userId}` : null),
    [userId],
  );

  useEffect(() => {
    if (!isSignedIn || !storageKey) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);

      setProfileData(saved.profileData || null);
      setTopics(saved.topics || null);
      setVerdict(saved.verdict || null);
      setRecommendations(saved.recommendations || null);
      setCurrentUsername(saved.currentUsername || "");
      setRevisionSheetRows(saved.revisionSheetRows || []);
      setImportResult(saved.importResult || null);
      setError(null);
    } catch (_error) {
      window.localStorage.removeItem(storageKey);
    }
  }, [isSignedIn, storageKey]);

  useEffect(() => {
    if (!isSignedIn || !storageKey || !profileData || !currentUsername) {
      return;
    }

    const payload = {
      profileData,
      topics,
      verdict,
      recommendations,
      currentUsername,
      revisionSheetRows,
      importResult,
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [
    currentUsername,
    importResult,
    isSignedIn,
    profileData,
    recommendations,
    revisionSheetRows,
    storageKey,
    topics,
    verdict,
  ]);

  const handleAnalyze = async (username) => {
    if (!username.trim()) return;
    setIsLoading(true);
    setError(null);
    setProfileData(null);
    setRevisionSheetRows([]);

    try {
      const { data } = await profileAnalysisApi.analyzeProfile(username.trim());

      const normalised = {
        totalSolved: data.totalSolved ?? 0,
        easySolved: data.easySolved ?? 0,
        mediumSolved: data.mediumSolved ?? 0,
        hardSolved: data.hardSolved ?? 0,
        acceptanceRate:
          data.acceptanceRate != null
            ? parseFloat(data.acceptanceRate).toFixed(1)
            : "N/A",
        ranking: data.ranking ?? 0,
        contestRating: data.contributionPoints ?? data.reputation ?? 0,
      };

      const derivedTopics = buildTopics(
        normalised.easySolved,
        normalised.mediumSolved,
        normalised.hardSolved,
      );
      const verdictData = calculateVerdict(normalised);

      const weakTopicNames = derivedTopics
        .filter((t) => t.solved <= 20)
        .map((t) => t.name);
      let filteredRecs = {};
      try {
        const recRes = await profileAnalysisApi.getRecommendations({
          weakAreas: weakTopicNames,
          limit: 20,
        });
        filteredRecs = recRes.data?.data || {};
      } catch (e) {
        filteredRecs = {};
      }

      setProfileData(normalised);
      setTopics(derivedTopics);
      setVerdict(verdictData);
      setRecommendations(filteredRecs);
      setCurrentUsername(username.trim().toLowerCase());
      setImportResult(null);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Failed to fetch profile. Check username and try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Saves a single problem to the revision list (MongoDB via profile-analysis service)
  const handleAddToRevision = async (problem, topic) => {
    if (!currentUsername) throw new Error("No user analyzed yet.");
    const problemName = problem.problemName || problem.name;
    const leetcodeUrl = problem.leetcodeUrl || problem.url || "";
    const topicFolderName = topic || "Recommended";

    await profileAnalysisApi.addRevision({
      username: currentUsername,
      problemName,
      difficulty: problem.difficulty || "Medium",
      leetcodeUrl,
    });

    setRevisionSheetRows((rows) => [
      ...rows,
      {
        topic: topicFolderName,
        problem: problemName,
        difficulty: problem.difficulty || "Medium",
        link: leetcodeUrl,
      },
    ]);
  };

  // Imports ALL recommendations into the Explorer in one shot (backend service-to-service)
  const handleImportToExplorer = async () => {
    if (!recommendations || Object.keys(recommendations).length === 0) return;
    setIsImporting(true);
    setImportResult(null);
    try {
      const problems = [];
      Object.entries(recommendations).forEach(([topic, probs]) => {
        probs.forEach((p) => {
          problems.push({
            topic,
            problemName: p.name,
            difficulty: p.difficulty || "Medium",
            leetcodeUrl: p.leetcodeUrl || p.url || "",
          });
        });
      });
      const res = await profileAnalysisApi.importWeakAreas({ problems });
      setImportResult({
        success: true,
        message: `Imported ${res.data.filesCreated} problems into Explorer under "Weak Areas"`,
      });
    } catch (err) {
      setImportResult({
        success: false,
        message: err.response?.data?.error || err.message || "Import failed",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const exportRevisionSheet = () => {
    if (!revisionSheetRows.length) return;
    const header = ["Topic", "Problem", "Difficulty", "Link"];
    const lines = revisionSheetRows.map((r) =>
      [r.topic, r.problem, r.difficulty, r.link].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revision-sheet-${currentUsername || "session"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartTopicData = topics
    ? { labels: topics.map((t) => t.name), data: topics.map((t) => t.solved) }
    : null;

  const chartDiffData = profileData
    ? {
        easy: profileData.easySolved,
        medium: profileData.mediumSolved,
        hard: profileData.hardSolved,
      }
    : null;

  return (
    <div className="relative min-h-full overflow-hidden bg-[#071018] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(148,163,184,0.14),transparent_24%),radial-gradient(circle_at_34%_8%,rgba(71,85,105,0.08),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.03),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-8 max-w-5xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">
            Interview Readiness Dashboard
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-[3rem]">
            Analyze your profile and turn weak areas into a sharper practice plan.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#b7c2cf] sm:text-base">
            Audit your LeetCode progress, surface the gaps holding you back,
            and convert recommendations into a cleaner workspace flow.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-300/16 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
              Topic signals
            </span>
            <span className="rounded-full border border-slate-300/16 bg-slate-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200">
              Difficulty mix
            </span>
            <span className="rounded-full border border-sky-300/16 bg-sky-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-200">
              Generated questions
            </span>
          </div>
        </div>

        <ProfileInput onAnalyze={handleAnalyze} isLoading={isLoading} />

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/12 bg-red-500/10 px-5 py-4 text-sm text-red-200">
            <span className="shrink-0 font-semibold">!</span>
            <span>{error}</span>
          </div>
        )}

        {profileData && (
          <div className="animate-fadeIn">
            <ProfileSummaryCards data={profileData} />

            {verdict && (
              <VerdictSection
                score={verdict.score}
                level={verdict.level}
                message={verdict.message}
              />
            )}

            <ChartsSection diffData={chartDiffData} topicData={chartTopicData} />

            <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">
              <StrengthSection
                strongTopics={topics?.filter((t) => t.solved >= 50)}
              />
              <WeaknessSection
                weakTopics={topics?.filter((t) => t.solved <= 20)}
              />
            </div>

            <RecommendationSection
              recommendations={recommendations}
              onAddToRevision={handleAddToRevision}
              onExportSheet={exportRevisionSheet}
              hasRevisionRows={revisionSheetRows.length > 0}
              onImportToExplorer={handleImportToExplorer}
              isImporting={isImporting}
              importResult={importResult}
            />
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
      `,
        }}
      />
    </div>
  );
};

export default ProfileAnalysisPage;
