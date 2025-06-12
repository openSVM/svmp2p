# SVMP2P API Documentation

**Version**: 1.0.0  
**Last Updated**: December 2024

## Overview

This directory contains comprehensive API documentation for the openSVM P2P Exchange platform. The documentation covers both smart contract instructions and wallet operation APIs, providing developers with the detailed information needed for integration and development.

## Documentation Structure

### Smart Contract APIs
- [`smart-contracts.md`](./smart-contracts.md) - Complete smart contract instruction reference
- [`account-structures.md`](./account-structures.md) - Detailed account structure definitions
- [`error-codes.md`](./error-codes.md) - Complete error code reference
- [`events.md`](./events.md) - Smart contract event emissions

### Wallet Integration APIs
- [`wallet-operations.md`](./wallet-operations.md) - Wallet connection and transaction APIs
- [`transaction-flows.md`](./transaction-flows.md) - Common transaction patterns and examples
- [`error-handling.md`](./error-handling.md) - Wallet error handling and recovery

### Reference
- [`CHANGELOG.md`](./CHANGELOG.md) - API version changes and updates
- [`examples/`](./examples/) - Complete code examples and tutorials

## Versioning Strategy

This documentation follows [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** version: Breaking changes to API interfaces
- **MINOR** version: New features, backward-compatible additions
- **PATCH** version: Bug fixes, clarifications, non-breaking updates

### Current Version: 1.0.0

- Initial comprehensive API documentation
- Complete smart contract instruction reference
- Wallet operation patterns and examples
- Error handling guidelines

## Usage Guidelines

### For Developers
1. Start with the smart contract or wallet operations documentation based on your integration needs
2. Review the account structures to understand data formats
3. Check error codes for proper error handling
4. Use the examples directory for implementation patterns

### For Maintainers
1. Update version numbers when making changes
2. Document all breaking changes in CHANGELOG.md
3. Add examples for new features
4. Cross-reference with actual smart contract source code

## Contributing to Documentation

When updating this documentation:

1. **Accuracy**: Cross-reference with actual smart contract source code
2. **Completeness**: Include all parameters, return values, and error conditions
3. **Examples**: Provide TypeScript/JavaScript examples for all operations
4. **Versioning**: Update version metadata and changelog appropriately

## Related Resources

- [Main Project Documentation](../README.md)
- [Smart Contract Source Code](../../programs/p2p-exchange/src/)
- [Frontend Integration Examples](../../src/)
- [Anchor Framework Documentation](https://project-serum.github.io/anchor/)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)

---

For questions or clarifications, please refer to the [Contributing Guide](../contributing.md) or open an issue on GitHub.