const ws = new WebSocket((location.protocol === "https:" ? "wss://" : "ws://") + location.host);
const messages = document.getElementById("messages");
const input = document.getElementById("input");
const send = document.getElementById("send");

function add(msg, cls) {
	const d = document.createElement("div");
	if (cls) d.className = cls;
	d.textContent = msg;
	messages.appendChild(d);
	messages.scrollTop = messages.scrollHeight;
}

ws.addEventListener("open", () => add("Terhubung ke server.", "meta"));
ws.addEventListener("message", (ev) => {
	try {
		const m = JSON.parse(ev.data);
		if (m.type === "response") add("AI: " + m.text, "ai");
		else if (m.type === "status") add("Status: " + m.status, "meta");
		else if (m.type === "error") add("Error: " + m.error, "error");
	} catch {
		add("Raw: " + ev.data, "meta");
	}
});

send.addEventListener("click", () => {
	const text = input.value.trim();
	if (!text) return;
	add("Anda: " + text, "user");
	ws.send(JSON.stringify({ type: "message", text }));
	input.value = "";
});

input.addEventListener("keydown", (e) => { if (e.key === "Enter") send.click(); });
