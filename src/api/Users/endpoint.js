import express from "express";
import User from "./model.js";
import createHttpError from "http-errors";
import multer from "multer";
import {
  createAccessToken,
  createTokens,
  verifyRefreshAndCreateNewTokens,
  verifyRefreshToken,
} from "../lib/jwt-tools.js";

const usersRouter = express.Router();

const upload = multer({ dest: "uploads/" });

usersRouter.post("/", async (req, res, next) => {
  try {
    const newUser = new User(req.body);
    const { _id } = await newUser.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});
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
      next(createHttpError(404, `User with id ${req.params.id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

//update user by id
usersRouter.put("/:id", async (req, res, next) => {
  //
  try {
    const modifiedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (modifiedUser) {
      res.send(modifiedUser);
    } else {
      next(createHttpError(404, `User with id ${req.params.id} not found!`));
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

    res.send(user);
  } catch (error) {
    next(error);
  }
});

//delete user by id
usersRouter.delete("/:id", async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (user) {
      res.status(204).send();
    } else {
      next(createHttpError(404, `User with id ${req.params.id} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

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
    const { accessToken, refreshToken } = await verifyRefreshAndCreateNewTokens(
      currentRefreshToken
    );

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
      next(createHttpError(409, `The user with this email already exist!`));
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
  "/:id/uploadAvatar",
  upload.single("avatar"),
  async (req, res, next) => {
    try {
      const modifiedUser = await User.findByIdAndUpdate(
        req.params.id,
        { avatar: req.file.path },
        {
          runValidators: true,
          new: true,
        }
      );
      if (modifiedUser) {
        res.send(modifiedUser);
      } else {
        next(createHttpError(404, `User with id ${req.params.id} not found!`));
      }
    } catch (error) {
      next(error);
    }
  }
);

export default usersRouter;
