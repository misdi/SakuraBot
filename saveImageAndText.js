const axios = require("axios");
const fs = require("fs");
const path = require("path");

// const saveFolderPath = "./saved_images/";
const saveFolderPath = 'H:/Shared drives/Image-Gallery/MidJourney_Images'; //gdrive folder


async function saveImageAndText(message) {
  const folderName = getCurrentDate();
  const folderPath = path.join(saveFolderPath, folderName);
  const uniqueId = generateUniqueId();

  const folderExists = fs.existsSync(folderPath);
  if (!folderExists) {
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`Save folder '${folderName}' created successfully!`);
  }

  // Save the image(s)
  if (message.attachments.size > 0) {
    message.attachments.forEach(async (attachment) => {
      const uniqueIdNew = generateUniqueId();
      const fileName = attachment.name;
      const fileExt = path.extname(fileName);
      const baseName = path.basename(fileName, fileExt);
      const newFileName = `${uniqueId}_${baseName}_${uniqueIdNew}${fileExt}`;
      const filePath = path.join(folderPath, newFileName);

      try {
        const response = await axios.get(attachment.url, {
          responseType: "stream",
        });
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
        console.log(`Saved ${newFileName}`);
      } catch (error) {
        console.error(`Error saving ${newFileName}:`, error);
      }
    });
  }

  // Save the message text
  // if (message.content) {
  //   const textContent = `User: ${message.author.tag}\nContent: ${message.content}`;
  //   const textFileName = `${uniqueId}_${message.id}.txt`;
  //   const textFilePath = path.join(folderPath, textFileName);

  //   fs.writeFile(textFilePath, textContent, (err) => {
  //     if (err) {
  //       console.error(`Error saving message text for ${textFileName}:`, err);
  //     } else {
  //       console.log(`Saved message text for ${textFileName} successfully!`);
  //     }
  //   });
  // }
}

function getCurrentDate() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateUniqueId() {
  return Date.now().toString();
}


module.exports = { saveImageAndText };
