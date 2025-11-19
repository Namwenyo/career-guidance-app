This repository contains the frontend for CareerNamibia, a web based AI system developed to
guides Namibian high school graduates in choosing university programs that align with their academic performance and personal interests.

The platform evaluates subjects, grades, interests, and university admission requirements to produce personalized program recommendations.
This repository only includes the frontend, but it is fully integrated with a powerful backend system kept in a private repository.

The backend is a Django + PostgreSQL service built to process student data, perform eligibility checks, and deliver AI-powered recommendations. It is where all the logics are ad this frontend communicates with it through secure API endpoints.

**Features for the Frontend**
-Built with Next.js and Tailwind CSS for a seamless experience on all devices.
- **Interactive Assessment**:
  - Upload report cards for automatic grade extraction (OCR)
  - Manual grade input fallback
  - Interest selection and university preferences
- **AI-Powered Results**: Displays personalized program recommendations with eligibility status.
- **Program Browser**: Explore all available university programs with filtering options.
- **Real-time Feedback**: Provide feedback on recommendations to improve the system.

**Tech Stack**

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form with Zod validation
- **Package Manager**: pnpm
