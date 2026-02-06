import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {

        email:{
            type:String,
            required:true,
            unique:true
        },

        firstName:{
            type:String,
            required:true

        },

        lastName:{
            type:String,
            required:true
        },

        password:{
            type:String,
            required:true

        },

        role:{
            type:String,
            default:"customer"
        },

        isEmailverified:{
            type:Boolean,
            default:false
        },
        
        isBlocked:{
            type:Boolean,
            default:false
        },

        image:{
            type:String,
            required:true,
            default:"/default.png"
        }

    }
)

const User = mongoose.model("user",userSchema)
export default User;
