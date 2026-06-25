import { getReceiverSocketId, io } from "../lib/socket.js";
import User from "../models/User.js";
import { hasImageKitConfig, uploadChatMedia } from "../lib/imagekit.js";
import Message from "../models/message.js";

export async function getUsersForSidebar(req, res) {
    try{
        const loggedInUserId = req.user._id;

        const filteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-clerkId");
        res.status(200).json(filteredUsers);

    }catch(error){
        console.error("Error fetching users for sidebar: ", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}


export async function getConversationsForSidebar(req, res) {
    try {
        const loggedInUserId = req.user._id;

        const conversations = await Message.aggregate([
            // 1. Keep only messages I sent or received
            {
                $match: {
                    $or: [
                        { senderId: loggedInUserId },
                        { receiverId: loggedInUserId },
                    ],
                },
            },

            // 2. Group by the other participant
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$senderId", loggedInUserId] },
                            "$receiverId",
                            "$senderId",
                        ],
                    },
                    lastMessageAt: { $max: "$createdAt" },
                },
            },

            // 3. Most recent conversations first
            {
                $sort: {
                    lastMessageAt: -1,
                },
            },

            // 4. Fetch user details
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },

            // 5. Remove conversations whose user no longer exists
            {
                $unwind: "$user",
            },

            // 6. Replace root document with the user object
            {
                $replaceRoot: {
                    newRoot: "$user",
                },
            },

            // 7. Hide clerkId
            {
                $project: {
                    clerkId: 0,
                },
            },
        ]);

        res.status(200).json(conversations);
    } catch (error) {
        console.error("Error in getConversationsForSidebar:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export async function getMessages(req, res){
    try{
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId:myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId},
            ]
        }).sort({createdAt:1})
        res.status(200).json(messages);
    }catch(error){
        console.error("Error in getMessages:", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export async function sendMessage(req, res){
    try{
        const { text } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        let videoUrl;

        if(req.file){
            if(!hasImageKitConfig()){
                return res.status(500).json({ message: "Media upload is not configured"});

            }
            const url = await uploadChatMedia(req.file)
            if(req.file.mimetype.startsWith("video/")) videoUrl = url;
            else imageUrl = url;
        }
        
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            video: videoUrl,
        })

        await newMessage.save()

        const receiverSocketId = getReceiverSocketId(receiverId);
        //only send the message in realtime if user is online
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    }catch(error){
        console.error("Error in sendMessage:", error);
        res.status(500).json({ message: "Internal Server Error"});
    }
}
