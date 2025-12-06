import { IWelcomeMessage } from "../interfaces/welcome-message.interface";
import { WelcomeMessageResponse } from "../interfaces/welcome-message.interface";

export class WelcomeMessageMapper {
  static toResponse(message: IWelcomeMessage): WelcomeMessageResponse {
    return {
      _id: message._id.toString(),
      title: message.title,
      message: message.message,
      instructions: message.instructions,
      quickTip: message.quickTip,
      isActive: message.isActive,
      version: message.version,
      deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      __v: message.__v,
    };
  }

  static toResponseArray(
    messages: IWelcomeMessage[]
  ): WelcomeMessageResponse[] {
    return messages.map((message) => this.toResponse(message));
  }
}
