// src/modules/analytics/models/References.ts
import mongoose from "mongoose";

// Referências aos modelos existentes com nomes CORRETOS das coleções
export const MemberRegistration =
  mongoose.models.memberregistrations ||
  mongoose.model(
    "memberregistrations",
    new mongoose.Schema({}, { strict: false })
  );

export const PrayerRequest =
  mongoose.models.prayerrequests ||
  mongoose.model("prayerrequests", new mongoose.Schema({}, { strict: false }));

export const ServantRegistration =
  mongoose.models.servantregistrations ||
  mongoose.model(
    "servantregistrations",
    new mongoose.Schema({}, { strict: false })
  );

export const PastoralVisit =
  mongoose.models.pastoralvisits ||
  mongoose.model("pastoralvisits", new mongoose.Schema({}, { strict: false }));

export const RequestLog =
  mongoose.models.requestlogs ||
  mongoose.model("requestlogs", new mongoose.Schema({}, { strict: false }));

export const User =
  mongoose.models.users ||
  mongoose.model("users", new mongoose.Schema({}, { strict: false }));

export const ChatbotSession =
  mongoose.models.chatbot_sessions ||
  mongoose.model(
    "chatbot_sessions",
    new mongoose.Schema({}, { strict: false })
  );

export const Message =
  mongoose.models.messages ||
  mongoose.model("messages", new mongoose.Schema({}, { strict: false }));

export const Notification =
  mongoose.models.notifications ||
  mongoose.model("notifications", new mongoose.Schema({}, { strict: false }));

export const ServerControlLog =
  mongoose.models.servercontrollogs ||
  mongoose.model(
    "servercontrollogs",
    new mongoose.Schema({}, { strict: false })
  );

export const WelcomeMessage =
  mongoose.models.welcomemessages ||
  mongoose.model("welcomemessages", new mongoose.Schema({}, { strict: false }));

export const MenuItem =
  mongoose.models.menuitems ||
  mongoose.model("menuitems", new mongoose.Schema({}, { strict: false }));

export const Menu =
  mongoose.models.menus ||
  mongoose.model("menus", new mongoose.Schema({}, { strict: false }));

export const NotificationTemplate =
  mongoose.models.notificationtemplates ||
  mongoose.model(
    "notificationtemplates",
    new mongoose.Schema({}, { strict: false })
  );

export const ScheduleConfig =
  mongoose.models.scheduleconfigs ||
  mongoose.model("scheduleconfigs", new mongoose.Schema({}, { strict: false }));

export const Session =
  mongoose.models.sessions ||
  mongoose.model("sessions", new mongoose.Schema({}, { strict: false }));
