// src/services/userService.ts
import { UserRepository } from '../../users/Repository/userRepository';
import { IUser, CreateUserDto, UpdateUserDto } from '../interface/user.interface';
import bcrypt from 'bcrypt';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // CREATE - Criar novo user com password encriptada
  async createUser(userData: CreateUserDto): Promise<IUser> {
    // Validar campos obrigatórios
    if (!userData.phoneNumber || !userData.password || !userData.email) {
      throw new Error('Número de celular, email e password são obrigatórios');
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Email inválido');
    }

    // Validar formato do número
    const cleanPhone = userData.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 9) {
      throw new Error('Número de celular deve ter 9 dígitos');
    }

    // Validar prefixo moçambicano
    const validPrefixes = ['82', '83', '84', '85', '86', '87'];
    const prefix = cleanPhone.substring(0, 2);
    if (!validPrefixes.includes(prefix)) {
      throw new Error('Número deve começar com 82, 83, 84, 85, 86 ou 87');
    }

    // Verificar se número já está registrado
    const isPhoneRegistered = await this.userRepository.isPhoneNumberRegistered(cleanPhone);
    if (isPhoneRegistered) {
      throw new Error('Já existe um usuário com este número de celular');
    }

    // Verificar se email já está registrado
    const isEmailRegistered = await this.userRepository.isEmailRegistered(userData.email);
    if (isEmailRegistered) {
      throw new Error('Já existe um usuário com este email');
    }

    // Validar role
    const validRoles = ['super_admin', 'grupo_pastoral', 'leader'];
    if (!validRoles.includes(userData.role)) {
      throw new Error('Role inválido');
    }

    // Encriptar password
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const userToCreate = {
      ...userData,
      phoneNumber: cleanPhone,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      status: 'ativo' as const
    };

    return await this.userRepository.create(userToCreate);
  }

  // READ - Buscar user por ID
  async getUserById(id: string): Promise<IUser | null> {
    if (!id) throw new Error('ID do usuário é obrigatório');
    return await this.userRepository.findById(id);
  }

  // READ - Buscar user por número de celular
  async getUserByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
    if (!phoneNumber) throw new Error('Número de celular é obrigatório');
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return await this.userRepository.findByPhoneNumber(cleanPhone);
  }

  // READ - Buscar user por email
  async getUserByEmail(email: string): Promise<IUser | null> {
    if (!email) throw new Error('Email é obrigatório');
    return await this.userRepository.findByEmail(email);
  }

  // READ - Listar todos users
  async getUsers(
    page: number = 1,
    limit: number = 10,
    filters: { role?: string; status?: string } = {}
  ) {
    return await this.userRepository.findAll(page, limit, filters);
  }

  // UPDATE - Atualizar user
  async updateUser(id: string, updateData: UpdateUserDto): Promise<IUser | null> {
    if (!id) throw new Error('ID do usuário é obrigatório');

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Se estiver a atualizar o número, validar
    if (updateData.phoneNumber) {
      const cleanPhone = updateData.phoneNumber.replace(/\D/g, '');
      
      if (cleanPhone.length !== 9) {
        throw new Error('Número de celular deve ter 9 dígitos');
      }

      const validPrefixes = ['82', '83', '84', '85', '86', '87'];
      const prefix = cleanPhone.substring(0, 2);
      if (!validPrefixes.includes(prefix)) {
        throw new Error('Número deve começar com 82, 83, 84, 85, 86 ou 87');
      }

      const existingWithPhone = await this.userRepository.findByPhoneNumber(cleanPhone);
      if (existingWithPhone && existingWithPhone._id !== id) {
        throw new Error('Já existe outro usuário com este número de celular');
      }

      updateData.phoneNumber = cleanPhone;
    }

    // Se estiver a atualizar email, validar
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        throw new Error('Email inválido');
      }

      const existingWithEmail = await this.userRepository.findByEmail(updateData.email);
      if (existingWithEmail && existingWithEmail._id !== id) {
        throw new Error('Já existe outro usuário com este email');
      }

      updateData.email = updateData.email.toLowerCase();
    }

    // Se estiver a atualizar password, encriptar
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    return await this.userRepository.update(id, updateData);
  }

  // SOFT DELETE - Desativar user
  async deactivateUser(id: string): Promise<IUser | null> {
    if (!id) throw new Error('ID do usuário é obrigatório');

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    return await this.userRepository.softDelete(id);
  }

  // HARD DELETE - Remover permanentemente
  async deleteUserPermanently(id: string): Promise<boolean> {
    if (!id) throw new Error('ID do usuário é obrigatório');

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    return await this.userRepository.hardDelete(id);
  }

  // RESTAURAR user
  async restoreUser(id: string): Promise<IUser | null> {
    if (!id) throw new Error('ID do usuário é obrigatório');

    const existingUser = await this.userRepository.findDeleted();
    if (!existingUser) {
      throw new Error('Usuário não encontrado ou não está deletado');
    }

    return await this.userRepository.restore(id);
  }

  // BLOQUEAR user
  async blockUser(id: string): Promise<IUser | null> {
    if (!id) throw new Error('ID do usuário é obrigatório');

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    return await this.userRepository.update(id, { status: 'bloqueado' });
  }

  // ATIVAR user
  async activateUser(id: string): Promise<IUser | null> {
    if (!id) throw new Error('ID do usuário é obrigatório');

    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    return await this.userRepository.update(id, { status: 'ativo' });
  }

  // ALTERAR PASSWORD
  async changePassword(id: string, newPassword: string): Promise<IUser | null> {
    if (!id || !newPassword) {
      throw new Error('ID e nova password são obrigatórios');
    }

    if (newPassword.length < 6) {
      throw new Error('Password deve ter pelo menos 6 caracteres');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    return await this.userRepository.update(id, { password: hashedPassword });
  }

  // BUSCAR USERS DELETADOS
  async getDeletedUsers(): Promise<IUser[]> {
    return await this.userRepository.findDeleted();
  }

  // ESTATÍSTICAS DE USERS
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    byRole: { [key: string]: number };
  }> {
    const [allUsers, activeUsers, inactiveUsers, blockedUsers] = await Promise.all([
      this.userRepository.findAll(1, 10000),
      this.userRepository.findAll(1, 10000, { status: 'ativo' }),
      this.userRepository.findAll(1, 10000, { status: 'desativado' }),
      this.userRepository.findAll(1, 10000, { status: 'bloqueado' })
    ]);

    const byRole = {
      super_admin: 0,
      grupo_pastoral: 0,
      leader: 0
    };

    allUsers.data.forEach(user => {
      byRole[user.role]++;
    });

    return {
      total: allUsers.total,
      active: activeUsers.total,
      inactive: inactiveUsers.total,
      blocked: blockedUsers.total,
      byRole
    };
  }

  // VERIFICAR SE USER PODE SER DELETADO (regras de negócio)
  async canDeleteUser(id: string): Promise<{ canDelete: boolean; reason?: string }> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      return { canDelete: false, reason: 'Usuário não encontrado' };
    }

    // Não permitir deletar o último super_admin
    if (user.role === 'super_admin') {
      const superAdmins = await this.userRepository.findAll(1, 10, { role: 'super_admin' });
      if (superAdmins.total <= 1) {
        return { canDelete: false, reason: 'Não é possível deletar o último super admin' };
      }
    }

    return { canDelete: true };
  }

  // VERIFICAR SE USER PODE SER BLOQUEADO
  async canBlockUser(id: string): Promise<{ canBlock: boolean; reason?: string }> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      return { canBlock: false, reason: 'Usuário não encontrado' };
    }

    // Não permitir bloquear o último super_admin
    if (user.role === 'super_admin') {
      const superAdmins = await this.userRepository.findAll(1, 10, { role: 'super_admin', status: 'ativo' });
      if (superAdmins.total <= 1) {
        return { canBlock: false, reason: 'Não é possível bloquear o último super admin ativo' };
      }
    }

    return { canBlock: true };
  }

  // MÉTODOS DE AUTENTICAÇÃO

  // Verificar credenciais de login (agora pode ser por phone ou email)
  async validateCredentials(identifier: string, password: string): Promise<IUser | null> {
    if (!identifier || !password) {
      throw new Error('Identificador e password são obrigatórios');
    }

    let user: IUser | null = null;

    // Verificar se é email ou phone
    if (identifier.includes('@')) {
      // Login por email
      user = await this.userRepository.findByEmail(identifier);
    } else {
      // Login por phone
      const cleanPhone = identifier.replace(/\D/g, '');
      user = await this.userRepository.findByPhoneNumber(cleanPhone);
    }

    if (!user) {
      return null;
    }

    // Verificar se user está ativo
    if (user.status !== 'ativo') {
      throw new Error('Usuário não está ativo');
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Incrementar tentativas de login
      if (user.phoneNumber) {
        await this.userRepository.incrementLoginAttempts(user.phoneNumber);
      }
      return null;
    }

    // Resetar tentativas em caso de sucesso
    if (user.phoneNumber) {
      await this.userRepository.resetLoginAttempts(user.phoneNumber);
      await this.userRepository.updateLastLogin(user.phoneNumber);
    }

    return user;
  }

  // VERIFICAR SE EMAIL ESTÁ DISPONÍVEL
  async isEmailAvailable(email: string): Promise<{ available: boolean; message?: string }> {
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { available: false, message: 'Email inválido' };
      }

      const existingUser = await this.userRepository.findByEmail(email);
      return { 
        available: !existingUser,
        message: existingUser ? 'Email já está em uso' : 'Email disponível'
      };
    } catch (error) {
      return { available: false, message: 'Erro ao verificar email' };
    }
  }

  // VERIFICAR SE TELEFONE ESTÁ DISPONÍVEL
  async isPhoneAvailable(phoneNumber: string): Promise<{ available: boolean; message?: string }> {
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      if (cleanPhone.length !== 9) {
        return { available: false, message: 'Número deve ter 9 dígitos' };
      }

      const validPrefixes = ['82', '83', '84', '85', '86', '87'];
      const prefix = cleanPhone.substring(0, 2);
      if (!validPrefixes.includes(prefix)) {
        return { available: false, message: 'Número deve começar com 82, 83, 84, 85, 86 ou 87' };
      }

      const existingUser = await this.userRepository.findByPhoneNumber(cleanPhone);
      return { 
        available: !existingUser,
        message: existingUser ? 'Número já está em uso' : 'Número disponível'
      };
    } catch (error) {
      return { available: false, message: 'Erro ao verificar número' };
    }
  }

  // REINICIAR TENTATIVAS DE LOGIN
  async resetUserLoginAttempts(phoneNumber: string): Promise<IUser | null> {
    if (!phoneNumber) throw new Error('Número de celular é obrigatório');
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return await this.userRepository.resetLoginAttempts(cleanPhone);
  }

  // ATUALIZAR ÚLTIMO LOGIN
  async updateUserLastLogin(phoneNumber: string): Promise<IUser | null> {
    if (!phoneNumber) throw new Error('Número de celular é obrigatório');
    
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return await this.userRepository.updateLastLogin(cleanPhone);
  }
}