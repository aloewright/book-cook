export type AloysiusEvent =
  | { type: "hello"; from: string }
  | { type: "assistant_message"; text: string }
  | { type: "pong" }
  | { type: "job_status"; job_id: string; kind: string; status: string };

export function connectAloysius(projectId: string): {
  ws: WebSocket;
  send: (msg: object) => void;
  onEvent: (cb: (e: AloysiusEvent) => void) => () => void;
} {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${window.location.host}/agents/aloysius/${projectId}`);
  const listeners = new Set<(e: AloysiusEvent) => void>();
  ws.addEventListener("message", (ev) => {
    const data = JSON.parse(String(ev.data)) as AloysiusEvent;
    listeners.forEach((l) => l(data));
  });
  return {
    ws,
    send: (msg) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(msg)),
    onEvent: (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
  };
}
