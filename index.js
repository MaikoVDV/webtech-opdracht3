const express = require("express");
const app = express();
const port = 8010;

app.get("/",  express.static("client"));

app.listen(port, () => {
  console.log(`Application running on port ${port}.`);
});