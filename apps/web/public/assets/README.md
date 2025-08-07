# Assets Directory

This directory contains all static assets for the Transcribe web application.

## Directory Structure

```
assets/
├── images/      # General images (logos, backgrounds, illustrations)
├── icons/       # Icon files (SVG, PNG icons)
└── README.md    # This file
```

## Usage

Assets stored in the `/public` directory can be accessed directly via URL path.

### Examples:

```jsx
// In React components
<img src="/assets/images/logo.png" alt="Logo" />
<img src="/assets/icons/notification-icon.svg" alt="Notification" />

// In CSS
background-image: url('/assets/images/background.jpg');
```

## Recommended Formats

- **Images**: 
  - PNG for images with transparency
  - JPG/JPEG for photos
  - WebP for modern browsers (with fallbacks)
  - SVG for scalable graphics

- **Icons**:
  - SVG preferred for scalability
  - PNG for fallback (provide multiple sizes: 16x16, 32x32, 64x64, 128x128)

## Naming Conventions

- Use lowercase with hyphens: `my-image-name.png`
- Be descriptive: `transcription-complete-illustration.svg`
- Include size for raster images when relevant: `logo-192x192.png`

## Image Optimization

Before adding images:
1. Compress PNG/JPG files (use tools like TinyPNG)
2. Consider using Next.js Image component for automatic optimization
3. Provide multiple sizes for responsive images
4. Use appropriate formats (WebP with fallbacks)

## Common Assets to Add

- [ ] App logo (various sizes)
- [ ] Favicon variants
- [ ] PWA icons (192x192, 512x512)
- [ ] OG image for social sharing
- [ ] Illustrations for empty states
- [ ] Background patterns/images
- [ ] Feature icons
- [ ] Success/error illustrations