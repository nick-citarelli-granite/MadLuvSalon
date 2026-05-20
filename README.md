# Madd Luv Salon & Beauty Lounge

Static mobile-first staff guidance and GlossGenius handoff page for Madd Luv Salon & Beauty Lounge.

## Open locally

Open or drag `index.html` into a browser.

No install step is required. There is no build step, package manager, framework, or local server requirement.

## Booking handoff

This site does not integrate with the GlossGenius API. It does not collect bookings, choose services, choose appointment times, create a cart, or store booking intent.

All booking calls to action link directly to:

```text
https://maddluvsalon.glossgenius.com/booking-flow
```

## Files

- `index.html` is the canonical landing page.
- `MaddLuvSalon-Brochure.html` is a legacy redirect fallback to `index.html`.
- `brochure.css` contains the mobile-first layout and modal styling.
- `brochure.js` validates required page data and renders the professional guidance modal.

## Notes

- Current imagery is temporary pending client-provided assets.
- Final canonical URL and social preview imagery are pending final client/deployment details.
- The page intentionally avoids phone, email, contact form, map, and local booking functionality.
