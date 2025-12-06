import { MemberRepository } from '../repositories/memberRepository';
import { IMemberRegistration, CreateMemberRegistrationDto, UpdateMemberRegistrationDto } from '../interfaces/member-registration.interface';

export class MemberService {
  private memberRegistrationRepository: MemberRepository;

  constructor() {
    this.memberRegistrationRepository = new MemberRepository();
  }

  // Buscar todos os registros
  async getAllRegistrations(
    filters: { status?: string; source?: string } = {},
    page: number = 1,
    limit: number = 10
  ) {
    return await this.memberRegistrationRepository.findAll(filters, page, limit);
  }

  // Buscar registro por ID
  async getRegistrationById(id: string): Promise<IMemberRegistration | null> {
    if (!id) throw new Error('ID do registro é obrigatório');
    return await this.memberRegistrationRepository.findById(id);
  }

  // Buscar registro por número de telefone
  async getRegistrationByPhone(phoneNumber: string): Promise<IMemberRegistration | null> {
    if (!phoneNumber) throw new Error('Número de telefone é obrigatório');

    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');

    if (cleanPhoneNumber.length < 9) {
      throw new Error('Número de telefone deve ter pelo menos 9 dígitos');
    }

    const validPrefixes = ['82', '83', '84', '85', '86', '87'];
    const prefix = cleanPhoneNumber.substring(0, 2);
    if (!validPrefixes.includes(prefix)) {
      throw new Error('Número de telefone deve começar com 82, 83, 84, 85, 86 ou 87');
    }

    return await this.memberRegistrationRepository.findByPhone(cleanPhoneNumber);
  }

  // Buscar registros pendentes
  async getPendingRegistrations(): Promise<IMemberRegistration[]> {
    return await this.memberRegistrationRepository.findPending();
  }

  // Criar novo registro
  async createRegistration(registrationData: CreateMemberRegistrationDto): Promise<IMemberRegistration> {
    if (!registrationData.fullName || !registrationData.phoneNumber) {
      throw new Error('Nome completo e telefone são obrigatórios');
    }

    const isRegistered = await this.memberRegistrationRepository.isPhoneNumberRegistered(registrationData.phoneNumber);
    if (isRegistered) {
      throw new Error('Já existe um registro com este número de telefone');
    }

    const birthDate = new Date(registrationData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 16) {
      throw new Error('É necessário ter pelo menos 16 anos para se registrar');
    }

    if (age > 100) {
      throw new Error('Data de nascimento inválida');
    }

    return await this.memberRegistrationRepository.create(registrationData);
  }

  // Atualizar registro
  async updateRegistration(id: string, updateData: UpdateMemberRegistrationDto): Promise<IMemberRegistration | null> {
    if (!id) throw new Error('ID do registro é obrigatório');

    const existingRegistration = await this.memberRegistrationRepository.findById(id);
    if (!existingRegistration) {
      throw new Error('Registro não encontrado');
    }

    if (existingRegistration.status !== 'pending' && existingRegistration.status !== 'cancelled') {
      throw new Error('Não é possível alterar um registro já processado');
    }

    return await this.memberRegistrationRepository.update(id, updateData);
  }

  // ✅ CORRIGIDO: Aprovar registro
  async approveRegistration(id: string, approvedBy: string): Promise<IMemberRegistration | null> {
    if (!id) throw new Error('ID do registro é obrigatório');
    
    // ✅ VALIDAÇÃO ADICIONAL: Se approvedBy não veio, usar "admin" como padrão
    const approver = approvedBy || "admin";

    const existingRegistration = await this.memberRegistrationRepository.findById(id);
    if (!existingRegistration) {
      throw new Error('Registro não encontrado');
    }

    if (existingRegistration.status !== 'pending') {
      throw new Error('Apenas registros pendentes podem ser aprovados');
    }

    return await this.memberRegistrationRepository.approve(id, approver);
  }

  // Rejeitar registro
  async rejectRegistration(id: string, rejectionReason: string): Promise<IMemberRegistration | null> {
    if (!id) throw new Error('ID do registro é obrigatório');
    if (!rejectionReason) throw new Error('Motivo da rejeição é obrigatório');

    const existingRegistration = await this.memberRegistrationRepository.findById(id);
    if (!existingRegistration) {
      throw new Error('Registro não encontrado');
    }

    if (existingRegistration.status !== 'pending') {
      throw new Error('Apenas registros pendentes podem ser rejeitados');
    }

    return await this.memberRegistrationRepository.reject(id, rejectionReason);
  }

  // Cancelar registro
  async cancelRegistration(id: string): Promise<IMemberRegistration | null> {
    if (!id) throw new Error('ID do registro é obrigatório');

    const existingRegistration = await this.memberRegistrationRepository.findById(id);
    if (!existingRegistration) {
      throw new Error('Registro não encontrado');
    }

    if (existingRegistration.status !== 'pending') {
      throw new Error('Apenas registros pendentes podem ser cancelados');
    }

    return await this.memberRegistrationRepository.cancel(id);
  }

  // Soft Delete
  async softDeleteRegistration(id: string): Promise<IMemberRegistration | null> {
    if (!id) throw new Error('ID do registro é obrigatório');

    const existingRegistration = await this.memberRegistrationRepository.findByIdIncludingDeleted(id);
    if (!existingRegistration) {
      throw new Error('Registro não encontrado');
    }

    return await this.memberRegistrationRepository.softDelete(id);
  }

  // Restaurar registro
  async restoreRegistration(id: string): Promise<IMemberRegistration | null> {
    if (!id) throw new Error('ID do registro é obrigatório');

    const existingRegistration = await this.memberRegistrationRepository.findByIdIncludingDeleted(id);
    if (!existingRegistration) {
      throw new Error('Registro não encontrado');
    }

    if (!existingRegistration.deletedAt) {
      throw new Error('Registro não está deletado');
    }

    return await this.memberRegistrationRepository.restore(id);
  }

  // Hard Delete
  async hardDeleteRegistration(id: string): Promise<boolean> {
    if (!id) throw new Error('ID do registro é obrigatório');

    const existingRegistration = await this.memberRegistrationRepository.findByIdIncludingDeleted(id);
    if (!existingRegistration) {
      throw new Error('Registro não encontrado');
    }

    return await this.memberRegistrationRepository.hardDelete(id);
  }

  // Buscar registros deletados
  async getDeletedRegistrations(): Promise<IMemberRegistration[]> {
    return await this.memberRegistrationRepository.findDeleted();
  }

  // Buscar estatísticas
  async getRegistrationStats() {
    return await this.memberRegistrationRepository.getStats();
  }

  // Buscar registros por período
  async getRegistrationsByPeriod(startDate: Date, endDate: Date): Promise<IMemberRegistration[]> {
    if (!startDate || !endDate) {
      throw new Error('Data inicial e final são obrigatórias');
    }

    if (startDate > endDate) {
      throw new Error('Data inicial não pode ser maior que data final');
    }

    return await this.memberRegistrationRepository.findByPeriod(startDate, endDate);
  }

  // Verificar status do registro
  async getRegistrationStatus(id: string): Promise<{ status: string; rejectionReason?: string }> {
    const registration = await this.memberRegistrationRepository.findById(id);
    if (!registration) {
      throw new Error('Registro não encontrado');
    }

    return {
      status: registration.status,
      rejectionReason: registration.rejectionReason
    };
  }
}