import type { Metadata } from "next";

import { PageHero } from "@/components/public/page-hero";
import { LegalDocument } from "@/components/public/legal-document";
import { getSettings } from "@/lib/cms/queries";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How The Skin Atelier collects, stores, uses and protects your personal and clinical information.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default async function PrivacyPage() {
  const settings = await getSettings();

  const sections = [
    {
      heading: "Who we are",
      body: `${settings.clinicName} is a skin and aesthetic clinic at ${settings.addressLine}, ${settings.city}, ${settings.country}. We are the data controller for the information described in this policy. You can reach us on ${settings.phone} or at ${settings.email}.`,
    },
    {
      heading: "What we collect",
      body: "We collect two categories of information.\n\n**Contact information** — your name, phone number, WhatsApp number, email address and, where you provide it, your postal address and emergency contact. We collect this when you submit a booking request, send an enquiry, or register as a patient.\n\n**Clinical information** — your medical history, allergies, medications, skin and hair assessments, consultation notes, treatment records and clinical photographs. We collect this only in the course of providing care, and only from you or from a clinician treating you.",
    },
    {
      heading: "Why we use it",
      body: "We use your contact information to arrange, confirm and follow up your appointments, to send you information about your care, and to take payment.\n\nWe use your clinical information to assess your suitability for treatment, to plan and deliver that treatment safely, to track your progress between sessions, and to maintain the medical records we are required to keep.\n\nWe do not sell your information. We do not share it with advertisers. We do not use your clinical information for marketing.",
    },
    {
      heading: "Clinical photographs",
      body: "Photographs taken during your care are stored privately and are visible only to the clinicians involved in treating you and to administrators who maintain the records system.\n\nA photograph of you appears on this website, on social media, or in any other public material **only** if you have given specific, separate, written consent for that particular use. Consenting to treatment is not consent to publication, and the two are recorded separately in our system.\n\nYou may withdraw publication consent at any time, without giving a reason and without any effect on your care. When you withdraw it, we remove the published image.",
    },
    {
      heading: "Who can see your records",
      body: "Access to your records is restricted by role. Clinicians can see the clinical records of patients they treat. Reception staff can see appointment and billing information, but not your clinical notes or photographs. Staff working in inventory have no access to patient records at all.\n\nEvery access to and change of a clinical record is logged with the identity of the person who made it and the time it occurred.",
    },
    {
      heading: "How long we keep it",
      body: "We retain clinical records for the period required by professional and legal obligations applicable to medical practice in Pakistan, and no longer than necessary thereafter. Contact information for enquiries that do not become appointments is retained for up to twenty-four months and then deleted.",
    },
    {
      heading: "Security",
      body: "Your information is stored on managed cloud infrastructure with encryption in transit and at rest. Access requires individual authenticated accounts with role-based permissions, and clinical images are stored privately rather than at publicly reachable addresses.",
    },
    {
      heading: "Your rights",
      body: `You may ask us for a copy of the information we hold about you, ask us to correct anything inaccurate, ask us to delete information we no longer need to keep, or withdraw a consent you have previously given.\n\nTo make any of these requests, contact us on ${settings.phone} or at ${settings.email}. We will respond within thirty days.`,
    },
    {
      heading: "Cookies",
      body: "This website uses only the cookies necessary to operate it — principally to keep staff signed in to the clinic management system. We do not set advertising or cross-site tracking cookies.",
    },
    {
      heading: "Changes to this policy",
      body: "If we change this policy we will update the date shown below. Where a change materially affects how we use your information, we will tell you directly.",
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="How we collect, store, use and protect your personal and clinical information."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
      />
      <LegalDocument sections={sections} />
    </>
  );
}
