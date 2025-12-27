import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const auth = await import("./lib/auth").then(mod => mod.auth);
  const rootEmail = process.env.ROOT_ACCOUNT;
  const rootPassword = process.env.ROOT_PASSWORD;
  if (!rootEmail || !rootPassword) {
    console.warn("ROOT_ACCOUNT or ROOT_PASSWORD is not set in environment variables.");
    return;
  }
  const context = await auth.$context;
  const internalAdapter = context.internalAdapter;
  const result = await internalAdapter.findUserByEmail(rootEmail);
  if (!result) {
    const user = await internalAdapter.createUser({ 
      name: "Root",
      email: rootEmail,
      role: "admin",
      emailVerified: true
    });
    await internalAdapter.linkAccount({
      accountId: user.id,
      providerId: "credential",
      password: await context.password.hash(rootPassword),
      userId: user.id,
    });
    console.log(`Root admin account created with email: ${rootEmail}`);
  } else {
    console.log(`Root admin account with email: ${rootEmail} already exists.`);
    return;
  }
}

try {
  await seed();
} catch (error) {
  console.error("Error seeding database:", error);
}