# Coding Principles

## General Rules
- Use modern JavaScript (ES2023+)
- Prefer pure functions for logic layers
- Isolate external I/O (APIs, SMTP) behind adapters
- No side effects inside business logic modules

## Module Structure
- Each module lives in its own file
- Default export = primary function
- No circular dependencies

## Testing Expectations
- Correlation engine must be unit-testable without network calls
- LLM prompt logic must be pure string templating
- SMTP sending must be mockable

## Error Handling
- Fail loudly for configuration errors
- Fail softly for transient network/API issues and retry

## Prompts
- Always force LLM to state when data is insufficient
- Never allow guessing or financial advice

## Docker
- No host assumptions; config via env vars only
- Do not bake secrets into the image
