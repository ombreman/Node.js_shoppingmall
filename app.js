const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // add jwt token module
const User = require("./models/user");
const authMiddleware = require("./middlewares/auth-middleware"); // add middleware for arthorisation

// connect mongodb
mongoose.connect("mongodb://localhost/shopping-demo", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();

// sign up API start
router.post("/users", async (req, res) => {
    const { nickname, email, password, confirmPassword } = req.body; // getting info from client

    // validate passwrod
    if (password !== confirmPassword) { // allow login if password is correct
        res.status(400).send({ // if incorrect send 400(Bad request) error message
            errorMessage: '패스워드가 패드워드 확인란과 동일하지 않습니다.', // 
        });
        return; // code has to be done by doing return
    }

    // validate email and nickname
    const existUsers = await User.find({ // check whether nickname and email are in DB
        $or: [{ email }, { nickname }],
    });
    if (existUsers.length) { // get every info meeting conditions
        res.status(400).send({ // send error 400 message if already exist
            errorMessage: '이미 가입된 이메일 또는 닉네임이 있습니다.'
        });
        return; // finish code if error occurs
    }

    const user = new User({ email, nickname, password }); // save user in DB
    await user.save();

    res.status(201).send({}); // send success message, code 201 is suitable based on REST API rules
});
// sign up API end

// login  API start
router.post("/auth", async(req, res) => { // 왜 POST? 입장권(token)을 그때 그때 생산한다. GET으로도 가능하지만 body에 정보를 못 싣고 주소에 치기때문에 보안에 취약
    const { email, password } = req.body; // take email and password

    const user = await User.findOne({ email, password }).exec(); // 일치하는 유저가 있는지 찾는다.

    if (!user) { // if no corresponding user,
        res.status(400).send({ // send an error message
            errorMessage: '이메일 또는 패스워드가 잘못됐습니다.'
        });
        return; // finish code if error occurs
    }

    const token = jwt.sign({ userId: user.userId }, "my-secret-key"); // make token (sign must be taken)
    res.send({
        token,
    });
});
// login API end

router.get("/users/me", authMiddleware, async(req, res) => { // authMiddleware 반드시 붙여줘야한다. 안그러면 res.locals 에 아무 정보도 담기지 않게 된다.
    const { user } = res.locals; // destructing (구조분해할당)
    res.send({
        user: {
            email: user.email,
            nickname: user.nickname,
        } // 클라이언트에서 알아서 email 과 nickname 만 골라 가져간다. 하지만 password 노출을 피하려면 email, nickname 만 골라서 클라이언트로 넘겨준다.
    });
});

app.use("/api", express.urlencoded({ extended: false }), router);
app.use(express.static("assets"));

app.listen(8080, () => {
    console.log("서버가 요청을 받을 준비가 됐어요");
});