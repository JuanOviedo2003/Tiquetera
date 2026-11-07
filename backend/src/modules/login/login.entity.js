import UserEntity from "../user/entity/user.entity.js";

const seedUsers = [
  {
    id: 0,
    nombre: "Superusuario",
    name: "Superusuario",
    email: "admin@tiquetera.com",
    password: "admin123",
    rol: "SUPER_ADMIN",
    role: "SUPER_ADMIN",
    restaurante_id: null,
    es_titular: false,
    activo: true,
  },
  {
    id: 1,
    nombre: "Restaurante Demo",
    name: "Restaurante Demo",
    email: "prueba@gmail.com",
    password: "1234",
    rol: "RESTAURANTE",
    role: "RESTAURANTE",
    restaurante_id: "REST-1",
    es_titular: true,
    activo: true,
  },
  {
    id: 2,
    nombre: "Cocina Central",
    name: "Cocina Central",
    email: "cocina@tiquetera.com",
    password: "cocina123",
    rol: "RESTAURANTE",
    role: "RESTAURANTE",
    restaurante_id: "REST-1",
    es_titular: false,
    activo: true,
  },
];

export default class LoginEntity {
  static findByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    const userFromUserEntity = UserEntity.findByEmail(normalized);
    if (userFromUserEntity) {
      return userFromUserEntity;
    }
    return seedUsers.find((user) => user.email === normalized) || null;
  }

  static findMany() {
    return [...seedUsers, ...UserEntity.findMany()];
  }
}
