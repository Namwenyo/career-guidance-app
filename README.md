This repository contains the frontend for CareerNamibia, a web based AI system developed to
guide Namibian high school graduates in choosing university programs that align with their academic performance and personal interests.

The platform evaluates subjects, grades, interests, and university admission requirements to produce personalized program recommendations.
This repository only includes the frontend, but it is fully integrated with a powerful backend system that is kept in a private repository.

The backend is a Django + PostgreSQL service built to process student data, perform eligibility checks, and deliver AI-powered recommendations. It is where all the logics and algorithms are and this frontend communicates with it through secure API endpoints.

The project was built as part of a Bachelor of Science in Computer Science research project at the University of Namibia (UNAM)


Would you have any inquiry


contact me at wilhelmnamwenyo@gmail.com

**Features for the Frontend**

Built with Next.js and Tailwind
- **Interactive Assessment**:
  - Upload report cards for automatic grade extraction (OCR)
  - Manual grade input fallback
  - Interest selection and university preferences
- **AI-Powered Results**: Displays personalized program recommendations with eligibility status.
- **Program Browser**: Explore all available university programs with filtering options.
- **Real time Feedback**: Provide feedback on recommendations to improve the system model.

**Tech Stack**

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form with Zod validation
- **Package Manager**: pnpm

**Some screenshots of the frontend**

**landing Page**

<img width="940" height="492" alt="image" src="https://github.com/user-attachments/assets/0a64999f-a220-4944-a691-7cd45d01b92d" />

<img width="940" height="451" alt="image" src="https://github.com/user-attachments/assets/6848142b-35ff-47f9-b8cb-89fa4a0526d5" />

**assessment page**

<img width="940" height="470" alt="image" src="https://github.com/user-attachments/assets/fb84bdf5-6f5c-4ffd-bdda-51a5c84b45be" />


<img width="940" height="533" alt="image" src="https://github.com/user-attachments/assets/ac7e725c-4b6f-44a3-8a4d-6fdee86ec25a" />


<img width="940" height="528" alt="image" src="https://github.com/user-attachments/assets/9244f77b-4ea3-4c30-a40e-ef871d9f6642" />


**Result page**

Display AI-generated career recommendations after analysing. Each recommendation includes program details, eligibility status, accompanied by an encouraging and motivation message and reasoning. The system also provides program suggestions, and market insights to guide students toward informed and achievable career choices.

<img width="940" height="566" alt="image" src="https://github.com/user-attachments/assets/a729a931-f76c-44b3-984f-e840873dc4d4" />





