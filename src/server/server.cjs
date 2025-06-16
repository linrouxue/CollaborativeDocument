#!/usr/bin/env node
require("dotenv").config();
const WebSocket = require("ws");
const http = require("http");
const number = require("lib0/number");
const wss = new WebSocket.Server({ noServer: true });
//这样会造成多个yjs 可以考虑复制一份utils.cjs
const setupWSConnection =
  require("../../node_modules/y-websocket/bin/utils.cjs").setupWSConnection;

//期望解决跨域访问
const host = process.env.HOST || "0.0.0.0";
const port = number.parseInt(process.env.PORT || "1234");

const server = http.createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("okay");
});

wss.on("connection", setupWSConnection);

server.on("upgrade", (request, socket, head) => {
  // You may check auth of request here..
  // Call `wss.HandleUpgrade` *after* you checked whether the client has access
  // (e.g. by checking cookies, or url parameters).
  // See https://github.com/websockets/ws#client-authentication
  wss.handleUpgrade(
    request,
    socket,
    head,
    /** @param {any} ws */ (ws) => {
      wss.emit("connection", ws, request);
    }
  );
});

server.listen(port, host, () => {
  console.log(`running at '${host}' on port ${port}`);
});
