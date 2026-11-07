import bcrypt from "bcrypt";
import UserEntity from "../entity/user.entity.js";
import TiqueteraEntity from "../../tiquetera/entity/tiquetera.entity.js";

function buildResumenRestaurante(restauranteId, precioUnitario = 0) {
  const tiqueteras = restauranteId
    ? TiqueteraEntity.findMany({ restaurante_id: restauranteId })
    : [];
  const pendientes = tiqueteras.filter((t) => t.estado === "PENDIENTE").length;
  const activas = tiqueteras.filter((t) => t.estado === "ACTIVA").length;
  const finalizadas = tiqueteras.filter((t) => t.estado === "FINALIZADA").length;
  const total = tiqueteras.length;
  const precio = Number(precioUnitario || 0);

  return {
    total,
    pendientes,
    activas,
    finalizadas,
    precio_tiquetera: precio,
    valor_estimado_total: total * precio,
    valor_estimado_activas: activas * precio,
    valor_estimado_finalizadas: finalizadas * precio,
  };
}

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
      const resumen_tiqueteras = buildResumenRestaurante(
        titular.restaurante_id,
        titular.precio_tiquetera
      );
      return {
        ...cleanTitular,
        total_equipo: miembrosEquipo,
        resumen_tiqueteras,
      };
    });
  }

  createRestaurante({ name, email, password, precio_tiquetera = 0 }) {
    if (typeof name !== "string" || !name.trim()) {
      throw new Error("El nombre del restaurante es obligatorio");
    }

    if (typeof email !== "string" || !email.includes("@")) {
      throw new Error("El correo electrónico no es válido");
    }

    if (typeof password !== "string" || !password.trim()) {
      throw new Error("La contraseña es obligatoria");
    }

    const precio = Number(precio_tiquetera || 0);
    if (Number.isNaN(precio) || precio < 0) {
      throw new Error("El precio de la tiquetera debe ser un número mayor o igual a 0");
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
      precio_tiquetera: precio,
      active: true,
    });

    const { passwordHash: _ph, password: _p, ...cleanRestaurante } = restauranteUser;
    return {
      ...cleanRestaurante,
      total_equipo: 1,
      resumen_tiqueteras: buildResumenRestaurante(restauranteId, precio),
    };
  }

  updateRestaurante(id, { name, email, password, active, precio_tiquetera } = {}) {
    const titular = UserEntity.findById(id);
    if (!titular || titular.role !== "RESTAURANTE") {
      const error = new Error("Restaurante no encontrado");
      error.status = 404;
      throw error;
    }

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        throw new Error("El nombre del restaurante no puede estar vacío");
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !email.includes("@")) {
        throw new Error("El correo electrónico no es válido");
      }
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== titular.email.toLowerCase()) {
        const existingUser = UserEntity.findByEmail(normalizedEmail);
        if (existingUser && existingUser.id !== titular.id) {
          throw new Error("El correo electrónico ya está en uso por otra cuenta");
        }
        updates.email = normalizedEmail;
      }
    }

    if (password !== undefined && String(password).trim() !== "") {
      updates.passwordHash = bcrypt.hashSync(String(password).trim(), 10);
      updates.password = null;
    }

    if (precio_tiquetera !== undefined) {
      const precio = Number(precio_tiquetera);
      if (Number.isNaN(precio) || precio < 0) {
        throw new Error("El precio de la tiquetera debe ser mayor o igual a 0");
      }
      updates.precio_tiquetera = precio;
    }

    if (active !== undefined) {
      const boolActive = Boolean(active);
      updates.active = boolActive;
      if (titular.restaurante_id) {
        UserEntity.updateActiveByRestauranteId(titular.restaurante_id, boolActive);
      }
    }

    const updated = UserEntity.updateOne(titular.id, updates);
    const allRestUsers = UserEntity.findMany({
      role: "RESTAURANTE",
      restaurante_id: updated.restaurante_id,
    });
    const { passwordHash: _ph, password: _p, ...cleanRestaurante } = updated;

    return {
      ...cleanRestaurante,
      total_equipo: allRestUsers.length || 1,
      resumen_tiqueteras: buildResumenRestaurante(
        updated.restaurante_id,
        updated.precio_tiquetera
      ),
    };
  }

  deleteRestaurante(id) {
    const titular = UserEntity.findById(id);
    if (!titular || titular.role !== "RESTAURANTE") {
      const error = new Error("Restaurante no encontrado");
      error.status = 404;
      throw error;
    }

    UserEntity.deleteRestauranteCascade(titular.restaurante_id, titular.id);
    return {
      mensaje: "Restaurante y todos sus datos asociados eliminados exitosamente",
      id: titular.id,
      restaurante_id: titular.restaurante_id,
    };
  }
}