# Gherkin Builder

An agentic AI application that automatically generates Gherkin feature files (Cucumber syntax) from any website URL.

## 🚀 Getting Started

Follow these steps to get the application running locally.

### Prerequisites

- **Node.js**: v18 or higher
- **pnpm**: v9 or higher
- **Supabase Account**: For database and authentication
- **OpenAI API Key**: For the LLM generation
- **Langfuse Account**: For observability and tracing

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gherkin-builder
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install chromium
   ```

### Configuration

1. **Environment Variables**
   Copy the template file to `.env.local`:
   ```bash
   cp env.template .env.local
   ```

   Fill in the required values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `OPENAI_API_KEY`: Your OpenAI API Key
   - `LANGFUSE_PUBLIC_KEY`: From Langfuse Project Settings
   - `LANGFUSE_SECRET_KEY`: From Langfuse Project Settings
   - `LANGFUSE_HOST`: `https://cloud.langfuse.com` (or your self-hosted instance)

2. **Database Setup**
   - Go to your Supabase Project Dashboard -> SQL Editor.
   - Copy the contents of `supabase/schema.sql`.
   - Run the SQL to create the `profiles`, `scans`, and `features` tables and set up Row Level Security (RLS).

### Running the Application

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture Overview

This application uses a modern, agentic stack designed for performance and observability.

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **UI Library**: [Mantine v8](https://mantine.dev/)
- **Compiler**: React Compiler (Experimental enabled)

### Backend & Database
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Auth**: Supabase Auth
- **API**: Next.js Server Actions & API Routes

### Agentic Core
The core logic resides in `src/lib/agent/`:
- **Browser Automation**: [Playwright](https://playwright.dev/) is used to headlessy browse websites, extract DOM content, and identify interactive elements (`src/lib/agent/browser.ts`).
- **AI Orchestration**: [Vercel AI SDK](https://sdk.vercel.ai/) manages the LLM interactions (`src/lib/agent/generator.ts`).
- **Model**: OpenAI `gpt-4o` is used to analyze the scraped content and generate Gherkin scenarios.

### Observability
- **Tracing**: [Langfuse](https://langfuse.com/) is integrated to trace the entire generation flow, capturing inputs (website content), outputs (Gherkin), and any errors.

## 🔍 Observability & Debugging

### Debugging the Agent
We provide a standalone script to verify the agent's logic without needing the full UI:

```bash
npx tsx scripts/verify-agent.ts
```
This script will:
1. Launch a headless browser.
2. Scan `example.com`.
3. Attempt to generate Gherkin features using your `.env.local` keys.
4. Log the output to the console.

### Viewing Traces
1. Log in to your [Langfuse Dashboard](https://cloud.langfuse.com).
2. Navigate to the **Traces** tab.
3. You will see traces named `generate-gherkin`.
4. Click on a trace to see the full prompt sent to the LLM, the raw response, and latency/cost metrics.

### Common Issues
- **Build Errors**: Ensure you are using `pnpm` and have installed all dependencies.
- **Browser Errors**: If Playwright fails, ensure you ran `npx playwright install chromium`.
- **API Errors**: Check your `.env.local` keys. If Gherkin generation fails, check the Langfuse trace for the specific error message from OpenAI.
