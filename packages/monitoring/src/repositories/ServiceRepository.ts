// packages/monitoring/src/repositories/ServiceRepository.ts
import { ServiceModel, IService } from "../models/ServiceModel";

export interface ServiceFilters {
  status?: string;
  type?: string;
  environment?: string;
  category?: string;
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export class ServiceRepository {
  /**
   * Busca todos os serviços com filtros e paginação
   */
  async findAll(
    filters: ServiceFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ services: IService[]; total: number }> {
    try {
      const query: any = {};

      // Aplica filtros
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.type) {
        query.type = filters.type;
      }
      if (filters.environment) {
        query.environment = filters.environment;
      }
      if (filters.category) {
        query.category = filters.category;
      }
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: "i" } },
          { displayName: { $regex: filters.search, $options: "i" } },
          { description: { $regex: filters.search, $options: "i" } },
          { url: { $regex: filters.search, $options: "i" } },
        ];
      }
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      // Calcula paginação
      const skip = (page - 1) * limit;

      // Executa consulta
      const [services, total] = await Promise.all([
        ServiceModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        ServiceModel.countDocuments(query),
      ]);

      return {
        services,
        total,
      };
    } catch (error) {
      console.error("Error finding services:", error);
      return { services: [], total: 0 };
    }
  }

  /**
   * Busca serviço por ID
   */
  async findById(id: string): Promise<IService | null> {
    try {
      return await ServiceModel.findById(id).lean();
    } catch (error) {
      console.error("Error finding service by ID:", error);
      return null;
    }
  }

  /**
   * Busca serviço por nome
   */
  async findByName(name: string): Promise<IService | null> {
    try {
      return await ServiceModel.findOne({ name }).lean();
    } catch (error) {
      console.error("Error finding service by name:", error);
      return null;
    }
  }

  /**
   * Busca serviço por URL
   */
  async findByUrl(url: string): Promise<IService | null> {
    try {
      return await ServiceModel.findOne({ url }).lean();
    } catch (error) {
      console.error("Error finding service by URL:", error);
      return null;
    }
  }

  /**
   * Cria um novo serviço
   */
  async create(serviceData: Partial<IService>): Promise<IService> {
    try {
      const service = new ServiceModel(serviceData);
      return await service.save();
    } catch (error) {
      console.error("Error creating service:", error);
      throw error;
    }
  }

  /**
   * Atualiza um serviço existente
   */
  async update(
    id: string,
    serviceData: Partial<IService>
  ): Promise<IService | null> {
    try {
      return await ServiceModel.findByIdAndUpdate(
        id,
        {
          ...serviceData,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      ).lean();
    } catch (error) {
      console.error("Error updating service:", error);
      return null;
    }
  }

  /**
   * Deleta um serviço
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await ServiceModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      console.error("Error deleting service:", error);
      return false;
    }
  }

  /**
   * Atualiza apenas o status de um serviço
   */
  async updateStatus(id: string, status: IService["status"]): Promise<boolean> {
    try {
      const result = await ServiceModel.findByIdAndUpdate(id, {
        status,
        lastHealthCheck: new Date(),
        updatedAt: new Date(),
      });
      return !!result;
    } catch (error) {
      console.error("Error updating service status:", error);
      return false;
    }
  }

  /**
   * Atualiza métricas de um serviço
   */
  async updateMetrics(
    id: string,
    responseTime: number,
    isSuccess: boolean
  ): Promise<boolean> {
    try {
      const service = await ServiceModel.findById(id);
      if (!service) return false;

      service.updateMetrics(responseTime, isSuccess);
      await service.save();

      return true;
    } catch (error) {
      console.error("Error updating service metrics:", error);
      return false;
    }
  }

  /**
   * Obtém resumo estatístico dos serviços
   */
  async getSummary(): Promise<{
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    stopped: number;
    unknown: number;
    byType: Record<string, number>;
    byEnvironment: Record<string, number>;
    avgUptime: number;
    avgResponseTime: number;
  }> {
    try {
      const services = await ServiceModel.find({}).lean();

      const summary = {
        total: services.length,
        healthy: services.filter((s) => s.status === "healthy").length,
        degraded: services.filter((s) => s.status === "degraded").length,
        unhealthy: services.filter((s) => s.status === "unhealthy").length,
        stopped: services.filter((s) => s.status === "stopped").length,
        unknown: services.filter((s) => s.status === "unknown").length,
        byType: {} as Record<string, number>,
        byEnvironment: {} as Record<string, number>,
        avgUptime: 0,
        avgResponseTime: 0,
      };

      // Calcula por tipo e ambiente
      let totalUptime = 0;
      let totalResponseTime = 0;
      let metricsCount = 0;

      services.forEach((service) => {
        // Contagem por tipo
        summary.byType[service.type] = (summary.byType[service.type] || 0) + 1;

        // Contagem por ambiente
        summary.byEnvironment[service.environment] =
          (summary.byEnvironment[service.environment] || 0) + 1;

        // Acumula métricas
        if (service.metrics) {
          totalUptime += service.metrics.uptime || 0;
          totalResponseTime += service.metrics.responseTime || 0;
          metricsCount++;
        }
      });

      // Calcula médias
      summary.avgUptime = metricsCount > 0 ? totalUptime / metricsCount : 0;
      summary.avgResponseTime =
        metricsCount > 0 ? totalResponseTime / metricsCount : 0;

      return summary;
    } catch (error) {
      console.error("Error getting services summary:", error);
      return {
        total: 0,
        healthy: 0,
        degraded: 0,
        unhealthy: 0,
        stopped: 0,
        unknown: 0,
        byType: {},
        byEnvironment: {},
        avgUptime: 0,
        avgResponseTime: 0,
      };
    }
  }

  /**
   * Busca serviços por proxyService
   */
  async findByProxyService(proxyService: string): Promise<IService[]> {
    try {
      return await ServiceModel.find({
        "metadata.proxyService": proxyService,
      }).lean();
    } catch (error) {
      console.error("Error finding services by proxyService:", error);
      return [];
    }
  }

  /**
   * Verifica se um serviço com a URL já existe
   */
  async existsByUrl(url: string): Promise<boolean> {
    try {
      const count = await ServiceModel.countDocuments({ url });
      return count > 0;
    } catch (error) {
      console.error("Error checking if service exists by URL:", error);
      return false;
    }
  }

  /**
   * Atualiza múltiplos serviços de uma vez
   */
  async bulkUpdate(
    updates: Array<{ id: string; data: Partial<IService> }>
  ): Promise<number> {
    try {
      const bulkOps = updates.map((update) => ({
        updateOne: {
          filter: { _id: update.id },
          update: {
            $set: {
              ...update.data,
              updatedAt: new Date(),
            },
          },
        },
      }));

      const result = await ServiceModel.bulkWrite(bulkOps);
      return result.modifiedCount;
    } catch (error) {
      console.error("Error in bulk update:", error);
      return 0;
    }
  }
}

// Export singleton
export default new ServiceRepository();
