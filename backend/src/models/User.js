import mongoose, { mongo } from "mongoose"

//user schema
const userSchema = new mongoose.Schema({
    
    clerkID: {
        type: String,
        required: true,
        unique: true,
    },
    email:{
        type: String,
        required: true,
        unique: true,
    },
    fullName:{
        type: String,
        required: true,
    },
    profilePic: {
        type: String,
        default: "",
    },
}, {timestamps: true},//createdAt
);

const User = mongoose.model("User", userSchema);

export default User;
