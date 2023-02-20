import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: {
    type: String,
    required: false,
    default: "https://via.placeholder.com/200x200",
  },
  password: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function (next) {
  const currentUser = this;
  if (currentUser.isModified("password")) {
    const plainPW = currentUser.password;

    const hash = await bcrypt.hash(plainPW, 10);
    currentUser.password = hash;
  }
  next();
});

userSchema.static("checkCredentials", async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      return user;
    } else {
      return null;
    }
  } else {
    return null;
  }
});

userSchema.static("checkEmail", async function (email) {
  const user = await this.findOne({ email });
  if (user) {
    return email;
  } else {
    return null;
  }
});

export default model("User", userSchema);
