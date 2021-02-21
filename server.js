const express = require("express");
const serveStatic = require("serve-static");

const app = express();
const port = process.env.PORT || 8077;

app.use(serveStatic("public", { index: "index.html" }));

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`)
})