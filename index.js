require("dotenv").config();
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const puppeteerOptions = {
  headless: true,
  args: ["--no-sandbox"],
};

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: puppeteerOptions,
});

// System prompt for AI behavior
const systemPrompt = `
Role (Peran):
Kamu adalah chatbot interaktif yang asik dan gaul. Tugas utamamu adalah membantu user dengan menjawab pertanyaan mereka secara jelas, interaktif, dan menyenangkan.

Task (Tugas):
- Berikan jawaban yang informatif, tapi tetap ringan dan gampang dimengerti.
- Jika pertanyaan kurang jelas, ajukan pertanyaan follow-up untuk mendapatkan konteks yang lebih lengkap.
- Gunakan bahasa santai dan gaul agar interaksi terasa lebih natural, seperti ngobrol sama temen sendiri.
- Jaga percakapan tetap fokus dan tidak keluar dari topik utama.
- Tambahkan emoji-emoji agar lebih menarik

Limit (Batasan):
- Jangan memberikan jawaban yang terlalu formal atau kaku.
- Hindari jawaban yang terlalu panjang atau teknis kecuali diminta secara spesifik.
- Jangan membuat asumsi tanpa mendapatkan klarifikasi dari user terlebih dahulu.
- Tetap sopan dan sesuai etika komunikasi yang baik.

Material (Bahan/Panduan):
Jika user bertanya sesuatu yang kurang jelas, gunakan frasa seperti:
- "Eh, maksudnya gimana nih? Bisa kasih contoh?"
- "Kamu lebih butuh solusi praktis atau penjelasan detail?"
- "Oke, ini menarik! Tapi konteksnya gimana dulu?"

Jika pertanyaan sudah jelas, langsung berikan jawaban yang singkat dan padat, misalnya:
- "Sip, ini dia jawabannya..."
- "Oke, kalau gitu solusinya gini..."
`;

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const userPhone = process.env.USER_PHONE;
// User conversation history
const userConversations = new Map();

// Event: When WhatsApp client is ready
client.on("ready", () => {
  console.log("WhatsApp client is ready!");
});

// Event: QR Code generation for authentication
client.on("qr", (qr) => {
  console.log("Scan the QR code below to authenticate:");
  qrcode.generate(qr, { small: true });
});

// Helper function to update conversation history
function updateUserConversation(userId, message) {
  const now = Date.now();
  if (!userConversations.has(userId)) {
    userConversations.set(userId, { messages: [], lastActivity: now });
  }

  const conversation = userConversations.get(userId);
  conversation.messages.push(message);
  conversation.lastActivity = now;

  // Clear conversation after 5 minutes of inactivity
  setTimeout(() => {
    if (
      userConversations.has(userId) &&
      userConversations.get(userId).lastActivity < now
    ) {
      userConversations.delete(userId);
      console.log(`Cleared conversation for user ${userId}`);
    }
  }, 6 * 60 * 1000);
}

// Process AI text response
async function processTextMessage(userId, userPrompt) {
  try {
    updateUserConversation(userId, {
      role: "user",
      parts: [{ text: userPrompt }],
    });
    const conversationHistory = userConversations.get(userId).messages;

    const result = await model.generateContent({
      contents: [
        { role: "model", parts: [{ text: systemPrompt }] },
        ...conversationHistory,
      ],
    });

    const responseText = result.response.text();
    console.log(`AI Response to ${userId}: ${responseText}`);

    updateUserConversation(userId, {
      role: "model",
      parts: [{ text: responseText }],
    });
    await client.sendMessage(userId, responseText);
  } catch (apiError) {
    console.error("Error generating AI response:", apiError);
    await client.sendMessage(
      userId,
      "Sorry, I encountered an error processing your request."
    );
  }
}

// Process AI image response
async function processImageMessage(userId, media, userPrompt) {
  try {
    updateUserConversation(userId, {
      role: "user",
      parts: [{ text: userPrompt }],
    });
    const conversationHistory = userConversations.get(userId).messages;

    // Save media temporarily
    const fileExtension = media.mimetype.split("/")[1];
    const filePath = path.join(__dirname, `temp_${userId}.${fileExtension}`);
    fs.writeFileSync(filePath, media.data, "base64");

    const imageBuffer = fs.readFileSync(filePath);
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType: media.mimetype,
      },
    };

    const result = await model.generateContent({
      contents: [
        { role: "model", parts: [{ text: systemPrompt }] },
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: userPrompt }, imagePart],
        },
      ],
    });

    const responseText = result.response.text();
    console.log(`AI Image Response: ${responseText}`);

    updateUserConversation(userId, {
      role: "model",
      parts: [{ text: responseText }],
    });
    await client.sendMessage(userId, responseText);

    // Clean up temp file
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Error processing image:", error);
    await client.sendMessage(userId, "Sorry, I couldn't process the image.");
  }
}

async function processPrivateMessage(message) {
  const userId = message.from;
  const body = message.body ? message.body.trim() : "";

  // Send typing indicator
  const chat = await message.getChat();
  chat.sendStateTyping();

  if (body || message.hasMedia) {
    // Extract user prompt
    const userPrompt = body || "Describe this image.";

    // Handle "ai: clear" command
    if (userPrompt.toLowerCase() === "clear") {
      if (userConversations.has(userId)) {
        userConversations.delete(userId); // Clear conversation history
        console.log(`Cleared conversation history for user ${userId}`);
        await client.sendMessage(userId, "Percakapanmu udah dihapus nih! 🧹");
      } else {
        await client.sendMessage(
          userId,
          "Ngga ada percakapan nih, yuk coba chat dulu. 😊"
        );
      }
      return; // Exit after handling the "clear" command
    }

    // Handle text messages
    if (!message.hasMedia) {
      if (!userPrompt) {
        await client.sendMessage(userId, "Tulis pertanyaanmu disini ya! 🤖");
        return;
      }
      await processTextMessage(userId, userPrompt);
    } else if (message.hasMedia) {
      const media = await message.downloadMedia();
      await processImageMessage(userId, media, userPrompt);
    }
  }
}

async function processGroupMessage(message) {
  const userId = message.from;
  const body = message.body ? message.body.trim() : "";
  const isMentioned = body.includes(userPhone);

  if (isMentioned) {
    // Send typing indicator
    const chat = await message.getChat();
    chat.sendStateTyping();

    // Extract user prompt
    const userPrompt = body || "Describe this image.";

    // Handle "ai: clear" command
    if (userPrompt.toLowerCase().includes("clear")) {
      if (userConversations.has(userId)) {
        userConversations.delete(userId); // Clear conversation history
        console.log(`Cleared conversation history for user ${userId}`);
        await client.sendMessage(userId, "Percakapanmu udah dihapus nih! 🧹");
      } else {
        await client.sendMessage(
          userId,
          "Ngga ada percakapan nih, yuk coba chat dulu. 😊"
        );
      }
      return; // Exit after handling the "clear" command
    }

    // Handle text messages
    if (!message.hasMedia) {
      if (!userPrompt) {
        await client.sendMessage(userId, "Tulis pertanyaanmu disini ya! 🤖");
        return;
      }
      await processTextMessage(userId, userPrompt);
    } else if (message.hasMedia) {
      const media = await message.downloadMedia();
      await processImageMessage(userId, media, userPrompt);
    }
  }
}

// Event: Handle incoming messages (text & media)
client.on("message", async (message) => {
  try {
    const userId = message.from;
    const isPrivateMessage = userId.endsWith("@c.us");

    if (isPrivateMessage) {
      await processPrivateMessage(message);
    } else {
      await processGroupMessage(message);
    }
  } catch (error) {
    console.error("Error handling message:", error);
    await client.sendMessage(
      message.from,
      "An unexpected error occurred. Please try again later."
    );
  }
});

// Start WhatsApp client
client.initialize();
