const sequelize = require("../src/config/database");

async function fixSequence() {
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(
      'SELECT COALESCE(MAX(id), 0) AS max_id FROM "FileNodes";',
    );
    const nextId = Number(rows[0].max_id || 0) + 1;
    await sequelize.query(
      `ALTER SEQUENCE "FileNodes_id_seq" RESTART WITH ${nextId};`,
    );
    console.log(`FileNodes sequence reset to ${nextId}`);
  } catch (error) {
    console.error("Failed to reset FileNodes sequence:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

fixSequence();
