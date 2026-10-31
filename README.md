# Life Planner

A free, pretty planner for your week, your goals and the things you care about. Pick a look, download one file and open it. No account, no install and no coding needed.

![The three Life Planner looks: Girly Pop, Arcade and Studio](themes/previews/all-themes.png)

## Pick a look

| Girly Pop | Arcade | Studio |
|---|---|---|
| ![Girly Pop preview](themes/previews/girly-pop.png) | ![Arcade preview](themes/previews/arcade.png) | ![Studio preview](themes/previews/studio.png) |
| Grown-up 2000s glam: dusty pink, cut-out letters, sparkles and an old-school phone screen for your weekly to-dos. For someone juggling a job search, goals, fitness and creative projects. | Dark grey gaming style with neon colours. Earn XP by ticking things off and get a game or anime quote each day. Made for a uni student: classes, deadlines, work, clubs and the gym. | Cosy and design-loving: pink gingham, sage and oak, with big easy-to-read text. Made for home life: projects, wellbeing, family and friends, inspiration, books and a video channel. |
| [`themes/girly-pop.html`](themes/girly-pop.html) | [`themes/arcade.html`](themes/arcade.html) | [`themes/studio.html`](themes/studio.html) |

Each one is a single file. They all have a 7-day week you can type into, lists you can tick off, and example content so you can see how it works.

### How they differ

| | Girly Pop | Arcade | Studio |
|---|---|---|---|
| **Best for** | Career changers and busy planners | Students | Home, hobbies and family life |
| **Feel** | Pink, playful, glam | Dark, neon, game-like | Soft, calm, easy to read |
| **Tabs** | This week, Jobs, Life | Week, Uni, Work, Social, Gym | This week, Home projects, Wellbeing, Family & friends, Inspiration, Books, My channel |
| **Stand-out features** | Job tracker with fit scores and a funnel chart, goals, fitness log, creative projects | XP bar, quote of the day, study sessions, deadlines, clubs, an energy check-in with ideas for low days | Daily quote, mood journal, book shelf with covers, home project tracker, posting calendar, a "Make it yours" button to change the title, colours and tab names |
| **Detail level** | Most detailed | Simple, made not to overwhelm | Simple, big buttons |

## Use it in your browser (easiest)

1. Click the file for the look you want in the table above, for example `themes/studio.html`.
2. Click the **Download raw file** button (the arrow pointing down, near the top right of the file).
3. Find the file in your Downloads folder and double-click it. It opens in your web browser.
4. Start typing. Everything saves by itself.

**Good to know**

- Your planner saves **inside that browser on that computer**. Open it the same way each time and your notes will be there.
- Move the file somewhere safe, like your Documents folder, and add a bookmark so it's one click away.
- Nothing you type is sent anywhere. It stays on your computer.
- It works without internet. When you're offline the fancy fonts fall back to your computer's own fonts, and Girly Pop's job funnel chart stays blank until you're back online. (A coming update builds these into the file.)
- Click **Start fresh** at the bottom to clear the example content and make it yours.
- If a change ever fails to save (for example, the browser's storage is full or blocked in a private window), a yellow message pops up so you can export a backup straight away.

## Back up your planner

Your planner lives only in the browser where you use it. Clearing your browser history or "site data", or switching to a new computer, starts you from empty. A backup file keeps it safe.

- **Export backup** (in Girly Pop: **Backup & export**, then **Everything (JSON backup)**) downloads one `.json` file with everything in your planner. The footer shows when you last made one.
- **Import backup** brings a backup back, on the same computer or a new one. Before anything changes it shows what's in the file and lets you pick:
  - **Add to what I have**: keeps everything you have and adds anything from the backup that's missing.
  - **Replace with backup**: your planner becomes the backup; anything the backup doesn't cover stays as it is (tap twice to confirm).
  - **Cancel**: nothing changes.
- Every import first saves a copy of your planner as it was, so **Undo last import** can put it back.
- All three planners use the same backup format. For now a backup restores into the planner it came from; moving information between planners comes in a later update, and today's backups will work with it.
- Backups made with Girly Pop's older "Everything (JSON)" export can be imported too.

Your backup file holds everything you typed, so keep it somewhere private.

## Use it with Claude or another AI

You can also open your planner inside an AI chat and ask it to change things for you.

**Claude**

1. Download the file as above.
2. Start a new chat at [claude.ai](https://claude.ai) and attach the file.
3. Paste this, then add your own wishes:

```
Open this file as an artifact so I can use it here. Then personalise it for me:
- My name is ___.
- The areas of my life I want to plan are ___.
- Change the example content to things that fit my life: ___.
Keep the same look and keep everything saving in the browser.
```

**ChatGPT, Gemini or another AI**

Attach the file the same way and use the same message. If the AI can show a live preview (both ChatGPT and Gemini call it Canvas), ask it to open the file there. If it can only give you code back, ask it for the whole updated file, save it as something like `my-planner.html`, and double-click it to open it in your browser.

**Ideas for things to ask**

- "Rename the tabs to Work, Home, Health and Fun."
- "Add a section for my reading list."
- "Make the text bigger."
- "Change the pink to lavender."

## Files

- `themes/girly-pop.html`, `themes/arcade.html`, `themes/studio.html`: the planners. Each works on its own.
- `shared/backup-kit.html`: the backup, import and save-warning code that all three planners share. It is copied into each planner by `npm run sync`, so each download stays a single file.
- `tests/`: browser tests for developers (`npm install`, then `npm test`). You don't need these to use a planner.

The example people, jobs and places in the files are made up.

Licensed under [MIT](LICENSE). Use it, change it, share it.
