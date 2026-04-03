import React, { useEffect, useRef, useState } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&family=Inter:wght@400;500;600&display=swap');

  .sfc-card {
    --sfc-border: rgba(125,211,252,0.14);
    --sfc-card-bg:
      radial-gradient(circle at top left, rgba(125,211,252,0.12), transparent 24%),
      radial-gradient(circle at bottom right, rgba(56,189,248,0.08), transparent 32%),
      linear-gradient(135deg, rgba(24,42,68,0.94), rgba(18,32,52,0.96) 52%, rgba(14,25,42,0.98));
    --sfc-card-shadow: 0 18px 36px rgba(2,6,23,0.26);
    --sfc-card-hover-shadow: 0 22px 42px rgba(2,6,23,0.32);
    --sfc-card-hover-border: rgba(125,211,252,0.22);
    --sfc-divider: rgba(255,255,255,0.08);
    --sfc-title: rgba(240,249,255,0.94);
    --sfc-menu-border: rgba(255,255,255,0.10);
    --sfc-menu-bg: rgba(255,255,255,0.06);
    --sfc-menu-hover-border: rgba(125,211,252,0.18);
    --sfc-menu-hover-bg: rgba(255,255,255,0.10);
    --sfc-menu-dot: rgba(224,242,254,0.8);
    --sfc-meta: rgba(186,230,253,0.78);
    --sfc-date: rgba(191,219,254,0.58);
    --sfc-underline: rgba(255,255,255,0.28);
    --sfc-icon-stroke: rgba(96,165,250,0.84);
    --sfc-icon-fill-top: rgba(255,255,255,0.98);
    --sfc-icon-fill-bottom: rgba(241,245,249,0.94);
    --sfc-icon-glow: rgba(96,165,250,0.10);
    position: relative;
    border-radius: 16px;
    border: 1px solid var(--sfc-border);
    background: var(--sfc-card-bg);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.07),
      var(--sfc-card-shadow);
    cursor: pointer;
    transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
  }

  .sfc-card.theme-sky {
    --sfc-border: rgba(186,230,253,0.30);
    --sfc-card-bg:
      radial-gradient(circle at top left, rgba(255,255,255,0.34), transparent 24%),
      radial-gradient(circle at bottom right, rgba(56,189,248,0.18), transparent 30%),
      linear-gradient(135deg, rgba(191,232,255,0.96), rgba(151,215,250,0.94) 54%, rgba(119,193,240,0.92));
    --sfc-card-shadow: 0 18px 36px rgba(34,94,140,0.18);
    --sfc-card-hover-shadow: 0 22px 42px rgba(34,94,140,0.22);
    --sfc-card-hover-border: rgba(59,130,246,0.34);
    --sfc-divider: rgba(255,255,255,0.24);
    --sfc-title: rgba(8,47,73,0.92);
    --sfc-menu-border: rgba(255,255,255,0.26);
    --sfc-menu-bg: rgba(255,255,255,0.18);
    --sfc-menu-hover-border: rgba(255,255,255,0.38);
    --sfc-menu-hover-bg: rgba(255,255,255,0.28);
    --sfc-menu-dot: rgba(8,47,73,0.72);
    --sfc-meta: rgba(8,47,73,0.74);
    --sfc-date: rgba(12,74,110,0.62);
    --sfc-underline: rgba(255,255,255,0.52);
    --sfc-icon-stroke: rgba(59,130,246,0.82);
    --sfc-icon-fill-top: rgba(255,255,255,0.98);
    --sfc-icon-fill-bottom: rgba(241,245,249,0.96);
    --sfc-icon-glow: rgba(96,165,250,0.14);
  }

  .sfc-card.theme-green {
    --sfc-border: rgba(203,213,225,0.28);
    --sfc-card-bg:
      radial-gradient(circle at top left, rgba(255,255,255,0.46), transparent 24%),
      radial-gradient(circle at bottom right, rgba(203,213,225,0.22), transparent 30%),
      linear-gradient(135deg, rgba(249,250,251,0.98), rgba(233,236,241,0.96) 54%, rgba(214,219,228,0.94));
    --sfc-card-shadow: 0 18px 36px rgba(71,85,105,0.16);
    --sfc-card-hover-shadow: 0 22px 42px rgba(71,85,105,0.20);
    --sfc-card-hover-border: rgba(100,116,139,0.34);
    --sfc-divider: rgba(15,23,42,0.12);
    --sfc-title: rgba(15,23,42,0.92);
    --sfc-menu-border: rgba(148,163,184,0.28);
    --sfc-menu-bg: rgba(255,255,255,0.46);
    --sfc-menu-hover-border: rgba(100,116,139,0.34);
    --sfc-menu-hover-bg: rgba(255,255,255,0.68);
    --sfc-menu-dot: rgba(15,23,42,0.72);
    --sfc-meta: rgba(30,41,59,0.76);
    --sfc-date: rgba(51,65,85,0.62);
    --sfc-underline: rgba(15,23,42,0.22);
    --sfc-icon-stroke: rgba(71,85,105,0.82);
    --sfc-icon-fill-top: rgba(255,255,255,0.99);
    --sfc-icon-fill-bottom: rgba(241,245,249,0.96);
    --sfc-icon-glow: rgba(148,163,184,0.14);
  }

  .sfc-card:hover {
    transform: translateY(-3px);
    border-color: var(--sfc-card-hover-border);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.09),
      var(--sfc-card-hover-shadow);
  }

  .sfc-shell {
    position: relative;
    min-height: 138px;
    padding: 16px 18px 13px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 10px;
  }

  .sfc-shell::after {
    content: "";
    position: absolute;
    inset: auto 18px 14px 18px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--sfc-divider), transparent);
    pointer-events: none;
  }

  .sfc-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    position: relative;
    z-index: 1;
  }

  .sfc-folder {
    position: relative;
    width: 70px;
    height: 46px;
    flex-shrink: 0;
    border-radius: 0;
    background: transparent;
    border: none;
    box-shadow: none;
    overflow: visible;
  }

  .sfc-folder::before {
    content: "";
    position: absolute;
    top: 7px;
    left: 12px;
    width: 18px;
    height: 6px;
    border-radius: 4px 4px 0 0;
    border: 2px solid var(--sfc-icon-stroke);
    border-bottom: 0;
    background: var(--sfc-icon-fill-top);
    box-shadow:
      0 0 4px var(--sfc-icon-glow),
      inset 0 0 3px rgba(255,255,255,0.06);
  }

  .sfc-folder::after {
    content: "";
    position: absolute;
    inset: 12px 6px 7px;
    border-radius: 5px;
    border: 2px solid var(--sfc-icon-stroke);
    background:
      linear-gradient(180deg, var(--sfc-icon-fill-top), var(--sfc-icon-fill-bottom));
    box-shadow:
      0 0 5px var(--sfc-icon-glow),
      inset 0 0 6px rgba(255,255,255,0.08);
  }

  .sfc-folder-glow {
    position: absolute;
    inset: auto 11px 7px 11px;
    height: 10px;
    border-radius: 999px;
    background: var(--sfc-icon-glow);
    filter: blur(7px);
    pointer-events: none;
    z-index: 2;
  }

  .sfc-copy {
    min-width: 0;
    flex: 1;
  }

  .sfc-title {
    margin: 0;
    color: var(--sfc-title);
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.045em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sfc-menu-wrap {
    position: relative;
    z-index: 4;
    flex-shrink: 0;
  }

  .sfc-menu-btn {
    width: 30px;
    height: 24px;
    border-radius: 8px;
    border: 1px solid var(--sfc-menu-border);
    background: var(--sfc-menu-bg);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 0;
    cursor: pointer;
    transition: background .16s ease, border-color .16s ease;
  }

  .sfc-menu-btn:hover {
    background: var(--sfc-menu-hover-bg);
    border-color: var(--sfc-menu-hover-border);
  }

  .sfc-dot {
    width: 3px;
    height: 3px;
    border-radius: 999px;
    background: var(--sfc-menu-dot);
  }

  .sfc-dropdown {
    position: absolute;
    top: 30px;
    right: 0;
    min-width: 144px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(15,23,42,0.98);
    padding: 6px;
    box-shadow: 0 18px 46px rgba(2,6,23,0.48);
    z-index: 20;
  }

  .sfc-dd-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    border: none;
    background: transparent;
    color: rgba(226,232,240,0.82);
    padding: 9px 10px;
    border-radius: 8px;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: background .14s ease, color .14s ease;
  }

  .sfc-dd-item:hover {
    background: rgba(255,255,255,0.06);
    color: #fff;
  }

  .sfc-dd-item.danger {
    color: #fca5a5;
  }

  .sfc-dd-item.danger:hover {
    background: rgba(239,68,68,0.12);
    color: #fecaca;
  }

  .sfc-sep {
    height: 1px;
    margin: 5px 0;
    background: rgba(255,255,255,0.08);
  }

  .sfc-rename {
    position: relative;
    z-index: 3;
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 0 18px 14px;
  }

  .sfc-rename-input {
    flex: 1;
    height: 38px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: #fff;
    padding: 0 12px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    outline: none;
  }

  .sfc-rename-input:focus {
    border-color: rgba(96,165,250,0.34);
  }

  .sfc-rename-btn {
    height: 38px;
    border-radius: 10px;
    border: 1px solid rgba(96,165,250,0.24);
    background: rgba(59,130,246,0.12);
    color: #bfdbfe;
    padding: 0 14px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .sfc-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    position: relative;
    z-index: 1;
    margin-left: 0;
  }

  .sfc-meta {
    color: var(--sfc-meta);
    font-size: 10px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    position: relative;
    padding-bottom: 6px;
  }

  .sfc-meta::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
    background: var(--sfc-underline);
  }

  .sfc-date {
    color: var(--sfc-date);
    font-size: 10px;
    white-space: nowrap;
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.04em;
    position: relative;
    padding-bottom: 6px;
  }

  .sfc-date::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
    background: var(--sfc-underline);
  }

  .sfc-confirm {
    position: absolute;
    inset: 0;
    z-index: 6;
    background: rgba(15,23,42,0.95);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 22px;
  }

  .sfc-confirm-text {
    margin: 0;
    text-align: center;
    color: rgba(226,232,240,0.78);
    line-height: 1.6;
    font-size: 13px;
  }

  .sfc-confirm-text strong {
    color: #fff;
  }

  .sfc-confirm-actions {
    display: flex;
    gap: 8px;
  }

  .sfc-confirm-btn {
    height: 36px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.04);
    color: rgba(226,232,240,0.84);
    cursor: pointer;
  }

  .sfc-confirm-btn.danger {
    border-color: rgba(239,68,68,0.20);
    background: rgba(239,68,68,0.12);
    color: #fecaca;
  }
`;

const formatDate = (dateValue) =>
  new Date(dateValue).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const FolderThemeTwo = ({ folder, onDelete, onOpen, onRename, theme = "default" }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [nextName, setNextName] = useState(folder.name);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const commitRename = () => {
    const trimmed = nextName.trim();

    if (!trimmed) {
      setNextName(folder.name);
      setIsRenaming(false);
      return;
    }

    if (trimmed !== folder.name) {
      onRename?.(folder.id, trimmed);
    }

    setIsRenaming(false);
  };

  return (
    <>
      <style>{css}</style>
      <div
        className={`sfc-card${theme === "sky" ? " theme-sky" : ""}${theme === "green" ? " theme-green" : ""}`}
        onClick={() => {
          if (!isRenaming && !isConfirmingDelete) {
            onOpen?.(folder);
          }
        }}
      >
        {isConfirmingDelete && (
          <div className="sfc-confirm">
            <p className="sfc-confirm-text">
              Delete <strong>/{folder.name}</strong>?
            </p>
            <div className="sfc-confirm-actions">
              <button
                type="button"
                className="sfc-confirm-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsConfirmingDelete(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sfc-confirm-btn danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete?.(folder);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        <div className="sfc-shell">
          <div className="sfc-top">
            <div className="sfc-folder" aria-hidden="true">
              <div className="sfc-folder-glow" />
            </div>

            <div className="sfc-copy">
              <h3 className="sfc-title">/{folder.name}</h3>
            </div>

            <div className="sfc-menu-wrap" ref={menuRef}>
              <button
                type="button"
                className="sfc-menu-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsMenuOpen((current) => !current);
                }}
                title="More"
              >
                <span className="sfc-dot" />
                <span className="sfc-dot" />
                <span className="sfc-dot" />
              </button>

              {isMenuOpen && (
                <div className="sfc-dropdown">
                  <button
                    type="button"
                    className="sfc-dd-item"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsMenuOpen(false);
                      setIsRenaming(true);
                    }}
                  >
                    Rename
                  </button>
                  <div className="sfc-sep" />
                  <button
                    type="button"
                    className="sfc-dd-item danger"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsMenuOpen(false);
                      setIsConfirmingDelete(true);
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="sfc-bottom">
            <div className="sfc-meta">
              {folder.files} {folder.files === 1 ? "problem" : "problems"}
            </div>
            <div className="sfc-date">{formatDate(folder.created || Date.now())}</div>
          </div>
        </div>

        {isRenaming && (
          <div
            className="sfc-rename"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              ref={inputRef}
              className="sfc-rename-input"
              value={nextName}
              onChange={(event) => setNextName(event.target.value)}
              onBlur={commitRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commitRename();
                }
                if (event.key === "Escape") {
                  setNextName(folder.name);
                  setIsRenaming(false);
                }
              }}
            />
            <button
              type="button"
              className="sfc-rename-btn"
              onMouseDown={(event) => {
                event.preventDefault();
                commitRename();
              }}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </>
  );
};

const SlateFolderCard = FolderThemeTwo;

export { FolderThemeTwo };

export default SlateFolderCard;
