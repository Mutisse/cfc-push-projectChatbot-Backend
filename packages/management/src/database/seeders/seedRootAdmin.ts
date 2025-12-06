// src/database/seeders/seedRootAdmin.ts
import { UserService } from "../../modules/people/users/Service/userService";

export class RootAdminSeeder {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async seedRootAdmin(): Promise<void> {
    try {
      console.log("🔍 Verificando se admin root já existe...");

      const existingAdmin = await this.userService.getUsers(1, 1, {
        role: "super_admin",
      });

      if (existingAdmin.total > 0) {
        console.log("✅ Admin root já existe. Seed não necessário.");
        return;
      }

      console.log("🌱 Criando admin root...");

      const rootAdminData = {
        phoneNumber: "847001234", // ✅ NÚMERO DE MISSÕES/EMERGÊNCIA
        email: "admin@cfcpush.org",
        password: "AdminRoot123!",
        gender: "male" as const,
        role: "super_admin" as const,
      };

      const rootAdmin = await this.userService.createUser(rootAdminData);

      console.log("🎉 ADMIN ROOT CRIADO COM SUCESSO!");
      console.log("📋 DETALHES:");
      console.log(`   📱 Telefone (Missões): ${rootAdmin.phoneNumber}`);
      console.log(`   📧 Email: ${rootAdmin.email}`);
      console.log(`   🔐 Password: ${rootAdminData.password}`);
      console.log(`   🎭 Role: ${rootAdmin.role}`);
      console.log("⚠️  GUARDE ESTAS CREDENCIAIS EM LOCAL SEGURO!");
      console.log("🚨 ESTE É O USUÁRIO DE EMERGÊNCIA/MISSÕES!");
    } catch (error) {
      console.error("❌ Erro ao criar admin root:", error);
      throw error;
    }
  }
}