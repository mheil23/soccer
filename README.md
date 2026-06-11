# ⚽ Soccer Formations Tool

A free, interactive tool for soccer coaches to visualize formations, plan set pieces, and communicate tactics. Works on any device — no download or account required.

## Getting Started

Open the app in your browser. Everything saves automatically to your browser's local storage.

## Features

### Choose Your Game Format

Click **7v7**, **9v9**, or **11v11** to match your team's age group or competition. The field, player count, and available formations adjust automatically. 7v7 includes build-out lines.

### Formations

Use the **Formation** dropdown to select a preset formation (e.g., 4-3-3, 3-5-2). Your team's players will snap into position on the field.

To create a custom formation:
1. Select **Custom** from the Formation dropdown
2. Drag players to your desired positions
3. Double-click a player to rename their position label (on mobile, long-press and hold for half a second)
4. Type a name and click **💾 Save** to keep it

Saved formations appear in the dropdown under "Saved" for future use.

### Drag Players

Click and drag any blue (own team) or red (opponent) player token to reposition them. The ball (⚽) is also draggable.

If you drag a player outside the field, they'll snap back to where they started.

### Opponent Team

Toggle the **Opponent** switch to show the opposing team in red. Choose their formation from the dropdown that appears. Drag opponent players to simulate specific matchups.

### Situational Moments

Use the **Moments** dropdown to load predefined set-piece scenarios:

- **Kickoff** — both teams positioned for a center kick
- **Corner Kick (Attacking/Defending)** — positions for taking or defending a corner
- **Free Kick (Attacking/Defending)** — wall positioning, runners, and taker
- **Throw-In (Attacking/Defending)** — movement options from the sideline
- **Goal Kick** — build-up shape from the back
- **Penalty Kick** — taker at the spot, everyone else in position

To save your own moment:
1. Arrange players and ball however you want
2. Type a name in the Moment name field
3. Click **💾 Save**

To duplicate an existing moment, select it and click **📋 Copy**, then adjust and save with a new name.

### Movement Arrows

Click **🏹 Arrows** to enter arrow drawing mode:
1. Click once on the field for the start point
2. Click again for the end point — a curved arrow appears

Use arrows to show player runs, passing lanes, or movement patterns.

- **Select an arrow** by clicking on it (it highlights)
- **Delete an arrow** by selecting it and pressing Delete/Backspace
- **Drag an arrow** by selecting it then dragging
- **Clear all arrows** with the ✕ Clear button

Arrows are included when you save moments and in image exports.

### Position Info

Click **ℹ️ Info** to enable the position description panel. Then click any blue player token to see details about that role — what attributes are needed, responsibilities, and key skills.

### Reset

Click **↺ Reset** to return all players and the ball to their default formation positions. A confirmation dialog prevents accidental resets.

### Export

Click **📷 Export** to download the current field view as a PNG image. Share with players via messaging apps, email, or print for the locker room.

## Tips

- Your work saves automatically in the browser — come back anytime and pick up where you left off
- Switch between formations to see how your players would shift
- Use moments + arrows together to plan set pieces visually
- Export images before and after adjustments to show players the difference
- Works on phones and tablets too — drag with your finger, long-press to rename tokens

## Data & Privacy

All data stays in your browser. Nothing is sent to a server. If you clear your browser data, your saved formations and moments will be lost.

## Development

For developers who want to run the project locally:

```bash
npx serve . -l 3000
```

Then open http://localhost:3000

Run tests:
```bash
npm test
```
