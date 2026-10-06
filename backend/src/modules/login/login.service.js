import bcrypt from "bcrypt";
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

    if (!user) {
      const error = new Error("Credenciales inválidas");
      error.statusCode = 401;
      throw error;
    }

    let passwordMatches = false;
    if (user.passwordHash) {
      try {
        passwordMatches = bcrypt.compareSync(password, user.passwordHash);
      } catch {
        passwordMatches = false;
      }
    } else if (user.password) {
      passwordMatches = user.password === password;
    }

    if (!passwordMatches) {
      const error = new Error("Credenciales inválidas");
      error.statusCode = 401;
      throw error;
    }

    const isActivo = user.activo !== undefined ? user.activo : (user.active !== false);
    if (!isActivo) {
      const error = new Error("Usuario inactivo");
      error.statusCode = 403;
      throw error;
    }

    const { password: _p, passwordHash: _ph, ...userSinPassword } = user;
    return userSinPassword;
  }
}
