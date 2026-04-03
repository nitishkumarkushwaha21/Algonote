import React from "react";
import { ArrowLeft, FolderPlus, Sparkles, SquarePen } from "lucide-react";

const FolderHeader = ({
  folderName,
  itemCount,
  folderInput,
  problemInput,
  activeFilter,
  onBack,
  onResetRevisions,
  onFolderInputKeyDown,
  onProblemInputKeyDown,
  onFolderInputChange,
  onProblemInputChange,
  onCreateFolder,
  onCreateProblem,
  onFilterChange,
}) => {
  const filters = ["all", "unsolved", "unrevised", "important"];

  return (
    <div style={styles.header}>
      <div style={styles.topRow}>
        <button
          style={styles.iconButton}
          onClick={onBack}
          title="Back"
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.10)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
        >
          <ArrowLeft size={17} color="rgba(255,255,255,0.82)" />
        </button>

        <button
          style={styles.resetButton}
          onClick={onResetRevisions}
          title="Reset All Revisions"
          onMouseEnter={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.11)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
        >
          Reset Sheet
        </button>

        <div style={styles.actionGroup}>
          <div style={styles.problemInputWrap}>
            <SquarePen size={14} color="rgba(251,191,36,0.92)" />
            <input
              type="text"
              placeholder="Paste LeetCode or GFG problem link..."
              style={styles.actionInput}
              value={problemInput}
              onChange={(event) => onProblemInputChange(event.target.value)}
              onKeyDown={onProblemInputKeyDown}
              onFocus={(event) => {
                event.currentTarget.parentElement.style.borderColor = "rgba(255,255,255,0.28)";
                event.currentTarget.parentElement.style.background = "rgba(255,255,255,0.06)";
              }}
              onBlur={(event) => {
                event.currentTarget.parentElement.style.borderColor = "rgba(255,255,255,0.14)";
                event.currentTarget.parentElement.style.background = "rgba(255,255,255,0.04)";
              }}
            />
          </div>
          <button
            style={styles.primaryButton}
            onClick={onCreateProblem}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "rgba(255,255,255,0.14)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "rgba(255,255,255,0.09)";
            }}
          >
            <Sparkles size={14} />
            Add Problem
          </button>
        </div>

        <div style={styles.actionGroupSeparated}>
          <div style={styles.folderInputWrap}>
            <FolderPlus size={14} color="rgba(96,165,250,0.95)" />
            <input
              type="text"
              placeholder="Add folder..."
              style={styles.actionInput}
              value={folderInput}
              onChange={(event) => onFolderInputChange(event.target.value)}
              onKeyDown={onFolderInputKeyDown}
              onFocus={(event) => {
                event.currentTarget.parentElement.style.borderColor = "rgba(255,255,255,0.28)";
                event.currentTarget.parentElement.style.background = "rgba(255,255,255,0.06)";
              }}
              onBlur={(event) => {
                event.currentTarget.parentElement.style.borderColor = "rgba(255,255,255,0.14)";
                event.currentTarget.parentElement.style.background = "rgba(255,255,255,0.04)";
              }}
            />
          </div>
          <button
            style={styles.secondaryButton}
            onClick={onCreateFolder}
            onMouseEnter={(event) => {
              event.currentTarget.style.background = "rgba(255,255,255,0.12)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.background = "rgba(255,255,255,0.07)";
            }}
          >
            <FolderPlus size={14} />
            Add Folder
          </button>
        </div>
      </div>

      <div style={styles.bottomRow}>
        <div style={styles.titleBlock}>
          <h1 style={styles.title}>
            <span style={styles.titleSlash}>/</span>
            <span style={styles.titleText} title={folderName}>
              {folderName}
            </span>
          </h1>
          <p style={styles.subtitle}>{itemCount} items</p>
        </div>

        <div style={styles.rightColumn}>
          <div style={styles.filterWrap}>
            {filters.map((filter) => (
              <button
                key={filter}
                style={{
                  ...styles.filterButton,
                  ...(activeFilter === filter ? styles.filterButtonActive : {}),
                }}
                onClick={() => onFilterChange(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const sharedButton = {
  height: 36,
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,0.16)",
  color: "rgba(255,255,255,0.92)",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'Inter', sans-serif",
  cursor: "pointer",
  transition: "background .15s, border-color .15s",
  whiteSpace: "nowrap",
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const sharedInputWrap = {
  height: 36,
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "0 11px",
  borderRadius: 11,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.04)",
};

const styles = {
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    padding: "16px 24px 15px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background:
      "linear-gradient(180deg, rgba(8,12,18,0.98) 0%, rgba(0,0,0,0.94) 100%)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    fontFamily: "'Inter', sans-serif",
  },
  topRow: {
    display: "grid",
    gridTemplateColumns: "36px auto minmax(340px, 1.25fr) minmax(230px, 0.95fr)",
    alignItems: "center",
    gap: 12,
  },
  bottomRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 18,
    minWidth: 0,
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
    flexShrink: 0,
  },
  titleBlock: {
    minWidth: 0,
  },
  title: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    margin: 0,
    minWidth: 0,
    fontSize: 15,
    fontWeight: 560,
    color: "rgba(255,255,255,0.98)",
    fontFamily: "'JetBrains Mono', monospace",
  },
  titleSlash: {
    color: "rgba(255,255,255,0.48)",
    flexShrink: 0,
  },
  titleText: {
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: 11,
    color: "rgba(255,255,255,0.42)",
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    marginLeft: 10,
  },
  actionGroupSeparated: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  problemInputWrap: {
    ...sharedInputWrap,
    minWidth: 0,
  },
  folderInputWrap: {
    ...sharedInputWrap,
    minWidth: 0,
  },
  actionInput: {
    height: "100%",
    width: "100%",
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.94)",
    fontSize: 12,
    fontFamily: "'Inter', sans-serif",
    outline: "none",
  },
  primaryButton: {
    ...sharedButton,
    padding: "0 14px",
    background: "rgba(255,255,255,0.09)",
  },
  secondaryButton: {
    ...sharedButton,
    padding: "0 13px",
    background: "rgba(255,255,255,0.07)",
  },
  resetButton: {
    ...sharedButton,
    justifyContent: "center",
    padding: "0 13px",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.74)",
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 11,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background .15s, border-color .15s",
    flexShrink: 0,
  },
  filterWrap: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "nowrap",
    flexShrink: 0,
  },
  filterButton: {
    height: 31,
    padding: "0 11px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    cursor: "pointer",
  },
  filterButtonActive: {
    border: "1px solid rgba(96,165,250,0.42)",
    background: "rgba(96,165,250,0.18)",
    color: "rgba(219,234,254,0.98)",
  },
};

export default FolderHeader;
