import type {
  ClinicSettings,
  Doctor,
  Faq,
  GalleryItem,
  Menu,
  Package,
  Service,
  ServiceCategory,
  Testimonial,
} from "@/types";
import { DEFAULT_BRANCH_ID } from "@/lib/firebase/collections";

/**
 * Bundled default content.
 *
 * Serves three purposes:
 *   1. The seed script writes these documents into Firestore.
 *   2. Public pages fall back to them when Firebase is not yet configured, so
 *      the site is reviewable immediately after `npm run dev`.
 *   3. They document the expected shape of every CMS record.
 *
 * All of it is editable from the admin once seeded — nothing here is the
 * source of truth in a configured deployment.
 */

const now = "2026-01-01T00:00:00.000Z";
const base = { createdAt: now, updatedAt: now, isDemo: false as const };

/* -------------------------------------------------------------------------- */
/* Clinic settings                                                            */
/* -------------------------------------------------------------------------- */

export const DEFAULT_SETTINGS: ClinicSettings = {
  id: "clinic",
  ...base,
  clinicName: "The Skin Atelier",
  tagline: "Skin & Aesthetic Clinic",
  phone: "0337 5977799",
  whatsapp: "03375977799",
  email: "hello@theskinatelier.pk",
  addressLine: "MXMQ+83H, F-11 Markaz, F-11",
  city: "Islamabad",
  country: "Pakistan",
  googleMapsUrl: "https://maps.google.com/?q=F-11+Markaz+Islamabad",
  googleRating: 4.9,
  googleReviewCount: 12,
  openingHours: [
    { day: 0, open: "12:00", close: "20:00", closed: false },
    { day: 1, open: "11:00", close: "20:00", closed: false },
    { day: 2, open: "11:00", close: "20:00", closed: false },
    { day: 3, open: "11:00", close: "20:00", closed: false },
    { day: 4, open: "11:00", close: "20:00", closed: false },
    { day: 5, open: "15:00", close: "20:00", closed: false },
    { day: 6, open: "11:00", close: "20:00", closed: false },
  ],
  social: {
    instagram: "https://instagram.com/theskinatelier",
    facebook: "https://facebook.com/theskinatelier",
  },
  currency: "PKR",
  currencySymbol: "PKR",
  taxPercent: 0,
  taxLabel: "Sales Tax",
  invoicePrefix: "TSA",
  patientCodePrefix: "TSA",
  appointment: { slotMinutes: 30, bufferMinutes: 10, maxAdvanceDays: 90, allowSameDay: true },
  seoDefaults: {
    title: "The Skin Atelier — Skin & Aesthetic Clinic in Islamabad",
    description:
      "Consultation-led dermatology and aesthetic treatments in F-11 Markaz, Islamabad. Botox, fillers, PRP, HydraFacial, laser and medical skincare.",
    keywords: [
      "skin clinic Islamabad",
      "aesthetic clinic Islamabad",
      "dermatologist Islamabad",
      "Botox Islamabad",
      "PRP Islamabad",
      "HydraFacial Islamabad",
      "laser hair removal Islamabad",
    ],
  },
  announcementBar: {
    enabled: true,
    text: "Now accepting consultations at F-11 Markaz, Islamabad",
    href: "/book",
  },
  onlineBookingEnabled: true,
};

/* -------------------------------------------------------------------------- */
/* Service categories                                                         */
/* -------------------------------------------------------------------------- */

export const DEFAULT_SERVICE_CATEGORIES: ServiceCategory[] = [
  "Injectables",
  "Skin Treatments",
  "Laser Treatments",
  "Hair Treatments",
  "Facial Treatments",
  "Body Treatments",
  "Dermatology",
  "Wellness",
].map((name, i) => ({
  ...base,
  id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  displayOrder: i,
  isActive: true,
}));

/* -------------------------------------------------------------------------- */
/* Services                                                                   */
/* -------------------------------------------------------------------------- */

type ServiceSeed = Omit<Service, keyof typeof base | "id"> & { id: string };

const service = (s: ServiceSeed): Service => ({ ...base, ...s });

export const DEFAULT_SERVICES: Service[] = [
  service({
    id: "botox",
    name: "Botox",
    slug: "botox",
    categoryId: "injectables",
    categoryName: "Injectables",
    shortDescription:
      "Refined muscle relaxant treatment that softens expression lines while keeping your face expressive.",
    detailedDescription:
      "Botulinum toxin treatment temporarily relaxes the specific muscles responsible for dynamic expression lines — most commonly across the forehead, between the brows and around the eyes. Our approach is deliberately conservative: we treat to soften, not to freeze, so that movement and character are preserved.\n\nEvery treatment begins with a facial assessment in which we map your movement patterns at rest and in animation. Dosing is then planned for your anatomy rather than to a fixed template. Suitability, dosage and expected outcome are always determined during consultation.",
    benefits: [
      "Softens forehead lines, frown lines and crow's feet",
      "Preventative effect when started early",
      "No downtime — most patients return to work immediately",
      "Fully temporary and adjustable over time",
    ],
    suitableFor: [
      "Dynamic lines that appear with expression",
      "Early signs of ageing around the eyes and brow",
      "Excessive sweating of the underarms or palms",
      "Jaw clenching and facial slimming (masseter treatment)",
    ],
    treatmentProcess: [
      { step: 1, title: "Consultation & mapping", description: "A clinician assesses your facial movement and discusses the outcome you are looking for." },
      { step: 2, title: "Preparation", description: "The area is cleansed. Topical numbing is available but is rarely required." },
      { step: 3, title: "Injection", description: "A series of small injections is placed using a fine needle. This takes about ten minutes." },
      { step: 4, title: "Review", description: "We review you at two weeks to assess the result and refine if needed." },
    ],
    durationMinutes: 30,
    downtime: "None. Mild redness at injection points settles within an hour.",
    resultsTimeline: "Begins at 3–5 days, full effect at 2 weeks.",
    recommendedSessions: "Every 3–4 months to maintain",
    price: 25000,
    priceOnConsultation: false,
    isFeatured: true,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 1,
    galleryImageUrls: [],
    faqs: [
      { question: "Will I still look like myself?", answer: "Yes. We dose conservatively and treat to soften rather than immobilise, so your expressions remain natural. If you would prefer a stronger or lighter result, we adjust at your two-week review." },
      { question: "Is it painful?", answer: "Most patients describe it as a brief pinch. The needle used is very fine and each injection takes a second or two." },
      { question: "How long does it last?", answer: "Typically three to four months, though this varies between individuals and with the area treated." },
    ],
    relatedServiceIds: ["dermal-fillers", "skin-boosters", "microneedling"],
    concernTags: ["Fine Lines & Wrinkles", "Facial Volume"],
    seo: {
      title: "Botox in Islamabad — Expression Line Treatment",
      description:
        "Consultation-led Botox treatment at The Skin Atelier, F-11 Markaz Islamabad. Natural, conservative dosing for forehead lines, frown lines and crow's feet.",
    },
  }),

  service({
    id: "dermal-fillers",
    name: "Dermal Fillers",
    slug: "dermal-fillers",
    categoryId: "injectables",
    categoryName: "Injectables",
    shortDescription:
      "Hyaluronic acid fillers that restore volume and definition with an emphasis on balance, not change.",
    detailedDescription:
      "Hyaluronic acid is a substance your skin already produces. As it depletes with age, the face loses support, and features that once looked full can begin to look hollow or drawn. Dermal fillers replace that support in precise, measured amounts.\n\nWe treat the face as a whole rather than as isolated areas. Often the most natural result comes from restoring a structural area — the cheek or temple — rather than treating the line that first prompted the visit. Your plan is discussed and agreed in consultation before anything is injected.",
    benefits: [
      "Restores lost volume in cheeks, temples and midface",
      "Defines the jawline, chin and lip border",
      "Softens nasolabial folds and under-eye hollowing",
      "Reversible — hyaluronic acid filler can be dissolved",
    ],
    suitableFor: [
      "Midface flattening and volume loss",
      "Undefined jawline or chin projection",
      "Lip definition and subtle enhancement",
      "Tear trough hollowing (assessed carefully for suitability)",
    ],
    treatmentProcess: [
      { step: 1, title: "Facial assessment", description: "We assess proportion and structure across the whole face, not just the area of concern." },
      { step: 2, title: "Numbing", description: "Topical anaesthetic is applied; most fillers also contain lidocaine." },
      { step: 3, title: "Placement", description: "Filler is placed by needle or cannula depending on the area and depth required." },
      { step: 4, title: "Aftercare & review", description: "Aftercare instructions are given and a review is scheduled at two weeks." },
    ],
    durationMinutes: 45,
    downtime: "Mild swelling and occasional bruising for 2–5 days.",
    resultsTimeline: "Immediate, settling fully over 2–4 weeks.",
    recommendedSessions: "Longevity of 9–18 months depending on product and area",
    price: 45000,
    priceOnConsultation: false,
    isFeatured: true,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 2,
    galleryImageUrls: [],
    faqs: [
      { question: "Will my face look overfilled?", answer: "Not with a considered plan. We treat structurally and in stages, reviewing between sessions rather than placing large volumes at once." },
      { question: "Can filler be removed?", answer: "Hyaluronic acid fillers can be dissolved with an enzyme if you are unhappy or if it becomes clinically necessary." },
    ],
    relatedServiceIds: ["botox", "skin-boosters", "prp-therapy"],
    concernTags: ["Facial Volume", "Fine Lines & Wrinkles"],
  }),

  service({
    id: "prp-therapy",
    name: "PRP Therapy",
    slug: "prp-therapy",
    categoryId: "skin-treatments",
    categoryName: "Skin Treatments",
    shortDescription:
      "Platelet-rich plasma drawn from your own blood, used to stimulate repair in skin and scalp.",
    detailedDescription:
      "Platelet-rich plasma is prepared by taking a small sample of your own blood and concentrating the platelets, which carry the growth factors involved in tissue repair. That concentrate is then reintroduced into the skin or scalp to stimulate the body's own regenerative processes.\n\nBecause the material is autologous — entirely your own — the risk of allergic reaction is very low. PRP is used both for overall skin quality and as part of a hair restoration plan. Response varies between individuals and is assessed over a course rather than after a single session.",
    benefits: [
      "Uses your own biological material",
      "Improves skin texture, tone and fine crepiness",
      "Supports hair density as part of a wider plan",
      "Combines well with microneedling",
    ],
    suitableFor: [
      "Dull or tired-looking skin",
      "Early hair thinning and shedding",
      "Under-eye crepiness",
      "Patients who prefer a biological rather than synthetic approach",
    ],
    treatmentProcess: [
      { step: 1, title: "Blood draw", description: "A small sample of blood is taken, as for a routine blood test." },
      { step: 2, title: "Separation", description: "The sample is spun in a centrifuge to concentrate the platelets." },
      { step: 3, title: "Application", description: "The PRP is injected or applied with microneedling into the treatment area." },
      { step: 4, title: "Course review", description: "Progress is assessed across the course, typically at session three." },
    ],
    durationMinutes: 60,
    downtime: "Redness for 12–24 hours; scalp tenderness possible.",
    resultsTimeline: "Gradual, typically noticeable from 6–8 weeks.",
    recommendedSessions: "A course of 3–4 sessions, 4 weeks apart",
    price: 20000,
    priceOnConsultation: false,
    isFeatured: true,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 3,
    galleryImageUrls: [],
    faqs: [
      { question: "Is PRP safe?", answer: "PRP uses your own blood, so the risk of allergic reaction is very low. A full medical history is taken at consultation to confirm suitability." },
      { question: "Does PRP regrow hair?", answer: "PRP is used to support hair density and reduce shedding. It is not a guaranteed regrowth treatment, and results vary from person to person. Suitability is assessed at consultation." },
    ],
    relatedServiceIds: ["microneedling", "hair-restoration", "skin-boosters"],
    concernTags: ["Hair Loss", "Dull Skin", "Skin Texture"],
  }),

  service({
    id: "hydrafacial",
    name: "HydraFacial",
    slug: "hydrafacial",
    categoryId: "facial-treatments",
    categoryName: "Facial Treatments",
    shortDescription:
      "A medical-grade resurfacing facial that cleanses, extracts and hydrates in a single session.",
    detailedDescription:
      "HydraFacial combines gentle exfoliation, painless extraction and the infusion of targeted serums in one treatment. Unlike a traditional facial it uses a vortex tip that lifts debris from the pore while simultaneously delivering hydrating and antioxidant actives.\n\nIt is one of the few treatments that leaves the skin visibly better immediately and with no downtime, which makes it a common choice before an event. It is equally effective as a monthly maintenance treatment within a longer skin plan.",
    benefits: [
      "Immediate visible glow with no downtime",
      "Painless extraction of congestion",
      "Serums tailored to your skin on the day",
      "Suitable for most skin types including sensitive",
    ],
    suitableFor: [
      "Dull, congested or dehydrated skin",
      "Pre-event skin preparation",
      "Monthly maintenance alongside other treatments",
      "First-time patients new to clinical skincare",
    ],
    treatmentProcess: [
      { step: 1, title: "Cleanse & peel", description: "A gentle acid blend loosens dead cells and surface debris." },
      { step: 2, title: "Extract", description: "Vortex suction clears pores without the pinching of manual extraction." },
      { step: 3, title: "Hydrate", description: "Antioxidant and hyaluronic serums are infused into the skin." },
      { step: 4, title: "Protect", description: "The skin is finished with SPF and aftercare guidance." },
    ],
    durationMinutes: 45,
    downtime: "None.",
    resultsTimeline: "Immediately after treatment.",
    recommendedSessions: "Monthly for maintenance",
    price: 15000,
    priceOnConsultation: false,
    isFeatured: true,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 4,
    galleryImageUrls: [],
    faqs: [
      { question: "Can I have this before an event?", answer: "Yes — it is one of the few treatments with no downtime, and many patients book it two to three days before an event." },
    ],
    relatedServiceIds: ["chemical-peels", "microneedling", "skin-rejuvenation"],
    concernTags: ["Dull Skin", "Skin Texture", "Acne"],
  }),

  service({
    id: "microneedling",
    name: "Microneedling",
    slug: "microneedling",
    categoryId: "skin-treatments",
    categoryName: "Skin Treatments",
    shortDescription:
      "Controlled micro-injury that prompts the skin to rebuild collagen, refining texture and scarring.",
    detailedDescription:
      "Microneedling creates thousands of microscopic channels in the skin. These are small enough to heal rapidly but sufficient to trigger a wound-healing response, in which the skin lays down new collagen and elastin.\n\nIt is one of the most versatile treatments available for texture — used for acne scarring, enlarged pores, fine lines and overall skin quality. Depth is adjusted by area and indication. It is frequently combined with PRP for an enhanced effect.",
    benefits: [
      "Improves acne scarring and skin texture",
      "Refines the appearance of enlarged pores",
      "Stimulates the skin's own collagen production",
      "Safe across a wide range of skin tones",
    ],
    suitableFor: [
      "Acne scarring and post-inflammatory texture",
      "Enlarged pores and uneven surface",
      "Fine lines and early laxity",
      "Stretch marks (body treatment)",
    ],
    treatmentProcess: [
      { step: 1, title: "Numbing", description: "Topical anaesthetic is applied for 30 minutes before treatment." },
      { step: 2, title: "Treatment", description: "The device is passed over the area at a depth chosen for the indication." },
      { step: 3, title: "Infusion", description: "A recovery serum, or PRP where included, is applied to the treated skin." },
      { step: 4, title: "Aftercare", description: "Sun protection and a simplified routine are advised for 5–7 days." },
    ],
    durationMinutes: 60,
    downtime: "Redness resembling mild sunburn for 24–48 hours.",
    resultsTimeline: "Texture improves progressively from 4 weeks over the course.",
    recommendedSessions: "A course of 3–6 sessions, 4 weeks apart",
    price: 18000,
    priceOnConsultation: false,
    isFeatured: true,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 5,
    galleryImageUrls: [],
    faqs: [
      { question: "Will it help my acne scars?", answer: "Microneedling is one of the standard treatments for atrophic acne scarring and usually produces gradual improvement over a course. The degree of improvement depends on scar type and depth, which we assess at consultation." },
    ],
    relatedServiceIds: ["prp-therapy", "chemical-peels", "acne-scar-treatment"],
    concernTags: ["Scars", "Skin Texture", "Fine Lines & Wrinkles"],
  }),

  service({
    id: "chemical-peels",
    name: "Chemical Peels",
    slug: "chemical-peels",
    categoryId: "skin-treatments",
    categoryName: "Skin Treatments",
    shortDescription:
      "Medical-grade acid resurfacing, prescribed by strength and formulation for your skin.",
    detailedDescription:
      "A chemical peel uses a controlled acid solution to remove the outer layers of the skin, prompting the surface to renew. Peels range from superficial — a light refresh with no visible shedding — to medium depth, where the skin flakes over several days.\n\nFormulation matters more than strength alone. For pigmentation-prone skin, which is common in South Asian skin types, an unsuitable peel can worsen the very pigmentation it was meant to treat. Every peel here is selected after assessment, and courses usually begin conservatively.",
    benefits: [
      "Brightens dull and uneven skin tone",
      "Targets pigmentation and post-acne marks",
      "Clears congestion and refines texture",
      "Strength adjustable across a course",
    ],
    suitableFor: [
      "Uneven tone and pigmentation",
      "Post-inflammatory marks from acne",
      "Congested or rough-textured skin",
      "Dullness and sun damage",
    ],
    treatmentProcess: [
      { step: 1, title: "Assessment & prep", description: "Skin type is assessed and, where needed, prepared with home care beforehand." },
      { step: 2, title: "Application", description: "The peel is applied and timed carefully to the planned depth." },
      { step: 3, title: "Neutralise", description: "The solution is neutralised or self-neutralises depending on formulation." },
      { step: 4, title: "Aftercare", description: "Strict sun protection is essential for the following two weeks." },
    ],
    durationMinutes: 40,
    downtime: "None to 5 days of light flaking, depending on depth.",
    resultsTimeline: "Brightness within a week; pigmentation over a course.",
    recommendedSessions: "A course of 4–6, spaced 2–4 weeks apart",
    price: 12000,
    priceOnConsultation: false,
    isFeatured: false,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 6,
    galleryImageUrls: [],
    faqs: [
      { question: "Is a peel safe for deeper skin tones?", answer: "Yes, with the correct formulation. Deeper skin tones carry a higher risk of post-inflammatory pigmentation, so we select the peel and depth accordingly and often prepare the skin beforehand." },
    ],
    relatedServiceIds: ["hydrafacial", "pigmentation-treatment", "acne-treatment"],
    concernTags: ["Pigmentation", "Dull Skin", "Acne", "Skin Texture"],
  }),

  service({
    id: "skin-boosters",
    name: "Skin Boosters",
    slug: "skin-boosters",
    categoryId: "injectables",
    categoryName: "Injectables",
    shortDescription:
      "Micro-injections of stabilised hyaluronic acid that hydrate the skin from within.",
    detailedDescription:
      "Skin boosters are not volumising fillers. They are fine, evenly distributed micro-injections of stabilised hyaluronic acid placed within the skin to improve hydration, elasticity and light reflection.\n\nThe result is a change in skin quality rather than shape — skin that looks better hydrated and smoother, particularly across the cheeks, neck and décolletage. Because the change is in quality rather than contour, it suits patients who want improvement without any alteration to their features.",
    benefits: [
      "Deep, lasting hydration within the skin",
      "Improves fine crepiness and light reflection",
      "No change to facial shape or volume",
      "Suitable for face, neck, décolletage and hands",
    ],
    suitableFor: [
      "Dehydrated or dull skin",
      "Fine crepiness on the cheeks or neck",
      "Patients wanting quality change without volume",
      "Pre-event skin preparation over a course",
    ],
    treatmentProcess: [
      { step: 1, title: "Numbing", description: "Topical anaesthetic is applied to the treatment area." },
      { step: 2, title: "Micro-injection", description: "Small deposits are placed evenly across the area in a grid pattern." },
      { step: 3, title: "Settle", description: "Small bumps settle within 24–48 hours." },
      { step: 4, title: "Course", description: "Usually a course of two to three, a month apart." },
    ],
    durationMinutes: 45,
    downtime: "Small injection bumps for 24–48 hours.",
    resultsTimeline: "Progressive over 4–6 weeks.",
    recommendedSessions: "2–3 sessions, then every 6 months",
    price: 30000,
    priceOnConsultation: false,
    isFeatured: false,
    isActive: true,
    showOnHomepage: false,
    showInCategory: true,
    displayOrder: 7,
    galleryImageUrls: [],
    faqs: [],
    relatedServiceIds: ["prp-therapy", "microneedling", "dermal-fillers"],
    concernTags: ["Dull Skin", "Skin Texture", "Fine Lines & Wrinkles"],
  }),

  service({
    id: "laser-hair-removal",
    name: "Laser Hair Removal",
    slug: "laser-hair-removal",
    categoryId: "laser-treatments",
    categoryName: "Laser Treatments",
    shortDescription:
      "Long-term hair reduction using wavelengths selected for your skin tone and hair type.",
    detailedDescription:
      "Laser hair removal targets the pigment in the hair follicle during its active growth phase. Because only a proportion of hairs are in that phase at any time, a course of sessions is always required.\n\nSkin tone determines which wavelength is appropriate. Using the wrong device on deeper skin risks burns and pigmentation, so a patch test is carried out before the first full session, without exception. Expect long-term reduction in density and thickness rather than permanent removal of every hair.",
    benefits: [
      "Long-term reduction in hair density and thickness",
      "Wavelength matched to your skin tone",
      "Reduces ingrown hairs and folliculitis",
      "Treats small and large areas alike",
    ],
    suitableFor: [
      "Unwanted facial or body hair",
      "Ingrown hairs and razor irritation",
      "Hirsutism, alongside medical assessment",
      "Patients seeking an alternative to waxing",
    ],
    treatmentProcess: [
      { step: 1, title: "Patch test", description: "A mandatory patch test is performed at least 24 hours before the first session." },
      { step: 2, title: "Preparation", description: "The area is shaved and cooled before treatment." },
      { step: 3, title: "Treatment", description: "The handpiece is passed over the area with integrated cooling." },
      { step: 4, title: "Course", description: "Sessions are spaced 4–6 weeks apart to match the growth cycle." },
    ],
    durationMinutes: 30,
    downtime: "Mild redness and follicular swelling for a few hours.",
    resultsTimeline: "Progressive reduction across the course.",
    recommendedSessions: "6–8 sessions, 4–6 weeks apart",
    price: null,
    priceOnConsultation: true,
    isFeatured: true,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 8,
    galleryImageUrls: [],
    faqs: [
      { question: "Is it permanent?", answer: "Laser produces long-term hair reduction rather than permanent removal. Most patients need occasional maintenance sessions after completing a course." },
      { question: "Is it safe for my skin tone?", answer: "We select the wavelength for your skin tone and always patch test first. This is why a consultation is required before booking a first session." },
    ],
    relatedServiceIds: ["skin-rejuvenation", "pigmentation-treatment"],
    concernTags: ["Skin Texture"],
  }),

  service({
    id: "acne-treatment",
    name: "Acne Treatment",
    slug: "acne-treatment",
    categoryId: "dermatology",
    categoryName: "Dermatology",
    shortDescription:
      "Medically led acne management combining prescription care with in-clinic treatment.",
    detailedDescription:
      "Acne is a medical condition, not a cosmetic one, and it responds best to a plan that addresses its cause rather than only its appearance. Assessment covers severity, distribution, scarring risk and any hormonal or lifestyle contributors.\n\nA plan typically combines topical or oral prescription treatment with in-clinic procedures such as peels or extractions, plus a simplified home routine. Active acne is stabilised before any scar treatment is considered, since treating scarring too early gives a poorer result.",
    benefits: [
      "Addresses the cause, not just the surface",
      "Reduces the risk of permanent scarring",
      "Prescription options where clinically appropriate",
      "Ongoing review as the skin changes",
    ],
    suitableFor: [
      "Persistent or recurring breakouts",
      "Hormonal acne along the jawline",
      "Acne that has not responded to over-the-counter care",
      "Patients concerned about scarring",
    ],
    treatmentProcess: [
      { step: 1, title: "Medical assessment", description: "Severity, triggers and history are reviewed by a clinician." },
      { step: 2, title: "Plan", description: "A combined prescription and in-clinic plan is agreed with you." },
      { step: 3, title: "Treatment phase", description: "In-clinic sessions run alongside your home routine." },
      { step: 4, title: "Review", description: "Progress is reviewed at 6–8 weeks and the plan adjusted." },
    ],
    durationMinutes: 45,
    downtime: "Varies by the procedures included in your plan.",
    resultsTimeline: "Meaningful change typically from 8–12 weeks.",
    recommendedSessions: "Ongoing plan with review at 6–8 weeks",
    price: null,
    priceOnConsultation: true,
    isFeatured: false,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 9,
    galleryImageUrls: [],
    faqs: [
      { question: "How quickly will my acne clear?", answer: "Acne treatment is gradual. Most plans show meaningful change by eight to twelve weeks, and some treatments cause an initial purge before improvement. Your clinician will set expectations for your specific plan." },
    ],
    relatedServiceIds: ["chemical-peels", "acne-scar-treatment", "hydrafacial"],
    concernTags: ["Acne", "Skin Texture"],
  }),

  service({
    id: "pigmentation-treatment",
    name: "Pigmentation Treatment",
    slug: "pigmentation-treatment",
    categoryId: "dermatology",
    categoryName: "Dermatology",
    shortDescription:
      "Targeted management of melasma, sun damage and post-inflammatory pigmentation.",
    detailedDescription:
      "Pigmentation is among the most common concerns we see, and among the most easily made worse by the wrong treatment. Melasma in particular is a chronic, relapsing condition that requires management rather than a one-off procedure.\n\nAssessment first establishes the type of pigmentation, because sun damage, melasma and post-inflammatory marks respond to different approaches. Treatment combines prescription topicals, carefully chosen in-clinic procedures and rigorous daily sun protection, which is the single most important factor in the outcome.",
    benefits: [
      "Correct identification of pigmentation type",
      "Plans designed for pigment-prone skin",
      "Combines topical, in-clinic and photoprotection",
      "Focus on preventing recurrence",
    ],
    suitableFor: [
      "Melasma and hormonal pigmentation",
      "Sun-induced pigmentation and uneven tone",
      "Post-inflammatory marks after acne or injury",
      "Patients whose pigmentation has returned after treatment elsewhere",
    ],
    treatmentProcess: [
      { step: 1, title: "Diagnosis", description: "The type and depth of pigmentation is established at consultation." },
      { step: 2, title: "Preparation", description: "Skin is prepared with prescribed topicals before any procedure." },
      { step: 3, title: "In-clinic treatment", description: "Peels or laser are introduced cautiously where appropriate." },
      { step: 4, title: "Maintenance", description: "A long-term maintenance and photoprotection plan is put in place." },
    ],
    durationMinutes: 45,
    downtime: "Varies by the procedures included.",
    resultsTimeline: "Gradual over 3–6 months, with maintenance ongoing.",
    recommendedSessions: "Ongoing plan with regular review",
    price: null,
    priceOnConsultation: true,
    isFeatured: false,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 10,
    galleryImageUrls: [],
    faqs: [
      { question: "Will my melasma come back?", answer: "Melasma is a chronic condition that tends to relapse, particularly with sun exposure and hormonal change. It is managed rather than cured, and daily sun protection is essential to holding the result." },
    ],
    relatedServiceIds: ["chemical-peels", "skin-rejuvenation", "microneedling"],
    concernTags: ["Pigmentation", "Dull Skin"],
  }),

  service({
    id: "hair-restoration",
    name: "Hair Restoration",
    slug: "hair-restoration",
    categoryId: "hair-treatments",
    categoryName: "Hair Treatments",
    shortDescription:
      "Medical assessment of hair loss with a plan combining PRP, mesotherapy and prescription care.",
    detailedDescription:
      "Hair loss has many causes — genetic, hormonal, nutritional, inflammatory — and effective treatment depends on identifying which is at work. Assessment includes history, scalp examination and, where indicated, blood tests.\n\nA plan may combine in-clinic PRP or mesotherapy with prescription topical or oral treatment. The realistic goal for most patients is to slow loss, thicken existing hair and support regrowth where follicles remain viable. Outcomes vary considerably between individuals.",
    benefits: [
      "Identifies the cause before treating",
      "Combines in-clinic and prescription approaches",
      "Supports density and reduces shedding",
      "Progress tracked with standardised photography",
    ],
    suitableFor: [
      "Male and female pattern hair loss",
      "Diffuse thinning and increased shedding",
      "Post-illness or post-partum hair loss",
      "Patients wanting assessment before considering transplant",
    ],
    treatmentProcess: [
      { step: 1, title: "Assessment", description: "History, scalp examination and blood tests where indicated." },
      { step: 2, title: "Plan", description: "A combined in-clinic and home plan is agreed." },
      { step: 3, title: "Treatment course", description: "Monthly in-clinic sessions alongside daily home treatment." },
      { step: 4, title: "Review", description: "Standardised photographs compared at three and six months." },
    ],
    durationMinutes: 60,
    downtime: "Scalp tenderness for up to 24 hours.",
    resultsTimeline: "Reduced shedding from 8 weeks; density from 4–6 months.",
    recommendedSessions: "Monthly for 4 sessions, then maintenance",
    price: null,
    priceOnConsultation: true,
    isFeatured: true,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 11,
    galleryImageUrls: [],
    faqs: [
      { question: "Will my hair grow back completely?", answer: "That depends on the cause and how long the loss has been present. Where follicles remain viable, density can improve; where they are no longer active, treatment focuses on protecting what remains. Your clinician will give you a realistic expectation after assessment." },
    ],
    relatedServiceIds: ["prp-therapy"],
    concernTags: ["Hair Loss"],
  }),

  service({
    id: "skin-rejuvenation",
    name: "Skin Rejuvenation",
    slug: "skin-rejuvenation",
    categoryId: "skin-treatments",
    categoryName: "Skin Treatments",
    shortDescription:
      "A combined programme addressing tone, texture and firmness rather than a single concern.",
    detailedDescription:
      "Skin rejuvenation is a plan rather than a single procedure. Where one concern dominates, a targeted treatment is usually the right answer; where skin has simply lost its overall quality, a combination approach delivers more than any one treatment can.\n\nA programme is built from the treatments best suited to your skin — commonly resurfacing, collagen stimulation and hydration — sequenced across several months. The plan is agreed at consultation and adjusted as your skin responds.",
    benefits: [
      "Addresses several concerns in one sequenced plan",
      "Treatments selected for your skin, not a fixed package",
      "Progress reviewed and the plan adjusted",
      "Home care integrated with in-clinic work",
    ],
    suitableFor: [
      "General loss of skin quality and radiance",
      "Combination of texture, tone and fine lines",
      "Sun-damaged skin",
      "Patients unsure which single treatment they need",
    ],
    treatmentProcess: [
      { step: 1, title: "Skin consultation", description: "A full assessment of tone, texture, hydration and laxity." },
      { step: 2, title: "Programme design", description: "A sequence of treatments is planned across three to six months." },
      { step: 3, title: "Treatment phase", description: "Sessions are delivered in the planned order with home care alongside." },
      { step: 4, title: "Review", description: "Standardised photography compared at the end of the programme." },
    ],
    durationMinutes: 60,
    downtime: "Varies by the treatments included.",
    resultsTimeline: "Progressive across the programme.",
    recommendedSessions: "Programme of 4–6 treatments over 3–6 months",
    price: null,
    priceOnConsultation: true,
    isFeatured: false,
    isActive: true,
    showOnHomepage: true,
    showInCategory: true,
    displayOrder: 12,
    galleryImageUrls: [],
    faqs: [],
    relatedServiceIds: ["hydrafacial", "microneedling", "chemical-peels", "skin-boosters"],
    concernTags: ["Dull Skin", "Skin Texture", "Fine Lines & Wrinkles"],
  }),

  service({
    id: "acne-scar-treatment",
    name: "Acne Scar Treatment",
    slug: "acne-scar-treatment",
    categoryId: "skin-treatments",
    categoryName: "Skin Treatments",
    shortDescription:
      "Scar-type-specific treatment combining resurfacing, subcision and collagen stimulation.",
    detailedDescription:
      "Acne scars are not all the same. Rolling, boxcar and ice-pick scars each respond to different techniques, and most patients have a mixture. Treating them all with a single modality is the most common reason results disappoint.\n\nAssessment maps the scar types present, and a plan combines the appropriate techniques — which may include microneedling, subcision, resurfacing or filler. Active acne must be controlled first. Improvement is realistic; complete erasure is not, and we will be direct with you about the likely extent.",
    benefits: [
      "Scar types mapped and treated individually",
      "Combination approach rather than one modality",
      "Realistic expectations set before starting",
      "Progress tracked with standardised photography",
    ],
    suitableFor: [
      "Rolling, boxcar or ice-pick scarring",
      "Post-acne texture irregularity",
      "Patients whose active acne is now controlled",
      "Those disappointed by single-modality treatment elsewhere",
    ],
    treatmentProcess: [
      { step: 1, title: "Scar mapping", description: "Scar types are identified and photographed under standardised lighting." },
      { step: 2, title: "Plan", description: "Techniques are selected per scar type and sequenced." },
      { step: 3, title: "Treatment course", description: "Sessions are delivered 4–6 weeks apart." },
      { step: 4, title: "Review", description: "Photographs compared at the end of the course." },
    ],
    durationMinutes: 75,
    downtime: "3–7 days depending on the techniques used.",
    resultsTimeline: "Progressive over 3–6 months as collagen remodels.",
    recommendedSessions: "A course of 4–6 sessions",
    price: null,
    priceOnConsultation: true,
    isFeatured: false,
    isActive: true,
    showOnHomepage: false,
    showInCategory: true,
    displayOrder: 13,
    galleryImageUrls: [],
    faqs: [
      { question: "Can acne scars be removed completely?", answer: "Realistic improvement is achievable, often substantial, but complete removal is not. We will tell you at consultation what degree of improvement is likely for your particular scar types." },
    ],
    relatedServiceIds: ["microneedling", "acne-treatment", "chemical-peels"],
    concernTags: ["Scars", "Skin Texture"],
  }),

  service({
    id: "body-contouring",
    name: "Body Contouring",
    slug: "body-contouring",
    categoryId: "body-treatments",
    categoryName: "Body Treatments",
    shortDescription:
      "Non-surgical treatments for localised fat and skin laxity, for patients near their target weight.",
    detailedDescription:
      "Non-surgical body contouring addresses localised, stubborn fat deposits and mild skin laxity. It is not a weight-loss treatment, and it works best for patients already close to their target weight who have specific areas that have not responded to diet and exercise.\n\nSuitability is assessed carefully: the treatments available here will not produce a meaningful result for generalised weight concerns, and we will say so rather than sell a course that cannot deliver.",
    benefits: [
      "Targets specific, localised areas",
      "Non-surgical with minimal downtime",
      "Honest assessment of likely benefit",
      "Can be combined across areas",
    ],
    suitableFor: [
      "Localised fat pockets resistant to diet and exercise",
      "Patients near their target weight",
      "Mild skin laxity after weight loss",
      "Post-pregnancy abdominal changes, once cleared",
    ],
    treatmentProcess: [
      { step: 1, title: "Assessment", description: "Suitability, measurements and photographs are taken." },
      { step: 2, title: "Plan", description: "Areas and the number of sessions are agreed." },
      { step: 3, title: "Treatment", description: "Sessions are delivered on the agreed schedule." },
      { step: 4, title: "Review", description: "Measurements and photographs compared at twelve weeks." },
    ],
    durationMinutes: 60,
    downtime: "Mild tenderness for a few days.",
    resultsTimeline: "Gradual over 8–12 weeks.",
    recommendedSessions: "A course, determined at assessment",
    price: null,
    priceOnConsultation: true,
    isFeatured: false,
    isActive: true,
    showOnHomepage: false,
    showInCategory: true,
    displayOrder: 14,
    galleryImageUrls: [],
    faqs: [
      { question: "Is this a weight-loss treatment?", answer: "No. Body contouring targets localised fat deposits in patients who are already close to their target weight. It is not a substitute for weight loss and will not produce a meaningful result for generalised weight concerns." },
    ],
    relatedServiceIds: ["skin-rejuvenation"],
    concernTags: ["Body Contouring"],
  }),
];

/* -------------------------------------------------------------------------- */
/* Doctors                                                                    */
/* -------------------------------------------------------------------------- */

export const DEFAULT_DOCTORS: Doctor[] = [
  {
    ...base,
    id: "dr-sara-ahmed",
    branchId: DEFAULT_BRANCH_ID,
    fullName: "Dr. Sara Ahmed",
    slug: "dr-sara-ahmed",
    title: "Consultant Dermatologist & Medical Director",
    qualifications: ["MBBS", "FCPS (Dermatology)", "Diploma in Aesthetic Medicine"],
    specialties: ["Medical Dermatology", "Injectables", "Pigmentation", "Acne"],
    bio: "Dr. Sara Ahmed founded The Skin Atelier with a conviction that aesthetic medicine belongs in clinical hands. Her practice is built on diagnosis first — understanding why a skin is behaving the way it is before deciding what to do about it.\n\nShe has a particular interest in pigmentation disorders and acne in South Asian skin, where the margin between an effective treatment and one that worsens the problem is narrow. Her approach to injectables is deliberately conservative, favouring structural balance over volume.",
    yearsExperience: 12,
    consultationFee: 5000,
    serviceIds: ["botox", "dermal-fillers", "acne-treatment", "pigmentation-treatment", "chemical-peels"],
    languages: ["English", "Urdu"],
    isPublished: true,
    displayOrder: 1,
  },
  {
    ...base,
    id: "dr-hina-malik",
    branchId: DEFAULT_BRANCH_ID,
    fullName: "Dr. Hina Malik",
    slug: "dr-hina-malik",
    title: "Aesthetic Physician",
    qualifications: ["MBBS", "MSc Aesthetic Medicine"],
    specialties: ["Skin Rejuvenation", "Microneedling", "PRP", "Skin Boosters"],
    bio: "Dr. Hina Malik focuses on skin quality — the texture, tone and light reflection that make skin look well rather than simply younger. She works predominantly with collagen-stimulating treatments and regenerative approaches such as PRP.\n\nShe is known among her patients for planning in courses rather than single sessions, and for setting expectations plainly at the outset about what each stage will and will not achieve.",
    yearsExperience: 8,
    consultationFee: 4000,
    serviceIds: ["microneedling", "prp-therapy", "skin-boosters", "skin-rejuvenation", "hydrafacial"],
    languages: ["English", "Urdu"],
    isPublished: true,
    displayOrder: 2,
  },
  {
    ...base,
    id: "dr-ayesha-tariq",
    branchId: DEFAULT_BRANCH_ID,
    fullName: "Dr. Ayesha Tariq",
    slug: "dr-ayesha-tariq",
    title: "Trichologist & Hair Restoration Lead",
    qualifications: ["MBBS", "Diploma in Trichology"],
    specialties: ["Hair Loss", "PRP for Hair", "Scalp Health"],
    bio: "Dr. Ayesha Tariq leads the hair restoration service. Her assessments begin with cause rather than treatment — examining the scalp, reviewing history and, where indicated, investigating nutritional and hormonal contributors before any plan is proposed.\n\nShe tracks every patient with standardised photography, which she regards as the only honest way to judge whether a hair treatment is working.",
    yearsExperience: 7,
    consultationFee: 4000,
    serviceIds: ["hair-restoration", "prp-therapy"],
    languages: ["English", "Urdu", "Punjabi"],
    isPublished: true,
    displayOrder: 3,
  },
];

/* -------------------------------------------------------------------------- */
/* Packages                                                                   */
/* -------------------------------------------------------------------------- */

export const DEFAULT_PACKAGES: Package[] = [
  {
    ...base,
    id: "bridal-glow",
    name: "Bridal Glow",
    slug: "bridal-glow",
    description:
      "A structured programme beginning three months before the wedding, sequencing resurfacing and hydration so the skin peaks on the day rather than before it.",
    items: [
      { serviceId: "hydrafacial", serviceName: "HydraFacial", sessions: 3 },
      { serviceId: "chemical-peels", serviceName: "Chemical Peels", sessions: 2 },
      { serviceId: "skin-boosters", serviceName: "Skin Boosters", sessions: 1 },
    ],
    totalSessions: 6,
    price: 85000,
    compareAtPrice: 108000,
    validityDays: 120,
    isActive: true,
    isFeatured: true,
    displayOrder: 1,
    terms: "Sessions are scheduled by the clinic to a timeline that ends one week before the event. Suitability confirmed at consultation.",
  },
  {
    ...base,
    id: "skin-rejuvenation-programme",
    name: "Skin Rejuvenation Programme",
    slug: "skin-rejuvenation-programme",
    description:
      "A six-treatment programme combining collagen stimulation and resurfacing, designed for skin that has lost overall quality rather than for one specific concern.",
    items: [
      { serviceId: "microneedling", serviceName: "Microneedling", sessions: 3 },
      { serviceId: "hydrafacial", serviceName: "HydraFacial", sessions: 3 },
    ],
    totalSessions: 6,
    price: 78000,
    compareAtPrice: 99000,
    validityDays: 180,
    isActive: true,
    isFeatured: true,
    displayOrder: 2,
  },
  {
    ...base,
    id: "acne-recovery",
    name: "Acne Recovery",
    slug: "acne-recovery",
    description:
      "Three months of combined in-clinic and prescription care to bring active acne under control, with review built in at the six-week mark.",
    items: [
      { serviceId: "acne-treatment", serviceName: "Acne Treatment", sessions: 3 },
      { serviceId: "chemical-peels", serviceName: "Chemical Peels", sessions: 3 },
    ],
    totalSessions: 6,
    price: 55000,
    compareAtPrice: 72000,
    validityDays: 150,
    isActive: true,
    isFeatured: true,
    displayOrder: 3,
  },
  {
    ...base,
    id: "hair-restoration-course",
    name: "Hair Restoration Course",
    slug: "hair-restoration-course",
    description:
      "Four monthly PRP sessions with trichology review, standardised photography at baseline and completion, and a home treatment plan throughout.",
    items: [{ serviceId: "hair-restoration", serviceName: "Hair Restoration", sessions: 4 }],
    totalSessions: 4,
    price: 68000,
    compareAtPrice: 80000,
    validityDays: 180,
    isActive: true,
    isFeatured: true,
    displayOrder: 4,
  },
  {
    ...base,
    id: "anti-ageing",
    name: "Anti-Ageing",
    slug: "anti-ageing",
    description:
      "A combined injectable and skin-quality plan addressing expression lines, structural support and hydration together, reviewed at two weeks.",
    items: [
      { serviceId: "botox", serviceName: "Botox", sessions: 1 },
      { serviceId: "skin-boosters", serviceName: "Skin Boosters", sessions: 2 },
    ],
    totalSessions: 3,
    price: 72000,
    compareAtPrice: 85000,
    validityDays: 180,
    isActive: true,
    isFeatured: false,
    displayOrder: 5,
  },
  {
    ...base,
    id: "monthly-skin-membership",
    name: "Monthly Skin Membership",
    slug: "monthly-skin-membership",
    description:
      "One maintenance facial each month with priority booking and a standing discount on additional treatments and prescribed skincare.",
    items: [{ serviceId: "hydrafacial", serviceName: "HydraFacial", sessions: 12 }],
    totalSessions: 12,
    price: 144000,
    compareAtPrice: 180000,
    validityDays: 365,
    isActive: true,
    isFeatured: false,
    displayOrder: 6,
    terms: "Billed annually. One session per calendar month; unused sessions do not roll over.",
  },
];

/* -------------------------------------------------------------------------- */
/* Testimonials                                                               */
/* -------------------------------------------------------------------------- */

export const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    ...base,
    id: "t1",
    authorName: "Mahnoor A.",
    rating: 5,
    body: "I had been to three clinics about my melasma before this one. Dr. Sara was the first person to explain what was actually causing it rather than just offering me a laser. Six months on and it is the best my skin has looked in years.",
    serviceName: "Pigmentation Treatment",
    source: "Google",
    isVisible: true,
    displayOrder: 1,
  },
  {
    ...base,
    id: "t2",
    authorName: "Zainab K.",
    rating: 5,
    body: "What I appreciated most was being told what would not work. I came in asking for filler and left with a plan for skin quality instead, which was clearly the right call.",
    serviceName: "Skin Boosters",
    source: "Google",
    isVisible: true,
    displayOrder: 2,
  },
  {
    ...base,
    id: "t3",
    authorName: "Fatima R.",
    rating: 5,
    body: "The bridal programme was properly planned around my date rather than sold as a bundle. My skin peaked exactly when it needed to. The clinic itself is beautiful and calm.",
    serviceName: "Bridal Glow",
    source: "Instagram",
    isVisible: true,
    displayOrder: 3,
  },
  {
    ...base,
    id: "t4",
    authorName: "Hassan M.",
    rating: 5,
    body: "Went in about hair thinning expecting to be sold a transplant. Instead I had blood tests, a proper diagnosis and a treatment course. Shedding stopped within two months.",
    serviceName: "Hair Restoration",
    source: "Google",
    isVisible: true,
    displayOrder: 4,
  },
  {
    ...base,
    id: "t5",
    authorName: "Ayesha S.",
    rating: 5,
    body: "Conservative with the Botox, which is exactly what I wanted. I still look like me, just less tired. The two-week review is a nice touch that I have not had elsewhere.",
    serviceName: "Botox",
    source: "Google",
    isVisible: true,
    displayOrder: 5,
  },
  {
    ...base,
    id: "t6",
    authorName: "Sana T.",
    rating: 5,
    body: "My acne scarring was mapped out scar by scar and treated differently in different areas. It is the first time anyone has explained why previous treatments did so little.",
    serviceName: "Acne Scar Treatment",
    source: "In-clinic",
    isVisible: true,
    displayOrder: 6,
  },
];

/* -------------------------------------------------------------------------- */
/* FAQs                                                                       */
/* -------------------------------------------------------------------------- */

export const DEFAULT_FAQS: Faq[] = [
  {
    ...base,
    id: "f1",
    question: "Do I need a consultation before treatment?",
    answer:
      "Yes. Every treatment at The Skin Atelier begins with a consultation, because suitability depends on your skin, your medical history and what you are trying to achieve. For some treatments — laser in particular — a patch test is also required before the first session.",
    category: "Appointments",
    displayOrder: 1,
    isVisible: true,
    showOnFaqPage: true,
  },
  {
    ...base,
    id: "f2",
    question: "How do I book an appointment?",
    answer:
      "You can request an appointment through the booking form on this site, by calling 0337 5977799, or on WhatsApp. A request is not a confirmed booking — our front desk will contact you to confirm the time, the clinician and any preparation required.",
    category: "Appointments",
    displayOrder: 2,
    isVisible: true,
    showOnFaqPage: true,
  },
  {
    ...base,
    id: "f3",
    question: "Are results guaranteed?",
    answer:
      "No, and you should be cautious of any clinic that says otherwise. Results vary from person to person depending on skin type, the condition being treated, age, medical history and how closely aftercare is followed. Your clinician will give you a realistic expectation for your specific case at consultation.",
    category: "Treatments",
    displayOrder: 3,
    isVisible: true,
    showOnFaqPage: true,
  },
  {
    ...base,
    id: "f4",
    question: "Are the treatments safe for deeper skin tones?",
    answer:
      "Yes, when the treatment and settings are chosen correctly. South Asian and deeper skin tones carry a higher risk of post-inflammatory pigmentation, which is precisely why device settings, peel formulations and treatment depths are selected individually rather than from a fixed protocol.",
    category: "Treatments",
    displayOrder: 4,
    isVisible: true,
    showOnFaqPage: true,
  },
  {
    ...base,
    id: "f5",
    question: "Is there any downtime?",
    answer:
      "It depends entirely on the treatment. HydraFacial and Botox have effectively none. Microneedling leaves redness for a day or two. Medium-depth peels and combined scar treatments can involve several days of flaking. Downtime is always discussed before you commit to a treatment.",
    category: "Treatments",
    displayOrder: 5,
    isVisible: true,
    showOnFaqPage: true,
  },
  {
    ...base,
    id: "f6",
    question: "How much do treatments cost?",
    answer:
      "Prices for standard treatments are listed on each service page. Some treatments — laser, acne and pigmentation plans, hair restoration and body contouring — are priced after consultation, because the plan depends on the assessment. We will always give you a written plan and cost before you commit.",
    category: "Pricing",
    displayOrder: 6,
    isVisible: true,
    showOnFaqPage: true,
  },
  {
    ...base,
    id: "f7",
    question: "Do you offer packages?",
    answer:
      "Yes. Packages are available for treatments that are naturally delivered as a course, and they are priced below the equivalent individual sessions. Package sessions are tracked in your patient record so you can always see how many remain.",
    category: "Pricing",
    displayOrder: 7,
    isVisible: true,
    showOnFaqPage: true,
  },
  {
    ...base,
    id: "f8",
    question: "What payment methods do you accept?",
    answer:
      "Cash, card, bank transfer, Easypaisa and JazzCash. A receipt is issued for every payment.",
    category: "Pricing",
    displayOrder: 8,
    isVisible: true,
    showOnFaqPage: true,
  },
  {
    ...base,
    id: "f9",
    question: "Will my photographs or records ever be shared?",
    answer:
      "Not without your explicit written consent. Clinical photographs are stored privately and are visible only to your treating clinician. A photograph appears on this website only if you have given specific consent for publication, and you may withdraw that consent at any time, after which the image is removed.",
    category: "Privacy",
    displayOrder: 9,
    isVisible: true,
    showOnFaqPage: true,
  },
  {
    ...base,
    id: "f10",
    question: "Where are you located and when are you open?",
    answer:
      "We are at MXMQ+83H, F-11 Markaz, Islamabad. The clinic is open daily; Friday hours are shorter to accommodate prayers. Exact hours are listed in the footer of every page.",
    category: "Clinic",
    displayOrder: 10,
    isVisible: true,
    showOnFaqPage: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

export const DEFAULT_MENUS: Menu[] = [
  {
    ...base,
    id: "primary",
    key: "primary",
    name: "Primary Navigation",
    items: [
      { id: "n1", label: "Treatments", url: "/services", order: 1 },
      { id: "n2", label: "Results", url: "/results", order: 2 },
      { id: "n3", label: "Experts", url: "/doctors", order: 3 },
      { id: "n4", label: "Packages", url: "/packages", order: 4 },
      { id: "n5", label: "Journal", url: "/blog", order: 5 },
      { id: "n6", label: "About", url: "/about", order: 6 },
      { id: "n7", label: "Contact", url: "/contact", order: 7 },
    ],
  },
  {
    ...base,
    id: "footer-services",
    key: "footer-services",
    name: "Footer — Treatments",
    items: [
      { id: "s1", label: "Botox", url: "/services/botox", order: 1 },
      { id: "s2", label: "Dermal Fillers", url: "/services/dermal-fillers", order: 2 },
      { id: "s3", label: "PRP Therapy", url: "/services/prp-therapy", order: 3 },
      { id: "s4", label: "HydraFacial", url: "/services/hydrafacial", order: 4 },
      { id: "s5", label: "Microneedling", url: "/services/microneedling", order: 5 },
      { id: "s6", label: "Laser Hair Removal", url: "/services/laser-hair-removal", order: 6 },
    ],
  },
  {
    ...base,
    id: "footer-clinic",
    key: "footer-clinic",
    name: "Footer — Clinic",
    items: [
      { id: "c1", label: "About Us", url: "/about", order: 1 },
      { id: "c2", label: "Our Experts", url: "/doctors", order: 2 },
      { id: "c3", label: "Before & After", url: "/results", order: 3 },
      { id: "c4", label: "Gallery", url: "/gallery", order: 4 },
      { id: "c5", label: "Skin Journal", url: "/blog", order: 5 },
      { id: "c6", label: "FAQ", url: "/faq", order: 6 },
    ],
  },
  {
    ...base,
    id: "legal",
    key: "legal",
    name: "Legal",
    items: [
      { id: "l1", label: "Privacy Policy", url: "/privacy", order: 1 },
      { id: "l2", label: "Terms & Conditions", url: "/terms", order: 2 },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Gallery                                                                    */
/* -------------------------------------------------------------------------- */

export const DEFAULT_GALLERY: GalleryItem[] = [
  { alt: "Consultation room with natural light", social: false },
  { alt: "Treatment suite at The Skin Atelier", social: false },
  { alt: "Clinic reception and waiting area", social: false },
  { alt: "Medical-grade skincare on display", social: true },
  { alt: "Detail of the clinic interior", social: true },
  { alt: "Clinician preparing a treatment", social: true },
  { alt: "Skincare products arranged on marble", social: true },
  { alt: "Clinic entrance at F-11 Markaz", social: true },
].map((g, i) => ({
  ...base,
  id: `g${i + 1}`,
  imageUrl: "",
  altText: g.alt,
  isSocial: g.social,
  displayOrder: i + 1,
  isVisible: true,
}));
