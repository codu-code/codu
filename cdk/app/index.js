const express = require("express");

const port = process.env.PORT || 8080;

const app = express();

app.use(express.text());

app.get("/", (req, res) => {
  res.send(
    "Let's see this hello from port " +
      port +
      process.env.TEST +
      " " +
      process.env.DB_TEST +
      "-Hi 2"
  );
});

app.get("/test", (req, res) => {
  res.send("Hello from TEST");
});

app.listen(port, () => {
  console.log("app is listening on port " + port);
});
