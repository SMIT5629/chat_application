import { model, Schema, Document } from "mongoose";

export interface ITokenBlacklist extends Document {
    token: string;
    createdAt: Date;
    updatedAt: Date;
}

const tokenBlacklistSchema = new Schema<ITokenBlacklist>(
    {
        token: {
            type: String,
            required: [true, "Token is required to blacklist"],
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

tokenBlacklistSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 3 }
);

const TokenBlackListModel = model<ITokenBlacklist>(
    "TokenBlackList",
    tokenBlacklistSchema
);

export default TokenBlackListModel;
