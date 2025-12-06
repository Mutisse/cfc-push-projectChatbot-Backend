import { Service, IService } from '../models/Service';

export interface ServiceFilters {
  status?: string;
  type?: string;
  environment?: string;
  search?: string;
}

export class ServiceRepository {
  async findAll(
    filters: ServiceFilters = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ services: IService[]; total: number }> {
    const query: any = {};

    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.environment) query.environment = filters.environment;
    
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      Service.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Service.countDocuments(query)
    ]);

    return { services, total };
  }

  async findById(id: string): Promise<IService | null> {
    return Service.findById(id).lean();
  }

  async findByName(name: string): Promise<IService | null> {
    return Service.findOne({ name }).lean();
  }

  async create(serviceData: Partial<IService>): Promise<IService> {
    const service = new Service(serviceData);
    return service.save();
  }

  async update(id: string, serviceData: Partial<IService>): Promise<IService | null> {
    return Service.findByIdAndUpdate(id, serviceData, { new: true }).lean();
  }

  async delete(id: string): Promise<boolean> {
    const result = await Service.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async updateStatus(id: string, status: IService['status']): Promise<IService | null> {
    return Service.findByIdAndUpdate(
      id,
      { 
        status,
        lastCheck: new Date()
      },
      { new: true }
    ).lean();
  }

  async getSummary(): Promise<{
    total: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
    byType: Record<string, number>;
  }> {
    const [total, healthy, unhealthy, unknown] = await Promise.all([
      Service.countDocuments(),
      Service.countDocuments({ status: 'healthy' }),
      Service.countDocuments({ status: 'unhealthy' }),
      Service.countDocuments({ status: 'unknown' })
    ]);

    const typeStats = await Service.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const byType = typeStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    return { total, healthy, unhealthy, unknown, byType };
  }

  async getAllHealthy(): Promise<IService[]> {
    return Service.find({ status: 'healthy' }).lean();
  }

  async getServicesHealth(): Promise<Array<{
    service: IService;
    lastCheck: Date;
    responseTime?: number;
  }>> {
    const services = await Service.find().lean();
    
    // Simulate health checks (in real app, you'd ping the services)
    return services.map(service => ({
      service,
      lastCheck: service.lastCheck,
      responseTime: Math.random() * 1000 // Mock response time
    }));
  }

  async bulkUpdateStatus(serviceIds: string[], status: IService['status']): Promise<number> {
    const result = await Service.updateMany(
      { _id: { $in: serviceIds } },
      { 
        status,
        lastCheck: new Date()
      }
    );
    return result.modifiedCount;
  }
}