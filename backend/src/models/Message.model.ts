import { Schema, model, Types, Document } from "mongoose";

export interface IMessage extends Document {
    conversation: Types.ObjectId;
    sender: Types.ObjectId;
    text: string;
    mediaUrl?: string;
    mediaType?: "image" | "file" | "none";
    readBy: Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
    {
        conversation: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },

        sender: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        text: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },

        mediaUrl: {
            type: String,
            default: "",
        },

        mediaType: {
            type: String,
            enum: ["image", "file", "none"],
            default: "none",
        },

        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ conversation: 1, createdAt: -1 });

const MessageModel = model<IMessage>("Message", messageSchema);

export default MessageModel;