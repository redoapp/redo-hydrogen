# Redo Hydrogen

Utilities to enable and disable Redo coverage on Hydrogen stores.

## Documentation

Full integration docs: https://developers.redo.com/docs/guides/integrations/hydrogen

## Version compatibility

| Package version | Hydrogen version | Router        |
| --------------- | ---------------- | ------------- |
| 2.x             | 2025.7+          | React Router 7 |
| 1.x             | Earlier versions | Remix         |

If your theme still uses Remix, use the [1.x releases](https://github.com/redoapp/redo-hydrogen/tree/release/1.4).

## Development

```bash
npm install
npm run build
npm run dev       # watch mode
```

### Running checks

Before submitting a PR, make sure all checks pass:

```bash
npm run typecheck
npm run lint
npm run e2e
```

## Contributing

PRs are welcome! This package is maintained by Redo and the Hydrogen community.

We would especially love contributions that add more fixtures to our CI/CD pipeline — the more store configurations we test against, the more confident we can be in releases. Check the `e2e/fixtures/` directory for existing examples.
