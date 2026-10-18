import { InferSchemaType, model, Schema } from "mongoose";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        username: {
            type: String,
            unique:true,
            required: true,
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            unique: true,
            required: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Invalid email"],
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        profilePicture: {
            type: String,
            default: ""
        },
    },
    { timestamps: true },
);

export type User = InferSchemaType<typeof userSchema>;

export default model("User", userSchema);
