import express from "express";
import User from "./model.js";
import createHttpError from "http-errors";
import multer from "multer";
import {
    createAccessToken,
    createTokens,
    verifyAccessToken,
    verifyRefreshAndCreateNewTokens,
    verifyRefreshToken,
} from "../lib/jwt-tools.js";
import passport from "passport";

const usersRouter = express.Router();

const upload = multer({ dest: "uploads/" });

//get all users
usersRouter.get("/", async (req, res, next) => {
    try {
        const users = await User.find();
        res.send(users);
    } catch (error) {
        next(error);
    }
});
//get user by id
usersRouter.get("/:id", async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            res.send(user);
        } else {
            next(
                createHttpError(404, `User with id ${req.params.id} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

//Logout. If implemented with cookies, should set an empty cookie. Otherwise it should just remove the refresh token from the DB.
usersRouter.delete("/session", async (req, res, next) => {
    try {
        const currentRefreshToken = req.body.currentRefreshToken;
        const { _id } = await verifyRefreshToken(currentRefreshToken);

        const user = await User.findByIdAndUpdate(_id, {
            $unset: { refreshToken: currentRefreshToken },
        });

        if (user) {
            res.status(204).send();
        } else {
            next(createHttpError(404, `User with id ${_id} not found!`));
        }
    } catch (error) {
        next(error);
    }
});

//oauth login
usersRouter.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);
usersRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login",
    }),
    async (req, res, next) => {
        try {
            const user = req.user;
            if (user) {
                const { accessToken, refreshToken } = await createTokens(user);
                res.send({ accessToken, refreshToken });
            } else {
                next(createHttpError(404, "Credentials are not ok!"));
            }
        } catch (error) {
            next(error);
        }
    }
);

//user login
usersRouter.post("/session", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.checkCredentials(email, password);

        if (user) {
            // const payload = { _id: user._id };
            // const accessToken = await createAccessToken(payload);
            const { accessToken, refreshToken } = await createTokens(user);
            res.send({ accessToken, refreshToken });
        } else {
            next(createHttpError(404, "Credentials are not ok!"));
        }
    } catch (error) {
        next(error);
    }
});

//Refreshed. EXTRA: instead than returning tokens in the response body, handle them using cookies.
usersRouter.post("/session/refresh", async (req, res, next) => {
    try {
        const { currentRefreshToken } = req.body;
        //check validity of this token
        const { accessToken, refreshToken } =
            await verifyRefreshAndCreateNewTokens(currentRefreshToken);

        res.send({ accessToken, refreshToken });
    } catch (error) {
        next(error);
    }
});

//user registiration, Created new user. EXTRA: instead than returning tokens in the response body, handle them using cookies.
usersRouter.post("/account", async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.checkEmail(email);
        if (user) {
            next(
                createHttpError(409, `The user with this email already exist!`)
            );
        } else {
            const newUser = new User(req.body);
            const { _id } = await newUser.save();
            const payload = { _id };
            const accessToken = await createAccessToken(payload);
            res.status(201).send({ accessToken });
        }
    } catch (error) {
        next(error);
    }
});

//upload avatar
usersRouter.post(
    "/uploadAvatar",
    upload.single("avatar"),
    async (req, res, next) => {
        //verify access token
        try {
            const accessToken = req.headers.authorization.split(" ")[1];
            const { _id } = await verifyAccessToken(accessToken);

            if (_id) {
                const modifiedUser = await User.findByIdAndUpdate(
                    _id,
                    { avatar: req.file.path },
                    {
                        runValidators: true,
                        new: true,
                    }
                );
                if (modifiedUser) {
                    res.send(modifiedUser);
                } else {
                    next(
                        createHttpError(404, `User with id ${_id} not found!`)
                    );
                }
            } else {
                next(createHttpError(404, `User with id ${_id} not found!`));
            }

            //find user with
        } catch (e) {
            if (e.name === "JsonWebTokenError") {
                next(createHttpError(401, "Access token is not valid!"));
            } else next(e);
        }
    }
);

export default usersRouter;
