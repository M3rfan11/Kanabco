// The FAQ page's questions and answers, from Website_FAQs.docx (cleaned, November 2026).
// Edit the text here; the page and its search-engine data read this file.
//
// An entry with `pending` is not shown: it still has a detail to confirm. Fill it in, then delete `pending`.

export type FaqLink = { href: string; label: string }

export type FaqItem = {
  id: string
  question: string
  /** One string per paragraph. */
  answer: string[]
  link?: FaqLink
  /** What must be confirmed before this question goes on the site. */
  pending?: string
}

export type FaqSection = { id: string; title: string; items: FaqItem[] }

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: "products",
    title: "Products & Shopping",
    items: [
      {
        id: "furniture",
        question: "What furniture does Kanabco have?",
        answer: [
          "Kanabco offers seating, sofas, room sets, tables, and bedroom furniture. Via our Customisation Tool, we can also build sofas, beds and headboards, wardrobes, dressers, dressing rooms and kitchens to your exact dimensions.",
        ],
      },
      {
        id: "dimensions",
        question: "Where can I find the product dimensions?",
        // The document's second sentence was unfinished ("Because our pieces are handcrafted ..."):
        // add it here once its wording is agreed.
        answer: ["Dimensions are listed in the product details on each product page."],
      },
      {
        id: "colours",
        question: "What colours, materials and finishes are available?",
        answer: [
          "Each product page will show the fabrics and colours that are available. Custom pieces will also give you the option of fabric, colour and finish.",
        ],
      },
      {
        id: "availability",
        question: "Are all the products available to order immediately?",
        answer: [
          "Stock tables and artwork are delivered in 2–3 weeks (up to 4 weeks if any preparation is required). Sofas and chairs are made to order with standard delivery taking 3–4 weeks from order confirmation.",
        ],
      },
      {
        id: "made-in-egypt",
        question: "Is Kanabco furniture made in Egypt?",
        answer: ["Yes. All our furniture is made locally in Egypt, combining Egyptian craftsmanship with classic design."],
      },
    ],
  },
  {
    id: "customisation",
    title: "Customisation",
    items: [
      {
        id: "customisation-tool",
        question: "What is the Kanabco Customisation Tool?",
        answer: [
          "It's our made-to-order studio. Just send us a photo of a room or a piece you like, and our chatbot advisor will identify it, price it from the official Kanabco rates, and guide you through the process until a sales specialist takes over. It takes about 2 minutes.",
        ],
        link: { href: "/custom-design", label: "Start a custom design" },
      },
      {
        id: "upload-photo",
        question: "Can I upload a photo of a piece of furniture that I like?",
        answer: [
          "Yes. Upload a JPG, PNG, GIF or WebP photo (up to 8 MB) or just skip the photo and describe what you have in mind.",
        ],
      },
      {
        id: "reproduce",
        question: "Can Kanabco reproduce any design that I upload?",
        answer: [
          "We custom build sofas, beds and headboards, wardrobes, dressers, dressing rooms and kitchens to your exact dimensions and materials. A Kanabco specialist will look at every request and confirm what is possible.",
        ],
      },
      {
        id: "customisation-time",
        question: "How long does customisation take?",
        answer: [
          "Standard delivery for made-to-order furniture is 3–4 weeks from order confirmation. Our specialist will confirm the timeline for your piece.",
        ],
      },
      {
        id: "follow-up",
        question: "Will the team get in touch with me once a request has been submitted?",
        // The document says "[within X hours]": add the time here once it is agreed.
        answer: ["Yes, a Kanabco specialist will follow up by phone or email to confirm the details and your order."],
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    items: [
      {
        id: "payment-options",
        question: "What payment options are available?",
        answer: [
          "You can pay by Visa, in instalments through our partners, or cash on delivery (COD). Orders are confirmed once payment has been received, in full or in part, as shown on the checkout page.",
        ],
      },
      {
        id: "instalment-providers",
        question: "Which instalment providers are available?",
        answer: [
          "We work with [providers]. You select your provider at checkout, and each one will walk you through their own application.",
        ],
        pending: "Name the providers that are live at checkout (the document lists Souhoola, TRU, Aman and valU to confirm).",
      },
      {
        id: "instalment-limit",
        question: "How do I check my available instalment limit?",
        answer: [
          "Select your provider at checkout and sign in to your account with them. You'll see your available balance, your limit and your eligible plans, and you can then pick the one that's right for you.",
        ],
      },
      {
        id: "credit-limit",
        question: "Does Kanabco decide my credit limit?",
        answer: [
          "No. Approval, limits and plans are all decided by the instalment provider on your account. Kanabco doesn't set your limit or approve your application.",
        ],
      },
      {
        id: "same-options",
        question: "Will everyone get the same instalment options?",
        answer: [
          "No. The options available to you depend on your individual account and limit with the provider, so what you see may be different from what someone else sees.",
        ],
      },
      {
        id: "tax",
        question: "Do your prices include tax?",
        answer: [
          "Yes. The prices include 14% VAT, and all custom quotes show the final selling price with tax included.",
        ],
        pending: "Confirm that every price on the site includes 14% VAT, not only custom quotes.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery & After-sales",
    items: [
      {
        id: "delivery-areas",
        question: "What areas do you deliver to?",
        answer: ["We deliver across Egypt."],
      },
      {
        id: "order-time",
        question: "How long will my order take?",
        answer: [
          "Made-to-order sofas and chairs take 3–4 weeks from order confirmation (this will, of course, vary slightly depending on workload and material availability).",
        ],
      },
      {
        id: "after-ordering",
        question: "What happens once I've placed an order?",
        answer: ["We'll confirm your order by phone or email, and then production gets underway."],
      },
      {
        id: "alter-cancel",
        question: "Can I alter or cancel my order?",
        // The document's last sentence was cut off ("Please review fabric and colour."): add the full
        // sentence here once its wording is agreed.
        answer: [
          "Once an order has been confirmed and production has commenced, no alterations or cancellations can be made.",
        ],
      },
      {
        id: "installation",
        question: "Do you offer installation?",
        answer: [
          "Delivery includes placement in your desired location within the property (where access permits).",
          "Please ensure that the stairs, lifts and door widths are all accessible.",
        ],
      },
      {
        id: "warranty",
        question: "Does Kanabco offer a warranty?",
        answer: [
          "Yes. Furniture is covered by a 12-month structural warranty from the date of delivery. This does not cover any fabric wear, scratches, stains, misuse, or exposure to humidity or sunlight. To make a claim, please contact us and select “Warranty Claim”.",
        ],
        link: { href: "/contact", label: "Contact us" },
      },
      {
        id: "returns",
        question: "Can I return or exchange an item?",
        answer: [
          "Made-to-order furniture is non-returnable and non-exchangeable (except in the case of manufacturing defects). Ready-made tables can be exchanged within 7 days of delivery if they are unused and in original condition. Paintings are non-returnable.",
        ],
      },
    ],
  },
]

/** The sections as the page shows them: questions still pending are left out. */
export function publishedSections(): FaqSection[] {
  return FAQ_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !i.pending) })).filter((s) => s.items.length > 0)
}
