import api from "./api";

const profileAnalysisApi = {
  /**
   * Fetch a LeetCode user's profile stats
   * @param {string} username
   */
  analyzeProfile: (username) => api.get(`/profile-analysis/${username}`),

  /**
   * Add a problem to the user's revision list
   * @param {{ username, problemName, difficulty, leetcodeUrl }} body
   */
  addRevision: (body) => api.post(`/profile-analysis/revision`, body),

  /**
   * Get all revision problems for a user
   * @param {string} username
   */
  getRevisions: (username) => api.get(`/profile-analysis/revision/${username}`),

  /**
   * Remove a revision problem by its MongoDB _id
   * @param {string} id
   */
  deleteRevision: (id) => api.delete(`/profile-analysis/revision/${id}`),

  /**
   * Get topic-wise recommendations based on weak areas
   * @param {{ weakAreas: string[], limit?: number }} body
   */
  getRecommendations: (body) =>
    api.post(`/profile-analysis/recommendations`, body),

  getTopicQuestions: (topic) =>
    api.post(`/profile-analysis/topic-questions`, { topic }),

  /**
   * Import weak-area problems into the file explorer (backend creates folders/files)
   * @param {{ problems: Array<{topic, problemName, difficulty, leetcodeUrl}> }} body
   */
  importWeakAreas: (body) =>
    api.post(`/profile-analysis/import-weak-areas`, body),
};

export default profileAnalysisApi;
