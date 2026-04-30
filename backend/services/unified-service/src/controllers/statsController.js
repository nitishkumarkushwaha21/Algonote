const LoginEvent = require("../models/LoginEvent");
const { UniqueConstraintError } = require("sequelize");
const { getUserIdFromReq } = require("../shared/requestContext");

const LOGIN_BASE_COUNT = 10;
let loginEventTableReady = false;

async function ensureLoginEventTable() {
  if (loginEventTableReady) {
    return;
  }

  await LoginEvent.sync();
  loginEventTableReady = true;
}

exports.recordLogin = async (req, res) => {
  try {
    await ensureLoginEventTable();

    const userId = getUserIdFromReq(req);
    const { sessionId } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!String(sessionId || "").trim()) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    let event;
    let created = false;

    try {
      event = await LoginEvent.create({
        userId,
        sessionId,
      });
      created = true;
    } catch (error) {
      if (!(error instanceof UniqueConstraintError)) {
        throw error;
      }

      event = await LoginEvent.findOne({ where: { sessionId } });
      if (!event) {
        throw error;
      }
    }

    const totalLogins = LOGIN_BASE_COUNT + (await LoginEvent.count());

    return res.status(created ? 201 : 200).json({
      created,
      totalLogins,
      loginId: event.id,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getLoginStats = async (_req, res) => {
  try {
    await ensureLoginEventTable();

    const totalLogins = LOGIN_BASE_COUNT + (await LoginEvent.count());
    return res.json({ totalLogins });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
