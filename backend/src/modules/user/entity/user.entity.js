let users = [];

export default class UserEntity {
  static findMany() {
    return users;
  }

  static findById(id) {
    return users.find((u) => String(u.id) === String(id)) || null;
  }

  static findByEmail(email) {
    if (!email) return null;
    const normalized = email.trim().toLowerCase();
    return users.find((u) => u.email && u.email.toLowerCase() === normalized) || null;
  }

  static createOne(data) {
    const user = { id: data.id || Date.now(), ...data };
    users.push(user);
    return user;
  }

  static clearAll() {
    users = [];
  }
}