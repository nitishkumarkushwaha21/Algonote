import React from "react";
import {
  CheckCircle2,
  Circle,
  Edit2,
  ExternalLink,
  FileCode,
  FileText,
  Folder,
  Star,
  Trash2,
} from "lucide-react";
import { clsx } from "clsx";
import { getFileVisualType } from "../../utils/problemSources";

const FolderItemsTable = ({
  items,
  renamingId,
  renameValue,
  onNavigate,
  onRenameStart,
  onRenameChange,
  onRenameKeyDown,
  onRenameBlur,
  onToggleRevision,
  onToggleSolved,
  onToggleImportant,
  onOpenLink,
  onDelete,
}) => {
  return (
    <>
      <style>{tableCss}</style>
      <table className="fit-table">
        <thead>
          <tr className="fit-head-row">
            <th className="fit-th fit-th-pl">Name</th>
            <th className="fit-th">State</th>
            <th className="fit-th">Last Revised</th>
            <th className="fit-th fit-th-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const fileVisualType = getFileVisualType(item);
            return (
            <tr
              key={item.id}
              className="fit-row"
              onClick={() => onNavigate(item)}
            >
              <td className="fit-td fit-td-pl">
                <div className="fit-name-cell">
                  {item.type === "folder" ? (
                    <Folder size={16} className="fit-icon-folder" />
                  ) : fileVisualType === "notes" ? (
                    <FileText size={16} className="fit-icon-notes" />
                  ) : fileVisualType === "gfg" ? (
                    <FileCode size={16} className="fit-icon-gfg" />
                  ) : fileVisualType === "leetcode" ? (
                    <FileCode size={16} className="fit-icon-leetcode" />
                  ) : (
                    <FileCode size={16} className="fit-icon-file" />
                  )}
                  {renamingId === item.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={renameValue}
                      onChange={(event) => onRenameChange(event.target.value)}
                      onKeyDown={onRenameKeyDown}
                      onClick={(event) => event.stopPropagation()}
                      onBlur={onRenameBlur}
                      className="fit-rename-input"
                    />
                  ) : (
                    <div className="fit-name-block">
                      <span className="fit-item-name">{item.name}</span>
                      {item.type === "file" && fileVisualType !== "notes" && (
                        <div className="fit-meta-row">
                          {item.difficulty && (
                            <span className={clsx("fit-chip", `fit-chip-${item.difficulty.toLowerCase()}`)}>
                              {item.difficulty}
                            </span>
                          )}
                          {item.tags?.[0]?.name && (
                            <span className="fit-chip fit-chip-tag">{item.tags[0].name}</span>
                          )}
                          {item.isImportant && (
                            <span className="fit-chip fit-chip-important">Important</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </td>

              <td className="fit-td">
                {item.type === "file" && (
                  <div className="fit-state-group">
                    <button
                      onClick={(event) => onToggleSolved(event, item)}
                      className={clsx(
                        "fit-toggle",
                        item.isSolved ? "fit-toggle-solved" : "",
                      )}
                      title={item.isSolved ? "Solved" : "Mark solved"}
                    >
                      <CheckCircle2 size={12} />
                      <span>Solved</span>
                    </button>

                    <button
                      onClick={(event) => onToggleRevision(event, item)}
                      className={clsx(
                        "fit-toggle",
                        item.isRevised ? "fit-toggle-revised" : "",
                      )}
                      title={item.isRevised ? "Revised" : "Mark revised"}
                    >
                      {item.isRevised ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                      <span>Rev</span>
                    </button>

                    <button
                      onClick={(event) => onToggleImportant(event, item)}
                      className={clsx(
                        "fit-toggle fit-toggle-icon",
                        item.isImportant ? "fit-toggle-important" : "",
                      )}
                      title={item.isImportant ? "Important" : "Mark important"}
                    >
                      <Star size={12} />
                    </button>
                  </div>
                )}
              </td>

              <td className="fit-td fit-td-date">
                {item.type === "file"
                  ? new Date(item.updatedAt || Date.now()).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"}
              </td>

              <td className="fit-td fit-td-actions">
                <div className="fit-actions">
                  {item.type === "file" && item.link && (
                    <button
                      onClick={(event) => onOpenLink(event, item)}
                      className="fit-action-btn fit-action-link"
                      title="Open source problem"
                    >
                      <ExternalLink size={13} />
                    </button>
                  )}
                  <button
                    onClick={(event) => onRenameStart(event, item)}
                    className="fit-action-btn"
                    title="Rename"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={(event) => onDelete(event, item.id)}
                    className="fit-action-btn fit-action-del"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
};

const tableCss = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600&display=swap');

  .fit-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-family: 'Inter', sans-serif;
  }

  .fit-head-row { border-bottom: 1px solid rgba(255,255,255,0.07); }

  .fit-th {
    padding: 10px 12px;
    font-size: 11px;
    font-weight: 500;
    color: rgba(255,255,255,0.34);
    letter-spacing: .08em;
    text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
  }
  .fit-th-pl { padding-left: 20px; }
  .fit-th-right { text-align: right; padding-right: 20px; }

  .fit-row {
    border-bottom: 1px solid rgba(255,255,255,0.05);
    cursor: pointer;
    transition: background .13s, border-color .13s;
  }
  .fit-row:hover {
    background: rgba(255,255,255,0.025);
    border-bottom-color: rgba(255,255,255,0.08);
  }

  .fit-td {
    padding: 10px 12px;
    font-size: 13px;
    color: rgba(255,255,255,0.78);
    vertical-align: middle;
  }
  .fit-td-pl { padding-left: 20px; }
  .fit-td-date {
    color: rgba(255,255,255,0.34);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    white-space: nowrap;
  }
  .fit-td-actions { text-align: right; padding-right: 20px; }

  .fit-name-cell { display: flex; align-items: center; gap: 10px; }
  .fit-name-block { min-width: 0; }
  .fit-icon-folder { color: #7ab8f0; flex-shrink: 0; }
  .fit-icon-file { color: #f0c97a; flex-shrink: 0; }
  .fit-icon-leetcode { color: #f4d03f; flex-shrink: 0; }
  .fit-icon-gfg { color: #4ade80; flex-shrink: 0; }
  .fit-icon-notes { color: #7dd3fc; flex-shrink: 0; }
  .fit-item-name {
    display: block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    color: rgba(255,255,255,0.9);
  }
  .fit-meta-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    flex-wrap: wrap;
  }
  .fit-chip {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 2px 7px;
    font-size: 10px;
    letter-spacing: .04em;
    text-transform: uppercase;
    border: 1px solid rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.68);
    background: rgba(255,255,255,0.04);
  }
  .fit-chip-easy { color: #4ade80; border-color: rgba(74,222,128,0.22); background: rgba(74,222,128,0.10); }
  .fit-chip-medium { color: #fbbf24; border-color: rgba(251,191,36,0.22); background: rgba(251,191,36,0.10); }
  .fit-chip-hard { color: #f87171; border-color: rgba(248,113,113,0.22); background: rgba(248,113,113,0.10); }
  .fit-chip-tag { color: #93c5fd; border-color: rgba(96,165,250,0.20); background: rgba(96,165,250,0.10); }
  .fit-chip-important { color: #facc15; border-color: rgba(250,204,21,0.22); background: rgba(250,204,21,0.10); }

  .fit-rename-input {
    max-width: 200px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.05);
    padding: 4px 8px;
    color: #fff;
    font-size: 13px;
    font-family: 'JetBrains Mono', monospace;
    outline: none;
  }

  .fit-state-group {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .fit-toggle {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.14);
    color: rgba(255,255,255,0.48);
    background: rgba(255,255,255,0.04);
    font-family: 'Inter', sans-serif;
    transition: opacity .15s, background .15s, color .15s, border-color .15s;
    white-space: nowrap;
  }
  .fit-toggle:hover { border-color: rgba(255,255,255,0.24); color: rgba(255,255,255,0.9); }
  .fit-toggle-solved {
    background: rgba(74,197,120,0.10);
    border-color: rgba(74,197,120,0.25);
    color: #4ac578;
  }
  .fit-toggle-revised {
    background: rgba(74,197,120,0.10);
    border-color: rgba(74,197,120,0.25);
    color: #4ac578;
  }
  .fit-toggle-important {
    color: #facc15;
    border-color: rgba(250,204,21,0.25);
    background: rgba(250,204,21,0.10);
  }
  .fit-toggle-icon { padding-inline: 7px; }

  .fit-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    opacity: 1;
    transition: opacity .15s;
  }
  .fit-action-btn {
    width: 30px;
    height: 30px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.10);
    background: rgba(255,255,255,0.045);
    color: rgba(255,255,255,0.52);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background .13s, color .13s, border-color .13s;
  }
  .fit-action-btn:hover {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.88);
    border-color: rgba(255,255,255,0.18);
  }
  .fit-action-del:hover {
    background: rgba(226,75,74,0.15);
    color: #e24b4a;
    border-color: rgba(226,75,74,0.25);
  }
  .fit-action-link:hover {
    background: rgba(249,115,22,0.14);
    color: #fb923c;
    border-color: rgba(249,115,22,0.25);
  }
`;

export default FolderItemsTable;
