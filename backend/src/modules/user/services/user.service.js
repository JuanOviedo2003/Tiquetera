import bcrypt from "bcrypt";
import UserEntity from "../entity/user.entity.js";

export class UsersService {
  findAllUsers(filters = {}) {
    const queryFilters = { role: "RESTAURANTE" };
    if (filters.restaurante_id) {
      queryFilters.restaurante_id = filters.restaurante_id;
    }

    return UserEntity.findMany(queryFilters).map((user) => {
      const { passwordHash: _ph, password: _p, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  createUser(name, email, password, restaurante_id = "REST-1") {
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("El nombre es obligatorio");
    }

    if (typeof email !== "string" || !email.includes("@")) {
      throw new Error("El email no es válido");
    }

    if (typeof password !== "string" || !password.trim()) {
      throw new Error("La contraseña es obligatoria");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = UserEntity.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error("El email ya está registrado");
    }

    // Convierte la contraseña original en un hash
    const passwordHash = bcrypt.hashSync(password, 10);

    const user = UserEntity.createOne({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "RESTAURANTE",
      restaurante_id: restaurante_id || "REST-1",
      es_titular: false,
      active: true,
    });

    const { passwordHash: _ph, password: _p, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  findAllRestaurantes() {
    const allRestUsers = UserEntity.findMany({ role: "RESTAURANTE" });
    const titulares = allRestUsers.filter((u) => u.es_titular);

    return titulares.map((titular) => {
      const { passwordHash: _ph, password: _p, ...cleanTitular } = titular;
      const miembrosEquipo = allRestUsers.filter(
        (u) => u.restaurante_id === titular.restaurante_id
      ).length;
      return {
        ...cleanTitular,
        total_equipo: miembrosEquipo,
      };
    });
  }

  createRestaurante({ name, email, password }) {
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("El nombre del restaurante es obligatorio");
    }

    if (typeof email !== "string" || !email.includes("@")) {
      throw new Error("El correo electrónico no es válido");
    }

    if (typeof password !== "string" || !password.trim()) {
      throw new Error("La contraseña es obligatoria");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = UserEntity.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new Error("El correo electrónico ya está registrado");
    }

    const restauranteId = `REST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const passwordHash = bcrypt.hashSync(password, 10);

    const restauranteUser = UserEntity.createOne({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "RESTAURANTE",
      restaurante_id: restauranteId,
      es_titular: true,
      active: true,
    });

    const { passwordHash: _ph, password: _p, ...cleanRestaurante } = restauranteUser;
    return {
      ...cleanRestaurante,
      total_equipo: 1,
    };
  }
}