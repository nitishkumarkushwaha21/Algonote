const FileNode = require("../models/FileNode");
const axios = require("axios");
const sequelize = require("../config/database");

const PROBLEM_SERVICE_URL =
  (process.env.PROBLEM_SERVICE_URL || "http://problem-service:5003") +
  "/api/problems";

function getUserIdFromReq(req) {
  return req.headers["x-user-id"];
}

async function resetFileNodeSequence() {
  const [rows] = await sequelize.query(
    'SELECT COALESCE(MAX(id), 0) AS max_id FROM "FileNodes";',
  );
  const nextId = Number(rows[0].max_id || 0) + 1;
  await sequelize.query(
    `ALTER SEQUENCE "FileNodes_id_seq" RESTART WITH ${nextId};`,
  );
  return nextId;
}

// @desc    Get file system tree
// @route   GET /api/files
exports.getFileSystem = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Fetch all nodes
    const nodes = await FileNode.findAll({ where: { userId }, raw: true });

    const buildTree = (parentId) => {
      return nodes
        .filter((node) => node.parentId === parentId)
        .map((node) => ({
          ...node,
          // Sequelize returns integer IDs, ensure frontend handles them correctly
          id: node.id,
          children: node.type === "folder" ? buildTree(node.id) : undefined,
        }));
    };

    const tree = buildTree(null);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new file or folder
// @route   POST /api/files
exports.createFileNode = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, type, parentId, link } = req.body;

    let fileNode;
    try {
      fileNode = await FileNode.create({
        userId,
        name,
        type,
        parentId: parentId || null,
        link: link || "",
      });
    } catch (createErr) {
      const detail = createErr.errors
        ? createErr.errors.map((e) => `${e.path}: ${e.message}`).join("; ")
        : createErr.message;

      // Self-heal when sequence drifts after manual imports/migrations.
      if (/id: id must be unique/i.test(detail)) {
        const nextId = await resetFileNodeSequence();
        console.warn(
          `[createFileNode] sequence drift detected. Reset to ${nextId} and retrying.`,
        );
        fileNode = await FileNode.create({
          userId,
          name,
          type,
          parentId: parentId || null,
          link: link || "",
        });
      } else {
        throw createErr;
      }
    }

    // If it's a file, notify Problem Service
    if (type === "file") {
      try {
        await axios.post(
          PROBLEM_SERVICE_URL,
          {
            fileId: fileNode.id, // ID is now Integer (or whatever Sequelize generated)
            title: name,
            userId,
          },
          {
            headers: { "x-user-id": userId },
          },
        );
      } catch (err) {
        console.error(
          "Failed to create problem in Problem Service:",
          err.message,
        );
      }
    }

    res.status(201).json(fileNode);
  } catch (error) {
    const detail = error.errors
      ? error.errors.map((e) => `${e.path}: ${e.message}`).join("; ")
      : error.message;
    console.error("[createFileNode] error:", detail);
    res.status(400).json({ message: detail });
  }
};

// @desc    Update file/folder (Rename, Move, Metadata)
// @route   PUT /api/files/:id
exports.updateFileNode = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, link, isSolved, isRevised } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (link !== undefined) updateData.link = link;
    if (isSolved !== undefined) updateData.isSolved = isSolved;
    if (isRevised !== undefined) updateData.isRevised = isRevised;

    const [updatedRows] = await FileNode.update(updateData, {
      where: { id: req.params.id, userId },
    });

    if (updatedRows === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const fileNode = await FileNode.findOne({
      where: { id: req.params.id, userId },
    });

    // Propagate rename
    if (name && fileNode.type === "file") {
      try {
        await axios.put(
          `${PROBLEM_SERVICE_URL}/${fileNode.id}`,
          {
            title: name,
          },
          {
            headers: { "x-user-id": userId },
          },
        );
      } catch (err) {
        console.error("Failed to update problem title:", err.message);
      }
    }

    res.json(fileNode);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete file or folder
// @route   DELETE /api/files/:id
exports.deleteFileNode = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const deleted = await FileNode.destroy({ where: { id, userId } });

    if (deleted) {
      // Propagate delete
      try {
        await axios.delete(`${PROBLEM_SERVICE_URL}/${id}`, {
          headers: { "x-user-id": userId },
        });
      } catch (err) {
        console.error("Failed to delete problem:", err.message);
      }
    }

    res.json({ message: "File deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
