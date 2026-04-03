const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LeetCodeProblemCache = sequelize.define(
  "LeetCodeProblemCache",
  {
    titleSlug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    difficulty: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    content: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    exampleTestcases: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    link: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
  },
  {
    tableName: "leetcode_problem_cache",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["titleSlug"],
      },
    ],
  },
);

module.exports = LeetCodeProblemCache;
