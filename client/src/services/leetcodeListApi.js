import api from "./api";

const leetcodeListApi = {
  importList: (text, platform) =>
    api.post("/problems/leetcode-list", { text, platform }),
  createFolderFromList: (folderName, problems) =>
    api.post("/problems/leetcode-list/create-folder", { folderName, problems }),
};

export default leetcodeListApi;
