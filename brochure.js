class SalonBrochureApp {
  constructor(config) {
    this.config = this.#validateConfig(config);
    this.root = this.#requiredElement(document, "[data-salon-app]");
    this.phoneLinks = this.#requiredElements(this.root, "[data-phone-link]");
    this.emailLinks = this.#requiredElements(this.root, "[data-email-link]");
    this.mapLinks = this.#requiredElements(this.root, "[data-map-link]");
    this.bioLinks = this.#requiredElements(this.root, ".card-actions a[href^='#']");
    this.bookingLinks = this.#requiredElements(this.root, "a[href*='glossgenius.com/booking-flow']");
  }

  init() {
    this.#applyContactLinks();
    this.#applyExternalLinkPolicy();
    this.#bindBioNavigation();
    document.documentElement.dataset.js = "ready";
  }

  #validateConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("SalonBrochureApp requires a config object.");
    }

    const required = ["phoneHref", "phoneLabel", "contactHref", "mapHref", "bookingHref"];
    for (const key of required) {
      if (typeof config[key] !== "string" || config[key].trim() === "") {
        throw new Error(`SalonBrochureApp missing config.${key}.`);
      }
    }

    if (!config.phoneHref.startsWith("tel:")) {
      throw new Error("SalonBrochureApp config.phoneHref must be a tel: URL.");
    }

    return Object.freeze({ ...config });
  }

  #requiredElement(scope, selector) {
    const element = scope.querySelector(selector);
    if (!element) {
      throw new Error(`Required element not found: ${selector}`);
    }
    return element;
  }

  #requiredElements(scope, selector) {
    const elements = Array.from(scope.querySelectorAll(selector));
    if (elements.length === 0) {
      throw new Error(`Required elements not found: ${selector}`);
    }
    return elements;
  }

  #applyContactLinks() {
    for (const link of this.phoneLinks) {
      link.href = this.config.phoneHref;
      if (!link.textContent.trim()) {
        link.textContent = this.config.phoneLabel;
      }
      link.setAttribute("aria-label", `Call Madd Luv Salon at ${this.config.phoneLabel}`);
    }

    for (const link of this.emailLinks) {
      link.href = this.config.contactHref;
      link.setAttribute("aria-label", "Email Madd Luv Salon through the GlossGenius contact form");
    }

    for (const link of this.mapLinks) {
      link.href = this.config.mapHref;
    }
  }

  #applyExternalLinkPolicy() {
    const externalLinks = this.root.querySelectorAll("a[href^='http']");
    for (const link of externalLinks) {
      link.target = "_blank";
      link.rel = "noopener";
    }

    for (const link of this.bookingLinks) {
      if (link.href !== this.config.bookingHref) {
        throw new Error(`Unexpected booking link target: ${link.href}`);
      }
    }
  }

  #bindBioNavigation() {
    for (const link of this.bioLinks) {
      link.addEventListener("click", (event) => {
        const targetId = link.getAttribute("href");
        const target = this.#requiredElement(document, targetId);
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", targetId);
      });
    }
  }
}

const salonBrochureConfig = Object.freeze({
  phoneHref: "tel:+19784940203",
  phoneLabel: "(978) 494-0203",
  contactHref: "https://maddluvsalon.glossgenius.com/contact",
  mapHref: "https://www.google.com/maps/search/?api=1&query=282A%20Main%20Street%2C%20Salem%2C%20NH%2003079",
  bookingHref: "https://maddluvsalon.glossgenius.com/booking-flow",
});

new SalonBrochureApp(salonBrochureConfig).init();
