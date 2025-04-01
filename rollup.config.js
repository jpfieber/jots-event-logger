import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/main.ts', // Entry point
    output: {
        file: 'dist/main.js', // Output file
        format: 'cjs', // CommonJS format for Obsidian plugins
        sourcemap: true, // Optional: Include source maps for debugging
    },
    plugins: [
        nodeResolve(), // Resolve and bundle dependencies like 'moment'
        commonjs(), // Convert CommonJS modules to ES modules
        typescript(), // Compile TypeScript
    ],
    external: ['obsidian'], // Keep Obsidian as an external dependency
};