import { UsersService } from "../services/user.service.js";

export default class UserController {
    usersService = new UsersService();

    getUsers = (req, res) => {
        const { restaurante_id } = req.query;
        const users = this.usersService.findAllUsers({ restaurante_id });
        res.json(users);
    };

    createUser = (req, res) => {
        const { name, email, password, restaurante_id } = req.body ?? {};

        try {
            const user = this.usersService.createUser(name, email, password, restaurante_id);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    getRestaurantes = (_req, res) => {
        const restaurantes = this.usersService.findAllRestaurantes();
        res.json(restaurantes);
    };

    createRestaurante = (req, res) => {
        const { name, email, password } = req.body ?? {};

        try {
            const restaurante = this.usersService.createRestaurante({ name, email, password });
            res.status(201).json(restaurante);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };
}