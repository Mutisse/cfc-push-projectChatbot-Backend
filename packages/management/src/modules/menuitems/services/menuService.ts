import { MenuRepository } from '../repositories/menuRepository';
import { IMenu, CreateMenuDto, UpdateMenuDto } from '../interfaces/menu.interface';

export class MenuService {
  private menuRepository: MenuRepository;

  constructor() {
    this.menuRepository = new MenuRepository();
  }

  async getAllMenus(): Promise<IMenu[]> {
    return await this.menuRepository.findAll();
  }

  async getMenuById(id: string): Promise<IMenu | null> {
    if (!id) throw new Error('ID do menu é obrigatório');
    return await this.menuRepository.findById(id);
  }

  async createMenu(menuData: CreateMenuDto): Promise<IMenu> {
    if (!menuData.title || !menuData.description) {
      throw new Error('Título e descrição são obrigatórios');
    }

    // Se for submenu, verificar se o parent existe
    if (menuData.parentId) {
      const parentMenu = await this.menuRepository.findById(menuData.parentId);
      if (!parentMenu) throw new Error('Menu pai não encontrado');
    }

    return await this.menuRepository.create(menuData);
  }

  async updateMenu(id: string, menuData: UpdateMenuDto): Promise<IMenu | null> {
    if (!id) throw new Error('ID do menu é obrigatório');

    const existingMenu = await this.menuRepository.findById(id);
    if (!existingMenu) throw new Error('Menu não encontrado');

    return await this.menuRepository.update(id, menuData);
  }

  // NOVO: Soft delete
  async deleteMenu(id: string): Promise<IMenu | null> {
    if (!id) throw new Error('ID do menu é obrigatório');

    const existingMenu = await this.menuRepository.findById(id);
    if (!existingMenu) throw new Error('Menu não encontrado');

    // Verificar se o menu tem submenus antes de deletar
    const hasSubmenus = await this.menuRepository.hasActiveSubmenus(id);
    if (hasSubmenus) {
      throw new Error('Não é possível excluir um menu que possui submenus ativos');
    }

    return await this.menuRepository.softDelete(id);
  }

  // NOVO: Restaurar menu
  async restoreMenu(id: string): Promise<IMenu | null> {
    if (!id) throw new Error('ID do menu é obrigatório');

    const existingMenu = await this.menuRepository.findDeleted().then(deleted => 
      deleted.find(menu => menu._id.toString() === id)
    );
    
    if (!existingMenu) throw new Error('Menu não encontrado');
    if (!existingMenu.deletedAt) throw new Error('Menu não está deletado');

    return await this.menuRepository.restore(id);
  }

  async toggleMenuStatus(id: string, isActive: boolean): Promise<IMenu | null> {
    if (!id) throw new Error('ID do menu é obrigatório');

    const existingMenu = await this.menuRepository.findById(id);
    if (!existingMenu) throw new Error('Menu não encontrado');

    return await this.menuRepository.toggleStatus(id, isActive);
  }

  async getMainMenus(): Promise<IMenu[]> {
    return await this.menuRepository.getMainMenus();
  }

  async getSubmenus(parentId: string): Promise<IMenu[]> {
    if (!parentId) throw new Error('ID do menu pai é obrigatório');

    const parentMenu = await this.menuRepository.findById(parentId);
    if (!parentMenu) throw new Error('Menu pai não encontrado');

    return await this.menuRepository.findByParentId(parentId);
  }

  async getActiveMenus(): Promise<IMenu[]> {
    return await this.menuRepository.getActiveMenus();
  }

  // NOVO: Buscar menus deletados
  async getDeletedMenus(): Promise<IMenu[]> {
    return await this.menuRepository.findDeleted();
  }
}