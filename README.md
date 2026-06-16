# Financial Advisor AI

Welcome to **Financial Advisor AI**, a comprehensive, AI-powered personal finance assistant designed to help you take full control of your financial health. 

🚀 **Live Deployment:** [https://clearfin-advisor.onrender.com](https://clearfin-advisor.onrender.com)

## Features

- **AI Financial Advisor (Chat):** A personal AI agent powered by OpenAI GPT-4o that has persistent memory of your financial profile. Ask it questions about reducing spending, saving for goals, or paying off debts.
- **Transactions Management:** Track your cash flow by logging income and expenses, categorizing them, and viewing your transaction history.
- **Budgeting:** Set spending limits for various categories and visually track your progress.
- **Analytics & Insights:** Gain deeper insights into your financial habits with spending breakdowns, cash flow trends, and goal progress visualizations.
- **Secure Authentication:** Secure registration and login flow, featuring email OTP verification.

## Getting Started

### Access the Live Application
You can access the live application directly at: [https://clearfin-advisor.onrender.com](https://clearfin-advisor.onrender.com)

### Using the App
1. **Register:** Create an account by entering your details.
2. **Verify Email:** Use the OTP sent to your email to verify your account (Note: during testing/development, the universal OTP is `123456`).
3. **Onboarding:** Set your financial goals and provide basic income/asset details to help the AI tailor its advice.
4. **Explore:** Add transactions, set up budgets, view analytics, and chat with your AI advisor!

For more detailed information on how to use the platform, please refer to the [User Manual](USER_MANUAL.md).

## Project Structure
- `artifacts/api-server/`: Express backend handling authentication, database interactions, and the OpenAI API integration.
- `client/`: React frontend providing the user interface, analytics charts, and chat interface.
- `@workspace/db`: Drizzle ORM database schema definitions.

## Local Development Setup

To run this project locally, you'll need Node.js and `pnpm` installed.

1. Clone the repository.
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Set up your environment variables by creating a `.env` file in the root directory:
   ```env
   DATABASE_URL=your_database_url
   OPENAI_API_KEY=your_openai_api_key
   SMTP_USER=your_smtp_email
   SMTP_PASS=your_smtp_password
   SESSION_SECRET=your_secret_key
   ```
4. Push the database schema:
   ```bash
   pnpm db:push
   ```
5. Start the development server:
   ```bash
   pnpm run dev
   ```

## Tech Stack
- **Frontend:** React, Tailwind CSS, Vite
- **Backend:** Node.js, Express
- **Database:** PostgreSQL, Drizzle ORM
- **AI:** OpenAI GPT-4o API
- **Deployment:** Render
