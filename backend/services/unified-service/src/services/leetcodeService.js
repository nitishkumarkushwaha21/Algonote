const axios = require("axios");

const LEETCODE_API_ENDPOINT = "https://leetcode.com/graphql/";

function buildLeetCodeHeaders(extraHeaders = {}) {
  const cookie = process.env.LEETCODE_COOKIE || "";
  const csrfToken = process.env.LEETCODE_CSRFTOKEN || "";

  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Content-Type": "application/json",
    Referer: "https://leetcode.com",
    Origin: "https://leetcode.com",
    "X-Requested-With": "XMLHttpRequest",
    ...(csrfToken ? { "x-csrftoken": csrfToken } : {}),
    ...(cookie ? { Cookie: cookie } : {}),
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    ...extraHeaders,
  };
}

const DEFAULT_HEADERS = buildLeetCodeHeaders();

async function postLeetCodeGraphQL({ query, variables }) {
  let response;

  try {
    response = await axios.post(
      LEETCODE_API_ENDPOINT,
      { query, variables },
      { headers: buildLeetCodeHeaders(), timeout: 15000 },
    );
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error(
        "LeetCode blocked the GraphQL request. Add LEETCODE_COOKIE/LEETCODE_CSRFTOKEN in the backend env or use a machine/network that can reach LeetCode.",
      );
    }
    throw error;
  }

  if (response.data?.errors?.length) {
    throw new Error(response.data.errors[0].message || "LeetCode GraphQL request failed");
  }

  return response.data?.data;
}

async function getLeetCodeQuestion(slug) {
  const query = `
    query getQuestionDetail($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title
        titleSlug
        content
        isPaidOnly
        difficulty
        exampleTestcases
        codeSnippets {
          lang
          code
        }
        topicTags {
          name
          slug
        }
      }
    }
  `;

  try {
    const data = await postLeetCodeGraphQL({
      query,
      variables: { titleSlug: slug },
    });

    return data?.question || null;
  } catch (error) {
    console.error("Error fetching LeetCode question:", error.message);
    throw error;
  }
}

async function getFavoriteQuestionList(favoriteSlug) {
  const query = `
    query favoriteQuestionList($favoriteSlug: String!) {
      favoriteQuestionList(favoriteSlug: $favoriteSlug) {
        id
        name
        questions {
          title
          titleSlug
          difficulty
        }
      }
    }
  `;

  const data = await postLeetCodeGraphQL({
    query,
    variables: { favoriteSlug },
  });

  return data?.favoriteQuestionList || null;
}

module.exports = {
  LEETCODE_API_ENDPOINT,
  DEFAULT_HEADERS,
  buildLeetCodeHeaders,
  getFavoriteQuestionList,
  getLeetCodeQuestion,
  postLeetCodeGraphQL,
};
