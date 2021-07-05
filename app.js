const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken"); // 토큰 모듈 불러오기
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
    const { nickname, email, password, confirmPassword } = req.body; // 클라이언트에서 보내는 정보들 받아오기

    // validate passwrod
    if (password !== confirmPassword) { // 비밀번호 일치해야만 로그인 허용
        res.status(400).send({ // 틀리면 에러 메세지 400(Bad request) 보낸다.
            errorMessage: '패스워드가 패드워드 확인란과 동일하지 않습니다.', // 
        });
        return; // 반드시 return을 통해 코드를 끝내줘야 한다.
    }

    // validate email and nickname
    const existUsers = await User.find({ // nickname과 email이 DB에 있는지 확인한다.
        $or: [{ email }, { nickname }],
    });
    if (existUsers.length) { // 조건 맞는 것들을 일단 가지고 온다.
        res.status(400).send({ // 이미 있다면 에러 메세지 보낸다.
            errorMessage: '이미 가입된 이메일 또는 닉네임이 있습니다.'
        });
        return; // 에러가 났으면 return 으로써 코드를 끝내준다.
    }

    const user = new User({ email, nickname, password }); // 사용자를 DB에 저장한다.
    await user.save();

    res.status(201).send({}); // 성공했다는 응답값을 보내준다. (REST API 원칙상 created (201) 이 적합)
});
// sign up API end

// login  API start
router.post("/auth", async(req, res) => { // 왜 POST? 입장권(token)을 그때 그때 생산한다. GET으로도 가능하지만 body에 정보를 못 싣고 주소에 치기때문에 보안에 취약
    const { email, password } = req.body; // email 과 password 입력을 받는다.

    const user = await User.findOne({ email, password }).exec(); // 일치하는 유저가 있는지 찾는다.

    if (!user) { // 일치하는 유저가 없다면,
        res.status(400).send({ // 에러 메세지를 보낸다.
            errorMessage: '이메일 또는 패스워드가 잘못됐습니다.'
        });
        return; // 에러가 났다면 바로 코드 종료
    }

    const token = jwt.sign({ userId: user.userId }, "my-secret-key"); // token 만들기 (sign을 해야된다.)
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