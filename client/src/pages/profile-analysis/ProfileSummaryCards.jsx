import React from "react";

const cards = [
  { key: "totalSolved", title: "Total Solved", tone: "text-sky-200" },
  { key: "easySolved", title: "Easy", tone: "text-emerald-200" },
  { key: "mediumSolved", title: "Medium", tone: "text-amber-200" },
  { key: "hardSolved", title: "Hard", tone: "text-rose-200" },
  { key: "acceptanceRate", title: "Acceptance", suffix: "%", tone: "text-white" },
  { key: "ranking", title: "Ranking", format: (v) => v.toLocaleString(), tone: "text-white" },
  { key: "contestRating", title: "Contest", format: (v) => Math.round(v), tone: "text-white" },
];

const ProfileSummaryCards = ({ data }) => {
  if (!data) return null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">
      {cards.map((card) => {
        const raw = data[card.key];
        const value = card.format ? card.format(raw) : raw;

        return (
          <div
            key={card.key}
            className="rounded-[20px] border border-white/10 bg-[#141d2a] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.1)]"
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">
              {card.title}
            </div>
            <div className={`mt-3 text-3xl font-semibold tracking-[-0.04em] ${card.tone}`}>
              {value}
              {card.suffix || ""}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProfileSummaryCards;
