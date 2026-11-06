import { respond } from "@/lib/api";
import { getDashboard } from "@/lib/services";

export function GET() {
  return respond(getDashboard);
}
