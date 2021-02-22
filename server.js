const { create } = require("domain");
const finalHandler = require("finalhandler");
const { createServer } = require("http");
const serveStatic = require("serve-static");

const port = process.env.PORT || 8077;
const serve = serveStatic("public", { index: "index.html" });

const server = createServer((req, res) => {
  serve(req, res, finalHandler(req, res))
});
server.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});
