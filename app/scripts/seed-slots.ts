import { ensureFutureSlots } from "../services/slot.server";

async function main() {
  await ensureFutureSlots("distillerie-montrieux-dev.myshopify.com", 60);
  console.log("Créneaux générés avec succès.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});