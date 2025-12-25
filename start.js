import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";

// Muat variabel lingkungan dari file .env (lokal)
dotenv.config({ path: "./api_key.env" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
	// Jika kunci tidak ada, hentikan agar pengguna tahu harus mengisi GEMINI_API_KEY.env
	console.error("GEMINI_API_KEY tidak ditemukan. Isi nilai di GEMINI_API_KEY.env lalu jalankan ulang.");
	process.exit(1);
}

// Inisialisasi client dengan apiKey
const ai = new GoogleGenAI({ apiKey });

// Baru: HTTP + WebSocket server untuk chat real-time
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT ?? 3000;

// Ganti: serve halaman klien inline -> layani folder public
app.use(express.static("public"));

// WebSocket handling: terima pesan, panggil GenAI, kirim jawaban
wss.on("connection", (ws) => {
	ws.on("message", async (data) => {
		let msg;
		try { msg = JSON.parse(data.toString()); } catch { return; }
		if (msg?.type === "message" && typeof msg.text === "string") {
			ws.send(JSON.stringify({ type: "status", status: "thinking" }));
			try {
				const response = await ai.models.generateContent({
					model: "gemini-2.5-flash",
					contents: msg.text,
				});
				const text = response?.text ?? JSON.stringify(response);
				ws.send(JSON.stringify({ type: "response", text }));
			} catch (err) {
				ws.send(JSON.stringify({ type: "error", error: String(err) }));
			}
		}
	});
});

// Mulai server
server.listen(PORT, "0.0.0.0", () => {
	console.log(`Server berjalan di http://localhost:${PORT} — WebSocket siap`);
	console.log("Static files served from ./public. Buka http://localhost:3000");
});