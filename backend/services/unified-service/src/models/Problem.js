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
    title: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    slug: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    source: {
      type: DataTypes.STRING,
      defaultValue: "manual",
    },
    sourceUrl: {
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
    constraints: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    examples: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    codeSnippets: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    solutionEntries: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
  },
  {
    tableName: "problem_details_v2",
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
