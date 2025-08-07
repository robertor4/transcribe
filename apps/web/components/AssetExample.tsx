/**
 * Example component showing how to use assets from the public/assets folder
 * This file can be deleted once you understand the pattern
 */

import Image from 'next/image';

export const AssetExample = () => {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Asset Usage Examples</h2>
      
      {/* Example 1: Direct img tag (not optimized) */}
      <div>
        <h3 className="text-sm font-medium mb-2">Using img tag:</h3>
        <img 
          src="/assets/images/logo.png" 
          alt="Logo"
          className="h-12 w-auto"
        />
      </div>

      {/* Example 2: Next.js Image component (optimized) */}
      <div>
        <h3 className="text-sm font-medium mb-2">Using Next.js Image (recommended):</h3>
        <Image
          src="/assets/images/hero-illustration.svg"
          alt="Hero illustration"
          width={200}
          height={150}
          priority // Use for above-the-fold images
        />
      </div>

      {/* Example 3: Background image in CSS */}
      <div>
        <h3 className="text-sm font-medium mb-2">As background image:</h3>
        <div 
          className="h-32 w-full rounded-lg"
          style={{
            backgroundImage: "url('/assets/images/pattern.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      </div>

      {/* Example 4: Icons */}
      <div>
        <h3 className="text-sm font-medium mb-2">Using icons:</h3>
        <div className="flex space-x-4">
          <img src="/assets/icons/success.svg" alt="Success" className="h-6 w-6" />
          <img src="/assets/icons/error.svg" alt="Error" className="h-6 w-6" />
          <img src="/assets/icons/warning.svg" alt="Warning" className="h-6 w-6" />
        </div>
      </div>

      {/* Example 5: Responsive images */}
      <div>
        <h3 className="text-sm font-medium mb-2">Responsive images:</h3>
        <picture>
          <source 
            media="(min-width: 768px)" 
            srcSet="/assets/images/hero-desktop.jpg"
          />
          <source 
            media="(min-width: 480px)" 
            srcSet="/assets/images/hero-tablet.jpg"
          />
          <img 
            src="/assets/images/hero-mobile.jpg" 
            alt="Responsive hero"
            className="w-full rounded-lg"
          />
        </picture>
      </div>
    </div>
  );
};