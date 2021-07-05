const jwt = require("jsonwebtoken"); // jwt 모듈 불러오기
const User = require("../models/user"); // DB 조회를 위해 user module 불러오기

module.exports = (req, res, next) => {
    const { authorization } = req.headers;
    const [tokenType, tokenValue] = authorization.split(' '); // 공백 기준으로 잘라서 배열로 저장해준다.

    if (tokenType !== 'Bearer') { // token type 이 bearer 가 아니면 탈출시킨다.
        res.status(401).send({
            errorMessage: "로그인 후 사용하세요"
        });
        return;
    }

    try { // try 에서 문제가 생기면 catch 로 넘어간다.
        const { userId } = jwt.verify(tokenValue, "my-secret-key");

        User.findById(userId).exec().then((user) => { // userId 를 DB로부터 가져온다.
            res.locals.user = user; // 사용자 정보를 임의의 공간에 담는다. >> 아주 편리함
            next(); // next를 반드시 호출해 주어야 한다.
        });
    } catch (error) { // token type 틀렸을 때와 동일
        res.status(401).send({
            errorMessage: "로그인 후 사용하세요"
        });
        return;
    }
};