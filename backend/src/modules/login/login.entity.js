const users = [
  {
    id: 1,
    nombre: "Restaurante Demo",
    email: "prueba@gmail.com",
    password: "1234",
    rol: "RESTAURANTE",
    activo: true,
  },
  {
    id: 2,
    nombre: "Cocina Central",
    email: "cocina@tiquetera.com",
    password: "cocina123",
    rol: "RESTAURANTE",
    activo: true,
  },
];

export default class LoginEntity {
  static findByEmail(email) {
    return users.find((user) => user.email === email);
  }

  static findMany() {
    return users;
  }
}
