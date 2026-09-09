import { UsersService } from "../services/user.service.js";

export default class UserController {
    usersService = new UsersService();

    getUsers = (req, res) => {
        const users = this.usersService.findAllUsers();
        res.json(users);
    };

    createUser = (req, res) => {
        const { name, email } = req.body ?? {};

        try {
            const user = this.usersService.createUser(name, email);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
}