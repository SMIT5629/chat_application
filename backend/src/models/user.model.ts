import { Document, model, Schema } from "mongoose";

export interface IUser extends Document {
    name: string;
    username: string;
    email: string;
    password?: string;
    profilePicture: string;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        username: {
            type: String,
            unique: true,
            required: true,
            trim: true,
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
            select: false,
        },
        profilePicture: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const UserModel = model<IUser>("User", userSchema);

export default UserModel;
