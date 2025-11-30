import HeroSection from "./components/home/homeSlider"
import SofaRevealSection from "./components/home/sofa-reveal-section"
import CollectionsSection from "./components/home/collections-section"
import BundleBuilderSection from "./components/home/bundle-builder-section"
import InteractiveProductSection from "./components/home/interactive-product-section"
import ProductDetailSection from "./components/home/product-detail-section"
import Navigation from "./components/navigation"
import NewArrivalsSection from "./components/home/new-arrivals-section"
import TestimonialSection from "./components/home/testimonial-section"
import Footer from "./components/footer"

export default function Home() {
  return (
    <main className="relative">
      {/* Hero Section (z-30) */}
      <div className="fixed inset-0 z-30">
        <HeroSection />
      </div>

      {/* Content above hero (z-40) */}
      <div className="relative z-40 pointer-events-none">
        {/* Hero spacer */}
        <div className="h-screen" />

        {/* Sticky Navigation - starts from collections and stays throughout */}
        <div className="sticky top-0 z-50 pointer-events-auto">
          <Navigation />
        </div>

        {/* Collections */}
        <div className="relative z-40 pointer-events-auto">
          <CollectionsSection />
        </div>

        {/* Sofa Reveal */}
        <div className="relative z-10 pointer-events-auto">
          <SofaRevealSection />
        </div>

        <div className="relative pointer-events-auto z-10">
          <BundleBuilderSection />
        </div>

        <div className="relative pointer-events-auto z-10">
          <InteractiveProductSection />
        </div>

        <div className="relative pointer-events-auto z-10">
          <ProductDetailSection />
        </div>

        <div className="relative pointer-events-auto z-10">
          <NewArrivalsSection/>
        </div>

        <div className="relative pointer-events-auto z-10">
          <TestimonialSection/>
        </div>
        <div className="relative pointer-events-auto z-10">
          <Footer/>
        </div>
      </div>
    </main>
  )
}
