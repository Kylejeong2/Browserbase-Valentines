# Browserbase Valentine's Card Generator 🌹

A Stagehand-powered automation that generates beautiful Valentine's Day cards using v0.dev. Built with Playwright and enhanced with Stagehand's AI capabilities.

## Features

- Automated v0.dev interaction
- GitHub authentication handling
- Smart cookie management
- Customizable flower themes
- AI-powered browser automation with fail-safes

## Quick Start

1. Clone the repo

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables:
    ```bash
    cp .env.example .env
    ```

    Add your credentials to `.env`:
    ```env
    BROWSERBASE_PROJECT_ID="your_project_id"
    BROWSERBASE_API_KEY="your_api_key"
    OPENAI_API_KEY="your_openai_key"  # Optional if using Anthropic
    ANTHROPIC_API_KEY="your_anthropic_key"  # Optional if using OpenAI
    GITHUB_EMAIL="your_github_email"
    GITHUB_PASSWORD="your_github_password"
    ```

4. Run the generator: (example query)
    ```bash
    npm start -- --flowerType="rose"
    ```

## How It Works

The script:
1. Launches a browser session
2. Navigates to v0.dev
3. Handles GitHub authentication if needed
4. Generates a Valentine's card based on your chosen flower
5. Extracts the generated code

## Configuration Options

### Running on Browserbase
Edit `stagehand.config.ts`:
```typescript
const StagehandConfig: ConstructorParams = {
  env: "BROWSERBASE",  // Change from "LOCAL"
  // ... other config
};
```

### Using Claude 3.5 Sonnet
Edit `stagehand.config.ts`:
```typescript
const StagehandConfig: ConstructorParams = {
  modelName: "claude-3-5-sonnet-latest",  // Change from "gpt-4o"
  modelClientOptions: {
    apiKey: process.env.ANTHROPIC_API_KEY,  // Change from OPENAI_API_KEY
  },
};
```

## Example Usage

Generate different themed cards:
```bash
npm start -- --flowerType="tulip"
npm start -- --flowerType="sunflower"
npm start -- --flowerType="orchid"
```

## Advanced Features

### Cookie Management
The script automatically saves and loads cookies between sessions for faster authentication.

### Error Handling
Built-in retries and fallbacks for:
- Login attempts
- Code generation
- Code extraction

### Debugging
Enable verbose logging in `stagehand.config.ts`:
```typescript
debugDom: true,
logger: (message: LogLine) => console.log(logLineToString(message)),
```

## Project Structure

- `main.ts` - Core automation logic
- `index.ts` - Entry point and setup
- `stagehand.config.ts` - Configuration
- `utils.ts` - Helper functions
- `.cursorrules` - Custom rules for Stagehand code generation

## Dependencies

- `@browserbasehq/stagehand`: ^1.11.0
- `@playwright/test`: ^1.49.1
- `zod`: ^3.22.4
- Other utilities: chalk, boxen, dotenv, yargs

## Notes

- The script has a 3-minute timeout for card generation
- GitHub credentials are required for v0.dev access
- Generated cards are single-file components
- Browser runs in non-headless mode by default

## Sources
- main.ts
- index.ts
- stagehand.config.ts
- package.json
- .env.example
- .cursorrules