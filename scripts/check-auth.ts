import { db } from "../src/lib/db.js";
import bcrypt from "bcryptjs";

async function main() {
  const email = "test@opcwc.com";
  const password = "test123456";

  const user = await db.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  console.log("User found:", !!user);
  if (user) {
    console.log("User id:", user.id);
    console.log("User name:", user.name);
    console.log("Accounts count:", user.accounts.length);
    
    const credAccount = user.accounts.find(a => a.provider === "credentials");
    console.log("Cred account found:", !!credAccount);
    if (credAccount?.access_token) {
      const valid = await bcrypt.compare(password, credAccount.access_token);
      console.log("Password valid:", valid);
    }
  }

  await db.$disconnect();
}

main();
