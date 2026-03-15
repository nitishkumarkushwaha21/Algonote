const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Problem = sequelize.define(
  "Problem",
  {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "legacy",
    },
    fileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Content fields (Metadata like title, link, status moved to MongoDB)
    notes: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    brute_solution: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    better_solution: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    optimal_solution: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    time_complexity: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    space_complexity: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    // LeetCode Metadata
    title: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    slug: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    difficulty: {
      type: DataTypes.STRING,
      defaultValue: "Medium",
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    exampleTestcases: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    codeSnippets: {
      type: DataTypes.JSON, // Store as JSON
      defaultValue: [],
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    tableName: "problem_details_v2", // Changed to avoid schema conflict with existing table
    indexes: [
      {
        unique: true,
        fields: ["userId", "fileId"],
      },
    ],
    timestamps: true,
  },
);

module.exports = Problem;
