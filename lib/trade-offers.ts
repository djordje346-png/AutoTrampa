import { getSupabase } from "@/lib/supabase";
import type { FuelType, Transmission } from "@/types";

export interface OfferCar {
  brand: string;
  model: string;
  year: number | null;
  image: string | null;
  city: string | null;
  mileage: number | null;
  specs: { fuelType: FuelType | null; transmission: Transmission | null };
}
export interface TradeOffer {
  id: string;
  sender_id: string;
  recipient_id: string;
  offered_car_id: string | null;
  target_car_id: string | null;
  offered_car: OfferCar;
  target_car: OfferCar;
  sender_name: string;
  recipient_name: string;
  note: string;
  status: "pending" | "declined" | "withdrawn";
  conversation_id: string | null;
  recipient_read_at: string | null;
  created_at: string;
  updated_at: string;
}
export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function offerActive(offer: TradeOffer) {
  return (
    offer.status === "pending" &&
    Boolean(offer.offered_car_id && offer.target_car_id)
  );
}
export function offerStatus(offer: TradeOffer) {
  if (offer.status === "withdrawn") return "Povučena";
  if (offer.status === "declined") return "Odbijena";
  if (!offer.offered_car_id || !offer.target_car_id)
    return "Vozilo nije dostupno";
  return offer.conversation_id ? "Razgovor započet" : "Na čekanju";
}
export function offerError(error: { message?: string } | null | undefined) {
  const message = error?.message ?? "";
  if (/AUTHENTICATION_REQUIRED/.test(message))
    return "Prijavi se da pošalješ ponudu.";
  if (/CAR_NOT_FOUND|OFFER_NOT_ACTIVE/.test(message))
    return "Jedno od vozila više nije dostupno za ovu zamenu.";
  if (/NOT_OWNED/.test(message)) return "Izaberi svoj automobil iz garaže.";
  if (/OWN_CAR/.test(message)) return "Ova radnja nije dostupna za tvoj oglas.";
  if (/NOTE_TOO_LONG/.test(message))
    return "Napomena može da ima najviše 500 znakova.";
  if (/OFFER_NOT_ACCESSIBLE|OFFER_ACTION_NOT_ALLOWED/.test(message))
    return "Ponuda je promenjena ili ti više nije dostupna. Osveži pregled.";
  return "Radnja nije uspela. Proveri vezu i pokušaj ponovo.";
}
export function notifyOffersChanged() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("autotrampa:offers"));
}
export async function sendTradeOffer(
  targetId: string,
  offeredId: string,
  note: string,
) {
  if (!UUID_RE.test(targetId) || !UUID_RE.test(offeredId)) {
    return {
      ok: false as const,
      message:
        "Za ponudu izaberi stvarni oglas i svoj automobil iz garaže. Demo oglasi ne primaju ponude.",
    };
  }
  try {
    const { data, error } = await getSupabase().rpc("create_trade_offer", {
      p_target_car_id: targetId,
      p_offered_car_id: offeredId,
      p_note: note.trim(),
    });
    if (error || !UUID_RE.test(data?.offer_id ?? ""))
      return { ok: false as const, message: offerError(error) };
    notifyOffersChanged();
    return {
      ok: true as const,
      id: data.offer_id as string,
      alreadyExists: Boolean(data.already_exists),
    };
  } catch {
    return { ok: false as const, message: offerError(null) };
  }
}
