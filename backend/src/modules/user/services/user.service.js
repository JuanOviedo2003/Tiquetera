import bcrypt from "bcrypt";
import UserEntity from "../entity/user.entity.js";

export class UsersService {
  findAllUsers() {
  return UserEntity.findMany().map((user) => {
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

  createUser(name, email, password) {
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

    const existingUser = UserEntity.findMany().find(
      (user) => user.email === normalizedEmail
    );

    if (existingUser) {
      throw new Error("El email ya está registrado");
    }
    // convierte la contraseña original en un hash.
    const passwordHash = bcrypt.hashSync(password, 10);

    const user = UserEntity.createOne({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "RESTAURANTE",
      active: true,
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  }
}