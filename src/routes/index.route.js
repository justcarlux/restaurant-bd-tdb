const { Router } = require("express");
const packageJson = require("../../package.json");

const router = Router();

router.get("/", async (req, res) => {
  res.send({ name: packageJson.name, version: packageJson.version });
});

module.exports = router;
