import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: {
        type: String,
        required: false,
        default: "https://via.placeholder.com/200x200",
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default model("User", userSchema);
