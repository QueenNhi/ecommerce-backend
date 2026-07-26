const jwt = require("jsonwebtoken");

const { SECRET } = require("../utils/jwt");

module.exports = (req, res, next) => {

    const auth = req.headers.authorization;

    if (!auth) {

        return res.status(401).json({

            message: "Unauthorized"

        });

    }

    const token = auth.split(" ")[1];

    try {

        req.user = jwt.verify(token, SECRET);

        next();

    }

    catch {

        return res.status(401).json({

            message: "Invalid Token"

        });

    }

};