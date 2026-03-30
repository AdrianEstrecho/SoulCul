const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const footerLinks = [
  { title: "Features", links: ["Core features", "Pro experience", "Integrations"] },
  { title: "Learn more", links: ["Blog", "Case studies", "Customer stories", "Best practices"] },
  { title: "Support", links: ["Contact", "Support", "Legal"] },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand-name">SouCul</div>
          <div className="footer-brand-desc">
            Descriptive line about what your company does.
          </div>
          <div className="footer-socials">
            {[<InstagramIcon />, <LinkedInIcon />, <XIcon />].map((Icon, i) => (
              <span key={i} className="footer-social-icon">{Icon}</span>
            ))}
          </div>
        </div>
        {footerLinks.map(({ title, links }) => (
          <div key={title}>
            <div className="footer-col-title">{title}</div>
            {links.map((link) => (
              <div key={link} className="footer-link">{link}</div>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-copy">© 2026 SouCul. All rights reserved.</div>
    </footer>
  );
}
