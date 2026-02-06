import { json } from "express";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

export async function createUser(req,res){

    try{
        
        const data = req.body
        const hashedPass = bcrypt.hashSync(data.password, 10)

        const user = new User({
            email:data.email,
            firstName:data.firstName,
            lastName:data.lastName,
            password:hashedPass,
            role:data.role
        })
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

export async function readUser(req,res){
    try{
        if(isAdmin(req)){
            return res.status(500).json({
                message:"only admins can view"
            })
        }

        const users= await User.find();
        res.json(users)
    }catch(error){
        res.status(403).json({
            message:"fetching errors",
            error:error.message
        })
    }
}

export async function updateUser(){}

export async function deleteUser(){}

export async function login(req,res){
    try{

        const email = req.body.email
        const password=req.body.password

        const user = await User.findOne({email})

        if(!user){
            return res.status(404).json({
                message:"user not found"
            });
        }

        const isPassCorrect = bcrypt.compareSync(password,user.password);
        
        if(!isPassCorrect){
            return res.status(403).json({
                message:"invalid password"
            })
        }

        const payload = {
            email:user.email,
            firstName:user.firstName,
            lastName:user.lastName,
            role:user.role,
            isEmailVerified:user.isEmailverified,
            image:user.image
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET,{expiresIn:"150h"});

        return res.json({
            message:"user logging successfully",
            token:token,
            role:user.role,
        })

    }catch(error){
        res.status(403).json({
            message:"server found",
            error:error.message

        })

    }
}



export function isAdmin(req) {
    if(req.user==null){
        return false
    }

    if(req.user.role != "admin"){
        return false
    }
    return true
}