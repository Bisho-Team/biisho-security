# Koppa Security System Backend

A comprehensive Node.js backend API for the Koppa Smart Security System with role-based access control, built with Express, Prisma, and PostgreSQL.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Super Admin, Office Managers, Police Managers, and Operators
- **Company Management**: Multi-tenant support with company isolation
- **Branch Management**: Location-based security management
- **Alarm System**: Real-time alarm creation and dispatch
- **Report Management**: Police response tracking and resolution
- **Analytics**: Comprehensive reporting and analytics

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod
- **Security**: Helmet, CORS

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone and install dependencies**:
\`\`\`bash
git clone <repository>
cd koppa-security-backend
npm install
\`\`\`

2. **Set up environment variables**:
\`\`\`bash
cp .env.example .env
# Edit .env with your database credentials
\`\`\`

3. **Set up database**:
\`\`\`bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
\`\`\`

4. **Start development server**:
\`\`\`bash
npm run dev
\`\`\`

### Using Docker

\`\`\`bash
# Start with Docker Compose
docker-compose up -d

# Run migrations and seed
docker-compose exec backend npm run db:push
docker-compose exec backend npm run db:seed
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (Super Admin only)
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List all users (Super Admin)
- `GET /api/users/my-operators` - Get managed operators
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Companies
- `GET /api/companies` - List companies (Super Admin)
- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Create company
- `PUT /api/companies/:id` - Update company
- `DELETE /api/companies/:id` - Delete company

### Branches
- `GET /api/branches` - List accessible branches
- `GET /api/branches/:id` - Get branch details
- `POST /api/branches` - Create branch
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Alarms
- `GET /api/alarms` - List alarms
- `GET /api/alarms/:id` - Get alarm details
- `POST /api/alarms` - Create and dispatch alarm
- `PUT /api/alarms/:id` - Update alarm status

### Reports
- `GET /api/reports` - List alarm reports (Police Manager)
- `PUT /api/reports/:id` - Update report status

### Analytics
- `GET /api/analytics/system` - System analytics (Super Admin)
- `GET /api/analytics/police` - Police manager analytics
- `GET /api/analytics/office` - Office manager analytics

## User Roles & Permissions

### Super Admin
- Full system access
- Manage all users, companies, and system settings
- View system-wide analytics

### Office Manager
- Manage branches within their company
- Create and manage operators
- Create and dispatch alarms
- View company analytics

### Police Manager
- Receive and respond to alarm reports
- Manage police operators
- View response analytics

### Operator (Office)
- Monitor assigned branches
- Create alarms for assigned locations
- Limited branch access

### Operator (Police)
- Handle assigned reports
- Update investigation status
- Evidence management

## Database Schema

The system uses a comprehensive PostgreSQL schema with the following main entities:

- **Users**: Authentication and role management
- **Companies**: Multi-tenant organization structure
- **Branches**: Physical security locations
- **Alarms**: Security incidents and alerts
- **Reports**: Police response tracking
- **Branch Operators**: Assignment relationships

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions by user role
- **Data Isolation**: Company-based data segregation
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM parameterized queries

## Development

### Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
\`\`\`

### Environment Variables

\`\`\`env
DATABASE_URL="postgresql://username:password@localhost:5432/koppa_security"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
\`\`\`

## Production Deployment

1. **Build the application**:
\`\`\`bash
npm run build
\`\`\`

2. **Set production environment variables**
3. **Run database migrations**:
\`\`\`bash
npm run db:migrate
\`\`\`

4. **Start the server**:
\`\`\`bash
npm start
\`\`\`

## API Response Format

### Success Response
\`\`\`json
{
  "message": "Operation successful",
  "data": { ... }
}
\`\`\`

### Error Response
\`\`\`json
{
  "error": "Error message",
  "details": { ... }
}
\`\`\`

### Pagination Response
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
