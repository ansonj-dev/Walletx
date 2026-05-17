# Changelog

All notable changes to the WalletX SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-17

### Added
- Initial release of WalletX SDK
- Core `WalletXClient` class for universal IDE integration
- `CreditManager` for credit operations and balance management
- `AIProxyClient` for routing AI requests through WalletX
- `ContextManager` for IDE context persistence and sharing
- Support for multiple AI models (OpenAI, Anthropic, Google Gemini)
- Event-driven architecture with real-time updates
- Offline mode with request queuing
- Cross-IDE context sharing capabilities
- Automatic retry logic for failed requests
- Cost estimation before making requests
- Transaction history tracking
- Local caching for improved performance
- Comprehensive error handling with custom error classes
- Full TypeScript definitions (coming soon)
- Integration examples for Cursor, GitHub Copilot, Windsurf, and Antigravity
- Comprehensive documentation and API reference
- Unit tests for core functionality

### Features
- **Universal Integration**: Works with any IDE extension
- **Automatic Credit Management**: Auto-deducts credits for AI requests
- **Multi-Model Support**: OpenAI, Anthropic, Google Gemini
- **Context Persistence**: Save and restore IDE context
- **Cross-IDE Compatibility**: Share context between different IDEs
- **Offline Support**: Queue requests when offline
- **Event System**: Real-time balance updates and notifications
- **Cost Transparency**: Estimate costs before making requests
- **Session Management**: Automatic session restoration
- **Storage Abstraction**: Works in both Node.js and browser environments

### Security
- HTTPS encryption for all API communication
- Local storage of authentication tokens
- No sensitive data transmitted in plain text
- Secure secret address validation

### Documentation
- Complete README with quick start guide
- API reference for all classes and methods
- Integration examples for 4 major IDEs
- Error handling guide
- Best practices documentation
- FAQ section

## [Unreleased]

### Planned
- TypeScript definitions
- Streaming support for chat completions
- Webhook support for balance notifications
- Advanced analytics and usage tracking
- Model performance metrics
- Batch request support
- Custom model configuration
- Plugin system for extensibility
- CLI tool for testing and debugging
- Browser extension support
- React hooks for web integrations
- Vue.js composables
- Additional IDE integration examples

---

For more information, visit [walletx.dev](https://walletx.dev)