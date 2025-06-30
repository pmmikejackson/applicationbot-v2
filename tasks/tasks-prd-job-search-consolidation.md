# Job Search Consolidation Task List

## Relevant Files

- `src/services/email/EmailService.ts` - Core email processing service with IMAP integration
- `src/services/email/EmailService.test.ts` - Unit tests for EmailService
- `src/services/parser/JobEmailParser.ts` - NLP-based email parsing for job listings
- `src/services/parser/JobEmailParser.test.ts` - Unit tests for JobEmailParser
- `src/models/Job.ts` - Job listing data model
- `src/models/Job.test.ts` - Unit tests for Job model
- `src/components/Dashboard/Dashboard.tsx` - Main dashboard component with metrics overview
- `src/components/Dashboard/Dashboard.test.tsx` - Unit tests for Dashboard
- `src/components/KanbanBoard/KanbanBoard.tsx` - Drag-and-drop Kanban board for application tracking
- `src/components/KanbanBoard/KanbanBoard.test.tsx` - Unit tests for KanbanBoard
- `src/services/ai/CoverLetterGenerator.ts` - AI service for cover letter generation
- `src/services/ai/CoverLetterGenerator.test.ts` - Unit tests for CoverLetterGenerator
- `src/services/calendar/CalendarIntegration.ts` - Calendar sync service for multiple providers
- `src/services/calendar/CalendarIntegration.test.ts` - Unit tests for CalendarIntegration
- `src/services/payment/StripeService.ts` - Stripe payment integration
- `src/services/payment/StripeService.test.ts` - Unit tests for StripeService
- `src/utils/deduplication.ts` - Utility for detecting duplicate job listings
- `src/utils/deduplication.test.ts` - Unit tests for deduplication utilities

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [ ] 1.0 Set up project infrastructure and authentication system
  - [ ] 1.1 Initialize Next.js/React project with TypeScript configuration
  - [ ] 1.2 Set up database schema (PostgreSQL/Prisma) for users, jobs, and applications
  - [ ] 1.3 Implement authentication system with email/password and 2FA support
  - [ ] 1.4 Create user registration flow with email verification
  - [ ] 1.5 Build login/logout functionality with session management
  - [ ] 1.6 Set up CCPA-compliant data privacy policies and user consent flow
  - [ ] 1.7 Implement user profile management and settings page
  - [ ] 1.8 Create responsive layout with navigation and mobile-friendly design

- [ ] 2.0 Implement email integration and job parsing functionality
  - [ ] 2.1 Build IMAP email service with support for Gmail, iCloud, Outlook
  - [ ] 2.2 Create email configuration wizard for user setup
  - [ ] 2.3 Implement secure credential storage with encryption
  - [ ] 2.4 Develop NLP-based job email parser to extract job details
  - [ ] 2.5 Build email filter configuration (sender addresses, subject patterns)
  - [ ] 2.6 Create background job processor for email scanning
  - [ ] 2.7 Implement historical email import on initial setup
  - [ ] 2.8 Build duplicate job detection algorithm
  - [ ] 2.9 Create manual job entry form for non-email jobs
  - [ ] 2.10 Implement automatic position closed detection for expired jobs

- [ ] 3.0 Build job management and application tracking features
  - [ ] 3.1 Create job listing data models with all required fields
  - [ ] 3.2 Build available jobs list view with search and filters
  - [ ] 3.3 Implement applied jobs list view with status indicators
  - [ ] 3.4 Develop drag-and-drop Kanban board with all status columns
  - [ ] 3.5 Create job card component with key information display
  - [ ] 3.6 Implement interview counter functionality for multiple rounds
  - [ ] 3.7 Build celebration screen with confetti animation for accepted jobs
  - [ ] 3.8 Create dashboard with metrics (job counts, status breakdown, oldest applications)
  - [ ] 3.9 Implement collaboration features with invite functionality
  - [ ] 3.10 Build PDF export functionality for job search reports
  - [ ] 3.11 Create job history configuration (up to 6 months retention)

- [ ] 4.0 Develop AI-powered cover letter and CV assistance
  - [ ] 4.1 Integrate AI service (OpenAI/Claude API) for content generation
  - [ ] 4.2 Build cover letter generation interface with job context
  - [ ] 4.3 Create CV optimization suggestion system
  - [ ] 4.4 Implement keyword highlighting from job descriptions
  - [ ] 4.5 Build document attachment system for jobs
  - [ ] 4.6 Create document viewer/download functionality
  - [ ] 4.7 Implement document versioning for cover letters and CVs
  - [ ] 4.8 Build templates system for cover letter customization

- [ ] 5.0 Integrate payment processing and subscription management
  - [ ] 5.1 Set up Stripe account and API integration
  - [ ] 5.2 Implement freemium model with 2-week trial logic
  - [ ] 5.3 Build subscription management page with plan details
  - [ ] 5.4 Create payment flow for $9/month premium subscription
  - [ ] 5.5 Implement single platform restriction for free tier after trial
  - [ ] 5.6 Build premium analytics dashboard with enhanced insights
  - [ ] 5.7 Create billing history and invoice download functionality
  - [ ] 5.8 Implement subscription cancellation flow
  - [ ] 5.9 Build usage tracking for premium feature access
  - [ ] 5.10 Create upgrade prompts for free tier limitations

- [ ] 6.0 Build calendar integration and browser extension
  - [ ] 6.1 Implement Google Calendar API integration
  - [ ] 6.2 Build Outlook Calendar integration
  - [ ] 6.3 Create Apple iCal integration support
  - [ ] 6.4 Develop bidirectional sync for interview appointments
  - [ ] 6.5 Build browser extension for Chrome/Firefox
  - [ ] 6.6 Create job capture functionality in browser extension
  - [ ] 6.7 Implement authentication flow for browser extension
  - [ ] 6.8 Build notification system for interview reminders
