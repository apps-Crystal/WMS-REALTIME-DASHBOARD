# Falcon Agrifriz Dashboard

A premium React application for visualizing vehicle entry data for Falcon Agrifriz Foods Private Limited, powered by Crystal Group.

## Features

- **Premium UI**: Glassmorphism design, smooth animations, and responsive layout.
- **Real-time Data**: Fetches directly from the Google Sheet vehicle entry log.
- **Smart Filtering**: Automatically filters data for "Falcon Agrifriz Foods Private Limited".
- **Dashboard Stats**: Displays total vehicles, pallets, and boxes.

## Tech Stack

- React (Vite)
- Framer Motion (Animations)
- PapaParse (CSV Processing)
- Lucide React (Icons)
- Vanilla CSS (Custom variables & advanced styling)

## Getting Started

1.  **Install Dependencies** (if not already done):
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Customization

- **Data Source**: Update `SHEET_ID` and `SHEET_NAME` in `src/App.jsx`.
- **Target Customer**: Update `TARGET_CUSTOMER` string in `src/App.jsx`.

---
*Created by Crystal Group Dev Team*
