const users = [];

export default class UserEntity {
  static findMany() {
    return users;
  }
  static createOne(data) {
    const user = { id: Date.now(), ...data };
    users.push(user);
    return user;
  }
}