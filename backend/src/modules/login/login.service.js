import UserEntity from "../entity/user.entity.js";


export class LoginService {
  loginByPassword(email) {
    return UserEntity.findMany();
  }

  loginByPin(name, email) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('El nombre es obligatorio');
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      throw new Error('El email no es válido');
    }

    return UserEntity.createOne({
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });
  }
}