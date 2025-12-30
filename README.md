# Appointment Booking System

A modern, full-stack appointment booking system built with Next.js, TypeScript, Prisma and Redis. Features a clean admin interface for managing time slots and a user-friendly booking experience with timezone support.

## 🌐 Demo

🚀 **[Live Demo](https://appointment-system-smoky-three.vercel.app/)** - Try the appointment booking system in action!

**Demo Features:**
- Browse available time slots on an interactive calendar
- Book appointments with real-time availability
- Admin dashboard for managing bookings and time slots
- Responsive design that works on all devices
- Secure authentication system

**Admin Access:**
- 🔐 **[Admin Login](https://appointment-system-smoky-three.vercel.app/admin/login)**
- **Email:** `root@example.com`
- **Password:** `rootpassword123`

*Use these credentials to explore the full admin dashboard functionality, including time slot management and booking oversight.*

## 🚀 Features

- **Modern Tech Stack**: Next.js 16, TypeScript, Tailwind CSS, Prisma
- **Authentication**: Secure authentication with Better Auth
- **Admin Dashboard**: Complete admin interface for managing bookings and time slots
- **Time Zone Support**: Configurable timezone handling with Day.js
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Email Integration**: Email notifications with Resend
- **Real-time Updates**: Live calendar and booking management

## 🏗️ Architecture

### Frontend
- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** components for accessibility
- **Lucide React** icons
- **Day.js** for date/time handling with timezone support

### Backend
- **Next.js API Routes** with Hono framework
- **Prisma** ORM with PostgreSQL
- **Redis** for caching
- **Better Auth** for authentication
- **Zod** for validation

### Database Models
- **User**: Authentication and user management
- **Booking**: Appointment bookings with status tracking
- **TimeSlot**: Available time slots with capacity management
- **Session/Account**: Authentication sessions and accounts

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn or pnpm

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd appointment-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy the example environment file and configure your environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` and fill in your actual values for the required environment variables:
   ```env
   DATABASE_URL="your-postgresql-connection-string"
   BETTER_AUTH_SECRET="your-secure-random-secret"
   BETTER_AUTH_URL="http://localhost:3000"
   RESEND_API_KEY="your-resend-api-key"
   REDIS_URL="your-redis-connection-string-here"
   ROOT_ACCOUNT="admin@example.com"
   ROOT_PASSWORD="secure-admin-password"
   TZ="UTC"
   NEXT_PUBLIC_TZ="Your/Timezone"
   OFFICE_HOURS="09:00-12:30,14:00-18:00"
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Push database schema
   npm run prisma:push

   # Run migrations (if needed)
   npm run prisma:migrate

   # Seed the database with root admin account
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📖 Usage

### For Users
1. **Register/Login**: Create an account or sign in
2. **Browse Calendar**: View available dates and time slots
3. **Book Appointment**: Select a time slot and confirm booking
4. **Manage Bookings**: View and cancel your appointments

### For Admins
1. **Admin Login**: Use the root admin account created during seeding
2. **Time Slot Management**: Create and manage available time slots
3. **Booking Management**: View, manage, and cancel user bookings
4. **User Management**: Monitor user accounts and activity

## 🏃‍♂️ Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:push     # Push schema to database
npm run prisma:migrate  # Run database migrations
npm run seed           # Seed database with initial data

# Authentication
npm run better-auth:generate # Generate auth types

# Code Quality
npm run lint           # Run ESLint
```

## 🔧 Configuration

### Time Zone Settings
The application supports configurable timezones:
- Set `NEXT_PUBLIC_TZ` for client-side timezone
- Should be set to the same IANA timezone identifier (e.g., "America/New_York", "Asia/Hong_Kong")
- Keep `TZ="UTC"` to avoid timezone conversion issues

### Office Hours
Configure business hours in the `OFFICE_HOURS` environment variable:
```
OFFICE_HOURS="09:00-12:30,14:00-18:00"
```
- Multiple time ranges separated by commas
- 24-hour format (HH:MM-HH:MM)

### Time Slot Settings
- `TIMESLOT_DURATION_MINUTES`: Duration of each time slot (default: 30)
- `TIMESLOT_CAPACITY`: Maximum bookings per time slot (default: 5)

## 🗂️ Project Structure

```
appointment-system/
├── app/                    # Next.js app directory
│   ├── (admin)/           # Admin routes
│   ├── (main)/            # Main user routes
│   └── api/               # API routes
├── components/            # Reusable UI components
├── lib/                   # Utility libraries
│   ├── app.ts            # Business logic
│   ├── auth.ts           # Authentication setup
│   ├── config.ts         # Configuration
│   └── utils.ts          # Utility functions
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── generated/            # Generated Prisma client
```

## 🔐 Authentication

The application uses Better Auth for secure authentication with:
- Email/OTP authentication
- Email/password authentication (Admin dashboard)
- Session management
- Admin role support

## 📧 Email Notifications

Integrated with Resend for email notifications:
- Booking confirmations (WIP)
- Cancellation notifications (WIP)

## 🎨 UI Components

Built with modern UI components:
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Lucide React** for icons
- **Custom components** in `/components` directory

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms
1. Build the application: `npm run build`
2. Set environment variables
3. Deploy the `.next` folder

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support or questions:
- Check the [Issues](https://github.com/your-repo/issues) page
- Review the [Next.js Documentation](https://nextjs.org/docs)
- Check [Prisma Documentation](https://www.prisma.io/docs)

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
