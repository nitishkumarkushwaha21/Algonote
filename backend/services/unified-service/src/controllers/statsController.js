const LoginEvent = require("../models/LoginEvent");
const { getUserIdFromReq } = require("../shared/requestContext");

const LOGIN_BASE_COUNT = 10;

exports.recordLogin = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    const { sessionId } = req.body || {};

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!String(sessionId || "").trim()) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    const [event, created] = await LoginEvent.findOrCreate({
      where: { sessionId },
      defaults: { userId, sessionId },
    });

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
    const totalLogins = LOGIN_BASE_COUNT + (await LoginEvent.count());
    return res.json({ totalLogins });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
