const users = [
    {
        email: "prueba@gmail.com",
        password: "1234"
    }
];

export default class LoginEntity {
  static find_user(email) {
    return users.find( (user) => {user.email == email} );
  }
}