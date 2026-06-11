// data.js — Static data layer: preset formations, position descriptions, predefined moments
// All normalized coordinates: (0,0) = top-left, (1,1) = bottom-right
// Convention: own team attacks toward ny=1 (bottom of field)

// ---------------------------------------------------------------------------
// Preset Formations (stub — populated by task 2.1)
// ---------------------------------------------------------------------------

export const DEFAULT_FORMATION = {
  "7v7": "2-3-1",
  "9v9": "3-3-2",
  "11v11": "4-3-3",
};

/** @type {import('./data.types').PresetFormation[]} */
const PRESET_FORMATIONS = [
  // ===========================================================================
  // 7v7 FORMATIONS  (7 players total: 1 GK + 6 outfield)
  // Own team attacks toward ny = 1 (bottom of field)
  // GK sits near ny ≈ 0.06; forwards push up toward ny ≈ 0.42-0.46
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 7v7 — 2-3-1
  // 2 defenders, 3 midfielders, 1 forward
  // ---------------------------------------------------------------------------
  {
    id: "7v7-2-3-1",
    name: "2-3-1",
    format: "7v7",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.94, descriptionId: "GK"   },
      { key: "CB1",  label: "CB",  nx: 0.33,  ny: 0.8,  descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.67,  ny: 0.8,  descriptionId: "CB"   },
      { key: "LM",   label: "LM",  nx: 0.18,  ny: 0.68, descriptionId: "LM"   },
      { key: "CM",   label: "CM",  nx: 0.5,   ny: 0.7,  descriptionId: "CM"   },
      { key: "RM",   label: "RM",  nx: 0.82,  ny: 0.68, descriptionId: "RM"   },
      { key: "ST",   label: "ST",  nx: 0.5,   ny: 0.56, descriptionId: "ST"   },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7v7 — 3-2-1
  // 3 defenders, 2 midfielders, 1 forward
  // ---------------------------------------------------------------------------
  {
    id: "7v7-3-2-1",
    name: "3-2-1",
    format: "7v7",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.94, descriptionId: "GK"   },
      { key: "CB1",  label: "CB",  nx: 0.22,  ny: 0.8,  descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.5,   ny: 0.82, descriptionId: "CB"   },
      { key: "CB3",  label: "CB",  nx: 0.78,  ny: 0.8,  descriptionId: "CB"   },
      { key: "CM1",  label: "CM",  nx: 0.33,  ny: 0.67, descriptionId: "CM"   },
      { key: "CM2",  label: "CM",  nx: 0.67,  ny: 0.67, descriptionId: "CM"   },
      { key: "ST",   label: "ST",  nx: 0.5,   ny: 0.56, descriptionId: "ST"   },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7v7 — 2-2-2
  // 2 defenders, 2 midfielders, 2 forwards
  // ---------------------------------------------------------------------------
  {
    id: "7v7-2-2-2",
    name: "2-2-2",
    format: "7v7",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.94, descriptionId: "GK"   },
      { key: "CB1",  label: "CB",  nx: 0.33,  ny: 0.81, descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.67,  ny: 0.81, descriptionId: "CB"   },
      { key: "CM1",  label: "CM",  nx: 0.33,  ny: 0.68, descriptionId: "CM"   },
      { key: "CM2",  label: "CM",  nx: 0.67,  ny: 0.68, descriptionId: "CM"   },
      { key: "ST1",  label: "ST",  nx: 0.33,  ny: 0.56, descriptionId: "ST"   },
      { key: "ST2",  label: "ST",  nx: 0.67,  ny: 0.56, descriptionId: "ST"   },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7v7 — 1-2-1-2 (Diamond)
  // 1 defender, 2 wide midfielders, 1 central midfielder, 2 forwards
  // ---------------------------------------------------------------------------
  {
    id: "7v7-1-2-1-2",
    name: "1-2-1-2",
    format: "7v7",
    positions: [
      { key: "GK",  label: "GK",  nx: 0.5,  ny: 0.94, descriptionId: "GK" },
      { key: "CB",  label: "CB",  nx: 0.5,  ny: 0.8,  descriptionId: "CB" },
      { key: "LM",  label: "LM",  nx: 0.25, ny: 0.68, descriptionId: "LM" },
      { key: "RM",  label: "RM",  nx: 0.75, ny: 0.68, descriptionId: "RM" },
      { key: "CM",  label: "CM",  nx: 0.5,  ny: 0.58, descriptionId: "CM" },
      { key: "ST1", label: "ST",  nx: 0.35, ny: 0.48, descriptionId: "ST" },
      { key: "ST2", label: "ST",  nx: 0.65, ny: 0.48, descriptionId: "ST" },
    ],
  },

  // ---------------------------------------------------------------------------
  // 7v7 — 3-1-2
  // 3 defenders, 1 midfielder, 2 forwards
  // ---------------------------------------------------------------------------
  {
    id: "7v7-3-1-2",
    name: "3-1-2",
    format: "7v7",
    positions: [
      { key: "GK",  label: "GK",  nx: 0.5,  ny: 0.94, descriptionId: "GK" },
      { key: "CB1", label: "CB",  nx: 0.22, ny: 0.8,  descriptionId: "CB" },
      { key: "CB2", label: "CB",  nx: 0.5,  ny: 0.78, descriptionId: "CB" },
      { key: "CB3", label: "CB",  nx: 0.78, ny: 0.8,  descriptionId: "CB" },
      { key: "CM",  label: "CM",  nx: 0.5,  ny: 0.64, descriptionId: "CM" },
      { key: "ST1", label: "ST",  nx: 0.33, ny: 0.5,  descriptionId: "ST" },
      { key: "ST2", label: "ST",  nx: 0.67, ny: 0.5,  descriptionId: "ST" },
    ],
  },

  // ===========================================================================
  // 9v9 FORMATIONS  (9 players total: 1 GK + 8 outfield)
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 9v9 — 3-3-2
  // 3 defenders, 3 midfielders, 2 forwards
  // ---------------------------------------------------------------------------
  {
    id: "9v9-3-3-2",
    name: "3-3-2",
    format: "9v9",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.94, descriptionId: "GK"   },
      { key: "CB1",  label: "CB",  nx: 0.22,  ny: 0.82, descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.5,   ny: 0.84, descriptionId: "CB"   },
      { key: "CB3",  label: "CB",  nx: 0.78,  ny: 0.82, descriptionId: "CB"   },
      { key: "LM",   label: "LM",  nx: 0.18,  ny: 0.7,  descriptionId: "LM"   },
      { key: "CM",   label: "CM",  nx: 0.5,   ny: 0.72, descriptionId: "CM"   },
      { key: "RM",   label: "RM",  nx: 0.82,  ny: 0.7,  descriptionId: "RM"   },
      { key: "ST1",  label: "ST",  nx: 0.35,  ny: 0.58, descriptionId: "ST"   },
      { key: "ST2",  label: "ST",  nx: 0.65,  ny: 0.58, descriptionId: "ST"   },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9v9 — 3-2-3
  // 3 defenders, 2 midfielders, 3 forwards
  // ---------------------------------------------------------------------------
  {
    id: "9v9-3-2-3",
    name: "3-2-3",
    format: "9v9",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.94, descriptionId: "GK"   },
      { key: "CB1",  label: "CB",  nx: 0.22,  ny: 0.82, descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.5,   ny: 0.84, descriptionId: "CB"   },
      { key: "CB3",  label: "CB",  nx: 0.78,  ny: 0.82, descriptionId: "CB"   },
      { key: "CM1",  label: "CM",  nx: 0.35,  ny: 0.7,  descriptionId: "CM"   },
      { key: "CM2",  label: "CM",  nx: 0.65,  ny: 0.7,  descriptionId: "CM"   },
      { key: "LW",   label: "LW",  nx: 0.18,  ny: 0.58, descriptionId: "LW"   },
      { key: "ST",   label: "ST",  nx: 0.5,   ny: 0.58, descriptionId: "ST"   },
      { key: "RW",   label: "RW",  nx: 0.82,  ny: 0.58, descriptionId: "RW"   },
    ],
  },

  // ---------------------------------------------------------------------------
  // 9v9 — 4-3-1
  // 4 defenders, 3 midfielders, 1 forward
  // ---------------------------------------------------------------------------
  {
    id: "9v9-4-3-1",
    name: "4-3-1",
    format: "9v9",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.94, descriptionId: "GK"   },
      { key: "LB",   label: "LB",  nx: 0.15,  ny: 0.82, descriptionId: "LB"   },
      { key: "CB1",  label: "CB",  nx: 0.38,  ny: 0.84, descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.62,  ny: 0.84, descriptionId: "CB"   },
      { key: "RB",   label: "RB",  nx: 0.85,  ny: 0.82, descriptionId: "RB"   },
      { key: "LM",   label: "LM",  nx: 0.22,  ny: 0.7,  descriptionId: "LM"   },
      { key: "CM",   label: "CM",  nx: 0.5,   ny: 0.72, descriptionId: "CM"   },
      { key: "RM",   label: "RM",  nx: 0.78,  ny: 0.7,  descriptionId: "RM"   },
      { key: "ST",   label: "ST",  nx: 0.5,   ny: 0.57, descriptionId: "ST"   },
    ],
  },

  // ===========================================================================
  // 11v11 FORMATIONS  (11 players total: 1 GK + 10 outfield)
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 11v11 — 4-3-3
  // 4 defenders, 3 midfielders, 3 forwards
  // ---------------------------------------------------------------------------
  {
    id: "11v11-4-3-3",
    name: "4-3-3",
    format: "11v11",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.95, descriptionId: "GK"   },
      { key: "LB",   label: "LB",  nx: 0.12,  ny: 0.82, descriptionId: "LB"   },
      { key: "CB1",  label: "CB",  nx: 0.35,  ny: 0.84, descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.65,  ny: 0.84, descriptionId: "CB"   },
      { key: "RB",   label: "RB",  nx: 0.88,  ny: 0.82, descriptionId: "RB"   },
      { key: "LCM",  label: "CM",  nx: 0.25,  ny: 0.7,  descriptionId: "CM"   },
      { key: "CM",   label: "CM",  nx: 0.5,   ny: 0.72, descriptionId: "CM"   },
      { key: "RCM",  label: "CM",  nx: 0.75,  ny: 0.7,  descriptionId: "CM"   },
      { key: "LW",   label: "LW",  nx: 0.15,  ny: 0.59, descriptionId: "LW"   },
      { key: "ST",   label: "ST",  nx: 0.5,   ny: 0.59, descriptionId: "ST"   },
      { key: "RW",   label: "RW",  nx: 0.85,  ny: 0.59, descriptionId: "RW"   },
    ],
  },

  // ---------------------------------------------------------------------------
  // 11v11 — 4-4-2
  // 4 defenders, 4 midfielders, 2 forwards
  // ---------------------------------------------------------------------------
  {
    id: "11v11-4-4-2",
    name: "4-4-2",
    format: "11v11",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.95, descriptionId: "GK"   },
      { key: "LB",   label: "LB",  nx: 0.12,  ny: 0.82, descriptionId: "LB"   },
      { key: "CB1",  label: "CB",  nx: 0.35,  ny: 0.84, descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.65,  ny: 0.84, descriptionId: "CB"   },
      { key: "RB",   label: "RB",  nx: 0.88,  ny: 0.82, descriptionId: "RB"   },
      { key: "LM",   label: "LM",  nx: 0.15,  ny: 0.7,  descriptionId: "LM"   },
      { key: "LCM",  label: "CM",  nx: 0.38,  ny: 0.72, descriptionId: "CM"   },
      { key: "RCM",  label: "CM",  nx: 0.62,  ny: 0.72, descriptionId: "CM"   },
      { key: "RM",   label: "RM",  nx: 0.85,  ny: 0.7,  descriptionId: "RM"   },
      { key: "ST1",  label: "ST",  nx: 0.35,  ny: 0.59, descriptionId: "ST"   },
      { key: "ST2",  label: "ST",  nx: 0.65,  ny: 0.59, descriptionId: "ST"   },
    ],
  },

  // ---------------------------------------------------------------------------
  // 11v11 — 4-2-3-1
  // 4 defenders, 2 defensive midfielders, 3 attacking midfielders, 1 forward
  // ---------------------------------------------------------------------------
  {
    id: "11v11-4-2-3-1",
    name: "4-2-3-1",
    format: "11v11",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.95, descriptionId: "GK"   },
      { key: "LB",   label: "LB",  nx: 0.12,  ny: 0.82, descriptionId: "LB"   },
      { key: "CB1",  label: "CB",  nx: 0.35,  ny: 0.84, descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.65,  ny: 0.84, descriptionId: "CB"   },
      { key: "RB",   label: "RB",  nx: 0.88,  ny: 0.82, descriptionId: "RB"   },
      { key: "DM1",  label: "DM",  nx: 0.38,  ny: 0.74, descriptionId: "DM"   },
      { key: "DM2",  label: "DM",  nx: 0.62,  ny: 0.74, descriptionId: "DM"   },
      { key: "LAM",  label: "AM",  nx: 0.18,  ny: 0.65, descriptionId: "AM"   },
      { key: "CAM",  label: "AM",  nx: 0.5,   ny: 0.66, descriptionId: "AM"   },
      { key: "RAM",  label: "AM",  nx: 0.82,  ny: 0.65, descriptionId: "AM"   },
      { key: "ST",   label: "ST",  nx: 0.5,   ny: 0.57, descriptionId: "ST"   },
    ],
  },

  // ---------------------------------------------------------------------------
  // 11v11 — 3-5-2
  // 3 defenders, 5 midfielders (incl. wing-backs), 2 forwards
  // ---------------------------------------------------------------------------
  {
    id: "11v11-3-5-2",
    name: "3-5-2",
    format: "11v11",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.95, descriptionId: "GK"   },
      { key: "CB1",  label: "CB",  nx: 0.25,  ny: 0.83, descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.5,   ny: 0.85, descriptionId: "CB"   },
      { key: "CB3",  label: "CB",  nx: 0.75,  ny: 0.83, descriptionId: "CB"   },
      { key: "LWB",  label: "LWB", nx: 0.1,   ny: 0.7,  descriptionId: "LWB"  },
      { key: "LCM",  label: "CM",  nx: 0.33,  ny: 0.71, descriptionId: "CM"   },
      { key: "CM",   label: "CM",  nx: 0.5,   ny: 0.73, descriptionId: "CM"   },
      { key: "RCM",  label: "CM",  nx: 0.67,  ny: 0.71, descriptionId: "CM"   },
      { key: "RWB",  label: "RWB", nx: 0.9,   ny: 0.7,  descriptionId: "RWB"  },
      { key: "ST1",  label: "ST",  nx: 0.38,  ny: 0.59, descriptionId: "ST"   },
      { key: "ST2",  label: "ST",  nx: 0.62,  ny: 0.59, descriptionId: "ST"   },
    ],
  },

  // ---------------------------------------------------------------------------
  // 11v11 — 5-3-2
  // 5 defenders (incl. wing-backs), 3 midfielders, 2 forwards
  // ---------------------------------------------------------------------------
  {
    id: "11v11-5-3-2",
    name: "5-3-2",
    format: "11v11",
    positions: [
      { key: "GK",   label: "GK",  nx: 0.5,   ny: 0.95, descriptionId: "GK"   },
      { key: "LWB",  label: "LWB", nx: 0.08,  ny: 0.78, descriptionId: "LWB"  },
      { key: "CB1",  label: "CB",  nx: 0.28,  ny: 0.83, descriptionId: "CB"   },
      { key: "CB2",  label: "CB",  nx: 0.5,   ny: 0.85, descriptionId: "CB"   },
      { key: "CB3",  label: "CB",  nx: 0.72,  ny: 0.83, descriptionId: "CB"   },
      { key: "RWB",  label: "RWB", nx: 0.92,  ny: 0.78, descriptionId: "RWB"  },
      { key: "LCM",  label: "CM",  nx: 0.28,  ny: 0.69, descriptionId: "CM"   },
      { key: "CM",   label: "CM",  nx: 0.5,   ny: 0.71, descriptionId: "CM"   },
      { key: "RCM",  label: "CM",  nx: 0.72,  ny: 0.69, descriptionId: "CM"   },
      { key: "ST1",  label: "ST",  nx: 0.38,  ny: 0.58, descriptionId: "ST"   },
      { key: "ST2",  label: "ST",  nx: 0.62,  ny: 0.58, descriptionId: "ST"   },
    ],
  },
];

/**
 * Returns all preset formations for the given format.
 * @param {"7v7"|"9v9"|"11v11"} format
 * @returns {import('./data.types').PresetFormation[]}
 */
export function getFormationsForFormat(format) {
  return PRESET_FORMATIONS.filter((f) => f.format === format);
}

/**
 * Returns the preset formation with the given id, or undefined if not found.
 * @param {string} id
 * @returns {import('./data.types').PresetFormation|undefined}
 */
export function getFormationById(id) {
  return PRESET_FORMATIONS.find((f) => f.id === id);
}

// ---------------------------------------------------------------------------
// Position Descriptions (stub — populated by task 2.3)
// ---------------------------------------------------------------------------

/** @type {Record<string, import('./data.types').PositionDescription>} */
const POSITION_DESCRIPTIONS = {
  GK: {
    id: "GK",
    positionName: "Goalkeeper",
    roleDescription:
      "The last line of defense and the only player permitted to handle the ball inside the penalty area. The goalkeeper organizes the backline, commands their box, and initiates attacking play with accurate distribution.",
    keyAttributes: [
      "Shot-stopping reflexes",
      "Aerial command and positioning",
      "Distribution and passing range",
      "Communication and leadership",
      "One-on-one composure",
    ],
    responsibilities:
      "Prevent goals by stopping shots, crosses, and through-balls. Command the penalty area on set pieces. Distribute accurately to restart attacks. Organize the defensive line and communicate pressure cues to teammates.",
  },

  CB: {
    id: "CB",
    positionName: "Centre Back",
    roleDescription:
      "A central defender whose primary duty is to prevent opposing attackers from scoring. The centre back wins aerial duels, blocks shots, intercepts passes, and provides a calm, composed presence at the back.",
    keyAttributes: [
      "Defending and tackling",
      "Aerial ability",
      "Positioning and anticipation",
      "Composure on the ball",
      "Reading the game",
    ],
    responsibilities:
      "Mark opposition strikers and wingers cutting inside. Win headers from corners and crosses. Clear danger from the penalty area. Play out from the back under pressure. Maintain a compact defensive shape alongside fellow defenders.",
  },

  LB: {
    id: "LB",
    positionName: "Left Back",
    roleDescription:
      "A full-back stationed on the left side of the defence who must balance defensive duties with supporting attacks down the flank. The left back provides width, delivers crosses, and tracks opposition wingers.",
    keyAttributes: [
      "Defensive awareness",
      "Stamina and athleticism",
      "Crossing and delivery",
      "1v1 defending",
      "Overlapping runs",
    ],
    responsibilities:
      "Defend against right-footed wingers and overlapping right backs. Support left-sided attacks with overlapping or underlapping runs. Deliver accurate crosses into the penalty area. Maintain defensive shape when the team is out of possession.",
  },

  RB: {
    id: "RB",
    positionName: "Right Back",
    roleDescription:
      "A full-back on the right side of the defence who combines solid defensive work with attacking contributions along the right flank. The right back pins back opposition wide players and provides crossing opportunities.",
    keyAttributes: [
      "Defensive solidity",
      "Pace and recovery speed",
      "Crossing and delivery",
      "1v1 defending",
      "Overlapping runs",
    ],
    responsibilities:
      "Defend against left-footed wingers and overlapping left backs. Advance to support right-sided attacks with well-timed overlapping runs. Deliver crosses and cutbacks into dangerous areas. Track back quickly when possession is lost.",
  },

  LM: {
    id: "LM",
    positionName: "Left Midfielder",
    roleDescription:
      "A wide midfielder on the left side who contributes both defensively and offensively. The left midfielder provides width, links play down the left channel, and supports both the left back and attacking players.",
    keyAttributes: [
      "Stamina and work rate",
      "Dribbling and ball control",
      "Crossing and final delivery",
      "Defensive tracking",
      "Link-up play",
    ],
    responsibilities:
      "Provide width on the left side in and out of possession. Combine with the left back and central midfielders to progress the ball. Deliver crosses into the penalty area and support attacking movements. Defend by tracking opposition right back overlaps and pressing high.",
  },

  CM: {
    id: "CM",
    positionName: "Central Midfielder",
    roleDescription:
      "The engine of the team who operates in the middle of the park. The central midfielder connects defence to attack, wins second balls, and dictates the tempo of play in both phases.",
    keyAttributes: [
      "Passing range and vision",
      "Work rate and pressing",
      "Ball retention",
      "Positional discipline",
      "Winning the ball",
    ],
    responsibilities:
      "Receive and distribute the ball under pressure to maintain possession. Press opposition midfielders to win the ball back quickly. Support both defensive and attacking transitions. Cover space left by full-backs on overlapping runs. Connect the defensive and attacking thirds.",
  },

  RM: {
    id: "RM",
    positionName: "Right Midfielder",
    roleDescription:
      "A wide midfielder on the right side who stretches the play and provides balance to the team. The right midfielder contributes offensively with crosses and goals while tracking back to support the right back defensively.",
    keyAttributes: [
      "Stamina and work rate",
      "Dribbling and ball control",
      "Crossing and final delivery",
      "Defensive tracking",
      "Link-up play",
    ],
    responsibilities:
      "Provide width on the right side in and out of possession. Combine with the right back and central midfielders to advance play. Deliver quality crosses and cutbacks. Track opposition left back runs and press from a wide defensive position.",
  },

  DM: {
    id: "DM",
    positionName: "Defensive Midfielder",
    roleDescription:
      "A midfielder who sits in front of the defensive line to screen the defence, break up opposition attacks, and recycle possession. The defensive midfielder is the first line of pressing and a shield for the centre backs.",
    keyAttributes: [
      "Tackling and interceptions",
      "Positional awareness",
      "Ball retention under pressure",
      "Covering and screening",
      "Reading the game",
    ],
    responsibilities:
      "Screen the defensive line by intercepting passes and breaking up attacks. Provide a passing option to the centre backs under pressure. Cover the space vacated by attacking midfielders and full-backs. Transition quickly between defensive and ball-playing roles.",
  },

  AM: {
    id: "AM",
    positionName: "Attacking Midfielder",
    roleDescription:
      "A creative player operating between midfield and attack who generates goalscoring opportunities through clever movement, incisive passing, and direct running. The attacking midfielder is the primary link between midfield and the striker.",
    keyAttributes: [
      "Creativity and vision",
      "Technical skill on the ball",
      "Movement and positioning",
      "Shooting and finishing",
      "Combination play",
    ],
    responsibilities:
      "Create chances for the striker and wide forwards with through-balls and key passes. Find pockets of space between the lines to receive the ball and turn. Press opposition defenders when the team is out of possession. Contribute goals from late runs into the penalty area.",
  },

  LW: {
    id: "LW",
    positionName: "Left Winger",
    roleDescription:
      "A wide forward on the left who uses pace, dribbling, and direct running to threaten the opposition defence. The left winger either delivers crosses from wide or cuts inside to shoot or combine centrally.",
    keyAttributes: [
      "Pace and acceleration",
      "Dribbling and 1v1 ability",
      "Crossing or cutting inside",
      "Goal threat",
      "Pressing and work rate",
    ],
    responsibilities:
      "Attack the opposition right back with pace and direct dribbling. Deliver crosses into the penalty area from wide positions or cut inside to create shooting opportunities. Press opposition full-backs and centre backs when out of possession. Provide width to stretch the defensive shape.",
  },

  RW: {
    id: "RW",
    positionName: "Right Winger",
    roleDescription:
      "A wide forward on the right who creates danger on the flanks through speed and skill. The right winger combines wide delivery with the ability to cut inside onto a stronger foot to shoot or play a key pass.",
    keyAttributes: [
      "Pace and acceleration",
      "Dribbling and 1v1 ability",
      "Crossing or cutting inside",
      "Goal threat",
      "Pressing and work rate",
    ],
    responsibilities:
      "Attack the opposition left back with pace and direct play. Provide crossing options from the right side or cut inside to create danger. Press from wide to prevent the opposition building from the back. Support the right back defensively when out of possession.",
  },

  ST: {
    id: "ST",
    positionName: "Striker",
    roleDescription:
      "The primary goal-scorer who leads the attacking line. The striker holds up the ball to bring teammates into play, makes intelligent runs behind the defensive line, and converts chances inside the penalty area.",
    keyAttributes: [
      "Finishing and composure",
      "Movement and timing of runs",
      "Hold-up play and physicality",
      "Heading ability",
      "Pressing from the front",
    ],
    responsibilities:
      "Score goals and create space for attacking teammates through intelligent movement. Hold up the ball under pressure to allow midfielders to advance. Make well-timed runs in behind the defensive line. Press opposition centre backs and defensive midfielders to win the ball high up the pitch.",
  },

  LWB: {
    id: "LWB",
    positionName: "Left Wing-Back",
    roleDescription:
      "A hybrid wide player in a three-at-the-back system who combines the defensive duties of a full-back with the attacking responsibilities of a winger. The left wing-back provides the entire left-side presence in both phases.",
    keyAttributes: [
      "Stamina and athleticism",
      "Crossing and delivery",
      "Defensive tracking and 1v1",
      "Overlapping runs",
      "Work rate",
    ],
    responsibilities:
      "Cover the entire left flank — push high to deliver crosses in attack and drop back to form a flat five in defence. Provide constant width to stretch the opposition and create crossing opportunities. Track opposition wide players and overlapping full-backs when defending. Combine with wide centre backs and central midfielders.",
  },

  RWB: {
    id: "RWB",
    positionName: "Right Wing-Back",
    roleDescription:
      "A dynamic wide player in a three-at-the-back system tasked with dominating the right flank in both phases. The right wing-back must possess the defensive reliability of a full-back and the attacking output of a winger.",
    keyAttributes: [
      "Stamina and athleticism",
      "Crossing and delivery",
      "Defensive tracking and 1v1",
      "Overlapping runs",
      "Work rate",
    ],
    responsibilities:
      "Push forward along the right flank to deliver crosses and create overloads in the final third. Drop back into a defensive five when the team is out of possession. Track opposition wide forwards and left-sided attackers. Link play with wide centre backs and central midfielders on the right side.",
  },
};

/**
 * Returns the position description for the given id, or undefined if not found.
 * @param {string} id
 * @returns {import('./data.types').PositionDescription|undefined}
 */
export function getDescriptionById(id) {
  return POSITION_DESCRIPTIONS[id];
}

// ---------------------------------------------------------------------------
// Predefined Situational Moments
// Requirements: 7.1
// ---------------------------------------------------------------------------

/**
 * @typedef {{ label: string; nx: number; ny: number }} MomentPosition
 * @typedef {{ id: string; name: string; isPredefined: boolean; format: "7v7"|"9v9"|"11v11"; ownPositions: MomentPosition[]; ballPosition: { nx: number; ny: number }; savedAt: null }} PredefinedMoment
 */

/**
 * All predefined situational moments. 5 types × 3 formats = 15 moments.
 * isPredefined: true, savedAt: null for all.
 *
 * Coordinate conventions:
 *  - Own team attacks downward (toward ny = 1)
 *  - Attacking corner kicks: own team in opponent's half (ny > 0.5)
 *  - Defending corner kicks: own team in own half (ny < 0.5), protecting goal at ny = 0
 *  - Ball at corner: nx ≈ 0 or 1, ny ≈ 0 or 1
 *  - Kickoff: ball at center (0.5, 0.5)
 *
 * @type {PredefinedMoment[]}
 */
const PREDEFINED_MOMENTS = [
  // =========================================================================
  // CORNER KICK — ATTACKING
  // Own team in opponent's box / near area; ball at opponent's corner (ny≈1)
  // =========================================================================

  // --- 7v7 attacking corner kick ---
  {
    id: "corner-attacking-7v7",
    name: "Corner Kick (Attacking)",
    isPredefined: true,
    format: "7v7",
    ballPosition: { nx: 1.0, ny: 0.0 },
    ownPositions: [
      { label: "GK", nx: 0.5,  ny: 0.95 }, // goalkeeper stays back
      { label: "CB", nx: 0.35, ny: 0.75 }, // center back covers
      { label: "CM", nx: 0.65, ny: 0.6  }, // midfielder holds
      { label: "W",  nx: 0.25, ny: 0.25 }, // near-post runner
      { label: "ST", nx: 0.5,  ny: 0.2  }, // center box target
      { label: "W2", nx: 0.7,  ny: 0.28 }, // far-post runner
      { label: "TK", nx: 0.9,  ny: 0.1  }, // corner taker
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.4,  ny: 0.14 },
      { label: "CB", nx: 0.6,  ny: 0.14 },
      { label: "MF", nx: 0.3,  ny: 0.2  },
      { label: "MF", nx: 0.7,  ny: 0.2  },
      { label: "W",  nx: 0.15, ny: 0.3  },
      { label: "ST", nx: 0.5,  ny: 0.35 },
    ],
    savedAt: null,
  },

  // --- 9v9 attacking corner kick ---
  {
    id: "corner-attacking-9v9",
    name: "Corner Kick (Attacking)",
    isPredefined: true,
    format: "9v9",
    ballPosition: { nx: 1.0, ny: 0.0 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "CB1", nx: 0.3,  ny: 0.8  },
      { label: "CB2", nx: 0.6,  ny: 0.8  },
      { label: "CM",  nx: 0.45, ny: 0.58 },
      { label: "W",   nx: 0.2,  ny: 0.28 },
      { label: "ST1", nx: 0.42, ny: 0.2  },
      { label: "ST2", nx: 0.58, ny: 0.22 },
      { label: "W2",  nx: 0.75, ny: 0.3  },
      { label: "TK",  nx: 0.92, ny: 0.08 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.35, ny: 0.12 },
      { label: "CB", nx: 0.55, ny: 0.12 },
      { label: "CB", nx: 0.7,  ny: 0.14 },
      { label: "MF", nx: 0.3,  ny: 0.2  },
      { label: "MF", nx: 0.5,  ny: 0.22 },
      { label: "MF", nx: 0.7,  ny: 0.2  },
      { label: "W",  nx: 0.15, ny: 0.32 },
      { label: "ST", nx: 0.5,  ny: 0.38 },
    ],
    savedAt: null,
  },

  // --- 11v11 attacking corner kick ---
  {
    id: "corner-attacking-11v11",
    name: "Corner Kick (Attacking)",
    isPredefined: true,
    format: "11v11",
    ballPosition: { nx: 1.0, ny: 0.0 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "CB1", nx: 0.28, ny: 0.82 },
      { label: "CB2", nx: 0.72, ny: 0.82 },
      { label: "LB",  nx: 0.12, ny: 0.68 },
      { label: "RB",  nx: 0.88, ny: 0.68 },
      { label: "DM",  nx: 0.5,  ny: 0.62 },
      { label: "CM",  nx: 0.38, ny: 0.48 },
      { label: "NP",  nx: 0.22, ny: 0.26 }, // near-post
      { label: "ST",  nx: 0.45, ny: 0.18 }, // central target
      { label: "FP",  nx: 0.68, ny: 0.24 }, // far-post
      { label: "TK",  nx: 0.95, ny: 0.06 }, // corner taker
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.05 },
      { label: "CB", nx: 0.3,  ny: 0.12 },
      { label: "CB", nx: 0.5,  ny: 0.1  },
      { label: "CB", nx: 0.7,  ny: 0.12 },
      { label: "LB", nx: 0.12, ny: 0.18 },
      { label: "RB", nx: 0.88, ny: 0.18 },
      { label: "DM", nx: 0.4,  ny: 0.22 },
      { label: "DM", nx: 0.6,  ny: 0.22 },
      { label: "CM", nx: 0.5,  ny: 0.3  },
      { label: "W",  nx: 0.15, ny: 0.35 },
      { label: "ST", nx: 0.5,  ny: 0.4  },
    ],
    savedAt: null,
  },

  // =========================================================================
  // CORNER KICK — DEFENDING
  // Own team defending their goal (ny ≈ 0); ball at own corner (ny ≈ 0)
  // =========================================================================

  // --- 7v7 defending corner kick ---
  {
    id: "corner-defending-7v7",
    name: "Corner Kick (Defending)",
    isPredefined: true,
    format: "7v7",
    ballPosition: { nx: 0.0, ny: 1.0 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.94 }, // goalkeeper on goal line
      { label: "CB1", nx: 0.3,  ny: 0.85 }, // near-post marker
      { label: "CB2", nx: 0.7,  ny: 0.85 }, // far-post marker
      { label: "MF",  nx: 0.5,  ny: 0.78 }, // box cover
      { label: "W",   nx: 0.2,  ny: 0.65 }, // zonal on edge
      { label: "ST",  nx: 0.65, ny: 0.65 }, // zonal cover / counter
      { label: "CM",  nx: 0.5,  ny: 0.5  }, // midfield anchor
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.5,  ny: 0.25 },
      { label: "MF", nx: 0.35, ny: 0.45 },
      { label: "MF", nx: 0.65, ny: 0.45 },
      { label: "W",  nx: 0.25, ny: 0.75 },
      { label: "ST", nx: 0.5,  ny: 0.82 },
      { label: "TK", nx: 0.1,  ny: 0.92 },
    ],
    savedAt: null,
  },

  // --- 9v9 defending corner kick ---
  {
    id: "corner-defending-9v9",
    name: "Corner Kick (Defending)",
    isPredefined: true,
    format: "9v9",
    ballPosition: { nx: 0.0, ny: 1.0 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "CB1", nx: 0.28, ny: 0.86 },
      { label: "CB2", nx: 0.5,  ny: 0.88 },
      { label: "CB3", nx: 0.72, ny: 0.86 },
      { label: "MF1", nx: 0.35, ny: 0.75 },
      { label: "MF2", nx: 0.65, ny: 0.75 },
      { label: "W1",  nx: 0.18, ny: 0.62 },
      { label: "W2",  nx: 0.82, ny: 0.62 },
      { label: "ST",  nx: 0.5,  ny: 0.48 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.35, ny: 0.2  },
      { label: "CB", nx: 0.65, ny: 0.2  },
      { label: "MF", nx: 0.5,  ny: 0.4  },
      { label: "W",  nx: 0.2,  ny: 0.7  },
      { label: "W",  nx: 0.75, ny: 0.7  },
      { label: "ST", nx: 0.42, ny: 0.8  },
      { label: "ST", nx: 0.58, ny: 0.78 },
      { label: "TK", nx: 0.08, ny: 0.92 },
    ],
    savedAt: null,
  },

  // --- 11v11 defending corner kick ---
  {
    id: "corner-defending-11v11",
    name: "Corner Kick (Defending)",
    isPredefined: true,
    format: "11v11",
    ballPosition: { nx: 0.0, ny: 1.0 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "CB1", nx: 0.25, ny: 0.86 },
      { label: "CB2", nx: 0.5,  ny: 0.89 },
      { label: "CB3", nx: 0.75, ny: 0.86 },
      { label: "LB",  nx: 0.1,  ny: 0.78 },
      { label: "RB",  nx: 0.9,  ny: 0.78 },
      { label: "DM1", nx: 0.35, ny: 0.74 },
      { label: "DM2", nx: 0.65, ny: 0.74 },
      { label: "CM",  nx: 0.5,  ny: 0.62 },
      { label: "LW",  nx: 0.2,  ny: 0.52 },
      { label: "ST",  nx: 0.7,  ny: 0.52 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.05 },
      { label: "CB", nx: 0.3,  ny: 0.18 },
      { label: "CB", nx: 0.7,  ny: 0.18 },
      { label: "LB", nx: 0.12, ny: 0.3  },
      { label: "RB", nx: 0.88, ny: 0.3  },
      { label: "DM", nx: 0.5,  ny: 0.4  },
      { label: "CM", nx: 0.38, ny: 0.55 },
      { label: "W",  nx: 0.22, ny: 0.74 },
      { label: "ST", nx: 0.45, ny: 0.82 },
      { label: "W",  nx: 0.68, ny: 0.76 },
      { label: "TK", nx: 0.05, ny: 0.94 },
    ],
    savedAt: null,
  },

  // =========================================================================
  // FREE KICK — ATTACKING
  // Own team with a free kick in the opponent's half (ny > 0.5)
  // Ball positioned around 65% down the field, central
  // =========================================================================

  // --- 7v7 attacking free kick ---
  {
    id: "freekick-attacking-7v7",
    name: "Free Kick (Attacking)",
    isPredefined: true,
    format: "7v7",
    ballPosition: { nx: 0.5, ny: 0.32 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 }, // keeper back
      { label: "CB",  nx: 0.5,  ny: 0.78 }, // sweeper
      { label: "MF",  nx: 0.5,  ny: 0.55 }, // relay / second ball
      { label: "W1",  nx: 0.2,  ny: 0.28 }, // left run
      { label: "ST",  nx: 0.5,  ny: 0.2  }, // target in box
      { label: "W2",  nx: 0.78, ny: 0.28 }, // right run
      { label: "FK",  nx: 0.5,  ny: 0.38 }, // free-kick taker
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.35, ny: 0.15 },
      { label: "CB", nx: 0.65, ny: 0.15 },
      { label: "W1", nx: 0.35, ny: 0.27 },
      { label: "W2", nx: 0.45, ny: 0.27 },
      { label: "W3", nx: 0.55, ny: 0.27 },
      { label: "ST", nx: 0.5,  ny: 0.4  },
    ],
    savedAt: null,
  },

  // --- 9v9 attacking free kick ---
  {
    id: "freekick-attacking-9v9",
    name: "Free Kick (Attacking)",
    isPredefined: true,
    format: "9v9",
    ballPosition: { nx: 0.5, ny: 0.32 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "CB1", nx: 0.35, ny: 0.8  },
      { label: "CB2", nx: 0.65, ny: 0.8  },
      { label: "MF",  nx: 0.5,  ny: 0.58 },
      { label: "W1",  nx: 0.18, ny: 0.3  },
      { label: "ST1", nx: 0.4,  ny: 0.2  },
      { label: "ST2", nx: 0.6,  ny: 0.22 },
      { label: "W2",  nx: 0.82, ny: 0.3  },
      { label: "FK",  nx: 0.5,  ny: 0.38 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.3,  ny: 0.14 },
      { label: "CB", nx: 0.65, ny: 0.14 },
      { label: "W1", nx: 0.35, ny: 0.26 },
      { label: "W2", nx: 0.43, ny: 0.26 },
      { label: "W3", nx: 0.51, ny: 0.26 },
      { label: "W4", nx: 0.59, ny: 0.26 },
      { label: "MF", nx: 0.75, ny: 0.2  },
      { label: "ST", nx: 0.5,  ny: 0.4  },
    ],
    savedAt: null,
  },

  // --- 11v11 attacking free kick ---
  {
    id: "freekick-attacking-11v11",
    name: "Free Kick (Attacking)",
    isPredefined: true,
    format: "11v11",
    ballPosition: { nx: 0.5, ny: 0.32 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "CB1", nx: 0.3,  ny: 0.82 },
      { label: "CB2", nx: 0.7,  ny: 0.82 },
      { label: "LB",  nx: 0.12, ny: 0.7  },
      { label: "RB",  nx: 0.88, ny: 0.7  },
      { label: "DM",  nx: 0.5,  ny: 0.6  },
      { label: "CM",  nx: 0.38, ny: 0.45 },
      { label: "W1",  nx: 0.18, ny: 0.3  },
      { label: "ST",  nx: 0.5,  ny: 0.18 },
      { label: "W2",  nx: 0.82, ny: 0.3  },
      { label: "FK",  nx: 0.5,  ny: 0.37 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.05 },
      { label: "CB", nx: 0.25, ny: 0.14 },
      { label: "CB", nx: 0.7,  ny: 0.14 },
      { label: "LB", nx: 0.1,  ny: 0.2  },
      { label: "RB", nx: 0.85, ny: 0.2  },
      { label: "W1", nx: 0.33, ny: 0.26 },
      { label: "W2", nx: 0.4,  ny: 0.26 },
      { label: "W3", nx: 0.47, ny: 0.26 },
      { label: "W4", nx: 0.54, ny: 0.26 },
      { label: "DM", nx: 0.7,  ny: 0.25 },
      { label: "ST", nx: 0.5,  ny: 0.4  },
    ],
    savedAt: null,
  },

  // =========================================================================
  // FREE KICK — DEFENDING
  // Own team defending a free kick in their own half (ny < 0.5)
  // Ball positioned around 35% down the field, central
  // =========================================================================

  // --- 7v7 defending free kick ---
  {
    id: "freekick-defending-7v7",
    name: "Free Kick (Defending)",
    isPredefined: true,
    format: "7v7",
    ballPosition: { nx: 0.5, ny: 0.68 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 }, // goalkeeper set position
      { label: "W1",  nx: 0.3,  ny: 0.72 }, // wall left
      { label: "W2",  nx: 0.4,  ny: 0.72 }, // wall right
      { label: "CB",  nx: 0.65, ny: 0.82 }, // covering post
      { label: "MF",  nx: 0.5,  ny: 0.55 }, // second ball
      { label: "W3",  nx: 0.2,  ny: 0.5  }, // wide cover
      { label: "ST",  nx: 0.75, ny: 0.52 }, // counter outlet
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.5,  ny: 0.25 },
      { label: "MF", nx: 0.35, ny: 0.45 },
      { label: "MF", nx: 0.65, ny: 0.45 },
      { label: "W",  nx: 0.2,  ny: 0.6  },
      { label: "W",  nx: 0.78, ny: 0.6  },
      { label: "FK", nx: 0.5,  ny: 0.62 },
    ],
    savedAt: null,
  },

  // --- 9v9 defending free kick ---
  {
    id: "freekick-defending-9v9",
    name: "Free Kick (Defending)",
    isPredefined: true,
    format: "9v9",
    ballPosition: { nx: 0.5, ny: 0.68 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "W1",  nx: 0.3,  ny: 0.73 }, // wall
      { label: "W2",  nx: 0.38, ny: 0.73 }, // wall
      { label: "W3",  nx: 0.46, ny: 0.73 }, // wall
      { label: "CB",  nx: 0.68, ny: 0.83 }, // far post cover
      { label: "MF1", nx: 0.35, ny: 0.58 }, // second ball
      { label: "MF2", nx: 0.65, ny: 0.58 }, // second ball
      { label: "W4",  nx: 0.18, ny: 0.45 }, // wide counter
      { label: "ST",  nx: 0.78, ny: 0.48 }, // counter outlet
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.35, ny: 0.2  },
      { label: "CB", nx: 0.65, ny: 0.2  },
      { label: "MF", nx: 0.5,  ny: 0.4  },
      { label: "W",  nx: 0.18, ny: 0.55 },
      { label: "W",  nx: 0.82, ny: 0.55 },
      { label: "ST", nx: 0.4,  ny: 0.62 },
      { label: "ST", nx: 0.6,  ny: 0.62 },
      { label: "FK", nx: 0.5,  ny: 0.63 },
    ],
    savedAt: null,
  },

  // --- 11v11 defending free kick ---
  {
    id: "freekick-defending-11v11",
    name: "Free Kick (Defending)",
    isPredefined: true,
    format: "11v11",
    ballPosition: { nx: 0.5, ny: 0.68 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "W1",  nx: 0.28, ny: 0.73 }, // wall
      { label: "W2",  nx: 0.35, ny: 0.73 }, // wall
      { label: "W3",  nx: 0.42, ny: 0.73 }, // wall
      { label: "W4",  nx: 0.49, ny: 0.73 }, // wall
      { label: "CB1", nx: 0.68, ny: 0.85 }, // far-post cover
      { label: "CB2", nx: 0.78, ny: 0.85 }, // far-post cover
      { label: "DM",  nx: 0.5,  ny: 0.62 }, // second ball
      { label: "CM",  nx: 0.35, ny: 0.5  }, // second ball / press
      { label: "LW",  nx: 0.15, ny: 0.45 }, // counter left
      { label: "RW",  nx: 0.78, ny: 0.48 }, // counter right
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.05 },
      { label: "CB", nx: 0.3,  ny: 0.18 },
      { label: "CB", nx: 0.7,  ny: 0.18 },
      { label: "LB", nx: 0.12, ny: 0.3  },
      { label: "RB", nx: 0.88, ny: 0.3  },
      { label: "DM", nx: 0.5,  ny: 0.4  },
      { label: "W",  nx: 0.18, ny: 0.55 },
      { label: "W",  nx: 0.82, ny: 0.55 },
      { label: "ST", nx: 0.5,  ny: 0.62 },
      { label: "AM", nx: 0.38, ny: 0.58 },
      { label: "FK", nx: 0.5,  ny: 0.63 },
    ],
    savedAt: null,
  },

  // =========================================================================
  // THROW-IN — ATTACKING (in opponent's half)
  // Ball on the sideline in the opponent's half (ny ≈ 0.3)
  // Own team creates movement patterns to receive the throw
  // =========================================================================

  // --- 7v7 attacking throw-in ---
  {
    id: "throwin-attacking-7v7",
    name: "Throw-In (Attacking)",
    isPredefined: true,
    format: "7v7",
    ballPosition: { nx: 0.0, ny: 0.35 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.94 },
      { label: "CB",  nx: 0.5,  ny: 0.75 },
      { label: "MF",  nx: 0.4,  ny: 0.55 },
      { label: "W1",  nx: 0.3,  ny: 0.38 },
      { label: "ST",  nx: 0.5,  ny: 0.3  },
      { label: "W2",  nx: 0.35, ny: 0.25 },
      { label: "TI",  nx: 0.0,  ny: 0.35 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.5,  ny: 0.18 },
      { label: "CB", nx: 0.7,  ny: 0.2  },
      { label: "MF", nx: 0.35, ny: 0.3  },
      { label: "MF", nx: 0.6,  ny: 0.32 },
      { label: "W",  nx: 0.2,  ny: 0.4  },
      { label: "ST", nx: 0.5,  ny: 0.45 },
    ],
    savedAt: null,
  },

  // --- 9v9 attacking throw-in ---
  {
    id: "throwin-attacking-9v9",
    name: "Throw-In (Attacking)",
    isPredefined: true,
    format: "9v9",
    ballPosition: { nx: 0.0, ny: 0.3 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.94 },
      { label: "CB1", nx: 0.4,  ny: 0.78 },
      { label: "CB2", nx: 0.65, ny: 0.78 },
      { label: "CM",  nx: 0.5,  ny: 0.55 },
      { label: "LM",  nx: 0.25, ny: 0.4  },
      { label: "RM",  nx: 0.7,  ny: 0.42 },
      { label: "W",   nx: 0.3,  ny: 0.28 },
      { label: "ST",  nx: 0.5,  ny: 0.25 },
      { label: "TI",  nx: 0.0,  ny: 0.3  },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.4,  ny: 0.16 },
      { label: "CB", nx: 0.6,  ny: 0.16 },
      { label: "CB", nx: 0.75, ny: 0.18 },
      { label: "MF", nx: 0.3,  ny: 0.28 },
      { label: "MF", nx: 0.55, ny: 0.3  },
      { label: "MF", nx: 0.75, ny: 0.28 },
      { label: "W",  nx: 0.2,  ny: 0.38 },
      { label: "ST", nx: 0.5,  ny: 0.42 },
    ],
    savedAt: null,
  },

  // --- 11v11 attacking throw-in ---
  {
    id: "throwin-attacking-11v11",
    name: "Throw-In (Attacking)",
    isPredefined: true,
    format: "11v11",
    ballPosition: { nx: 0.0, ny: 0.3 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "CB1", nx: 0.35, ny: 0.82 },
      { label: "CB2", nx: 0.65, ny: 0.82 },
      { label: "RB",  nx: 0.85, ny: 0.7  },
      { label: "DM",  nx: 0.5,  ny: 0.6  },
      { label: "CM",  nx: 0.4,  ny: 0.45 },
      { label: "RM",  nx: 0.75, ny: 0.4  },
      { label: "LW",  nx: 0.25, ny: 0.32 },
      { label: "ST",  nx: 0.5,  ny: 0.28 },
      { label: "RW",  nx: 0.7,  ny: 0.3  },
      { label: "TI",  nx: 0.0,  ny: 0.3  },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.05 },
      { label: "CB", nx: 0.35, ny: 0.15 },
      { label: "CB", nx: 0.6,  ny: 0.15 },
      { label: "LB", nx: 0.12, ny: 0.22 },
      { label: "RB", nx: 0.85, ny: 0.2  },
      { label: "DM", nx: 0.45, ny: 0.28 },
      { label: "CM", nx: 0.3,  ny: 0.32 },
      { label: "CM", nx: 0.65, ny: 0.3  },
      { label: "W",  nx: 0.2,  ny: 0.38 },
      { label: "W",  nx: 0.78, ny: 0.36 },
      { label: "ST", nx: 0.5,  ny: 0.42 },
    ],
    savedAt: null,
  },

  // =========================================================================
  // THROW-IN — DEFENDING (in own half)
  // Ball on the sideline in own half (ny ≈ 0.7)
  // Own team maintains shape, options to play safe or up the line
  // =========================================================================

  // --- 7v7 defending throw-in ---
  {
    id: "throwin-defending-7v7",
    name: "Throw-In (Defending)",
    isPredefined: true,
    format: "7v7",
    ballPosition: { nx: 0.0, ny: 0.7 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.94 },
      { label: "CB1", nx: 0.35, ny: 0.82 },
      { label: "CB2", nx: 0.65, ny: 0.82 },
      { label: "MF",  nx: 0.4,  ny: 0.68 },
      { label: "W1",  nx: 0.3,  ny: 0.6  },
      { label: "ST",  nx: 0.5,  ny: 0.55 },
      { label: "TI",  nx: 0.0,  ny: 0.7  },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.5,  ny: 0.25 },
      { label: "MF", nx: 0.35, ny: 0.45 },
      { label: "MF", nx: 0.65, ny: 0.45 },
      { label: "W",  nx: 0.2,  ny: 0.6  },
      { label: "W",  nx: 0.7,  ny: 0.58 },
      { label: "ST", nx: 0.4,  ny: 0.65 },
    ],
    savedAt: null,
  },

  // --- 9v9 defending throw-in ---
  {
    id: "throwin-defending-9v9",
    name: "Throw-In (Defending)",
    isPredefined: true,
    format: "9v9",
    ballPosition: { nx: 0.0, ny: 0.7 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.94 },
      { label: "CB1", nx: 0.3,  ny: 0.85 },
      { label: "CB2", nx: 0.55, ny: 0.85 },
      { label: "CB3", nx: 0.75, ny: 0.83 },
      { label: "LM",  nx: 0.25, ny: 0.7  },
      { label: "CM",  nx: 0.5,  ny: 0.68 },
      { label: "RM",  nx: 0.75, ny: 0.65 },
      { label: "ST",  nx: 0.5,  ny: 0.55 },
      { label: "TI",  nx: 0.0,  ny: 0.7  },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.4,  ny: 0.2  },
      { label: "CB", nx: 0.65, ny: 0.2  },
      { label: "MF", nx: 0.3,  ny: 0.4  },
      { label: "MF", nx: 0.55, ny: 0.42 },
      { label: "MF", nx: 0.75, ny: 0.4  },
      { label: "W",  nx: 0.18, ny: 0.58 },
      { label: "W",  nx: 0.8,  ny: 0.55 },
      { label: "ST", nx: 0.45, ny: 0.62 },
    ],
    savedAt: null,
  },

  // --- 11v11 defending throw-in ---
  {
    id: "throwin-defending-11v11",
    name: "Throw-In (Defending)",
    isPredefined: true,
    format: "11v11",
    ballPosition: { nx: 0.0, ny: 0.7 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "CB1", nx: 0.3,  ny: 0.85 },
      { label: "CB2", nx: 0.6,  ny: 0.85 },
      { label: "LB",  nx: 0.15, ny: 0.78 },
      { label: "RB",  nx: 0.8,  ny: 0.78 },
      { label: "DM",  nx: 0.45, ny: 0.72 },
      { label: "LM",  nx: 0.25, ny: 0.65 },
      { label: "CM",  nx: 0.5,  ny: 0.63 },
      { label: "RM",  nx: 0.75, ny: 0.62 },
      { label: "ST",  nx: 0.5,  ny: 0.55 },
      { label: "TI",  nx: 0.0,  ny: 0.7  },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.05 },
      { label: "CB", nx: 0.35, ny: 0.18 },
      { label: "CB", nx: 0.65, ny: 0.18 },
      { label: "LB", nx: 0.12, ny: 0.28 },
      { label: "RB", nx: 0.88, ny: 0.28 },
      { label: "DM", nx: 0.5,  ny: 0.38 },
      { label: "LM", nx: 0.22, ny: 0.5  },
      { label: "CM", nx: 0.5,  ny: 0.52 },
      { label: "RM", nx: 0.78, ny: 0.5  },
      { label: "W",  nx: 0.18, ny: 0.6  },
      { label: "ST", nx: 0.45, ny: 0.63 },
    ],
    savedAt: null,
  },

  // =========================================================================
  // KICKOFF
  // Ball at center (0.5, 0.5); own team taking kickoff
  // Rules: all players must be in their own half except the two kickers at center
  // The kicker pair straddles the center spot, one slightly ahead to pass back
  // ny=0.5 is the halfway line; own half is ny > 0.5
  // =========================================================================

  // --- 7v7 kickoff ---
  {
    id: "kickoff-7v7",
    name: "Kickoff",
    isPredefined: true,
    format: "7v7",
    ballPosition: { nx: 0.5, ny: 0.5 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.94 },
      { label: "CB1", nx: 0.33, ny: 0.78 },
      { label: "CB2", nx: 0.67, ny: 0.78 },
      { label: "LM",  nx: 0.2,  ny: 0.62 },
      { label: "RM",  nx: 0.8,  ny: 0.62 },
      { label: "CF",  nx: 0.4,  ny: 0.51 }, // kickoff passer (just behind ball)
      { label: "ST",  nx: 0.6,  ny: 0.51 }, // kickoff receiver
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.33, ny: 0.22 },
      { label: "CB", nx: 0.67, ny: 0.22 },
      { label: "LM", nx: 0.2,  ny: 0.38 },
      { label: "RM", nx: 0.8,  ny: 0.38 },
      { label: "CF", nx: 0.4,  ny: 0.47 },
      { label: "ST", nx: 0.6,  ny: 0.47 },
    ],
    savedAt: null,
  },

  // --- 9v9 kickoff ---
  {
    id: "kickoff-9v9",
    name: "Kickoff",
    isPredefined: true,
    format: "9v9",
    ballPosition: { nx: 0.5, ny: 0.5 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.94 },
      { label: "CB1", nx: 0.3,  ny: 0.82 },
      { label: "CB2", nx: 0.7,  ny: 0.82 },
      { label: "LM",  nx: 0.18, ny: 0.67 },
      { label: "CM",  nx: 0.5,  ny: 0.65 },
      { label: "RM",  nx: 0.82, ny: 0.67 },
      { label: "LW",  nx: 0.28, ny: 0.55 },
      { label: "CF",  nx: 0.45, ny: 0.51 }, // kickoff passer
      { label: "RW",  nx: 0.72, ny: 0.55 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.3,  ny: 0.18 },
      { label: "CB", nx: 0.7,  ny: 0.18 },
      { label: "LM", nx: 0.18, ny: 0.33 },
      { label: "CM", nx: 0.5,  ny: 0.35 },
      { label: "RM", nx: 0.82, ny: 0.33 },
      { label: "LW", nx: 0.28, ny: 0.44 },
      { label: "CF", nx: 0.5,  ny: 0.47 },
      { label: "RW", nx: 0.72, ny: 0.44 },
    ],
    savedAt: null,
  },

  // --- 11v11 kickoff ---
  {
    id: "kickoff-11v11",
    name: "Kickoff",
    isPredefined: true,
    format: "11v11",
    ballPosition: { nx: 0.5, ny: 0.5 },
    ownPositions: [
      { label: "GK",  nx: 0.5,  ny: 0.95 },
      { label: "CB1", nx: 0.35, ny: 0.82 },
      { label: "CB2", nx: 0.65, ny: 0.82 },
      { label: "LB",  nx: 0.12, ny: 0.75 },
      { label: "RB",  nx: 0.88, ny: 0.75 },
      { label: "DM",  nx: 0.5,  ny: 0.68 },
      { label: "LM",  nx: 0.22, ny: 0.6  },
      { label: "RM",  nx: 0.78, ny: 0.6  },
      { label: "LW",  nx: 0.3,  ny: 0.53 },
      { label: "CF",  nx: 0.45, ny: 0.51 }, // kickoff passer
      { label: "RW",  nx: 0.7,  ny: 0.53 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.05 },
      { label: "CB", nx: 0.35, ny: 0.18 },
      { label: "CB", nx: 0.65, ny: 0.18 },
      { label: "LB", nx: 0.12, ny: 0.25 },
      { label: "RB", nx: 0.88, ny: 0.25 },
      { label: "DM", nx: 0.5,  ny: 0.32 },
      { label: "LM", nx: 0.22, ny: 0.4  },
      { label: "RM", nx: 0.78, ny: 0.4  },
      { label: "LW", nx: 0.3,  ny: 0.46 },
      { label: "CF", nx: 0.5,  ny: 0.48 },
      { label: "RW", nx: 0.7,  ny: 0.46 },
    ],
    savedAt: null,
  },

  // =========================================================================
  // GOAL KICK
  // Ball on own 6-yard line; own team in build-up shape
  // =========================================================================

  // --- 7v7 goal kick ---
  {
    id: "goalkick-7v7",
    name: "Goal Kick",
    isPredefined: true,
    format: "7v7",
    ballPosition: { nx: 0.5, ny: 0.95 },
    ownPositions: [
      { label: "GK", nx: 0.5,  ny: 0.97 },
      { label: "CB", nx: 0.3,  ny: 0.85 },
      { label: "CB", nx: 0.7,  ny: 0.85 },
      { label: "LM", nx: 0.15, ny: 0.72 },
      { label: "CM", nx: 0.5,  ny: 0.7  },
      { label: "RM", nx: 0.85, ny: 0.72 },
      { label: "ST", nx: 0.5,  ny: 0.55 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.5,  ny: 0.25 },
      { label: "MF", nx: 0.3,  ny: 0.42 },
      { label: "MF", nx: 0.7,  ny: 0.42 },
      { label: "W",  nx: 0.2,  ny: 0.55 },
      { label: "ST", nx: 0.5,  ny: 0.58 },
      { label: "W",  nx: 0.8,  ny: 0.55 },
    ],
    savedAt: null,
  },

  // --- 9v9 goal kick ---
  {
    id: "goalkick-9v9",
    name: "Goal Kick",
    isPredefined: true,
    format: "9v9",
    ballPosition: { nx: 0.5, ny: 0.95 },
    ownPositions: [
      { label: "GK", nx: 0.5,  ny: 0.97 },
      { label: "CB", nx: 0.25, ny: 0.85 },
      { label: "CB", nx: 0.5,  ny: 0.83 },
      { label: "CB", nx: 0.75, ny: 0.85 },
      { label: "LM", nx: 0.15, ny: 0.7  },
      { label: "CM", nx: 0.5,  ny: 0.68 },
      { label: "RM", nx: 0.85, ny: 0.7  },
      { label: "LW", nx: 0.25, ny: 0.55 },
      { label: "RW", nx: 0.75, ny: 0.55 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.06 },
      { label: "CB", nx: 0.35, ny: 0.2  },
      { label: "CB", nx: 0.65, ny: 0.2  },
      { label: "MF", nx: 0.3,  ny: 0.38 },
      { label: "MF", nx: 0.5,  ny: 0.4  },
      { label: "MF", nx: 0.7,  ny: 0.38 },
      { label: "W",  nx: 0.2,  ny: 0.52 },
      { label: "ST", nx: 0.5,  ny: 0.55 },
      { label: "W",  nx: 0.8,  ny: 0.52 },
    ],
    savedAt: null,
  },

  // --- 11v11 goal kick ---
  {
    id: "goalkick-11v11",
    name: "Goal Kick",
    isPredefined: true,
    format: "11v11",
    ballPosition: { nx: 0.5, ny: 0.95 },
    ownPositions: [
      { label: "GK", nx: 0.5,  ny: 0.97 },
      { label: "CB", nx: 0.3,  ny: 0.85 },
      { label: "CB", nx: 0.65, ny: 0.85 },
      { label: "LB", nx: 0.1,  ny: 0.78 },
      { label: "RB", nx: 0.9,  ny: 0.78 },
      { label: "DM", nx: 0.5,  ny: 0.72 },
      { label: "LM", nx: 0.2,  ny: 0.62 },
      { label: "CM", nx: 0.5,  ny: 0.6  },
      { label: "RM", nx: 0.8,  ny: 0.62 },
      { label: "LW", nx: 0.25, ny: 0.5  },
      { label: "ST", nx: 0.5,  ny: 0.48 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.05 },
      { label: "CB", nx: 0.35, ny: 0.18 },
      { label: "CB", nx: 0.65, ny: 0.18 },
      { label: "LB", nx: 0.12, ny: 0.28 },
      { label: "RB", nx: 0.88, ny: 0.28 },
      { label: "DM", nx: 0.5,  ny: 0.35 },
      { label: "LM", nx: 0.22, ny: 0.45 },
      { label: "CM", nx: 0.5,  ny: 0.47 },
      { label: "RM", nx: 0.78, ny: 0.45 },
      { label: "W",  nx: 0.2,  ny: 0.55 },
      { label: "ST", nx: 0.5,  ny: 0.58 },
    ],
    savedAt: null,
  },

  // =========================================================================
  // PENALTY KICK
  // Own team taking a penalty; ball on opponent's penalty spot
  // =========================================================================

  // --- 7v7 penalty kick ---
  {
    id: "penalty-7v7",
    name: "Penalty Kick",
    isPredefined: true,
    format: "7v7",
    ballPosition: { nx: 0.5, ny: 0.105 },
    ownPositions: [
      { label: "GK", nx: 0.5,  ny: 0.94 },
      { label: "PK", nx: 0.5,  ny: 0.13 },
      { label: "2",  nx: 0.3,  ny: 0.2  },
      { label: "3",  nx: 0.45, ny: 0.2  },
      { label: "4",  nx: 0.55, ny: 0.2  },
      { label: "5",  nx: 0.7,  ny: 0.2  },
      { label: "6",  nx: 0.5,  ny: 0.25 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.02 },
      { label: "2",  nx: 0.25, ny: 0.5  },
      { label: "3",  nx: 0.35, ny: 0.5  },
      { label: "4",  nx: 0.5,  ny: 0.5  },
      { label: "5",  nx: 0.65, ny: 0.5  },
      { label: "6",  nx: 0.75, ny: 0.5  },
      { label: "7",  nx: 0.5,  ny: 0.48 },
    ],
    savedAt: null,
  },

  // --- 9v9 penalty kick ---
  {
    id: "penalty-9v9",
    name: "Penalty Kick",
    isPredefined: true,
    format: "9v9",
    ballPosition: { nx: 0.5, ny: 0.105 },
    ownPositions: [
      { label: "GK", nx: 0.5,  ny: 0.94 },
      { label: "PK", nx: 0.5,  ny: 0.13 },
      { label: "2",  nx: 0.25, ny: 0.2  },
      { label: "3",  nx: 0.35, ny: 0.2  },
      { label: "4",  nx: 0.45, ny: 0.2  },
      { label: "5",  nx: 0.55, ny: 0.2  },
      { label: "6",  nx: 0.65, ny: 0.2  },
      { label: "7",  nx: 0.75, ny: 0.2  },
      { label: "8",  nx: 0.5,  ny: 0.25 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.02 },
      { label: "2",  nx: 0.2,  ny: 0.5  },
      { label: "3",  nx: 0.3,  ny: 0.5  },
      { label: "4",  nx: 0.4,  ny: 0.5  },
      { label: "5",  nx: 0.5,  ny: 0.5  },
      { label: "6",  nx: 0.6,  ny: 0.5  },
      { label: "7",  nx: 0.7,  ny: 0.5  },
      { label: "8",  nx: 0.8,  ny: 0.5  },
      { label: "9",  nx: 0.5,  ny: 0.48 },
    ],
    savedAt: null,
  },

  // --- 11v11 penalty kick ---
  {
    id: "penalty-11v11",
    name: "Penalty Kick",
    isPredefined: true,
    format: "11v11",
    ballPosition: { nx: 0.5, ny: 0.105 },
    ownPositions: [
      { label: "GK", nx: 0.5,  ny: 0.95 },
      { label: "PK", nx: 0.5,  ny: 0.13 },
      { label: "2",  nx: 0.2,  ny: 0.2  },
      { label: "3",  nx: 0.28, ny: 0.2  },
      { label: "4",  nx: 0.36, ny: 0.2  },
      { label: "5",  nx: 0.44, ny: 0.2  },
      { label: "6",  nx: 0.56, ny: 0.2  },
      { label: "7",  nx: 0.64, ny: 0.2  },
      { label: "8",  nx: 0.72, ny: 0.2  },
      { label: "9",  nx: 0.8,  ny: 0.2  },
      { label: "10", nx: 0.5,  ny: 0.25 },
    ],
    opponentPositions: [
      { label: "GK", nx: 0.5,  ny: 0.02 },
      { label: "2",  nx: 0.15, ny: 0.5  },
      { label: "3",  nx: 0.25, ny: 0.5  },
      { label: "4",  nx: 0.35, ny: 0.5  },
      { label: "5",  nx: 0.45, ny: 0.5  },
      { label: "6",  nx: 0.55, ny: 0.5  },
      { label: "7",  nx: 0.65, ny: 0.5  },
      { label: "8",  nx: 0.75, ny: 0.5  },
      { label: "9",  nx: 0.85, ny: 0.5  },
      { label: "10", nx: 0.4,  ny: 0.48 },
      { label: "11", nx: 0.6,  ny: 0.48 },
    ],
    savedAt: null,
  },
];

/**
 * Returns all predefined situational moments for the given format.
 * @param {"7v7"|"9v9"|"11v11"} format
 * @returns {PredefinedMoment[]}
 */
export function getPredefinedMoments(format) {
  return PREDEFINED_MOMENTS.filter((m) => m.format === format);
}
