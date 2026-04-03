import React, { useMemo } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

const centerTextPlugin = {
  id: "centerTextPlugin",
  afterDatasetsDraw(chart, _args, pluginOptions) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const { x, y } = meta.data[0];
    const total = pluginOptions?.total ?? 0;
    const label = pluginOptions?.label ?? "";

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 34px Segoe UI";
    ctx.fillText(String(total), x, y - 6);

    ctx.fillStyle = "rgba(183, 194, 207, 0.78)";
    ctx.font = "600 12px Segoe UI";
    ctx.fillText(label, x, y + 18);
    ctx.restore();
  },
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  centerTextPlugin,
);

const cardClass =
  "relative overflow-hidden rounded-[26px] border border-white/10 bg-[#151c25] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.12)]";

const chartWrapClass =
  "relative mt-6 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-4";

const shortenTopicLabel = (label) =>
  String(label || "")
    .replace("Depth-First Search", "DFS")
    .replace("Dynamic Programming", "DP")
    .replace("Hash Table", "Hash")
    .replace("Binary Search", "Binary")
    .replace("Backtracking", "Backtrack");

const ChartsSection = ({ diffData, topicData }) => {
  const solvedTotal =
    (diffData?.easy || 0) + (diffData?.medium || 0) + (diffData?.hard || 0);
  const filteredTopicData = useMemo(() => {
    if (!topicData?.labels?.length || !topicData?.data?.length) {
      return { labels: [], data: [], average: 0 };
    }

    const pairs = topicData.labels.map((label, index) => ({
      label,
      value: Number(topicData.data[index] || 0),
    }));

    const average =
      pairs.reduce((sum, item) => sum + item.value, 0) / pairs.length;

    let selected = pairs
      .filter((item) => item.value <= average)
      .sort(
        (left, right) =>
          right.value - left.value || left.label.localeCompare(right.label),
      );

    // Keep the chart focused on weaker coverage, but make sure it still
    // shows a meaningful set of topics instead of collapsing to a tiny sample.
    if (selected.length < 8) {
      selected = [...pairs]
        .sort(
          (left, right) =>
            left.value - right.value || left.label.localeCompare(right.label),
        )
        .slice(0, Math.min(8, pairs.length))
        .sort(
          (left, right) =>
            right.value - left.value || left.label.localeCompare(right.label),
        );
    }

    return {
      labels: selected.map((item) => item.label),
      data: selected.map((item) => item.value),
      average,
    };
  }, [topicData]);
  const strongestTopic = useMemo(() => {
    if (!topicData?.labels?.length || !topicData?.data?.length) return null;

    let bestIndex = 0;
    for (let i = 1; i < topicData.data.length; i += 1) {
      if (topicData.data[i] > topicData.data[bestIndex]) {
        bestIndex = i;
      }
    }

    return {
      label: topicData.labels[bestIndex],
      value: topicData.data[bestIndex],
    };
  }, [topicData]);

  const doughnutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "72%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#b7c5d9",
            font: { size: 13, weight: "600" },
            boxWidth: 12,
            boxHeight: 12,
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: "#101723",
          borderColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          titleColor: "#ffffff",
          bodyColor: "#dbe5f4",
          padding: 12,
        },
        centerTextPlugin: {
          total: solvedTotal,
          label: "solved mix",
        },
      },
    }),
    [solvedTotal],
  );

  const doughnutData = {
    labels: ["Easy", "Medium", "Hard"],
    datasets: [
      {
        data: [diffData?.easy || 0, diffData?.medium || 0, diffData?.hard || 0],
        backgroundColor: [
          "rgba(16, 185, 129, 0.92)",
          "rgba(245, 158, 11, 0.92)",
          "rgba(244, 63, 94, 0.9)",
        ],
        hoverBackgroundColor: [
          "rgba(52, 211, 153, 1)",
          "rgba(251, 191, 36, 1)",
          "rgba(251, 113, 133, 1)",
        ],
        borderColor: "#151c25",
        borderWidth: 5,
        hoverOffset: 8,
      },
    ],
  };

  const barGradient = (context) => {
    const chart = context.chart;
    const { ctx, chartArea } = chart;
    if (!chartArea) return "rgba(148,163,184,0.62)";

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, "rgba(125, 211, 252, 0.95)");
    gradient.addColorStop(0.55, "rgba(96, 165, 250, 0.8)");
    gradient.addColorStop(1, "rgba(71, 85, 105, 0.86)");
    return gradient;
  };

  const barData = {
    labels: filteredTopicData.labels.map(shortenTopicLabel),
    datasets: [
      {
        label: "Problems Solved",
        data: filteredTopicData.data,
        backgroundColor: barGradient,
        borderRadius: 10,
        borderSkipped: false,
        maxBarThickness: 18,
        categoryPercentage: 0.72,
        barPercentage: 0.78,
      },
      {
        label: "Average",
        data: filteredTopicData.labels.map(() => filteredTopicData.average),
        type: "line",
        borderColor: "rgba(125, 211, 252, 0.92)",
        borderWidth: 1.8,
        borderDash: [6, 6],
        pointRadius: 0,
      },
      {
        label: "Weak Threshold",
        data: filteredTopicData.labels.map(() => 20),
        type: "line",
        borderColor: "rgba(251, 113, 133, 0.9)",
        borderWidth: 1.8,
        borderDash: [4, 6],
        pointRadius: 0,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#b7c5d9",
          font: { size: 12, weight: "600" },
          boxWidth: 12,
          boxHeight: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#101723",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "#ffffff",
        bodyColor: "#dbe5f4",
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255,255,255,0.08)", drawBorder: false },
        ticks: { color: "#93a4bb", font: { size: 12, weight: "600" } },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#a8b6cc",
          font: { size: 11, weight: "700" },
          maxRotation: 18,
          minRotation: 18,
        },
      },
    },
  };

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className={`${cardClass} lg:col-span-1`}>
        <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 bg-[radial-gradient(circle,rgba(245,158,11,0.13),transparent_62%)] blur-2xl" />
        <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">
          Difficulty Distribution
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#b7c2cf]">
          A stronger view of how your solved set spreads across easy, medium, and hard.
        </p>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-emerald-400/15 bg-emerald-500/10 px-3 py-1 text-emerald-200">
            {diffData?.easy || 0} Easy
          </span>
          <span className="rounded-full border border-amber-400/15 bg-amber-500/10 px-3 py-1 text-amber-200">
            {diffData?.medium || 0} Medium
          </span>
          <span className="rounded-full border border-rose-400/15 bg-rose-500/10 px-3 py-1 text-rose-200">
            {diffData?.hard || 0} Hard
          </span>
        </div>

        <div className={chartWrapClass}>
          <div className="h-[290px]">
            {solvedTotal > 0 ? (
              <Doughnut data={doughnutData} options={doughnutOptions} />
            ) : (
              <div className="flex h-full items-center justify-center font-medium text-white/42">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`${cardClass} lg:col-span-2`}>
        <div className="pointer-events-none absolute left-0 top-0 h-32 w-32 bg-[radial-gradient(circle,rgba(125,211,252,0.12),transparent_62%)] blur-2xl" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">
              Topic Strength Distribution
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#b7c2cf]">
              Focused on average and below-average topics so weak coverage is easier to spot.
            </p>
          </div>

          {filteredTopicData.labels.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">
                Topics shown
              </div>
              <div className="mt-1 font-semibold text-white">
                {filteredTopicData.labels.length} below avg
              </div>
              <div className="mt-1 text-white/52">
                Avg line at {filteredTopicData.average.toFixed(1)}
              </div>
            </div>
          ) : null}
        </div>

        <div className={chartWrapClass}>
          <div className="h-[300px] w-full">
            {filteredTopicData.labels.length > 0 ? (
              <Bar data={barData} options={barOptions} />
            ) : (
              <div className="flex h-full items-center justify-center font-medium text-white/42">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsSection;
