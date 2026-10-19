import { Schema, model, Types, Document } from "mongoose";

export interface IConversation extends Document {
    participants: Types.ObjectId[];
    lastMessage?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
    {
        participants: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
            ],
            required: true,
            validate: {
                validator: (users: Types.ObjectId[]) =>
                    users.length === 2 &&
                    new Set(users.map((id) => id.toString())).size === 2,
                message: "A conversation must have two different participants",
            },
        },

        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
    },
    {
        timestamps: true,
    }
);

conversationSchema.index({ participants: 1 });

const ConversationModel = model<IConversation>("Conversation", conversationSchema);

export default ConversationModel;