import { faker } from "@faker-js/faker";
import { createUser } from "../controllers/userController.js";

function generateRandomUser() {
  const password = "12345678";
  return {
    email: faker.internet.email(),
    password,
    confirm_password: password,
    name: faker.person.firstName() + " " + faker.person.lastName(),
    phone: faker.phone.number(),
    role: faker.helpers.arrayElement([
      "Kepala Desa",
      "Sekretaris Desa",
      "Bendahara Desa",
      "Kepala Dusun",
      "Kasi Pemerintahan",
      "Kasi Kesejahteraan",
      "Kasi Pelayanan",
    ]),
    imagePath: faker.image.avatar(),
  };
}

async function createFakeUser(user) {
  const imageBuffer = Buffer.from(
    await (await fetch(user.imagePath)).arrayBuffer()
  );
  const imageFile = {
    buffer: imageBuffer,
    mimetype: "image/jpeg",
  };

  const req = {
    body: user,
    file: imageFile,
  };

  const res = {
    status: (code) => ({
      send: (data) => { },
    }),
  };

  try {
    await createUser(req, res);
  } catch (error) {
    console.error("Error creating user:", error);
  }
}

async function generateAndInsertFakeUsers() {
  for (let i = 0; i < 3; i++) {
    const user = generateRandomUser();
    await createFakeUser(user);
  }
}

generateAndInsertFakeUsers()
  .then(() => {
    console.log("Fake user generation completed.");
  })
  .catch((error) => {
    console.error("Error in fake user generation:", error);
  });
