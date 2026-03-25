const OpenAI = require("openai");
const { getUserIdFromReq } = require("../shared/requestContext");

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });
}

exports.analyzeCode = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const openai = getOpenAIClient();
    if (!openai) {
      return res.status(503).json({
        message: "AI service is not configured. Set OPENAI_API_KEY to enable.",
      });
    }

    const { code, language } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Code is required" });
    }

    const prompt = `
        Analyze the time and space complexity of the following ${language || "code"} snippet.
        Provide the result in strictly JSON format with keys: "time", "space", and "explanation".
        
        Example JSON format:
        {
            "time": "O(n)",
            "space": "O(1)",
            "explanation": "Brief explanation..."
        }

        Code:
        ${code}
        `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const content = completion.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    return res.json(result);
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    return res.status(500).json({
      message: "AI Analysis Failed",
      error: error.message,
      fallback: {
        time: "Unknown",
        space: "Unknown",
        explanation: "Could not analyze code at this time.",
      },
    });
  }
};
