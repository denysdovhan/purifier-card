# Contributing

If you plan to contribute back to this repo, please fork & open a PR.

## How to add translation

Only a native speaker can translate to a specific language.

1. Copy `src/translations/en.json` file and name it with an appropriate language code.
2. Translate only values in this file, not keys.
3. Import your translation in `src/localize.js` file.
4. Mention your translation in `README.md` file.
5. Open a PR.
6. Find someone to check and approve your PR.

**Do not open multiple PRs for a single translation**, this is just rude, they will be closed.

## How to run locally

1. Clone this repo to wherever you want:
   ```sh
   git clone https://github.com/denysdovhan/purifier-card.git
   ```
2. Go into the repo folder:
   ```sh
   cd purifier-card
   ```
3. Install dependencies (Node.js and npm are required):
   ```sh
   npm install
   ```
4. Run development server. It's going to watch source files, recompile on changes and server compiled a file on a local server.
   ```sh
   npm start
   ```
5. Add `http://localhost:5000/purifier-card.js` to your Lovelace resources.

Now you can make changes to files in `src` folder. The development server will automatically rebuild on changes. Lovelace will load a resource from the development server. Refresh the browser to see changes. Make sure a cache is cleared or disabled.
