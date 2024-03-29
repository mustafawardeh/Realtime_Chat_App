import User from "../Models/user.model.js"
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken"
//----------------------------------------------
//--------------Register Controller-------------
//----------------------------------------------
export const signupController = async (req, res) => {
    const { password, confirmPassword, email, fullName, gender } = req.body

    if (!email || !password || !confirmPassword || !fullName || !gender) {
        return res.status(400).json({ msg: "Please fill all fields" })
    }
    else if (password !== confirmPassword) {
        return res.status(400).json({ msg: 'Passwords do not match' })
    }
    try {
        const findUser = await User.findOne({ email })
        if (findUser) {
            return res.status(400).json({ msg: "Email is already in use!" })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const girlProfilePic = `https://avatar.iran.liara.run/public/girl?email=${fullName}`;
        const boyProfilePic = `https://avatar.iran.liara.run/public/boy?email=${fullName}`;

        const user = new User({
            email,
            password: hashedPassword,
            fullName,
            gender,
            profilePic: gender === 'male' ? boyProfilePic : girlProfilePic
        })
        // Save the user to the database
        const createdUser = await user.save()

        const token = jwt.sign({ userId: createdUser._id }, process.env.JWT_SECRET_KEY, { expiresIn: "3d" });

        res.cookie("jwt", token);

        res.status(201).json({
            msg: 'User Successfully Registered',
            data: {
                _id: createdUser._id,
                fullName: createdUser.fullName,
                email: createdUser.email,
                profilePic: createdUser.profilePic,
            }
        });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Something went wrong oops' })
    }
}

//----------------------------------------------
//---------------Login Controller---------------
//----------------------------------------------
export const loginController = async (req, res) => {
    const { password, email } = req.body
    if (!email || !password) {
        return res.status(400).json({ msg: "Please fill all fields" })
    }

    try {
        const findUser = await User.findOne({ email })
        if (!findUser) {
            return res.status(400).json({ msg: "Oops:Email Deos Not Registered" })
        }

        const isMatch = await bcrypt.compare(password, findUser.password)
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid Email Or Password" })
        }

        const token = jwt.sign({ userId: findUser._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "3d",
        });

        res.cookie("jwt", token);

        res.status(201).json({
            msg: 'User Successfully Logged In',
            data: {
                _id: findUser._id,
                fullName: findUser.fullName,
                email: findUser.email,
                profilePic: findUser.profilePic,
            }
        });
    }
    catch (error) {
        return res.status(500).json({ msg: 'Something went wrong oops' })
    }
}

//----------------------------------------------
//---------------Logout Controller--------------
//----------------------------------------------
export const logoutController = (req, res) => {
    res.clearCookie("jwt")
    res.status(200).json({
        msg: 'User Logged Out Successfully'
    })
}


export const checkAuthentication = (req, res) => {
    if (!req.userId) {
        res.redirect('http://localhost:3001/login')
    }
}