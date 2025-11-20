#!/bin/bash
set -e

echo "🧹 Cleaning dist directory..."
npm run clean

echo "📝 Compiling TypeScript..."
tsc

echo "📦 Bundling with Rollup..."
rollup -c rollup.config.js

echo "📚 Generating documentation (optional)..."
npm run docgen || echo "⚠️  Documentation generation skipped"

echo "✅ Build complete!"
