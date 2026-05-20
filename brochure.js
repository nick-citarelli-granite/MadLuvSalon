class SalonLandingApp {
  constructor(root) {
    this.root = this.#requiredElement(root, "[data-salon-app]");
    this.bookingHref = this.#requiredDataset(this.root, "bookingHref");
    this.cards = this.#requiredElements(this.root, "[data-professional-card]");
    this.modal = this.#requiredElement(this.root, "[data-team-modal]");
    this.modalName = this.#requiredElement(this.modal, "[data-modal-name]");
    this.modalImage = this.#requiredElement(this.modal, "[data-modal-image]");
    this.modalHeading = this.#requiredElement(this.modal, "[data-modal-heading]");
    this.modalDescription = this.#requiredElement(this.modal, "[data-modal-description]");
    this.modalChips = this.#requiredElement(this.modal, "[data-modal-chips]");
    this.modalBooking = this.#requiredElement(this.modal, "[data-modal-booking]");
    this.modalClose = this.#requiredElement(this.modal, "[data-modal-close]");
    this.track = this.#requiredElement(this.root, "[data-team-track]");
    this.dotsContainer = this.#requiredElement(this.root, "[data-carousel-dots]");
    this.professionals = this.#collectProfessionals();
    this.dots = [];
    this.lastTrigger = null;
  }

  init() {
    this.#enforceExternalLinks();
    this.#bindModalTriggers();
    this.#bindModalClose();
    this.#renderCarouselDots();
    this.#bindCarouselDots();
    this.#syncCarouselDots();
    document.documentElement.dataset.js = "ready";
  }

  #collectProfessionals() {
    const professionals = new Map();

    for (const card of this.cards) {
      const id = this.#requiredDataset(card, "professionalCard");
      const name = this.#requiredText(card, "h3");
      const heading = this.#requiredDataset(card, "modalHeading");
      const description = this.#modalDescriptionFor(name, this.#requiredText(card, ".team-card-copy p"));
      const image = this.#requiredElement(card, ".team-photo img");
      const chips = this.#requiredElements(card, ".chips li").map((chip) => chip.textContent.trim());
      const trigger = this.#requiredElement(card, "[data-modal-trigger]");

      if (trigger.dataset.modalTrigger !== id) {
        throw new Error(`Card ${id} trigger does not match professional id.`);
      }

      professionals.set(id, {
        id,
        name,
        heading,
        description,
        imageAlt: image.alt || name,
        imageSrc: image.currentSrc || image.src,
        chips,
        trigger,
      });
    }

    return professionals;
  }

  #enforceExternalLinks() {
    for (const link of this.root.querySelectorAll("a[href^='http']")) {
      link.target = "_blank";
      link.rel = "noopener";
    }

    for (const link of this.root.querySelectorAll("a[href*='glossgenius.com/booking-flow']")) {
      if (link.href !== this.bookingHref) {
        throw new Error(`Unexpected booking link target: ${link.href}`);
      }
    }
  }

  #bindModalTriggers() {
    for (const professional of this.professionals.values()) {
      professional.trigger.addEventListener("click", () => {
        this.lastTrigger = professional.trigger;
        this.#openModal(professional);
      });
    }
  }

  #bindModalClose() {
    this.modalClose.addEventListener("click", () => this.#closeModal());

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.modal.open) {
        this.#closeModal();
      }
    });

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.#closeModal();
      }
    });

    this.modal.addEventListener("close", () => this.lastTrigger?.focus());
  }

  #openModal(professional) {
    this.modalName.textContent = professional.name;
    this.modalImage.src = professional.imageSrc;
    this.modalImage.alt = professional.imageAlt;
    this.modalHeading.textContent = professional.heading;
    this.modalDescription.textContent = professional.description;
    this.modalBooking.href = this.bookingHref;
    this.#renderChips(professional.chips);

    if (typeof this.modal.showModal === "function") {
      this.modal.showModal();
    } else {
      this.modal.setAttribute("open", "");
    }

    this.modalClose.focus();
  }

  #closeModal() {
    if (typeof this.modal.close === "function") {
      this.modal.close();
    } else {
      this.modal.removeAttribute("open");
      this.lastTrigger?.focus();
    }
  }

  #renderChips(chips) {
    this.modalChips.replaceChildren(
      ...chips.map((chip) => {
        const item = document.createElement("li");
        item.textContent = chip;
        return item;
      })
    );
  }

  #renderCarouselDots() {
    this.dotsContainer.replaceChildren(
      ...this.cards.map((card, index) => {
        const dot = document.createElement("button");
        dot.className = "carousel-dot";
        dot.type = "button";
        dot.dataset.carouselDot = String(index);
        dot.setAttribute("aria-label", `Show ${this.#requiredText(card, "h3")}`);
        return dot;
      })
    );
    this.dots = Array.from(this.dotsContainer.querySelectorAll("[data-carousel-dot]"));
  }

  #bindCarouselDots() {
    this.track.addEventListener("scroll", () => this.#syncCarouselDots(), { passive: true });

    this.dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        const card = this.cards[index];
        if (!card) {
          throw new Error(`Carousel dot references missing card: ${index}`);
        }
        card.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      });
    });
  }

  #syncCarouselDots() {
    if (this.cards.length !== this.dots.length) {
      throw new Error("Carousel dot count must match professional card count.");
    }

    const trackRect = this.track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    const activeIndex = this.cards.reduce((closestIndex, card, index) => {
      const currentDistance = this.#distanceFromTrackCenter(card, trackCenter);
      const closestDistance = this.#distanceFromTrackCenter(this.cards[closestIndex], trackCenter);
      return currentDistance < closestDistance ? index : closestIndex;
    }, 0);

    this.dots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index === activeIndex);
      dot.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    });
  }

  #distanceFromTrackCenter(card, trackCenter) {
    const rect = card.getBoundingClientRect();
    return Math.abs(rect.left + rect.width / 2 - trackCenter);
  }

  #modalDescriptionFor(name, cardDescription) {
    const firstName = name.split(" ")[0];
    const serviceFocus = cardDescription.replace(/^Best fit for\s+/i, "").replace(/\.$/, "");
    return `${firstName} may be a good fit for ${serviceFocus}. Continue to GlossGenius to choose services, view availability, and complete booking.`;
  }

  #requiredDataset(element, key) {
    const value = element.dataset[key];
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`Required data-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)} missing.`);
    }
    return value;
  }

  #requiredText(scope, selector) {
    const text = this.#requiredElement(scope, selector).textContent.trim();
    if (!text) {
      throw new Error(`Required text missing: ${selector}`);
    }
    return text;
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
}

new SalonLandingApp(document).init();
