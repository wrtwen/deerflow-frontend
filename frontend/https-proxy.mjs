import https from "node:https";
import http from "node:http";
import fs from "node:fs";

const options = {
  key: fs.readFileSync("dev-key.pem"),
  cert: fs.readFileSync("dev-cert.pem"),
};

const server = https.createServer(options, (req, res) => {
  const proxyReq = http.request(
    {
      host: "localhost",
      port: 3099,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: "localhost:3099" },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    },
  );
  proxyReq.on("error", () => res.statusCode = 502 && res.end());
  req.pipe(proxyReq, { end: true });
});

server.listen(3443, "0.0.0.0", () => {
  console.log("HTTPS proxy: https://192.168.2.147:3443");
});
