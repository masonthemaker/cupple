# Cupple

<div align="center">

## 🚀 Active Development - Join Our Community!

<a href="https://discord.gg/hxya9aEjJg">
  <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png" alt="Discord" width="80" height="80"/>
</a>

### [**Join Our Discord Server**](https://discord.gg/hxya9aEjJg)

**Pushing 10-15 updates per month** | Get support, share ideas, and stay updated with the latest features!

[![Discord](https://img.shields.io/badge/Click%20to%20Join-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/hxya9aEjJg)

---

</div>

> Living docs that sync across IDEs and agents

**Cupple** is a CLI tool that automatically generates and maintains AI-readable markdown documentation for your codebase. It's designed for the age of agentic coding—where AI assistants need up-to-date context to help you build better software, faster.

## Why Cupple?

In the era of AI-powered development, your documentation isn't just for humans anymore. **AI agents need context.** But keeping documentation in sync with rapidly changing code is nearly impossible manually.

Cupple solves this by:

- 📝 **Auto-generating documentation** as you code
- 🔄 **Keeping docs in sync** with your actual implementation
- 🤖 **Creating AI-optimized markdown** that agents can easily parse
- 🔗 **Sharing context across IDE instances** (frontend ↔ backend)
- ⚡ **Working invisibly** in the background while you focus on building

### The Problem Cupple Solves

When working with AI coding assistants (Cursor, Copilot, Claude, etc.), they often:
- ❌ Lack context about your full architecture
- ❌ Don't know what changed in other parts of your codebase
- ❌ Can't see how your frontend and backend connect
- ❌ Make assumptions based on outdated information

**Cupple ensures your AI agents always have accurate, up-to-date context.**

## Features

### 🤖 Automatic Documentation Generation
- Monitors your code changes in real-time
- Generates comprehensive markdown docs for any file type
- Configurable detail levels (brief, standard, comprehensive)
- Smart threshold system—only updates when meaningful changes occur

### 🔗 Cross-IDE Syncing
- Pair multiple Cupple instances (e.g., frontend + backend projects)
- Browse and pull documentation from paired projects
- Share context seamlessly between repositories
- Keep distributed teams and AI agents in sync

### ⚙️ Flexible Configuration
- **Auto Mode**: Automatic documentation as you code
- **Selector Mode**: Manual control over what gets documented
- Configure per-file-type detail levels
- Customizable change thresholds
- Support for TypeScript, JavaScript, Python, Java, Go, Rust, C++, and more

### 🎯 Built for AI Agents
- Clean, structured markdown optimized for LLM parsing
- Includes types, interfaces, props, parameters, and usage examples
- Tracks implementation details and gotchas
- Organized in predictable `docs/` folders

## Installation

```bash
npm install -g cupple
```

## Quick Start

1. **Navigate to your project directory:**
   ```bash
   cd your-project
   ```

2. **Start Cupple:**
   ```bash
   cupple
   ```

3. **Enter your API key** (Groq API for LLM-powered documentation):
   - Get a free key at [groq.com](https://console.groq.com/)

4. **Choose your mode:**
   - **Auto Mode**: Automatic documentation (recommended)
   - **Selector Mode**: Manual file selection

5. **Configure autodoc** (for Auto Mode):
   ```bash
   /init
   ```
   - Select file types to document
   - Set detail level per language
   - Configure change threshold

## Usage

### Commands

```bash
/init              # Configure autodoc settings
/select            # Browse and document files (selector mode)
/redoc <file> [notes]     # Regenerate docs with custom guidance
/auto <threshold>  # Set autodoc threshold (tiny/small/medium/big)
/mode              # Switch between auto and selector mode
/status            # Check server and watcher status
/pair <port>       # Connect to another Cupple instance
/unpair <port>     # Disconnect from paired instance
/browse <port>     # Browse files on paired instance
/help              # Show all commands
/exit              # Exit Cupple
```

### Auto Mode (Recommended)

Perfect for active development:

```bash
# After running /init, Cupple watches your files
# Documentation updates automatically when you save changes
# Configurable thresholds prevent spam (default: 40 lines changed)
```

**Example workflow:**
1. Edit `UserService.ts`, add 50 lines of new code
2. Save the file
3. Cupple auto-generates `docs/UserService-guide.md`
4. Your AI agent now understands the new service

### Selector Mode

For fine-grained control:

```bash
/select            # Opens file browser
# Navigate with arrow keys
# Press Enter to generate docs for selected file
```

### Pairing Projects

Link your frontend and backend:

**Backend (running on port 3000):**
```bash
cupple
# Server starts at http://localhost:3000
```

**Frontend (running on port 3001):**
```bash
cupple
# Server starts at http://localhost:3001
/pair 3000         # Connect to backend
/browse 3000       # View backend documentation
```

Now both projects can see each other's documentation—and so can your AI agents!

## Configuration

Settings are stored in `.cupple/cupplesettings.json`:

```json
{
  "mode": "auto",
  "apiKey": "your-groq-api-key",
  "autodocThreshold": 40,
  "extensionConfigs": [
    { "extension": ".ts", "detailLevel": "standard" },
    { "extension": ".tsx", "detailLevel": "comprehensive" },
    { "extension": ".py", "detailLevel": "brief" }
  ],
  "pairedInstances": [
    {
      "port": 3000,
      "url": "http://localhost:3000",
      "projectPath": "/path/to/backend"
    }
  ]
}
```

## Generated Documentation Structure

Cupple creates documentation in `docs/` subdirectories:

```
your-project/
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   └── docs/
│   │       └── Button-guide.md      ← AI-readable documentation
│   ├── services/
│   │   ├── AuthService.ts
│   │   └── docs/
│   │       └── AuthService-guide.md
```

Each guide includes:
- Purpose and overview
- Type definitions and interfaces
- Props/parameters with descriptions
- Usage examples
- Edge cases and gotchas
- Implementation notes

## API Key

Cupple uses the [Groq API](https://groq.com) with the **GPT OSS 120B** model for blazing-fast, high-quality LLM-powered documentation generation.

### Why Groq?

- ⚡ **Ultra-fast**: ~500 tokens/second output (documentation in seconds, not minutes)
- 💰 **Extremely cheap**: $0.15/M input tokens, $0.75/M output tokens
- 🆓 **Generous free tier**: 200k tokens/day (1,000 requests/day, 30 requests/minute)


### Pricing Breakdown

**Cost per documentation generation/update:**
- Average file (~200 lines, 1500 input tokens, 1000 output tokens)
- Input cost: $0.000225
- Output cost: $0.00075
- **Total: ~$0.001 per doc** (less than 1/10th of a cent!)

**Real-world estimates:**
- **100 docs generated**: ~$0.10
- **1,000 docs generated**: ~$1.00
- **10,000 docs generated**: ~$10.00

### Free Tier vs. Paid

**Free Tier** (openai/gpt-oss-120b):
- 200,000 tokens/day
- 1,000 requests/day
- 30 requests/minute
- Perfect for individual developers and small projects

**Developer Account** (pay-as-you-go):
- Sign up for free at [console.groq.com](https://console.groq.com/)
- Only pay for tokens used (~$0.001 per doc)
- Unlocks rate limits for high-volume projects
- Great for teams and active development

**Privacy**: Your code is sent to Groq for documentation generation. Groq does not train on your data.

Get your free API key: [console.groq.com](https://console.groq.com/)

## Why AI-Readable Documentation Matters

Traditional documentation is written for humans. But in 2025, your code is read by:
- **Human developers** (occasionally)
- **AI coding assistants** (constantly)

AI agents need:
- ✅ Structured, parseable markdown
- ✅ Up-to-date implementation details
- ✅ Type information and signatures
- ✅ Usage examples and edge cases
- ✅ Context about related components

Cupple generates exactly this—automatically.


## Use Cases

### 1. Solo Development with AI Assistants
- Keep your AI coding assistant informed as you build
- No more "the AI suggested outdated code"
- Context-aware suggestions and debugging

### 2. Team Development
- Onboard new team members with always-current docs
- Share knowledge across frontend/backend teams
- Document tribal knowledge automatically

### 3. Multi-Agent Workflows
- Different AI agents working on different parts of your stack
- Share context between agents via paired Cupple instances
- Coordinate changes across microservices

### 4. Open Source Projects
- Automatically maintain contributor documentation
- Help AI tools generate better PRs
- Keep README and API docs in sync

## Requirements

- Node.js 18+
- npm or yarn
- Groq API key (free)

## License

MIT License - Copyright (c) 2025 Mason Adams

See [LICENSE](./LICENSE) for full text.

## Contributing

Cupple is open source! Contributions welcome.

## Author

**Mason Adams**

---

**Built for the age of AI-powered development. Keep your agents in the loop.** 🤖✨

