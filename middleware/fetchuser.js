const jwt = require("jsonwebtoken");

let JWT_SECRET = "mySecret";

const fetchuser = (req, res, next) => {
  // get the user from jwt token and add the id to the request
  
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ error: "Please authenticate the user" });
  } else {
    try {
      const data = jwt.verify(token, JWT_SECRET);
      req.user = data.user;
      next();
    } catch (error) {
      res.status(401).send({ error: "Please authenticate the user" });
    }
  }
};

module.exports = fetchuser;
