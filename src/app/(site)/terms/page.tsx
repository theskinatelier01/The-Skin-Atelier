import type { Metadata } from "next";

import { PageHero } from "@/components/public/page-hero";
import { LegalDocument } from "@/components/public/legal-document";
import { getSettings } from "@/lib/cms/queries";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms on which The Skin Atelier provides consultations, treatments and packages, including booking, cancellation and payment.",
  alternates: { canonical: "/terms" },
};

export default async function TermsPage() {
  const settings = await getSettings();

  const sections = [
    {
      heading: "These terms",
      body: `These terms apply to consultations, treatments, packages and products provided by ${settings.clinicName} at ${settings.addressLine}, ${settings.city}. By booking with us you agree to them.`,
    },
    {
      heading: "Booking requests",
      body: "A request submitted through this website, by WhatsApp or by phone is a **request**, not a confirmed appointment. Your appointment exists once a member of our team has confirmed the date, time and clinician with you directly.\n\nWe may decline or reschedule a request where the requested time is unavailable, where the treatment is not clinically appropriate, or where a required patch test has not been completed.",
    },
    {
      heading: "Consultation and suitability",
      body: "Every treatment is preceded by a consultation. A clinician will assess whether the treatment you have asked about is suitable for you, and may recommend a different treatment or none at all.\n\nWe reserve the right to decline to perform any treatment where, in the clinician's judgement, it is not in your interest. A consultation fee remains payable where this occurs, because the assessment has still been provided.",
    },
    {
      heading: "Results",
      body: "We do not guarantee any particular outcome. Results vary from person to person according to skin type, age, the condition being treated, medical history, the number of sessions completed and adherence to aftercare.\n\nAny before and after images shown on this website or in the clinic are individual outcomes and are not a representation of the result you will achieve.",
    },
    {
      heading: "Cancellation and missed appointments",
      body: "Please give us at least twenty-four hours' notice if you need to cancel or reschedule, so the time can be offered to another patient.\n\nRepeated missed appointments without notice may result in a deposit being required for future bookings. Where a deposit has been taken and an appointment is missed without notice, that deposit may be retained.",
    },
    {
      heading: "Payment",
      body: `Payment is due at the time of treatment unless agreed otherwise in advance. We accept cash, card, bank transfer, Easypaisa and JazzCash. Prices are quoted in ${settings.currency} and a receipt is issued for every payment.\n\nPrices listed on this website are indicative starting points and may vary with the area treated and the plan agreed at consultation. Your final cost is confirmed in writing before treatment begins.`,
    },
    {
      heading: "Packages",
      body: "Packages are valid for the period stated at purchase and are non-transferable. Sessions are tracked against your patient record.\n\nWhere a treatment included in a package is found at consultation to be unsuitable for you, we will substitute an equivalent treatment or refund the unused portion at the package rate. Unused sessions expire at the end of the validity period.",
    },
    {
      heading: "Aftercare",
      body: "Following the aftercare instructions you are given is part of the treatment. Where instructions — particularly regarding sun protection — are not followed, the result may be compromised and, in the case of pigmentation-prone skin, the condition may worsen.\n\nWe cannot accept responsibility for outcomes arising from aftercare that was not followed.",
    },
    {
      heading: "Medical information",
      body: "You must tell us about all medical conditions, medications, allergies, previous aesthetic treatments and, where relevant, pregnancy or breastfeeding. Some treatments are unsafe in these circumstances.\n\nWithholding this information may make a treatment unsafe, and we cannot accept responsibility for consequences arising from information that was not disclosed to us.",
    },
    {
      heading: "Complaints",
      body: `If you are unhappy with any aspect of your care, please contact us on ${settings.phone} or at ${settings.email}. We will acknowledge your complaint within three working days and aim to resolve it within thirty days.`,
    },
    {
      heading: "Website content",
      body: "Information on this website is provided for general guidance. It is not medical advice and must not be relied on as a substitute for an individual assessment by a qualified clinician.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms & Conditions"
        description="The terms on which we provide consultations, treatments and packages."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]}
      />
      <LegalDocument sections={sections} />
    </>
  );
}
