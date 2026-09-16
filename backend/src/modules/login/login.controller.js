import { LoginService } from "./login.service.js";

export default class LoginController {
  loginService = new LoginService();

  login = (req, res) => {
    const { email, password } = req.body ?? {};

    try {
      const user = this.loginService.login(email, password);
      res.status(200).json({ mensaje: "Inicio de sesión exitoso", usuario: user });
    } catch (error) {
      res.status(error.statusCode ?? 400).json({ error: error.message });
    }
  };
}
