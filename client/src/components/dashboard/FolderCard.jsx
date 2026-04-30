import React, { useState, useRef, useEffect } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600&display=swap');

  .fc-card {
    position: relative;
    border-radius: 20px;
    cursor: pointer;
    transition: transform .18s ease;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 14px 28px rgba(0,0,0,0.32);
    background: rgba(255,255,255,0.02);
    overflow: hidden;
  }
  .fc-card:hover {
    transform: translateY(-3px);
    border-color: rgba(255,255,255,0.88);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.18), 0 18px 34px rgba(0,0,0,0.42);
  }

  .fc-icon {
    width: 100%;
    aspect-ratio: 16 / 8.5;
    border-radius: 18px;
    overflow: hidden;
    background: #0a0a0a;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 2px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
    position: relative;
    line-height: 0;
  }
  .fc-icon svg { width: 100%; height: 100%; display: block; }

  .fc-glass-flap {
    position: absolute;
    left: 0; right: 0; bottom: 0; top: 42%;
    border-radius: 12px 12px 17px 17px;
    backdrop-filter: blur(16px) saturate(1.8);
    -webkit-backdrop-filter: blur(16px) saturate(1.8);
    background: rgba(10,10,14,0.58);
    border-top: 2.5px solid #000;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 20px;
    z-index: 10;
    pointer-events: none;
  }
  .fc-glass-flap::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 32%;
    border-radius: 12px 12px 0 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%);
    pointer-events: none;
  }
  .fc-glass-flap::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 38%;
    background: linear-gradient(0deg, rgba(0,0,0,0.52) 0%, transparent 100%);
    border-radius: 0 0 17px 17px;
    pointer-events: none;
  }

  .fc-flap-name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px;
    font-weight: 600;
    color: rgba(255,255,255,0.98);
    white-space: normal;
    overflow-wrap: anywhere;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    position: relative;
    z-index: 2;
    line-height: 1.2;
    letter-spacing: -0.03em;
  }
  .fc-flap-count {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: rgba(255,255,255,0.74);
    margin-top: 6px;
    position: relative;
    z-index: 2;
    text-transform: lowercase;
  }

  .fc-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 4px 0;
  }
  .fc-meta-date {
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    color: rgba(255,255,255,0.25);
  }
  .fc-meta-tag {
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    color: #4ade80;
    background: rgba(74,222,128,0.10);
    border: 1px solid rgba(74,222,128,0.26);
    border-radius: 5px;
    padding: 2px 8px;
  }

  .fc-menu-wrap { position: absolute; top: 10px; right: 10px; z-index: 60; }
  .fc-menu-btn {
    display: inline-flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 3px;
    width: 32px;
    height: 24px;
    border-radius: 8px;
    background: rgba(0,0,0,0.56);
    border: 1px solid rgba(255,255,255,0.18);
    cursor: pointer;
    transition: background .15s, border-color .15s;
    pointer-events: all;
    padding: 0;
  }
  .fc-menu-btn:hover { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.34); }
  .fc-menu-btn:hover .fc-dot { background: #fff; }
  .fc-dot {
    width: 3px; height: 3px;
    border-radius: 50%;
    background: rgba(255,255,255,0.78);
    display: block;
    transition: background .15s;
  }

  .fc-dropdown {
    position: absolute; top: 34px; right: 0;
    background: rgba(14,14,14,0.97);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 12px; overflow: hidden;
    min-width: 140px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
    z-index: 200;
    display: none;
  }
  .fc-dropdown.open { display: block; }
  .fc-dd-item {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 14px; font-size: 13px; cursor: pointer;
    color: rgba(255,255,255,0.6);
    background: none; border: none; width: 100%;
    text-align: left; font-family: 'Inter', sans-serif;
    transition: background .12s, color .12s;
  }
  .fc-dd-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
  .fc-dd-item.danger { color: #e24b4a; }
  .fc-dd-item.danger:hover { background: rgba(226,75,74,0.10); }
  .fc-dd-sep { height: 1px; background: rgba(255,255,255,0.07); }

  .fc-rename-bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    padding: 8px 10px;
    background: rgba(8,12,22,0.96);
    border-top: 1px solid rgba(255,255,255,0.10);
    border-radius: 0 0 20px 20px;
    display: flex; gap: 6px; align-items: center;
    z-index: 70;
    min-width: 0;
  }
  .fc-rename-bar { display: none; }
  .fc-rename-bar.show { display: flex; }
  .fc-rename-input {
    flex: 1;
    min-width: 0;
    background: rgba(4,9,19,0.96);
    border: 1px solid rgba(186,230,253,0.34);
    border-radius: 7px; padding: 5px 9px;
    color: rgba(240,249,255,0.98); font-size: 12px; font-weight: 600;
    font-family: 'JetBrains Mono', monospace;
    outline: none;
  }
  .fc-rename-input:focus {
    border-color: rgba(125,211,252,0.60);
    box-shadow: 0 0 0 1px rgba(125,211,252,0.26);
  }
  .fc-rename-ok {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.14);
    color: rgba(255,255,255,0.6);
    border-radius: 7px; padding: 4px 10px;
    font-size: 12px; cursor: pointer;
    font-family: 'Inter', sans-serif;
  }

  .fc-confirm {
    position: absolute; inset: 0; border-radius: 20px;
    background: rgba(8,8,8,0.95);
    border: 1px solid rgba(226,75,74,0.3);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 14px; z-index: 100; padding: 20px;
  }
  .fc-confirm { display: none; }
  .fc-confirm.show { display: flex; }
  .fc-confirm-text {
    font-size: 13px; color: rgba(255,255,255,0.55);
    text-align: center; line-height: 1.6;
    font-family: 'Inter', sans-serif;
  }
  .fc-confirm-text strong { color: #e24b4a; }
  .fc-confirm-text small {
    display: block; font-size: 11px;
    color: rgba(255,255,255,0.25); margin-top: 2px;
  }
  .fc-confirm-btns { display: flex; gap: 8px; }
  .fc-btn-cancel {
    font-size: 12px; padding: 6px 16px; border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.04);
    color: rgba(255,255,255,0.5); cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: background .12s;
  }
  .fc-btn-cancel:hover { background: rgba(255,255,255,0.08); }
  .fc-btn-del {
    font-size: 12px; padding: 6px 16px; border-radius: 8px;
    border: 1px solid rgba(226,75,74,0.4);
    background: rgba(226,75,74,0.14);
    color: #e24b4a; cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: background .12s;
  }
  .fc-btn-del:hover { background: rgba(226,75,74,0.26); }
`;

const FolderIcon = ({ name }) => {
  const id = name.replace(/[^a-z0-9]/gi, "_");
  return (
    <svg viewBox="0 0 280 210" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`fc-bg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.09)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
        </linearGradient>
        <linearGradient id={`fc-paper-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dce8f8" />
          <stop offset="100%" stopColor="#aec8e8" />
        </linearGradient>
        <linearGradient id={`fc-paperC-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eaf2fc" />
          <stop offset="100%" stopColor="#c2d8f2" />
        </linearGradient>
        <clipPath id={`fc-clip-${id}`}>
          <rect x="0" y="14" width="280" height="196" rx="16" />
        </clipPath>
      </defs>

      <rect
        x="12"
        y="0"
        width="80"
        height="17"
        rx="7"
        fill="rgba(255,255,255,0.10)"
      />
      <rect
        x="0"
        y="14"
        width="280"
        height="196"
        rx="16"
        fill="rgba(0,0,0,0.82)"
      />
      <rect
        x="0"
        y="14"
        width="280"
        height="196"
        rx="16"
        fill={`url(#fc-bg-${id})`}
      />
      <rect
        x=".5"
        y="14.5"
        width="279"
        height="195"
        rx="15.5"
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="1"
      />
      <g clipPath={`url(#fc-clip-${id})`}>
        <rect
          x="18"
          y="26"
          width="244"
          height="78"
          rx="18"
          fill="rgba(255,255,255,0.035)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
        />
        <rect
          x="36"
          y="44"
          width="96"
          height="8"
          rx="4"
          fill="rgba(96,165,250,0.18)"
        />
        <rect
          x="36"
          y="59"
          width="152"
          height="6"
          rx="3"
          fill="rgba(255,255,255,0.08)"
        />
        <rect
          x="36"
          y="72"
          width="118"
          height="6"
          rx="3"
          fill="rgba(255,255,255,0.06)"
        />
      </g>
    </svg>
  );
};

const FolderCard = ({ folder, onRename, onDelete, onOpen }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(folder.name);
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  useEffect(() => {
    const handler = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const commitRename = () => {
    const value = renameVal.trim();
    if (value && value !== folder.name) onRename(folder.id, value);
    else setRenameVal(folder.name);
    setRenaming(false);
  };

  const formatDate = (dateValue) =>
    new Date(dateValue).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      <style>{css}</style>
      <div
        className="fc-card"
        onClick={() => !renaming && !confirming && onOpen?.(folder)}
      >
        <div className={`fc-confirm${confirming ? " show" : ""}`}>
          <p className="fc-confirm-text">
            Delete <strong>/{folder.name}</strong>?
            <small>This cannot be undone.</small>
          </p>
          <div className="fc-confirm-btns">
            <button
              className="fc-btn-cancel"
              onClick={(event) => {
                event.stopPropagation();
                setConfirming(false);
              }}
            >
              Cancel
            </button>
            <button
              className="fc-btn-del"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(folder);
              }}
            >
              Delete
            </button>
          </div>
        </div>

        <div className="fc-icon">
          <FolderIcon name={folder.name} />
          <div className="fc-glass-flap">
            <div className="fc-flap-name">/{folder.name}</div>
            <div className="fc-flap-count">
              {folder.files} {folder.files === 1 ? "file" : "files"}
            </div>
          </div>
        </div>

        <div
          className={`fc-rename-bar${renaming ? " show" : ""}`}
          onClick={(event) => event.stopPropagation()}
        >
          <input
            ref={inputRef}
            className="fc-rename-input"
            value={renameVal}
            onChange={(event) => setRenameVal(event.target.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitRename();
              if (event.key === "Escape") {
                setRenameVal(folder.name);
                setRenaming(false);
              }
            }}
          />
          <button
            className="fc-rename-ok"
            onMouseDown={(event) => {
              event.preventDefault();
              commitRename();
            }}
          >
            OK
          </button>
        </div>

        <div className="fc-meta">
          <span className="fc-meta-date">{formatDate(folder.created)}</span>
          <span className="fc-meta-tag">#{folder.name}</span>
        </div>

        <div className="fc-menu-wrap" ref={menuRef}>
          <button
            className="fc-menu-btn"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            title="Options"
          >
            <span className="fc-dot" />
            <span className="fc-dot" />
            <span className="fc-dot" />
          </button>

          {menuOpen && (
            <div className="fc-dropdown open">
              <button
                className="fc-dd-item"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  setRenameVal(folder.name);
                  setRenaming(true);
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <path d="M2 9.5l1.5-1.5 5-5 1.5 1.5-5 5L2 11z" />
                  <path d="M8.5 3l1.5 1.5" />
                </svg>
                Rename
              </button>
              <div className="fc-dd-sep" />
              <button
                className="fc-dd-item danger"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  setConfirming(true);
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                >
                  <path d="M2 3.5h9M4.5 3.5V2.5h4v1M3 3.5l.6 7.5h5.8l.6-7.5" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default FolderCard;
