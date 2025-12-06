import { MenuModel } from "../models/Menu";

export class MenuRepository {
  // 🎯 MÉTODO PRINCIPAL: Busca todos os menus ativos para o cache
  async findAllActive(): Promise<any[]> {
    try {
      console.log("🔍 Buscando menus na collection 'menuitems'...");

      const menus = await MenuModel.find(
        { isActive: true },
        {
          _id: 1,
          title: 1,
          description: 1,
          type: 1,
          parentId: 1,
          order: 1,
          content: 1,
          url: 1,
          payload: 1,
          metadata: 1,
          icon: 1,
          quickReply: 1,
        }
      )
        .sort({ order: 1 })
        .lean();

      console.log(`✅ ${menus.length} menus encontrados`);

      // Debug dos primeiros 3
      if (menus.length > 0) {
        console.log("📋 Primeiros 3 menus:");
        menus.slice(0, 3).forEach((menu) => {
          console.log(`   ${menu.order}. ${menu.title} (${menu.type})`);
        });
      }

      return menus;
    } catch (error: any) {
      console.error("❌ Erro no findAllActive:", error.message);
      throw error;
    }
  }

  // 🎯 Busca um menu específico por ID (para debug)
  async findById(menuId: string): Promise<any | null> {
    try {
      return await MenuModel.findById(menuId).lean();
    } catch (error) {
      console.error("❌ Erro no MenuRepository.findById:", error);
      return null;
    }
  }

  // 🎯 Busca menus raiz (sem parentId)
  async findRootMenus(): Promise<any[]> {
    try {
      return await MenuModel.find(
        { parentId: null, isActive: true },
        { title: 1, order: 1, description: 1, type: 1 }
      )
        .sort({ order: 1 })
        .lean();
    } catch (error) {
      console.error("❌ Erro no MenuRepository.findRootMenus:", error);
      return [];
    }
  }

  // 🎯 Busca submenus de um menu pai
  async findSubmenus(parentId: string): Promise<any[]> {
    try {
      return await MenuModel.find(
        { parentId, isActive: true },
        { title: 1, order: 1, description: 1, type: 1, content: 1, url: 1 }
      )
        .sort({ order: 1 })
        .lean();
    } catch (error) {
      console.error("❌ Erro no MenuRepository.findSubmenus:", error);
      return [];
    }
  }

  // 🎯 Método para estatísticas
  async getStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    rootMenus: number;
    submenus: number;
  }> {
    try {
      const total = await MenuModel.countDocuments({ isActive: true });
      const rootMenus = await MenuModel.countDocuments({
        parentId: null,
        isActive: true,
      });
      const submenus = total - rootMenus;

      // Contagem por tipo
      const typeCounts = await MenuModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$type", count: { $sum: 1 } } },
      ]);

      const byType: Record<string, number> = {};
      typeCounts.forEach((item) => {
        byType[item._id] = item.count;
      });

      return {
        total,
        byType,
        rootMenus,
        submenus,
      };
    } catch (error) {
      console.error("❌ Erro no MenuRepository.getStats:", error);
      return {
        total: 0,
        byType: {},
        rootMenus: 0,
        submenus: 0,
      };
    }
  }

  // 🎯 ADICIONE ESTE MÉTODO:
  async debugCollection(): Promise<void> {
    try {
      console.log("🔍 DEBUG: Verificando collection 'menuitems'...");

      // Conta total
      const total = await MenuModel.countDocuments();
      console.log(`📊 Total documentos: ${total}`);

      // Conta ativos
      const active = await MenuModel.countDocuments({ isActive: true });
      console.log(`📊 Menus ativos: ${active}`);

      // Mostra alguns exemplos
      if (total > 0) {
        const samples = await MenuModel.find({})
          .limit(3)
          .sort({ order: 1 })
          .lean();

        console.log("\n📋 Amostra de documentos:");
        samples.forEach((doc, i) => {
          console.log(`   ${i + 1}. ${doc.order}. ${doc.title} (${doc.type})`);
          console.log(`      ID: ${doc._id}`);
          console.log(`      Parent: ${doc.parentId || "Raiz"}`);
        });
      }
    } catch (error) {
      console.error("❌ Erro no debug:", error);
    }
  }
}

export const menuRepository = new MenuRepository();
