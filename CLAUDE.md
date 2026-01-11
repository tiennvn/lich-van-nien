# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vietnamese Lunar Calendar (Lịch Vạn Niên Việt Nam) - A React-based web application that displays both solar and lunar calendar dates with Vietnamese holidays and traditional Can-Chi year naming.

**Live Site**: https://tiennvn.github.io/lich-van-nien

## Common Commands

- **Development server**: `npm run dev` - Starts Vite dev server with hot module replacement
- **Build**: `npm run build` - Creates production build in `dist/` directory
- **Lint**: `npm run lint` - Runs ESLint on all JavaScript/JSX files
- **Preview**: `npm run preview` - Preview production build locally
- **Deploy**: `npm run deploy` - Build and deploy to GitHub Pages (gh-pages branch)

## Architecture

### Single-Component Architecture

The entire application is contained within `src/App.jsx` as a single-file component (~686 lines). This monolithic structure includes:

1. **Lunar Calendar Utilities** (lines 3-140)
   - `jdFromDate` / `jdToDate`: Julian Day conversions
   - `getNewMoonDay`: Calculates new moon dates for lunar month boundaries
   - `getSunLongitude`: Astronomical calculations for solar terms
   - `convertSolar2Lunar`: Main conversion function (solar → lunar calendar)
   - Algorithm based on Hồ Ngọc Đức's Vietnamese lunar calendar calculations

2. **Can-Chi System** (lines 142-150)
   - Traditional 10 Heavenly Stems (Can) and 12 Earthly Branches (Chi)
   - `getCanChiYear`: Generates Vietnamese zodiac year names (e.g., "Giáp Tý")

3. **Holiday Definitions** (lines 152-182)
   - `SOLAR_HOLIDAYS`: Gregorian calendar holidays
   - `LUNAR_HOLIDAYS`: Vietnamese traditional holidays (Tết, Vu Lan, etc.)
   - `getHoliday`: Holiday lookup function

4. **React Components** (lines 184-269)
   - `DayCell`: Individual calendar day with solar/lunar dates and holiday indicator
   - `MonthCalendar`: Month view with 7-day week grid
   - `AdBanner`: Placeholder components for Google AdSense integration
   - All components use React.memo for performance optimization

5. **Main App Component** (lines 271-686)
   - Infinite scroll calendar (loads additional years on scroll)
   - Year navigation with smooth scrolling
   - IntersectionObserver for lazy loading future years
   - Inline CSS-in-JS styling for entire application

### State Management

- Minimal React hooks-based state (useState, useEffect, useRef, useCallback)
- `years`: Array of years to display (grows with infinite scroll)
- `currentYear`: Currently selected year for navigation
- `selectedDates`: Set of selected dates stored in localStorage
- `observerTarget`: Ref for IntersectionObserver trigger
- `yearRefs`: Object mapping years to DOM refs for scroll navigation

### Key Features

1. **Date Selection**: Click dates to select/deselect with visual highlighting (green background)
2. **LocalStorage Persistence**: Selected dates persist across page refreshes
3. **Sticky Header**: Compact header stays at top while scrolling
4. **Smooth Navigation**: Year navigation scrolls smoothly with header offset
5. **Holiday Indicators**: Red dots mark Vietnamese solar and lunar holidays
6. **Responsive Design**: Adapts to desktop, tablet, and mobile screens

### Styling Approach

All styles are inline in a `<style>` JSX block within App.jsx. Responsive breakpoints:
- Desktop: 3-column month grid, centered layout (max-width: 1400px)
- Tablet (≤1024px): 2-column month grid
- Mobile (≤768px): 1-column grid

Color scheme: Purple/violet gradient background (#667eea to #764ba2)

## Development Notes

### Modifying Calendar Logic

When updating lunar conversion algorithms:
- The timezone parameter defaults to 7 (Vietnam GMT+7)
- All Julian Day calculations use integer math for precision
- Leap month detection is handled in `getLeapMonthOffset`

### Performance Considerations

- `DayCell` and `MonthCalendar` are memoized to prevent unnecessary re-renders
- Each day cell performs a solar-to-lunar conversion on render
- Consider caching conversion results if performance degrades

### Adding Holidays

Update the constant objects:
- `SOLAR_HOLIDAYS`: Use format `'day-month': 'Holiday Name'`
- `LUNAR_HOLIDAYS`: Same format for lunar calendar dates

### Responsive Design

The app uses CSS Grid throughout. When adding features, maintain the existing breakpoints at 1024px and 768px to ensure consistent mobile experience.

## Deployment

The app is deployed to GitHub Pages using the `gh-pages` package:
- **Repository**: https://github.com/tiennvn/lich-van-nien
- **Live URL**: https://tiennvn.github.io/lich-van-nien
- **Deployment branch**: `gh-pages` (auto-managed by gh-pages package)
- **Base path**: `/lich-van-nien/` (configured in vite.config.js)

To deploy updates:
1. Make your changes
2. Run `npm run deploy` (automatically builds and publishes)
