class SalonBrochureApp {
  constructor(config) {
    this.config = this.#validateConfig(config);
    this.root = this.#requiredElement(document, "[data-salon-app]");
    this.phoneLinks = this.#requiredElements(this.root, "[data-phone-link]");
    this.emailLinks = this.#requiredElements(this.root, "[data-email-link]");
    this.mapLinks = this.#requiredElements(this.root, "[data-map-link]");
    this.bioTriggers = this.#requiredElements(this.root, "[data-bio-trigger]");
    this.bioDrawer = this.#requiredElement(this.root, "[data-bio-drawer]");
    this.bioName = this.#requiredElement(this.bioDrawer, "[data-bio-name]");
    this.bioHeading = this.#requiredElement(this.bioDrawer, "[data-bio-heading]");
    this.bioDescription = this.#requiredElement(this.bioDrawer, "[data-bio-description]");
    this.bioChips = this.#requiredElement(this.bioDrawer, "[data-bio-chips]");
    this.bioPortfolio = this.#requiredElement(this.bioDrawer, "[data-bio-portfolio]");
    this.bioBooking = this.#requiredElement(this.bioDrawer, "[data-bio-booking]");
    this.bioClose = this.#requiredElement(this.bioDrawer, "[data-bio-close]");
    this.bookingLinks = this.#requiredElements(this.root, "a[href*='glossgenius.com/booking-flow']");
  }

  init() {
    this.#applyContactLinks();
    this.#applyExternalLinkPolicy();
    this.#bindBioDrawer();
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

    if (!config.professionals || typeof config.professionals !== "object") {
      throw new Error("SalonBrochureApp requires config.professionals.");
    }

    for (const [id, professional] of Object.entries(config.professionals)) {
      this.#validateProfessional(id, professional);
    }

    return Object.freeze({ ...config });
  }

  #validateProfessional(id, professional) {
    if (!professional || typeof professional !== "object") {
      throw new Error(`Professional ${id} must be an object.`);
    }

    const requiredTextFields = ["firstName", "name", "heading", "description"];
    for (const key of requiredTextFields) {
      if (typeof professional[key] !== "string" || professional[key].trim() === "") {
        throw new Error(`Professional ${id} missing ${key}.`);
      }
    }

    if (!Array.isArray(professional.chips) || professional.chips.length === 0) {
      throw new Error(`Professional ${id} requires chips.`);
    }

    if (!Array.isArray(professional.portfolio) || professional.portfolio.length === 0) {
      throw new Error(`Professional ${id} requires portfolio images.`);
    }

    for (const image of professional.portfolio) {
      if (!image.src || !image.alt) {
        throw new Error(`Professional ${id} has an incomplete portfolio image.`);
      }
    }
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

  #bindBioDrawer() {
    for (const link of this.bioTriggers) {
      const professionalId = link.dataset.bioTrigger;
      if (!this.config.professionals[professionalId]) {
        throw new Error(`Bio trigger references unknown professional: ${professionalId}`);
      }

      link.addEventListener("click", (event) => {
        event.preventDefault();
        this.#openBioDrawer(professionalId);
      });
    }

    this.bioClose.addEventListener("click", () => this.#closeBioDrawer());
  }

  #openBioDrawer(professionalId) {
    const professional = this.config.professionals[professionalId];
    if (!professional) {
      throw new Error(`Cannot open missing professional: ${professionalId}`);
    }

    this.bioName.textContent = professional.name;
    this.bioHeading.textContent = professional.heading;
    this.bioDescription.textContent = professional.description;
    this.bioBooking.textContent = `Book with ${professional.firstName}`;
    this.bioBooking.href = this.config.bookingHref;
    this.#renderList(this.bioChips, professional.chips, (chip) => {
      const span = document.createElement("span");
      span.textContent = chip;
      return span;
    });
    this.#renderList(this.bioPortfolio, professional.portfolio, (image) => {
      const img = document.createElement("img");
      img.src = image.src;
      img.alt = image.alt;
      return img;
    });

    this.bioDrawer.hidden = false;
    this.bioDrawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  #closeBioDrawer() {
    this.bioDrawer.hidden = true;
  }

  #renderList(container, items, renderItem) {
    container.replaceChildren(...items.map(renderItem));
  }
}

const salonBrochureConfig = Object.freeze({
  phoneHref: "tel:+19784940203",
  phoneLabel: "(978) 494-0203",
  contactHref: "https://maddluvsalon.glossgenius.com/contact",
  mapHref: "https://www.google.com/maps/search/?api=1&query=282A%20Main%20Street%2C%20Salem%2C%20NH%2003079",
  bookingHref: "https://maddluvsalon.glossgenius.com/booking-flow",
  professionals: {
    madison: {
      firstName: "Madison",
      name: "Madison Wesinger",
      heading: "Color, bridal & beauty",
      description:
        "Madison is listed publicly on the Madd Luv Salon team and is connected to hair, extensions, color, makeup, waxing, bridal, and lash services. Popular services include Full Foil, Partial Foil, Cut And Blowdry, Makeup, Updo, Blowout, Men's Cut, Full Balayage, and Hair Extension Consultation.",
      chips: ["Full Foil $140+ / 165 min", "Partial Foil $95+ / 120 min", "Cut And Blowdry $50+ / 60 min", "Makeup $80+ / 60 min"],
      portfolio: [
        {
          src: "https://static.glossgenius.com/public/service/97c98fa204c8c5a73392c12ce54be4f772f23f20/image/dbc2b5e16a90e848dbfafd3a6a5f7ad3.jpg",
          alt: "Full Foil service at Madd Luv Salon",
        },
        {
          src: "https://static.glossgenius.com/public/service/8203919a9157cec25c8cbe95ccc59a04a1ab2a89/image/2cef0c0770e76a1d2432ac7236124f8b.jpg",
          alt: "Partial Foil service at Madd Luv Salon",
        },
        {
          src: "https://static.glossgenius.com/public/service/f981cd99a9aff3cffe75c201710bd5eb5b24f5b3/image/31536f28af6fb9c3e40515d128b9fdf1.jpg",
          alt: "Bridal or styling service at Madd Luv Salon",
        },
      ],
    },
    mikaela: {
      firstName: "Mikaela",
      name: "Mikaela Wesinger",
      heading: "Lashes, brows & nails",
      description:
        "Mikaela is listed publicly on the Madd Luv Salon team and is connected to beauty services including lash extensions, lash lift and tint, brow wax and tint, makeup, waxing, and nail services.",
      chips: ["Lash Lift And Tint", "Full Set Lash Extensions", "Brow Wax And Tint", "Builder Gel Manicure"],
      portfolio: [
        {
          src: "https://static.glossgenius.com/public/stockimage/2/image/eyelashes.jpg",
          alt: "Lash service image from GlossGenius",
        },
        {
          src: "https://static.glossgenius.com/public/service/6513dbda8109d00a51a6d74096be0cb7ab3bf612/image/2fd06e3d62a7debf99a1fc510ac68904.jpg",
          alt: "Brow or lash service at Madd Luv Salon",
        },
        {
          src: "https://static.glossgenius.com/public/service/d24b604e06e2d2e4e52668fe772a22ca3a6d9ef7/image/8127d62b06bf436a2130bcb4d184248a.jpg",
          alt: "Makeup service at Madd Luv Salon",
        },
      ],
    },
    keira: {
      firstName: "Keira",
      name: "Keira Garcia",
      heading: "Nails & styling detail",
      description:
        "Keira is listed publicly on the Madd Luv Salon team and is connected to nail services including gel polish manicure, builder gel manicure, builder gel fill, Gel-X, design work, nail fixes, and nail removal.",
      chips: ["Gel Polish Manicure $35+", "Builder Gel Manicure $45", "Builder Gel Fill $40", "Gel-X $60"],
      portfolio: [
        {
          src: "https://static.glossgenius.com/public/service/5cf330af9236f87ce8c8bcfedc5fbe0867a43ca9/image/262e5916e6a22c4829964ab713e4a2ac.jpg",
          alt: "Gel polish manicure at Madd Luv Salon",
        },
        {
          src: "https://static.glossgenius.com/public/service/c8d221d7ab674b2e6d6a49c4dec5cd5c40e47065/image/dd31c462fdc0133bd32a8b9d6503207a.jpg",
          alt: "Builder Gel Manicure at Madd Luv Salon",
        },
        {
          src: "https://static.glossgenius.com/public/service/8b337764309f63a06fc213ad7890e1c14e2ffd08/image/dc31f678edb811e16976d22cec0c7cd2.jpg",
          alt: "Gel-X nail service at Madd Luv Salon",
        },
      ],
    },
  },
});

new SalonBrochureApp(salonBrochureConfig).init();
