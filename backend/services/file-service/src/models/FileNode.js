const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FileNode = sequelize.define(
  "FileNode",
  {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "legacy",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("folder", "file"),
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "FileNodes", // Sequelize creates table as plural by default
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    // Metadata fields
    link: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    isSolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isRevised: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "FileNodes", // Explicit table name
    timestamps: true,
  },
);

// Self-referencing association
FileNode.hasMany(FileNode, { as: "children", foreignKey: "parentId" });
FileNode.belongsTo(FileNode, { as: "parent", foreignKey: "parentId" });

module.exports = FileNode;
