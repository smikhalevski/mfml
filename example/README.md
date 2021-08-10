# MFML example

The full-functional example that shows how to use MFML.

Uses TypeScript, Webpack, React and MFML.

Install modules with `npm ci`.

Use `npm run watch` to start the dev server.

Use `npm run build` to build the project to `./target` directory.

**Note:** Webpack doesn't watch [`./src/translations/en-US.json`](./src/translations/en-US.json)
and [`./src/translations/ru-RU.json`](./src/translations/ru-RU.json), so you would need
to run `npm run mfmlc` to recompile translations with MFML. 
