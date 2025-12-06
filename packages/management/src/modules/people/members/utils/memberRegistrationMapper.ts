import { IMemberRegistration } from '../interfaces/member-registration.interface';
import { MemberRegistrationResponse } from '../interfaces/member-registration.interface';

export class MemberRegistrationMapper {
  static toResponse(registration: IMemberRegistration): MemberRegistrationResponse {
    return {
      _id: registration._id.toString(),
      fullName: registration.fullName,
      phoneNumber: registration.phoneNumber,
      email: registration.email,
      dateOfBirth: registration.dateOfBirth.toISOString(),
      gender: registration.gender,
      maritalStatus: registration.maritalStatus,
      address: registration.address,
      emergencyContact: registration.emergencyContact,
      baptismStatus: registration.baptismStatus,
      baptismDate: registration.baptismDate ? registration.baptismDate.toISOString() : undefined,
      previousChurch: registration.previousChurch,
      spiritualInterest: registration.spiritualInterest,
      howDidYouHear: registration.howDidYouHear,
      status: registration.status,
      approvedBy: registration.approvedBy ? registration.approvedBy.toString() : undefined,
      approvedAt: registration.approvedAt ? registration.approvedAt.toISOString() : undefined,
      rejectionReason: registration.rejectionReason,
      source: registration.source,
      notes: registration.notes,
      internalNotes: registration.internalNotes,
      deletedAt: registration.deletedAt ? registration.deletedAt.toISOString() : null,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
    };
  }

  static toResponseArray(registrations: IMemberRegistration[]): MemberRegistrationResponse[] {
    return registrations.map(registration => this.toResponse(registration));
  }
}