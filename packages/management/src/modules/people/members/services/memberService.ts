// src/modules/people/members/services/memberService.ts - VERSÃO COMPLETA FUNCIONAL
import { MemberRepository } from "../repositories/memberRepository";
import {
  IMemberRegistration,
  CreateMemberRegistrationDto,
  UpdateMemberRegistrationDto,
} from "../interfaces/member-registration.interface";

export class MemberService {
  private memberRegistrationRepository: MemberRepository;

  constructor() {
    this.memberRegistrationRepository = new MemberRepository();
  }

  // ==================== MÉTODO DE PREPARAÇÃO DE DADOS ====================
  private prepareRegistrationData(data: any): CreateMemberRegistrationDto {
    console.log("🎯 Preparando dados para registro:", {
      nome: data.name || data.nomeCompleto,
      telefone: data.phone || data.telefone,
      origem: data.source || data.fonte
    });

    // Criar objeto com valores padrão
    const registrationData: CreateMemberRegistrationDto = {
      fullName: "",
      phoneNumber: "",
      dateOfBirth: new Date().toISOString().split('T')[0],
      gender: "male",
      maritalStatus: "single",
      address: {
        street: "",
        city: "",
        province: "",
        neighborhood: "",
        residenceType: "family"
      },
      howDidYouHear: "friend",
      baptismStatus: "not_baptized",
      source: "website",
      status: "pending"
    };

    // ========== MAPEAMENTO DOS CAMPOS ==========

    // 1. Dados pessoais básicos
    registrationData.fullName = data.fullName || data.nomeCompleto || data.name || data.nome || "";
    registrationData.phoneNumber = data.phoneNumber || data.telefone || data.phone || "";

    // 2. Data de nascimento
    if (data.dateOfBirth || data.dataNascimento) {
      try {
        const dateStr = data.dateOfBirth || data.dataNascimento;
        registrationData.dateOfBirth = new Date(dateStr).toISOString().split('T')[0];
      } catch {
        console.warn("⚠️ Data de nascimento inválida, usando data atual");
      }
    }

    // 3. Gênero
    const rawGender = data.gender || data.genero;
    if (rawGender) {
      registrationData.gender = this.normalizeGender(rawGender);
    }

    // 4. Estado civil
    const rawMaritalStatus = data.maritalStatus || data.estadoCivil;
    if (rawMaritalStatus) {
      registrationData.maritalStatus = this.normalizeMaritalStatus(rawMaritalStatus);
    }

    // 5. Endereço (Mapeamento CRÍTICO: frontend usa 'region', modelo usa 'province')
    if (data.address || data.endereco) {
      const addr = data.address || data.endereco;
      
      registrationData.address = {
        street: addr.street || addr.rua || "",
        city: addr.city || addr.cidade || "",
        province: addr.province || addr.provincia || addr.region || "", // ← MAPEIA 'region' para 'province'
        neighborhood: addr.neighborhood || addr.bairro || "",
        residenceType: this.normalizeResidenceType(addr.residenceType || addr.tipoResidencia || "family")
      };
    }

    // 6. Como conheceu a igreja (frontend usa 'howFoundChurch', modelo usa 'howDidYouHear')
    if (data.howFoundChurch || data.comoConheceu) {
      registrationData.howDidYouHear = this.normalizeHowDidYouHear(data.howFoundChurch || data.comoConheceu);
    }

    // 7. Campos opcionais
    if (data.email) registrationData.email = data.email;
    if (data.profession || data.profissao) registrationData.profession = data.profession || data.profissao;
    if (data.baptismStatus || data.situacaoBatismo) {
      registrationData.baptismStatus = this.normalizeBaptismStatus(data.baptismStatus || data.situacaoBatismo);
    }
    if (data.familyMembers || data.familiares) {
      registrationData.familyMembers = parseInt(data.familyMembers || data.familiares || "0");
    }
    if (data.previousChurch || data.igrejaAnterior) {
      registrationData.previousChurch = data.previousChurch || data.igrejaAnterior;
    }
    if (data.notes || data.observacoes) {
      registrationData.notes = data.notes || data.observacoes;
    }
    if (data.source || data.fonte) {
      registrationData.source = this.normalizeSource(data.source || data.fonte);
    }

    // 8. Contato de emergência
    if (data.emergencyContact || data.contactoEmergencia) {
      const ec = data.emergencyContact || data.contactoEmergencia;
      registrationData.emergencyContact = {
        name: ec.name || ec.nome || "",
        phoneNumber: ec.phoneNumber || ec.telefone || ec.phone || "",
        relationship: ec.relationship || ec.relacao || ec.parentesco || ""
      };
    }

    console.log("✅ Dados preparados:", {
      nome: registrationData.fullName,
      telefone: registrationData.phoneNumber,
      provincia: registrationData.address.province,
      origem: registrationData.source
    });

    return registrationData;
  }

  // ==================== NORMALIZADORES ====================
  private normalizeGender(gender: string): "male" | "female" {
    const g = (gender || "").toLowerCase().trim();
    
    if (g === "feminino" || g === "f" || g === "mulher" || g === "female") {
      return "female";
    }
    
    return "male"; // padrão
  }

  private normalizeMaritalStatus(status: string): "single" | "married" | "divorced" | "widowed" {
    const s = (status || "").toLowerCase().trim();
    
    if (s.includes("casad")) return "married";
    if (s.includes("divor")) return "divorced";
    if (s.includes("viúv") || s.includes("viuv")) return "widowed";
    
    return "single"; // padrão
  }

  private normalizeResidenceType(type: string): "own" | "rented" | "family" {
    const t = (type || "").toLowerCase().trim();
    
    if (t.includes("own") || t.includes("própria") || t === "propria") return "own";
    if (t.includes("rent") || t.includes("alugada")) return "rented";
    
    return "family"; // padrão
  }

  private normalizeHowDidYouHear(value: string): "friend" | "social_media" | "event" | "other" {
    const v = (value || "").toLowerCase().trim();
    
    if (v.includes("friend") || v.includes("amigo")) return "friend";
    if (v.includes("social") || v.includes("rede") || v.includes("facebook") || v.includes("instagram")) return "social_media";
    if (v.includes("event") || v.includes("evento")) return "event";
    
    return "other"; // padrão
  }

  private normalizeBaptismStatus(status: string): "baptized" | "not_baptized" | "want_baptism" {
    const s = (status || "").toLowerCase().trim();
    
    if (s.includes("batizado") || s.includes("baptized")) return "baptized";
    if (s.includes("deseja") || s.includes("want") || s.includes("pretende")) return "want_baptism";
    
    return "not_baptized"; // padrão
  }

  private normalizeSource(source: string): "chatbot" | "website" | "in_person" {
    const s = (source || "").toLowerCase().trim();
    
    if (s.includes("chat") || s.includes("bot") || s.includes("whatsapp")) return "chatbot";
    if (s.includes("person") || s.includes("pessoa") || s.includes("presencial")) return "in_person";
    
    return "website"; // padrão
  }

  // ==================== MÉTODO DE CRIAÇÃO ====================
  async createRegistration(formData: any): Promise<IMemberRegistration> {
    try {
      console.log("🚀 INICIANDO CRIAÇÃO DE REGISTRO");
      
      // 1. Preparar dados
      const registrationData = this.prepareRegistrationData(formData);
      
      // 2. VALIDAÇÕES
      console.log("🔍 Validando dados...");
      
      // Nome obrigatório
      if (!registrationData.fullName || registrationData.fullName.trim().length < 2) {
        throw new Error("Nome completo é obrigatório (mínimo 2 caracteres)");
      }
      
      // Telefone obrigatório
      if (!registrationData.phoneNumber || registrationData.phoneNumber.trim().length === 0) {
        throw new Error("Telefone é obrigatório");
      }
      
      // Limpar e validar telefone
      const cleanPhone = registrationData.phoneNumber.replace(/\D/g, "");
      if (cleanPhone.length < 9) {
        throw new Error("Telefone deve ter pelo menos 9 dígitos");
      }
      registrationData.phoneNumber = cleanPhone;
      
      // Verificar duplicidade
      const phoneExists = await this.memberRegistrationRepository.isPhoneNumberRegistered(cleanPhone);
      if (phoneExists) {
        throw new Error("Já existe um registro com este número de telefone");
      }
      
      // Validar idade
      if (registrationData.dateOfBirth) {
        const birthDate = new Date(registrationData.dateOfBirth);
        const today = new Date();
        
        if (isNaN(birthDate.getTime())) {
          throw new Error("Data de nascimento inválida");
        }
        
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        
        console.log(`📅 Idade calculada: ${calculatedAge} anos`);
        
        if (calculatedAge < 16) {
          throw new Error("É necessário ter pelo menos 16 anos para se registrar");
        }
        
        if (calculatedAge > 100) {
          throw new Error("Data de nascimento inválida");
        }
      }
      
      // 3. CRIAR REGISTRO
      console.log("💾 Salvando no banco de dados...");
      const result = await this.memberRegistrationRepository.create(registrationData);
      
      console.log("🎉 REGISTRO CRIADO COM SUCESSO!");
      console.log("   ID:", result._id);
      console.log("   Nome:", result.fullName);
      console.log("   Status:", result.status);
      console.log("   Telefone:", result.phoneNumber);
      
      return result;
      
    } catch (error: any) {
      console.error("❌ ERRO ao criar registro:", error.message);
      console.error("   Stack:", error.stack);
      throw error;
    }
  }

  // ==================== MÉTODO DE APROVAÇÃO ====================
  async approveRegistration(id: string, approvedBy: any): Promise<IMemberRegistration | null> {
    try {
      console.log(`✅ PROCESSANDO APROVAÇÃO do registro ${id}`);
      
      // Determinar quem está aprovando
      let approver = "admin";
      
      if (approvedBy) {
        if (typeof approvedBy === "string") {
          approver = approvedBy.trim();
        } else if (approvedBy._id) {
          approver = approvedBy._id.toString();
        } else if (approvedBy.id) {
          approver = approvedBy.id.toString();
        } else if (approvedBy.userId) {
          approver = approvedBy.userId.toString();
        }
      }
      
      console.log("   Aprovador:", approver);
      
      // Aprovar registro
      const result = await this.memberRegistrationRepository.approve(id, approver);
      
      if (!result) {
        throw new Error("Registro não encontrado");
      }
      
      console.log("🎉 Registro aprovado!");
      console.log("   Novo status:", result.status);
      console.log("   Aprovado em:", result.approvedAt);
      console.log("   Aprovado por:", result.approvedBy);
      
      return result;
      
    } catch (error: any) {
      console.error("❌ ERRO ao aprovar registro:", error.message);
      throw error;
    }
  }

  // ==================== MÉTODOS DE CONSULTA ====================
  async getAllRegistrations(
    filters: { status?: string; source?: string } = {},
    page: number = 1,
    limit: number = 10
  ) {
    return await this.memberRegistrationRepository.findAll(filters, page, limit);
  }

  async getPendingRegistrations(): Promise<IMemberRegistration[]> {
    return await this.memberRegistrationRepository.findPending();
  }

  async getRegistrationById(id: string): Promise<IMemberRegistration | null> {
    if (!id) {
      throw new Error("ID do registro é obrigatório");
    }
    return await this.memberRegistrationRepository.findById(id);
  }

  async getRegistrationByPhone(phoneNumber: string): Promise<IMemberRegistration | null> {
    if (!phoneNumber) {
      throw new Error("Número de telefone é obrigatório");
    }
    
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 9) {
      throw new Error("Número de telefone deve ter pelo menos 9 dígitos");
    }
    
    return await this.memberRegistrationRepository.findByPhone(cleanPhone);
  }

  // ==================== MÉTODOS DE STATUS ====================
  async rejectRegistration(id: string, rejectionReason: string): Promise<IMemberRegistration | null> {
    if (!id) throw new Error("ID do registro é obrigatório");
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error("Motivo da rejeição é obrigatório");
    }
    
    return await this.memberRegistrationRepository.reject(id, rejectionReason);
  }

  async cancelRegistration(id: string): Promise<IMemberRegistration | null> {
    if (!id) throw new Error("ID do registro é obrigatório");
    return await this.memberRegistrationRepository.cancel(id);
  }

  async getRegistrationStats() {
    return await this.memberRegistrationRepository.getStats();
  }

  // ==================== MÉTODOS DE ATUALIZAÇÃO ====================
  async updateRegistration(
    id: string,
    updateData: UpdateMemberRegistrationDto
  ): Promise<IMemberRegistration | null> {
    if (!id) throw new Error("ID do registro é obrigatório");
    
    const existingRegistration = await this.memberRegistrationRepository.findById(id);
    if (!existingRegistration) {
      throw new Error("Registro não encontrado");
    }
    
    // Só permite atualizar registros pendentes ou cancelados
    if (existingRegistration.status !== "pending" && existingRegistration.status !== "cancelled") {
      throw new Error("Não é possível alterar um registro já processado");
    }
    
    return await this.memberRegistrationRepository.update(id, updateData);
  }

  // ==================== MÉTODOS DE EXCLUSÃO ====================
  async softDeleteRegistration(id: string): Promise<IMemberRegistration | null> {
    if (!id) throw new Error("ID do registro é obrigatório");
    return await this.memberRegistrationRepository.softDelete(id);
  }

  async restoreRegistration(id: string): Promise<IMemberRegistration | null> {
    if (!id) throw new Error("ID do registro é obrigatório");
    return await this.memberRegistrationRepository.restore(id);
  }

  async hardDeleteRegistration(id: string): Promise<boolean> {
    if (!id) throw new Error("ID do registro é obrigatório");
    return await this.memberRegistrationRepository.hardDelete(id);
  }

  async getDeletedRegistrations(): Promise<IMemberRegistration[]> {
    return await this.memberRegistrationRepository.findDeleted();
  }

  // ==================== MÉTODOS ADICIONAIS ====================
  async getRegistrationStatus(id: string): Promise<{ status: string; rejectionReason?: string }> {
    const registration = await this.memberRegistrationRepository.findById(id);
    if (!registration) {
      throw new Error("Registro não encontrado");
    }
    
    return {
      status: registration.status,
      rejectionReason: registration.rejectionReason
    };
  }

  async getRegistrationsByPeriod(startDate: Date, endDate: Date): Promise<IMemberRegistration[]> {
    if (!startDate || !endDate) {
      throw new Error("Data inicial e final são obrigatórias");
    }
    
    if (startDate > endDate) {
      throw new Error("Data inicial não pode ser maior que data final");
    }
    
    return await this.memberRegistrationRepository.findByPeriod(startDate, endDate);
  }
}