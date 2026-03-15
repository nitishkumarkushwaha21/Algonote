const Problem = require("../models/Problem");

function getUserIdFromReq(req) {
  return req.headers["x-user-id"];
}

// @desc    Get problem details by file ID
// @route   GET /api/problems/:fileId
exports.getProblem = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { fileId } = req.params;

    // Find or create the problem to ensure we always have a valid database row
    const [problem] = await Problem.findOrCreate({
      where: { fileId, userId },
      defaults: {
        userId,
        title: "",
        slug: "",
        difficulty: "",
        description: "",
        exampleTestcases: "",
        tags: [],
        codeSnippets: [],
        notes: "",
        brute_solution: "",
        better_solution: "",
        optimal_solution: "",
        time_complexity: "",
        space_complexity: "",
      },
    });

    // Map flat Postgres structure back to nested JSON for frontend compatibility
    res.json({
      id: problem.id,
      fileId: problem.fileId,
      title: problem.title || "",
      slug: problem.slug || "",
      difficulty: problem.difficulty || "",
      description: problem.description || "",
      exampleTestcases: problem.exampleTestcases || "",
      tags: problem.tags || [],
      codeSnippets: problem.codeSnippets || [],
      notes: problem.notes || "",
      solutions: {
        brute: problem.brute_solution || "",
        better: problem.better_solution || "",
        optimal: problem.optimal_solution || "",
      },
      analysis: {
        time: problem.time_complexity || "",
        space: problem.space_complexity || "",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new problem content entry
// @route   POST /api/problems
exports.createProblem = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { fileId } = req.body;

    // Upsert (Create or Do Nothing if exists)
    const [problem, created] = await Problem.findOrCreate({
      where: { fileId, userId },
      defaults: {
        userId,
        notes: "",
        brute_solution: "",
        better_solution: "",
        optimal_solution: "",
        time_complexity: "",
        space_complexity: "",
      },
    });

    res.status(201).json(problem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update problem content
// @route   PUT /api/problems/:fileId
exports.updateProblem = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { fileId } = req.params;
    const {
      solutions,
      notes,
      analysis,
      title,
      slug,
      difficulty,
      description,
      exampleTestcases,
      tags,
      codeSnippets,
    } = req.body;

    // Find the problem first or create it if it doesn't exist
    let problem = await Problem.findOne({ where: { fileId, userId } });
    if (!problem) {
      problem = await Problem.create({
        userId,
        fileId,
        notes: "",
        brute_solution: "",
        better_solution: "",
        optimal_solution: "",
        time_complexity: "",
        space_complexity: "",
      });
    }

    // Flatten update object, only updating fields that are provided
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (description !== undefined) updateData.description = description;
    if (exampleTestcases !== undefined)
      updateData.exampleTestcases = exampleTestcases;
    if (tags !== undefined) updateData.tags = tags;
    if (codeSnippets !== undefined) updateData.codeSnippets = codeSnippets;
    if (notes !== undefined) updateData.notes = notes;
    if (solutions) {
      if (solutions.brute !== undefined)
        updateData.brute_solution = solutions.brute;
      if (solutions.better !== undefined)
        updateData.better_solution = solutions.better;
      if (solutions.optimal !== undefined)
        updateData.optimal_solution = solutions.optimal;
    }
    if (analysis) {
      if (analysis.time !== undefined)
        updateData.time_complexity = analysis.time;
      if (analysis.space !== undefined)
        updateData.space_complexity = analysis.space;
    }

    // Apply the updates
    await problem.update(updateData);

    // Fetch the fully updated row to return it
    const updated = await Problem.findOne({ where: { fileId, userId } });

    res.json({
      id: updated.id,
      fileId: updated.fileId,
      title: updated.title,
      description: updated.description,
      notes: updated.notes,
      solutions: {
        brute: updated.brute_solution,
        better: updated.better_solution,
        optimal: updated.optimal_solution,
      },
      analysis: {
        time: updated.time_complexity,
        space: updated.space_complexity,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete problem
// @route   DELETE /api/problems/:fileId
exports.deleteProblem = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await Problem.destroy({ where: { fileId: req.params.fileId, userId } });
    res.json({ message: "Problem deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
