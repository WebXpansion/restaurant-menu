import bcrypt from "bcrypt";

// Hasher le mot de passe "123456" avec un sel de 12
bcrypt.hash("123456", 12).then(console.log);