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
        const { name, email, password, precio_tiquetera } = req.body ?? {};

        try {
            const restaurante = this.usersService.createRestaurante({
                name,
                email,
                password,
                precio_tiquetera,
            });
            res.status(201).json(restaurante);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    };

    updateRestaurante = (req, res) => {
        const { id } = req.params;
        const { name, email, password, active, precio_tiquetera } = req.body ?? {};

        try {
            const restaurante = this.usersService.updateRestaurante(id, {
                name,
                email,
                password,
                active,
                precio_tiquetera,
            });
            res.json(restaurante);
        } catch (error) {
            const status = error.status || 400;
            res.status(status).json({ error: error.message });
        }
    };

    deleteRestaurante = (req, res) => {
        const { id } = req.params;

        try {
            const result = this.usersService.deleteRestaurante(id);
            res.json(result);
        } catch (error) {
            const status = error.status || 400;
            res.status(status).json({ error: error.message });
        }
    };
}