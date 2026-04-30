const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LoginEvent = sequelize.define(
  "LoginEvent",
  {
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "LoginEvents",
    timestamps: true,
    updatedAt: false,
  },
);

module.exports = LoginEvent;
