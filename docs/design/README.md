# UI Redesign & Design System

This document outlines the design system for the Local Events platform redesign. The goal is to create a UI that is simple, elegant, and efficient for a tech-savvy audience.

## Guiding Principles

1.  **Information-Dense & Efficient:** Prioritize scannability and quick access to information.
2.  **Elegant & Modern Aesthetics:** A clean, consistent, and professional dark theme.
3.  **"Spark Joy" through Polish:** Create a responsive and intuitive feel with subtle animations and instant feedback.
4.  **Privacy-First:** Handle all data transparently and ethically.

## Color Palette (Dark Theme)

The new design uses a modern dark theme.

| Role              | Hex Code      | Tailwind Utility      | Description                                      |
| ----------------- | ------------- | --------------------- | ------------------------------------------------ |
| **Background**    | `#111827`     | `bg-gray-900`         | Main page background                             |
| **Panels / Cards**| `#1F2937`     | `bg-gray-800`         | Background for cards, modals, and side panels    |
| **Borders**       | `#374151`     | `border-gray-700`     | Subtle borders for cards and inputs              |
| **Primary Accent**| `#38BDF8`     | `bg-sky-400`          | Buttons, links, highlights, focus rings          |
| **Accent Hover**  | `#7DD3FC`     | `bg-sky-300`          | Hover state for primary accent elements          |
| **Text Primary**  | `#F9FAFB`     | `text-gray-50`        | Main text, headings                            |
| **Text Secondary**| `#9CA3AF`     | `text-gray-400`       | Secondary information, placeholders, subtitles   |
| **Success**       | `#34D399`     | `bg-emerald-400`      | Confirmation messages, "Free" tag              |
| **Warning**       | `#FBBF24`     | `bg-amber-400`        | Non-critical alerts                            |
| **Danger**        | `#F87171`     | `bg-red-400`          | Errors, deletion confirmation                  |

## Typography

- **UI Font:** `Inter` (already configured in `tailwind.config.js`). It's a clean, highly readable sans-serif font perfect for UIs.
- **Monospace Font:** `Source Code Pro` will be used for specific elements like dates, times, or other data-like figures to appeal to the tech aesthetic.
- **Scale:**
    - `text-4xl` (36px): Main hero titles.
    - `text-2xl` (24px): Page and section headings.
    - `text-lg` (18px): Card titles.
    - `text-base` (16px): Body text.
    - `text-sm` (14px): Secondary text, metadata.
    - `text-xs` (12px): Badges, tertiary info.

## Spacing & Layout

- **Base Unit:** `1 unit = 4px`. All spacing will be a multiple of this unit. (e.g., `p-4` = 16px).
- **Layout:** The main event list will move to a responsive **masonry grid**. This provides high information density and visual interest.
- **Rounding:** All interactive elements (cards, buttons, inputs) will have a consistent corner radius (`rounded-lg` / 8px).

## Interactivity & Animation

- **Hover Effects:** Interactive elements will have a clear hover state (e.g., cards lift, buttons change brightness).
- **Transitions:** Use `transition-colors` and `duration-200` for smooth visual feedback.
- **Page Load:** Elements will fade in smoothly on load.
- **List Animation:** New items in the event list will animate in using a subtle fade and slide-up effect.
