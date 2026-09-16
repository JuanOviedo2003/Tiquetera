import LoginEntity from "./login.entity.js";

export class LoginService {
  login(email, password) {
    if (typeof email !== "string" || !email.trim()) {
      const error = new Error("El correo es obligatorio");
      error.statusCode = 400;
      throw error;
    }

    if (typeof password !== "string" || !password.trim()) {
      const error = new Error("La contraseña es obligatoria");
      error.statusCode = 400;
      throw error;
    }

    const user = LoginEntity.findByEmail(email.trim().toLowerCase());

    if (!user || user.password !== password) {
      const error = new Error("Credenciales inválidas");
      error.statusCode = 401;
      throw error;
    }

    if (!user.activo) {
      const error = new Error("Usuario inactivo");
      error.statusCode = 403;
      throw error;
    }

    const { password: _password, ...userSinPassword } = user;
    return userSinPassword;
  }
}
