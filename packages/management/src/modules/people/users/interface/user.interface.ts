// src/interfaces/user.interface.ts
export interface IUser {
  _id?: string;
  phoneNumber: string;
  email: string;
  password: string;
  gender: 'male' | 'female';
  role: 'super_admin' | 'grupo_pastoral' | 'leader';
  status: 'ativo' | 'desativado' | 'bloqueado';
  lastLogin?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserDto {
  phoneNumber: string;
  email: string;
  password: string;
  gender: 'male' | 'female';
  role: 'super_admin' | 'grupo_pastoral' | 'leader';
}

export interface UpdateUserDto {
  phoneNumber?: string;
  email?: string;
  password?: string;
  gender?: 'male' | 'female';
  role?: 'super_admin' | 'grupo_pastoral' | 'leader';
  status?: 'ativo' | 'desativado' | 'bloqueado';
}