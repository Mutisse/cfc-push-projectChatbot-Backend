import { Request, Response } from 'express';
import { MenuService } from '../services/menuService';
import { CreateMenuDto, UpdateMenuDto } from '../interfaces/menu.interface';
import { MenuMapper } from '../utils/menuMapper';

export class MenuController {
  private menuService: MenuService;

  constructor() {
    this.menuService = new MenuService();
  }

  // Buscar todos os menus
  getAllMenus = async (req: Request, res: Response): Promise<void> => {
    try {
      const menus = await this.menuService.getAllMenus();
      res.status(200).json({
        success: true,
        data: MenuMapper.toResponseArray(menus),
        message: 'Menus recuperados com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  };

  // Buscar menu por ID
  getMenuById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const menu = await this.menuService.getMenuById(id);
      
      if (!menu) {
        res.status(404).json({
          success: false,
          message: 'Menu não encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: MenuMapper.toResponse(menu),
        message: 'Menu recuperado com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  };

  // Criar novo menu
  createMenu = async (req: Request, res: Response): Promise<void> => {
    try {
      const menuData: CreateMenuDto = req.body;
      const newMenu = await this.menuService.createMenu(menuData);
      
      res.status(201).json({
        success: true,
        data: MenuMapper.toResponse(newMenu),
        message: 'Menu criado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao criar menu'
      });
    }
  };

  // Atualizar menu
  updateMenu = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const menuData: UpdateMenuDto = req.body;
      const updatedMenu = await this.menuService.updateMenu(id, menuData);
      
      if (!updatedMenu) {
        res.status(404).json({
          success: false,
          message: 'Menu não encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: MenuMapper.toResponse(updatedMenu),
        message: 'Menu atualizado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao atualizar menu'
      });
    }
  };

  // Soft delete
  deleteMenu = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deletedMenu = await this.menuService.deleteMenu(id);
      
      if (!deletedMenu) {
        res.status(404).json({
          success: false,
          message: 'Menu não encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: MenuMapper.toResponse(deletedMenu),
        message: 'Menu excluído com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao excluir menu'
      });
    }
  };

  // Restaurar menu
  restoreMenu = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const restoredMenu = await this.menuService.restoreMenu(id);
      
      if (!restoredMenu) {
        res.status(404).json({
          success: false,
          message: 'Menu não encontrado ou não está deletado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: MenuMapper.toResponse(restoredMenu),
        message: 'Menu restaurado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao restaurar menu'
      });
    }
  };

  // Buscar menus deletados
  getDeletedMenus = async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedMenus = await this.menuService.getDeletedMenus();
      
      res.status(200).json({
        success: true,
        data: MenuMapper.toResponseArray(deletedMenus),
        message: 'Menus deletados recuperados com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  };

  // Ativar/Desativar menu
  toggleMenuStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const updatedMenu = await this.menuService.toggleMenuStatus(id, isActive);
      
      if (!updatedMenu) {
        res.status(404).json({
          success: false,
          message: 'Menu não encontrado'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: MenuMapper.toResponse(updatedMenu),
        message: `Menu ${isActive ? 'ativado' : 'desativado'} com sucesso`
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao alterar status do menu'
      });
    }
  };

  // Buscar menus principais
  getMainMenus = async (req: Request, res: Response): Promise<void> => {
    try {
      const mainMenus = await this.menuService.getMainMenus();
      res.status(200).json({
        success: true,
        data: MenuMapper.toResponseArray(mainMenus),
        message: 'Menus principais recuperados com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  };

  // Buscar submenus
  getSubmenus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { parentId } = req.params;
      const submenus = await this.menuService.getSubmenus(parentId);
      res.status(200).json({
        success: true,
        data: MenuMapper.toResponseArray(submenus),
        message: 'Submenus recuperados com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao buscar submenus'
      });
    }
  };
}