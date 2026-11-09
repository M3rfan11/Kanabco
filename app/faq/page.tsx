import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"
import Navigation from "../components/navigation"
import Footer from "../components/footer"
import { publishedSections } from "./faq-content"
import OpenFromHash from "./open-from-hash"

export const metadata: Metadata = {
  title: "FAQ | Kanabco",
  description:
    "Answers about Kanabco furniture, custom pieces, payments and instalments, delivery, warranty and returns.",
}

export default function FaqPage() {
  const sections = publishedSections()

  // FAQ rich results in search: the same questions and answers as the page shows.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sections.flatMap((s) =>
      s.items.map((i) => ({
        "@type": "Question",
        name: i.question,
        acceptedAnswer: { "@type": "Answer", text: i.answer.join(" ") },
      })),
    ),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <header className="bg-[#ed6b3e] px-6 py-16 md:py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-oblong font-bold text-white mb-4">FREQUENTLY ASKED QUESTIONS</h1>
        <p className="text-white/90 font-gill-sans text-lg leading-relaxed max-w-2xl mx-auto">
          Everything about our furniture, custom pieces, payments and delivery. Can&apos;t find your answer? We&apos;re a
          message away.
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
        <nav aria-label="FAQ sections" className="flex flex-wrap gap-2 mb-12">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-gill-sans text-gray-700 transition-colors hover:border-[#ed6b3e] hover:text-[#ed6b3e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ed6b3e]"
            >
              {s.title}
            </a>
          ))}
        </nav>

        {sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="mb-12 scroll-mt-24">
            <h2 id={`${section.id}-title`} className="text-2xl md:text-3xl font-oblong font-bold text-gray-900 mb-5">
              {section.title}
            </h2>
            <div className="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {section.items.map((item) => (
                <details key={item.id} id={item.id} className="group scroll-mt-24">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-5 font-gill-sans text-left transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#ed6b3e] [&::-webkit-details-marker]:hidden">
                    <span className="text-base md:text-lg font-semibold text-gray-900">{item.question}</span>
                    <Plus
                      aria-hidden="true"
                      className="mt-1 h-5 w-5 shrink-0 text-[#ed6b3e] transition-transform duration-200 group-open:rotate-45"
                    />
                  </summary>
                  <div className="space-y-3 px-5 pb-6 font-gill-sans text-gray-600 leading-relaxed">
                    {item.answer.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {item.link && (
                      <Link
                        href={item.link.href}
                        className="inline-block font-semibold text-[#ed6b3e] underline-offset-4 hover:underline"
                      >
                        {item.link.label} →
                      </Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}

        <aside className="rounded-2xl bg-[#18395c] px-6 py-10 text-center text-white">
          <h2 className="text-2xl font-oblong font-bold mb-3">Still have a question?</h2>
          <p className="font-gill-sans text-white/80 mb-6">Our team is happy to help with anything not covered here.</p>
          <Link
            href="/contact"
            className="inline-block rounded-full bg-[#ed6b3e] px-8 py-3 font-gill-sans font-semibold text-white transition-opacity hover:opacity-90"
          >
            Contact us
          </Link>
        </aside>
      </main>

      <Footer />
      <OpenFromHash />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
    </div>
  )
}
