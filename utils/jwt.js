const jwt = require("jsonwebtoken");

const SECRET = "LUXE_HANDBAGS_SECRET";

const generateToken = (user) => {

    return jwt.sign(

        {
            id: user.id,
            email: user.email,
            role: user.role
        },

        SECRET,

        {
            expiresIn: "7d"
        }

    );

};

module.exports = {

    generateToken,
    SECRET

};