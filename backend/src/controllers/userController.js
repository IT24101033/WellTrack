import User from "../models/user.js";

export async function createUser(req,res){

    try{

        const user = new User(req.body)
        await user.save()

        res.status(201).json({
            message:"user created"
        })
    }catch(error){
        res.status(500).json({
            message:"error creating account",
            error:error.message
        })

    }
}

export async function readCreate(){}

export async function updateCreate(){}

export async function deleteCreate(){}

export async function login(){}