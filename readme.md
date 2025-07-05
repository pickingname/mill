# MapCore

A real-time earthquake monitoring and visualization application built with Vite and Mapbox GL. MapCore provides live earthquake data visualization with detailed information about seismic events.

## ✨ Features

- **Real-time Earthquake Monitoring**: Fetches live earthquake data from P2P Earthquake Network API
- **Interactive Map Visualization**: Powered by Mapbox GL with smooth animations and responsive design
- **Detailed Earthquake Information**: Displays magnitude, intensity, depth, location, and timestamp
- **Modern UI**: Clean interface with dark/light theme support
- **Responsive Design**: Optimized for desktop and mobile devices
- **Minimap Support**: Additional mapping utilities for enhanced navigation

## 🛠️ Tech Stack

- **Frontend**: Vite, JavaScript (ES6 modules)
- **Mapping**: Mapbox GL JS
- **Styling**: Tailwind CSS v4, PostCSS
- **Package Manager**: pnpm
- **Data Source**: P2P Earthquake Network API

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Mapbox account and access token

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mapcore
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_MAPBOX_GL_ACCESS_TOKEN=your_mapbox_access_token_here
   ```
   
   Get your free Mapbox access token at [mapbox.com](https://www.mapbox.com/)

4. **Start development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

## 📝 Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally

## 🏗️ Project Structure

```
mapcore/
├── src/
│   ├── utils/
│   │   ├── main.js              # Main application logic
│   │   ├── config.js            # Configuration settings
│   │   ├── map/                 # Map initialization and utilities
│   │   ├── fetch/               # Data fetching utilities
│   │   ├── classification/      # Data classification logic
│   │   └── components/          # UI components
│   ├── lib/
│   │   └── minimap.js          # Minimap functionality
│   ├── special/
│   │   └── epicenterRef.json   # Earthquake reference data
│   └── style.css               # Global styles
├── public/                     # Static assets
├── index.html                  # Main HTML template
├── package.json               # Dependencies and scripts
└── tailwind.config.js         # Tailwind configuration
```

## 🔧 Configuration

### API Settings
The application fetches earthquake data from the P2P Earthquake Network API. Configuration can be modified in `src/utils/config.js`:

- **API Endpoint**: Real-time earthquake data feed
- **Update Interval**: 3 seconds (configurable)
- **Map Settings**: Bounds, animations, and theme preferences

### Environment Variables
- `VITE_MAPBOX_GL_ACCESS_TOKEN`: Your Mapbox access token (required)

## 📊 Data Source

MapCore uses the [P2P Earthquake Network API](https://api.p2pquake.net/) which provides:
- Real-time earthquake reports
- Detailed seismic information
- Japanese earthquake monitoring data
- Various report types (DetailScale, ScalePrompt, etc.)

## 🎨 Themes

The application supports automatic theme switching based on system preferences, with additional manual theme options available in the configuration.

## 📱 Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and not currently licensed for public use.

---

**Note**: This application provides earthquake monitoring for educational and informational purposes. For official earthquake warnings and emergency information, always refer to your local geological survey or emergency management agency.
