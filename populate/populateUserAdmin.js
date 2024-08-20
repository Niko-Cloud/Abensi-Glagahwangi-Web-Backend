import { createUser } from "../controllers/userController.js";

function generateAdmin() {
    const password = "admin123"
    return {
        email: "admin@admin.com",
        password,
        confirm_password: password,
        name: "admin",
        phone: "",
        role: "admin",
        alamat: "",
        imagePath: "https://picsum.photos/200/300",
    };
}

async function createAdmin(user) {
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

async function generateAndInsertAdmin() {
    const user = generateAdmin();
    await createAdmin(user);
}

generateAndInsertAdmin()
    .then(() => {
        console.log("Admin making completed.");
    })
    .catch((error) => {
        console.error("Admin making error:", error);
    });