import { Menu } from "../models/Menu";
import {
  IMenu,
  CreateMenuDto,
  UpdateMenuDto,
} from "../interfaces/menu.interface";
import { Types } from "mongoose";

export class MenuRepository {
  // Buscar todos os menus não deletados
  async findAll(): Promise<IMenu[]> {
    return await Menu.find({ deletedAt: null }).sort({ order: 1 }).exec();
  }

  // Buscar por ID (apenas não deletados)
  async findById(id: string): Promise<IMenu | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return await Menu.findOne({ _id: id, deletedAt: null }).exec();
  }

  // Buscar por parentId (apenas não deletados)
  async findByParentId(parentId: string | null): Promise<IMenu[]> {
    if (parentId && !Types.ObjectId.isValid(parentId)) return [];

    const query = parentId
      ? { parentId: new Types.ObjectId(parentId), deletedAt: null }
      : { parentId: null, deletedAt: null };

    return await Menu.find(query).sort({ order: 1 }).exec();
  }

  // Criar menu
  async create(menuData: CreateMenuDto): Promise<IMenu> {
    const data = {
      ...menuData,
      parentId: menuData.parentId
        ? new Types.ObjectId(menuData.parentId)
        : null,
    };

    const menu = new Menu(data);
    return await menu.save();
  }

  // Atualizar menu
  async update(id: string, menuData: UpdateMenuDto): Promise<IMenu | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const data: any = { ...menuData };
    if (menuData.parentId !== undefined) {
      data.parentId = menuData.parentId
        ? new Types.ObjectId(menuData.parentId)
        : null;
    }

    return await Menu.findOneAndUpdate({ _id: id, deletedAt: null }, data, {
      new: true,
    }).exec();
  }

  // Soft delete
  async softDelete(id: string): Promise<IMenu | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await Menu.findOneAndUpdate(
      { _id: id, deletedAt: null },
      {
        deletedAt: new Date(),
        isActive: false, // Desativa ao deletar
      },
      { new: true }
    ).exec();
  }

  // Restaurar menu
  async restore(id: string): Promise<IMenu | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await Menu.findByIdAndUpdate(
      id,
      { deletedAt: null },
      { new: true }
    ).exec();
  }

  // Ativar/Desativar
  async toggleStatus(id: string, isActive: boolean): Promise<IMenu | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    return await Menu.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { isActive },
      { new: true }
    ).exec();
  }

  // Buscar menus principais não deletados
  async getMainMenus(): Promise<IMenu[]> {
    return await Menu.find({ parentId: null, deletedAt: null })
      .sort({ order: 1 })
      .exec();
  }

  // Buscar menus ativos não deletados
  async getActiveMenus(): Promise<IMenu[]> {
    return await Menu.find({ isActive: true, deletedAt: null })
      .sort({ order: 1 })
      .exec();
  }

  // Buscar menus deletados
  async findDeleted(): Promise<IMenu[]> {
    return await Menu.find({ deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .exec();
  }

  // Verificar se menu tem submenus ativos
  async hasActiveSubmenus(parentId: string): Promise<boolean> {
    const count = await Menu.countDocuments({
      parentId: new Types.ObjectId(parentId),
      deletedAt: null,
    });
    return count > 0;
  }
}
