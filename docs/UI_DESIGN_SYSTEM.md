# UI Design System

Neural Summary follows Apple-like design principles with pill-shaped CTAs and consistent styling across landing page and dashboard.

## Brand Colors
- **Primary**: `#cc3399` (pink/magenta)
- **Primary hover**: `#b82d89` (darker pink)
- **Primary light**: `bg-pink-50` for subtle backgrounds
- Always use brand colors for new UI screens and components

## Text Color Best Practices

**CRITICAL: Always specify explicit text colors for readability**

When creating UI components, NEVER use text size classes without color:
- ❌ WRONG: `className="text-sm"` or `className="text-sm font-medium"`
- ✅ CORRECT: `className="text-sm text-gray-700"` or `className="text-sm font-medium text-gray-800"`

**Text Color Guidelines:**
- **Headers/Titles**: `text-gray-900` (maximum contrast)
- **Primary text**: `text-gray-800` (buttons, important labels)
- **Secondary text**: `text-gray-700` (descriptions, form labels)
- **Tertiary text**: `text-gray-600` (hints only - use sparingly)
- **Never use**: `text-gray-500` or lighter for body text (poor readability)

**Interactive Elements:**
- **Default state**: `text-gray-700` minimum
- **Hover state**: `hover:text-gray-900` or `hover:text-[#cc3399]`
- **Selected/Active**: `text-[#cc3399]` or `text-gray-900`

**Input Fields & Textareas:**
- **Always include both text and placeholder colors**
- ❌ WRONG: `className="px-3 py-2 border border-gray-400 rounded-lg"`
- ✅ CORRECT: `className="px-3 py-2 border border-gray-400 rounded-lg text-gray-800 placeholder:text-gray-500"`
- **Input text**: `text-gray-800` (dark, readable)
- **Placeholder text**: `placeholder:text-gray-500` (visible but subtle)
- **Border**: `border-gray-400` minimum (not gray-300 or lighter)
- **Focus state**: `focus:border-[#cc3399] focus:ring-2 focus:ring-[#cc3399]/20`

## Button Design System

**CRITICAL: Use the standardized Button component for all new UI**

**Component Location:** `/apps/web/components/Button.tsx`

### Button Variants

#### 1. Primary - Main actions (solid dark background)
```tsx
<Button variant="primary">Create Conversation</Button>
```
- Background: `#2c2c2c` (hover: `#3a3a3a`)
- Text: White
- Shape: `rounded-full` (pill-shaped)
- Effect: Shadow + scale on hover (`hover:scale-105`)
- Use for: Primary CTAs, main actions

#### 2. Secondary - Alternative actions (outlined with hover fill)
```tsx
<Button variant="secondary">Cancel</Button>
```
- Background: White/transparent (fills on hover to `#2c2c2c`)
- Border: `border-2 border-gray-900`
- Text: Gray-900 (inverts to white on hover)
- Shape: `rounded-full` (pill-shaped)
- Effect: Fill + scale on hover
- Use for: Secondary CTAs, cancel actions

#### 3. Brand - Special CTAs (bold pink)
```tsx
<Button variant="brand">Get Started</Button>
```
- Background: `#cc3399` (hover: `#b82d89`)
- Text: White
- Shape: `rounded-full` (pill-shaped)
- Effect: Shadow + scale on hover
- Use for: Sign up CTAs, premium features

#### 4. Ghost - Subtle actions (transparent with hover)
```tsx
<Button variant="ghost">View All</Button>
```
- Background: Transparent (hover: `bg-gray-100`)
- Text: `text-gray-700`
- Shape: `rounded-full`
- Effect: Background fill on hover (no scale)
- Use for: Tertiary actions, navigation links

#### 5. Danger - Destructive actions (red)
```tsx
<Button variant="danger">Delete Conversation</Button>
```
- Background: `bg-red-50` (hover: `bg-red-100`)
- Text: `text-red-600`
- Shape: `rounded-full`
- Effect: Background darken on hover
- Use for: Delete, remove, destructive actions

### Button Sizes
- `size="sm"`: Small buttons (px-4 py-2, text-sm)
- `size="md"`: Default medium (px-6 py-2.5, text-sm)
- `size="lg"`: Large CTAs (px-10 py-4, text-lg) - used on landing page

### Additional Props
- `fullWidth`: Makes button span full width
- `icon`: Adds icon with proper spacing
- `href`: Renders as Next.js Link instead of button
- `disabled`: Reduces opacity and disables interaction

### Design Principles
- **Always pill-shaped** (`rounded-full`) for primary/secondary/brand variants - never use `rounded-lg` for main CTAs
- **Use `rounded-lg` only** for utility buttons in forms, inputs, small actions
- **Scale on hover** for primary/secondary/brand to create Apple-like interactive feel
- **Consistent spacing** with icon prop (gap-2 for proper alignment)
- **Dark mode support** built-in via Tailwind dark: variants

### Examples
```tsx
// Primary CTA with icon
<Button variant="primary" size="lg" icon={<Plus />}>
  New Conversation
</Button>

// Link button
<Button variant="brand" href="/signup">
  Get Started
</Button>

// Full-width action
<Button variant="danger" fullWidth icon={<Trash2 />}>
  Delete Conversation
</Button>

// Ghost navigation
<Button variant="ghost" size="sm">
  View All →
</Button>
```

### Migration Guide
- Replace raw `<button>` or `<Link>` tags with `<Button>` component
- Use `variant` prop instead of custom Tailwind classes
- Leverage `icon` prop instead of manual icon placement
- Ensure all CTAs use `rounded-full` for consistency
