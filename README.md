# Life Planner

A simple way to run your life admin, goals and side projects with Claude, plus a one-page dashboard Claude rebuilds whenever you ask.

![Dashboard preview](preview.png)

## How it works

1. **One Claude project.** Create a project for your personal hub and paste the text from [`project-instructions.md`](project-instructions.md) into its instructions. Edit the areas and topics to fit your life.
2. **One thread per topic.** Name each thread `Area · Topic`, for example `Career · Resume` or `Health · Exercise`. Keep each conversation in its own thread so Claude always knows the latest status.
3. **Refresh on request.** Ask Claude to "refresh my dashboard". It reads each thread's latest status and rebuilds the page using [`dashboard.html`](dashboard.html) as the layout.

## What's on the dashboard

| Section | What goes there |
|---|---|
| Right now | Your top 3 priorities and a light plan for the week |
| Areas | One card per project with its status and a tag |
| Wins | Things you finished, so they don't get forgotten |
| Idea Vault | Ideas you saved but haven't committed to. No pressure. |

**Tags:** `ACTIVE` (working on it now) · `NEXT` (up soon) · `TIME-BOUND` (has a deadline) · `LATER` (parked on purpose) · `DONE`.

## Tips

- Start small: three or four areas and a few threads. Add more as you need them.
- Tell Claude your priority order so optional projects don't crowd out the important ones.
- The example content in `dashboard.html` is made up. Claude replaces it with yours the first time you refresh.

## Files

- `dashboard.html`: the dashboard layout with example content. Open it in a browser to preview.
- `project-instructions.md`: starter instructions to paste into your Claude project.

Licensed under [MIT](LICENSE). Use it, change it, share it.
