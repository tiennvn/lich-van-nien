# Lịch Vạn Niên Việt Nam 📅

A beautiful Vietnamese Lunar Calendar web application that displays both solar and lunar calendar dates with Vietnamese holidays and traditional Can-Chi year naming.

**Live Demo**: [https://tiennvn.github.io/lich-van-nien](https://tiennvn.github.io/lich-van-nien)

## Features

- 📅 **Dual Calendar Display**: View both solar (Gregorian) and lunar (Vietnamese) dates
- 🎯 **Date Selection**: Click to select/deselect dates with persistent storage
- 🎊 **Vietnamese Holidays**: Automatic marking of solar and lunar holidays
- 🔄 **Infinite Scroll**: Seamlessly browse multiple years
- 📱 **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- 🎨 **Modern UI**: Clean purple/violet gradient theme with smooth animations
- 🏛️ **Can-Chi System**: Traditional Vietnamese zodiac year naming (Giáp Tý, Ất Sửu, etc.)
- 💾 **LocalStorage**: Selected dates persist across browser sessions

## Technology Stack

- **React 19.2** - Modern UI library
- **Vite 7.2** - Fast build tool and dev server
- **CSS-in-JS** - Inline styling with responsive design
- **Lunar Calendar Algorithm** - Based on Hồ Ngọc Đức's calculations

## Getting Started

### Prerequisites

- Node.js 20.15+ or 22.12+
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/tiennvn/lich-van-nien.git

# Navigate to project directory
cd lich-van-nien

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to view the app.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run deploy` - Build and deploy to GitHub Pages

## Project Structure

```
lich-van-nien/
├── src/
│   ├── App.jsx          # Main application component (single-file architecture)
│   ├── main.jsx         # React entry point
│   └── index.css        # Global styles
├── public/
│   └── calendar.svg     # Calendar favicon
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── package.json         # Dependencies and scripts
└── CLAUDE.md           # Development guidance
```

## Vietnamese Holidays

### Solar Calendar Holidays
- Tết Dương lịch (Jan 1)
- Quốc tế Phụ nữ (Mar 8)
- Giải phóng miền Nam (Apr 30)
- Quốc tế Lao động (May 1)
- Quốc khánh (Sep 2)
- And more...

### Lunar Calendar Holidays
- Tết Nguyên Đán (1/1)
- Tết Nguyên Tiêu (15/1)
- Giỗ Tổ Hùng Vương (10/3)
- Phật Đản (15/4)
- Tết Đoan Ngọ (5/5)
- Vu Lan (15/7)
- Tết Trung Thu (15/8)
- Ông Táo chầu trời (23/12)

## Deployment

This project is automatically deployed to GitHub Pages using the `gh-pages` package.

To deploy your own version:

1. Update `homepage` in `package.json` to your GitHub Pages URL
2. Update `base` in `vite.config.js` to match your repository name
3. Run `npm run deploy`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Lunar calendar conversion algorithm by Hồ Ngọc Đức
- Built with React and Vite
- Deployed on GitHub Pages

---

Made with ❤️ for the Vietnamese community
