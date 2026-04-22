import {
  Play,
  MessageSquare,
  FormInput,
  Database,
  Brain,
  CreditCard,
  Briefcase,
  Factory,
  FileText,
} from "lucide-react";

export const CATEGORY_ICONS: Record<string, any> = {
  FlowControl: Play,
  Communication: MessageSquare,
  Forms: FormInput,
  Data: Database,
  AI: Brain,
  CustomerProcess: CreditCard,
  BusinessProcess: Briefcase,
  Industrial: Factory,
  Reports: FileText,
};