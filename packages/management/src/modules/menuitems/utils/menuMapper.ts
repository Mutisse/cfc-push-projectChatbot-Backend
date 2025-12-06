import { IMenu } from "../interfaces/menu.interface";
import { MenuResponse } from "../interfaces/menu.interface";

export class MenuMapper {
  static toResponse(menu: IMenu): MenuResponse {
    return {
      _id: menu._id.toString(),
      title: menu.title,
      description: menu.description,
      type: menu.type,
      parentId: menu.parentId ? menu.parentId.toString() : null,
      order: menu.order,
      isActive: menu.isActive,
      requiredRole: menu.requiredRole,
      icon: menu.icon,
      quickReply: menu.quickReply,
      content: menu.content,
      url: menu.url,
      payload: menu.payload,
      keywords: menu.keywords,
      metadata: menu.metadata,
      deletedAt: menu.deletedAt ? menu.deletedAt.toISOString() : null, // ← NOVO
      __v: menu.__v,
      createdAt: menu.createdAt.toISOString(),
      updatedAt: menu.updatedAt.toISOString(),
    };
  }

  static toResponseArray(menus: IMenu[]): MenuResponse[] {
    return menus.map((menu) => this.toResponse(menu));
  }
}
