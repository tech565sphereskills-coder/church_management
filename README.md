<<<<<<< HEAD
# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
=======
# 🏛️ RCCG Emmanuel Sanctuary Portal

[![Tech Stack](https://img.shields.io/badge/Stack-Django%20%2B%20React-blue.svg)](https://github.com/rccg-emmanuel/portal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

A comprehensive, enterprise-grade Church Management System designed to streamline administration, engagement, and financial oversight for **RCCG Emmanuel Sanctuary**. This platform provides a centralized hub for managing members, tracking attendance via QR codes, overseeing church financials, and automating communication.

---

## ✨ Core Modules

### 👥 Member Management
- **Enterprise Directory**: High-density, 18-column data table with sticky positioning for seamless navigation.
- **Detailed Profiles**: Complete digital history for every member, including ordination details and workforce history.
- **QR Identity**: Automatic QR code generation for every member for secure and fast check-ins.
- **Smart Import/Export**: Robust Excel/CSV import suite with intelligent field mapping for bulk data handling.

### 📅 Attendance & Engagement
- **QR Check-in**: Real-time attendance tracking via mobile QR scanning.
- **Service Management**: Track attendance across Sunday Services, Midweek Services, and Special Programs.
- **Engagement Analytics**: Automatic detection of members needing follow-up based on attendance trends.

### 💰 Financial Oversight
- **Income Tracking**: Detailed logging of Tithes, Offerings, Building Funds, and Special Seeds.
- **Expense Management**: Categorized expenditure tracking with support for salary, maintenance, and projects.
- **Financial Reporting**: Comprehensive summaries and analytics for transparency and planning.

### 💬 Communication Hub
- **WhatsApp Integration**: Contact members directly via WhatsApp without saving numbers locally.
- **Bulk SMS**: Send personalized announcements and reminders to multiple members effortlessly.
- **Follow-up System**: Structured workflow for reaching out to first-timers and missed attendees.

### 🏢 Departments & Workforce
- **Workforce Tracking**: Manage church workers, ministers, and HODs across various departments (Choir, Ushering, etc.).
- **Family Trees**: Organize members into family units for holistic pastoral care.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Shadcn UI, Framer Motion |
| **Backend** | Django 6.0.2, Django REST Framework, PostgreSQL / SQLite |
| **State Management** | TanStack Query (React Query) |
| **Icons & UI** | Lucide React, Google Fonts (Outfit, Inter) |
| **Authentication** | JWT, Role-Based Access Control (RBAC), Google OAuth |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### Installation

#### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start the server
python manage.py runserver
```

#### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📂 Project Structure

```text
├── backend/               # Django REST API
│   ├── church_management/ # Core app logic, models & views
│   └── portal_api/        # Project settings & URL routing
├── frontend/              # Vite + React Application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks (API integration)
│   │   └── pages/         # High-level page components
└── docker-compose.yml     # Production deployment configuration
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed for RCCG Emmanuel Sanctuary.**
>>>>>>> e11383f (Added latest features)
