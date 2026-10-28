// Every WhatsApp click is also one GA4 recommended "generate_lead" event, so the reports have a single conversion
// (marked as the key event in GA) instead of three that would count the same contact twice.

const LEAD_TYPES = { whatsapp_contact: "contact", whatsapp_booking: "booking", whatsapp_summary: "summary" };

/** The generate_lead event that goes with `name`, or null when the event is not a lead. */
export function leadFor(name, params = {}) {
  const leadType = LEAD_TYPES[name];
  if (!leadType) return null;
  return {
    name: "generate_lead",
    params: { method: "whatsapp", lead_type: leadType, ...(params.city && { city: params.city }) },
  };
}
