export type ErrorCode =
  | "invalid"
  | "rate"
  | "auth"
  | "notfound"
  | "otp_wrong"
  | "otp_expired"
  | "sms"
  | "password"
  | "unavailable"
  | "locked"
  | "payments_off"
  | "server";

export type Result<T = object> = ({ ok: true } & T) | { ok: false; error: ErrorCode };

export const fail = (error: ErrorCode): { ok: false; error: ErrorCode } => ({ ok: false, error });

export function errorText(code: ErrorCode, tr: (en: string, hi: string) => string): string {
  switch (code) {
    case "invalid":
      return tr("Please check the details and try again.", "कृपया जानकारी जाँचकर दोबारा कोशिश करें।");
    case "rate":
      return tr("Too many attempts. Please wait a few minutes.", "बहुत ज़्यादा कोशिशें हो गईं। कुछ मिनट रुकें।");
    case "auth":
      return tr("Please sign in again.", "कृपया दोबारा लॉग इन करें।");
    case "notfound":
      return tr("We couldn't find that.", "यह नहीं मिला।");
    case "otp_wrong":
      return tr("That code isn't right. Please try again.", "कोड सही नहीं है। दोबारा कोशिश करें।");
    case "otp_expired":
      return tr("The code has expired. Please request a new one.", "कोड की समय-सीमा खत्म हो गई। नया कोड मँगाएँ।");
    case "sms":
      return tr("We couldn't send the SMS. Please try again.", "SMS नहीं भेजा जा सका। दोबारा कोशिश करें।");
    case "password":
      return tr("Wrong password. Please ask the couple.", "पासवर्ड गलत है। कृपया जोड़े से पूछें।");
    case "unavailable":
      return tr("Sorry, someone just picked this gift. Please choose another.", "क्षमा करें, यह तोहफ़ा अभी किसी और ने चुन लिया। कोई और चुनें।");
    case "locked":
      return tr("This registry is private.", "यह रजिस्ट्री निजी है।");
    case "payments_off":
      return tr("Online payment isn't available right now.", "ऑनलाइन भुगतान अभी उपलब्ध नहीं है।");
    default:
      return tr("Something went wrong. Please try again.", "कुछ गड़बड़ हो गई। दोबारा कोशिश करें।");
  }
}
