import Navbar from "./Navbar";
import Footer from "./Footer";
import mapBg from "../assets/PhilippineMap.png";
import cloud1 from "../assets/2 1.png";
import cloud2 from "../assets/3 1.png";
import cloud3 from "../assets/3A.png";
import cloud4 from "../assets/4A.png";

export default function AboutUs({ cartCount }) {
  return (
    <div className="soucul-app about-us-page">
      <Navbar cartCount={cartCount} hideBackButton />

      {/* Hero — same cover as landing page */}
      <section className="about-hero">
        <img src={mapBg} alt="Philippines Map" className="landing-map" />
        <img src={cloud1} alt="" className="landing-cloud landing-cloud-1" />
        <img src={cloud2} alt="" className="landing-cloud landing-cloud-2" />
        <img src={cloud3} alt="" className="landing-cloud landing-cloud-3" />
        <img src={cloud4} alt="" className="landing-cloud landing-cloud-4" />

        <div className="about-hero-overlay">
          <h1 className="about-hero-title">About SouCul</h1>
          <p className="about-hero-subtitle">
            Preserving Filipino culture, one souvenir at a time.
          </p>
        </div>
      </section>

      {/* What is SouCul */}
      <section className="about-section">
        <h2 className="about-section-title">What is SouCul?</h2>
        <div className="about-section-body">
          <p>
            <strong>SouCul</strong> — short for <em>Sou</em> and <em>Culture</em> — is an
            online souvenir marketplace that celebrates the heart and heritage of the
            Philippines. We connect travelers, culture enthusiasts, and gift seekers with
            authentic, locally handcrafted products from iconic Filipino destinations.
          </p>
          <p>
            Every item you find on SouCul tells a story. From the hand-woven baskets of
            Vigan to the strawberry preserves of Baguio, each product carries the soul of
            its maker and the culture of the land it comes from. Our platform is built on
            the belief that souvenirs should be more than trinkets — they should be lasting
            connections to the places and people that made your journey unforgettable.
          </p>
        </div>
      </section>

      {/* Our History */}
      <section className="about-section about-section-alt">
        <h2 className="about-section-title">Our History</h2>
        <div className="about-timeline">
          <div className="about-timeline-item">
            <span className="about-timeline-year">2024</span>
            <div>
              <h3>The Spark</h3>
              <p>
                A group of Filipino students and culture advocates noticed that many
                locally crafted souvenirs were being overshadowed by mass-produced
                imports. They saw artisans with incredible talent but limited reach,
                and travelers who wanted authentic keepsakes but didn't know where to
                find them. The idea for SouCul was born — a platform that could bridge
                that gap.
              </p>
            </div>
          </div>
          <div className="about-timeline-item">
            <span className="about-timeline-year">2025</span>
            <div>
              <h3>Building the Platform</h3>
              <p>
                The founding team spent a year researching, traveling, and partnering with
                artisan communities across the Philippines. They visited Vigan, Baguio,
                Tagaytay, Boracay, and Bohol — curating products, documenting stories, and
                building the relationships that form the backbone of SouCul. The platform
                was developed with a focus on showcasing regional identity through five
                product categories: Handicrafts, Clothes, Decorations, Homeware, and
                Delicacies.
              </p>
            </div>
          </div>
          <div className="about-timeline-item">
            <span className="about-timeline-year">2026</span>
            <div>
              <h3>Going Live</h3>
              <p>
                SouCul officially launched, offering curated collections from five iconic
                Philippine destinations. With a growing catalog of products and a passionate
                community, SouCul continues to expand — adding new regions, new artisans,
                and new ways to experience Filipino culture from anywhere in the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission & Vision */}
      <section className="about-section">
        <h2 className="about-section-title">Our Mission & Vision</h2>
        <div className="about-cards-row">
          <div className="about-card">
            <h3 className="about-card-title">Mission</h3>
            <p className="about-card-text">
              To empower Filipino artisan communities by providing a digital marketplace
              that amplifies their craft, preserves cultural heritage, and connects them
              with a global audience. Every purchase on SouCul directly supports the
              livelihoods of local makers and their families.
            </p>
          </div>
          <div className="about-card">
            <h3 className="about-card-title">Vision</h3>
            <p className="about-card-text">
              A world where Filipino culture thrives through commerce — where every souvenir
              purchased is a vote of support for authenticity, craftsmanship, and the
              communities that keep traditions alive. We envision SouCul as the go-to
              destination for anyone who wants to bring a piece of the Philippines home.
            </p>
          </div>
        </div>
      </section>

      {/* The People Behind SouCul */}
      <section className="about-section about-section-alt">
        <h2 className="about-section-title">The People Behind SouCul</h2>
        <p className="about-section-intro">
          SouCul is powered by a passionate team of students, developers, and culture
          advocates united by a shared love for Filipino heritage.
        </p>
        <div className="about-people-grid">
          {[
            {
              role: "Founder & Project Lead",
              desc: "Drives the vision and strategic direction of SouCul, ensuring every decision stays rooted in cultural authenticity and community impact.",
            },
            {
              role: "Lead Developer",
              desc: "Architects and builds the platform from the ground up — from the interactive Philippine map to the seamless shopping experience.",
            },
            {
              role: "UI/UX Designer",
              desc: "Crafts the visual identity and user experience, blending modern design with Filipino aesthetic elements like glass-morphism and regional color palettes.",
            },
            {
              role: "Community & Artisan Relations",
              desc: "Travels to partner regions, builds relationships with artisan communities, curates products, and ensures fair-trade practices across the supply chain.",
            },
            {
              role: "Content & Marketing",
              desc: "Tells the stories behind every product and destination — through photography, copywriting, and social media — to bring the SouCul experience to life online.",
            },
            {
              role: "Quality Assurance",
              desc: "Tests every feature, reviews every product listing, and ensures that the platform delivers a polished, reliable experience for both buyers and artisans.",
            },
          ].map((person) => (
            <div className="about-person-card" key={person.role}>
              <div className="about-person-avatar">
                {person.role.charAt(0)}
              </div>
              <h3 className="about-person-role">{person.role}</h3>
              <p className="about-person-desc">{person.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What We Offer */}
      <section className="about-section">
        <h2 className="about-section-title">What We Offer</h2>
        <div className="about-offer-grid">
          {[
            {
              title: "5 Iconic Destinations",
              desc: "Explore curated products from Vigan, Baguio, Tagaytay, Boracay, and Bohol — each with its own unique cultural identity.",
            },
            {
              title: "5 Product Categories",
              desc: "Shop across Handicrafts, Clothes, Decorations, Homeware, and Delicacies — all handpicked for quality and authenticity.",
            },
            {
              title: "Artisan Stories",
              desc: "Every product comes with the story of its maker and origin, so you know exactly where your purchase comes from and who it supports.",
            },
            {
              title: "Fair-Trade Commitment",
              desc: "We work directly with artisan communities to ensure fair pricing, ethical sourcing, and sustainable practices at every step.",
            },
          ].map((item) => (
            <div className="about-offer-card" key={item.title}>
              <h3 className="about-offer-title">{item.title}</h3>
              <p className="about-offer-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose SouCul */}
      <section className="about-section about-section-alt">
        <h2 className="about-section-title">Why Choose SouCul?</h2>
        <div className="about-section-body">
          <ul className="about-reasons-list">
            <li>
              <strong>Authenticity Guaranteed</strong> — Every product is sourced directly
              from local artisans. No mass-produced imitations.
            </li>
            <li>
              <strong>Cultural Preservation</strong> — Your purchase helps keep traditional
              Filipino crafts and recipes alive for future generations.
            </li>
            <li>
              <strong>Community Impact</strong> — Proceeds go directly to artisan families
              and local communities, supporting sustainable livelihoods.
            </li>
            <li>
              <strong>Curated Experience</strong> — We don't just sell products — we tell
              the stories behind them, giving every item deeper meaning.
            </li>
            <li>
              <strong>Regional Discovery</strong> — Our interactive map lets you explore the
              Philippines region by region, discovering the unique treasures each destination
              has to offer.
            </li>
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  );
}
