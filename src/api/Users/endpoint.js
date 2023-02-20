import express from "express";
import User from "./model.js";
import createHttpError from "http-errors";
import multer from "multer";

export const usersRouter = express.Router();

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
            next(
                createHttpError(404, `User with id ${req.params.id} not found!`)
            );
        }
    } catch (error) {
        next(error);
    }
});

//update user by id
usersRouter.put("/:id", async (req, res, next) => {
    //
    try {
        const modifiedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                runValidators: true,
                new: true,
            }
        );
        if (modifiedUser) {
            res.send(modifiedUser);
        } else {
            next(
                createHttpError(404, `User with id ${req.params.id} not found!`)
            );
        }
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
            next(
                createHttpError(404, `User with id ${req.params.id} not found!`)
            );
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
                next(
                    createHttpError(
                        404,
                        `User with id ${req.params.id} not found!`
                    )
                );
            }
        } catch (error) {
            next(error);
        }
    }
);
