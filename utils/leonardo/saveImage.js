require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = async (url, username, generationData) => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const contentDisposition = response.headers["content-disposition"];
    const fileName = contentDisposition
      ? contentDisposition.match(/filename="?(.+?)"?$/)[1]
      : path.basename(url);

    // const parentFolderPath = path.join(__dirname, "..", "generated");
    const parentFolderPath = path.join(__dirname, "..", "..", "generated");
    const userFolderPath = path.join(parentFolderPath, username);

    if (!fs.existsSync(parentFolderPath)) {
      fs.mkdirSync(parentFolderPath, { recursive: true });
    }

    if (!fs.existsSync(userFolderPath)) {
      fs.mkdirSync(userFolderPath, { recursive: true });
    }

    let newFileName = fileName;
    let count = 1;
    const fileExt = path.extname(fileName);
    const baseFileName = path.basename(fileName, fileExt);

    while (fs.existsSync(path.join(userFolderPath, newFileName))) {
      newFileName = `${baseFileName}_${count}${fileExt}`;
      count++;
    }

    const filePath = path.join(userFolderPath, newFileName);

    fs.writeFileSync(filePath, Buffer.from(response.data, "binary"));

    // Save generation info in a text file
    let infoFileName = `${baseFileName}.txt`;
    count = 1;

    while (fs.existsSync(path.join(userFolderPath, infoFileName))) {
      infoFileName = `${baseFileName}_${count}.txt`;
      count++;
    }

    const infoFilePath = path.join(userFolderPath, infoFileName);
    const generationInfo = JSON.stringify(generationData, null, 2);
    fs.writeFileSync(infoFilePath, generationInfo);

    return filePath;
  } catch (error) {
    console.error("Error saving image:", error);
    throw error;
  }
};
