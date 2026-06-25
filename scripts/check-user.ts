import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const u = await p.user.findFirst({ where: { email: "test@opcwc.com" } });
  if (u) {
    console.log("✅ 测试账号存在");
    console.log("   邮箱: test@opcwc.com");
    console.log("   密码: test123456");
    console.log("   昵称:", u.name);
  } else {
    console.log("❌ 测试账号不存在，正在创建...");
    await p.user.create({
      data: {
        name: "测试用户",
        email: "test@opcwc.com",
        accounts: {
          create: {
            type: "credentials",
            provider: "credentials",
            providerAccountId: "test@opcwc.com",
            access_token: "$2a$12$LJ3m4ys3GZfnYMz8kVsKaOTSJFHGLf2PyGQKzGGHXz2YQfVPvEPTu", // test123456
          },
        },
      },
    });
    console.log("✅ 测试账号已创建: test@opcwc.com / test123456");
  }
  await p.$disconnect();
}
main();
