import type {
  AtBatEvent,
  GameEvent,
  Half,
  Player,
  Score,
  Team,
} from "../domain/types";
import type { PersistedGameV2 } from "../storage/local-storage";

interface DevGameScenarioExpectation {
  score: Score;
  gameStatus: "live" | "finished";
  inning: number;
  half: Half;
  outs: number;
  activePitcherId?: {
    away: string | null;
    home: string | null;
  };
}

export interface DevGameScenario {
  id: string;
  title: string;
  description: string;
  category: "pitching" | "offense" | "dramatic" | "management";
  statusLabel: string;
  expectation: string;
  expectedState: DevGameScenarioExpectation;
  createGame: () => PersistedGameV2;
}

function players(side: "away" | "home", count = 9): Player[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${side}-${index + 1}`,
    name: `${side === "away" ? "先攻" : "後攻"} 選手${index + 1}`,
    order: index + 1,
    position: index === 0 ? "pitcher" : null,
  }));
}

function team(side: "away" | "home", count = 9): Team {
  const lineup = players(side, count);
  return {
    name: side === "away" ? "ビジターズ" : "ホームズ",
    players: lineup,
    startingPitcherId: lineup[0]?.id ?? null,
    startingPitcherName: lineup[0]?.name ?? "",
  };
}

function game(
  id: string,
  regulationInnings: number,
  events: GameEvent[],
  overrides: {
    away?: Team;
    home?: Team;
    status?: PersistedGameV2["status"];
  } = {}
): PersistedGameV2 {
  return {
    id,
    date: "2026-07-26T12:00:00.000Z",
    status: overrides.status ?? "live",
    config: {
      regulationInnings,
      teams: {
        away: overrides.away ?? team("away"),
        home: overrides.home ?? team("home"),
      },
    },
    events,
  };
}

function batterOut(id: string, batterId: string): AtBatEvent {
  return {
    id,
    kind: "atBat",
    batterId,
    result: "groundOut",
    movements: [
      {
        playerId: batterId,
        from: "batter",
        to: "out",
        isRBI: false,
      },
    ],
  };
}

function homeRun(id: string, batterId: string): AtBatEvent {
  return {
    id,
    kind: "atBat",
    batterId,
    result: "homerun",
    movements: [
      {
        playerId: batterId,
        from: "batter",
        to: "home",
        isRBI: true,
      },
    ],
  };
}

function threeOuts(prefix: string, batterIds: readonly string[]): AtBatEvent[] {
  return batterIds.map((batterId, index) =>
    batterOut(`${prefix}-${index + 1}`, batterId)
  );
}

const pitchingDuel: DevGameScenario = {
  id: "pitching-duel",
  title: "1対0の投手戦",
  description:
    "初回の先頭打者本塁打だけで決着し、両投手がその後を無失点に抑える1回制の試合です。",
  category: "pitching",
  statusLabel: "試合終了",
  expectation: "ビジターが1対0で勝利し、2回表の終了状態になる",
  expectedState: {
    score: { away: 1, home: 0 },
    gameStatus: "finished",
    inning: 2,
    half: "top",
    outs: 0,
  },
  createGame: () =>
    game(
      "pitching-duel",
      1,
      [
        homeRun("away-leadoff-homer", "away-1"),
        ...threeOuts("away-outs", ["away-2", "away-3", "away-4"]),
        ...threeOuts("home-outs", ["home-1", "home-2", "home-3"]),
      ],
      { status: "finished" }
    ),
};

const slugfest: DevGameScenario = {
  id: "slugfest",
  title: "9本塁打の乱打戦",
  description:
    "先攻5本、後攻4本のソロ本塁打が飛び交い、最終回まで1点差で進む入力負荷の高い試合です。",
  category: "offense",
  statusLabel: "試合終了",
  expectation: "9本の本塁打が反映され、ビジターが5対4で勝利する",
  expectedState: {
    score: { away: 5, home: 4 },
    gameStatus: "finished",
    inning: 2,
    half: "top",
    outs: 0,
  },
  createGame: () =>
    game(
      "slugfest",
      1,
      [
        ...[1, 2, 3, 4, 5].map((number) =>
          homeRun(`away-homer-${number}`, `away-${number}`)
        ),
        ...threeOuts("away-slugfest-outs", ["away-6", "away-7", "away-8"]),
        ...[1, 2, 3, 4].map((number) =>
          homeRun(`home-homer-${number}`, `home-${number}`)
        ),
        ...threeOuts("home-slugfest-outs", ["home-5", "home-6", "home-7"]),
      ],
      { status: "finished" }
    ),
};

const walkOff: DevGameScenario = {
  id: "bases-loaded-walk-off",
  title: "満塁サヨナラ本塁打",
  description:
    "後攻が最終回に単打2本で走者をため、3点本塁打で即時終了するサヨナラ試合です。",
  category: "dramatic",
  statusLabel: "サヨナラ終了",
  expectation: "満塁本塁打で4対2となり、1回裏の途中で即時終了する",
  expectedState: {
    score: { away: 2, home: 4 },
    gameStatus: "finished",
    inning: 1,
    half: "bottom",
    outs: 0,
  },
  createGame: () =>
    game(
      "bases-loaded-walk-off",
      1,
      [
        homeRun("away-homer-1", "away-1"),
        homeRun("away-homer-2", "away-2"),
        ...threeOuts("away-walkoff-outs", ["away-3", "away-4", "away-5"]),
        {
          id: "home-single-1",
          kind: "atBat",
          batterId: "home-1",
          result: "single",
          movements: [
            {
              playerId: "home-1",
              from: "batter",
              to: "first",
              isRBI: false,
            },
          ],
        },
        {
          id: "home-single-2",
          kind: "atBat",
          batterId: "home-2",
          result: "single",
          movements: [
            {
              playerId: "home-1",
              from: "first",
              to: "second",
              isRBI: false,
            },
            {
              playerId: "home-2",
              from: "batter",
              to: "first",
              isRBI: false,
            },
          ],
        },
        {
          id: "home-single-3",
          kind: "atBat",
          batterId: "home-3",
          result: "single",
          movements: [
            {
              playerId: "home-1",
              from: "second",
              to: "third",
              isRBI: false,
            },
            {
              playerId: "home-2",
              from: "first",
              to: "second",
              isRBI: false,
            },
            {
              playerId: "home-3",
              from: "batter",
              to: "first",
              isRBI: false,
            },
          ],
        },
        {
          id: "walk-off-homer",
          kind: "atBat",
          batterId: "home-4",
          result: "homerun",
          movements: [
            {
              playerId: "home-1",
              from: "third",
              to: "home",
              isRBI: true,
            },
            {
              playerId: "home-2",
              from: "second",
              to: "home",
              isRBI: true,
            },
            {
              playerId: "home-3",
              from: "first",
              to: "home",
              isRBI: true,
            },
            {
              playerId: "home-4",
              from: "batter",
              to: "home",
              isRBI: true,
            },
          ],
        },
      ],
      { status: "finished" }
    ),
};

const extraInnings: DevGameScenario = {
  id: "extra-inning-away-win",
  title: "延長戦のビジター勝利",
  description:
    "1回を0対0で終え、延長2回表の本塁打を守り切る自動終了判定の確認用試合です。",
  category: "dramatic",
  statusLabel: "延長終了",
  expectation: "延長2回の得点でビジターが1対0で勝利する",
  expectedState: {
    score: { away: 1, home: 0 },
    gameStatus: "finished",
    inning: 3,
    half: "top",
    outs: 0,
  },
  createGame: () =>
    game(
      "extra-inning-away-win",
      1,
      [
        ...threeOuts("regulation-away", ["away-1", "away-2", "away-3"]),
        ...threeOuts("regulation-home", ["home-1", "home-2", "home-3"]),
        homeRun("extra-away-homer", "away-4"),
        ...threeOuts("extra-away-outs", ["away-5", "away-6", "away-7"]),
        ...threeOuts("extra-home-outs", ["home-4", "home-5", "home-6"]),
      ],
      { status: "finished" }
    ),
};

const dhPitchingChange: DevGameScenario = {
  id: "dh-pitching-change",
  title: "DH制の投手交代",
  description:
    "打順外の先発投手から救援投手へ交代し、DHの打順スロットを維持する試合途中データです。",
  category: "management",
  statusLabel: "試合中",
  expectation: "DHの打順を維持したまま現在投手が救援投手へ替わる",
  expectedState: {
    score: { away: 0, home: 0 },
    gameStatus: "live",
    inning: 1,
    half: "bottom",
    outs: 0,
    activePitcherId: {
      away: "away-1",
      home: "home-reliever",
    },
  },
  createGame: () => {
    const home = team("home");
    home.players[0] = {
      ...home.players[0],
      name: "ホーム DH",
      position: "dh",
    };
    home.benchPlayers = [
      {
        id: "home-starter",
        name: "ホーム 先発",
        order: 10,
        position: "pitcher",
      },
      {
        id: "home-reliever",
        name: "ホーム 救援",
        order: 11,
        position: "pitcher",
      },
    ];
    home.startingPitcherId = "home-starter";
    home.startingPitcherName = "ホーム 先発";
    return game(
      "dh-pitching-change",
      7,
      [
        {
          id: "pitching-change",
          kind: "substitution",
          team: "home",
          inPlayerId: "home-reliever",
          outPlayerId: "home-starter",
          role: "pitcher",
        },
        ...threeOuts("after-pitching-change", ["away-1", "away-2", "away-3"]),
      ],
      { home }
    );
  },
};

const substitutionsAndRunning: DevGameScenario = {
  id: "substitutions-and-running",
  title: "代走・盗塁・代打",
  description:
    "出塁後に代走を送り、盗塁と適時二塁打で得点し、続けて代打を起用する試合途中データです。",
  category: "management",
  statusLabel: "試合中",
  expectation: "代走の得点、盗塁、代打が反映され、1対0・1アウトになる",
  expectedState: {
    score: { away: 1, home: 0 },
    gameStatus: "live",
    inning: 1,
    half: "top",
    outs: 1,
  },
  createGame: () => {
    const away = team("away");
    away.benchPlayers = [
      {
        id: "away-pinch-runner",
        name: "先攻 代走",
        order: 10,
        position: null,
      },
      {
        id: "away-pinch-hitter",
        name: "先攻 代打",
        order: 11,
        position: null,
      },
    ];
    return game(
      "substitutions-and-running",
      7,
      [
        {
          id: "leadoff-single",
          kind: "atBat",
          batterId: "away-1",
          result: "single",
          movements: [
            {
              playerId: "away-1",
              from: "batter",
              to: "first",
              isRBI: false,
            },
          ],
        },
        {
          id: "pinch-runner",
          kind: "substitution",
          team: "away",
          inPlayerId: "away-pinch-runner",
          outPlayerId: "away-1",
          role: "pinchRunner",
        },
        {
          id: "stolen-base",
          kind: "baseRunning",
          type: "steal",
          movements: [
            {
              playerId: "away-pinch-runner",
              from: "first",
              to: "second",
              isRBI: false,
            },
          ],
        },
        {
          id: "rbi-double",
          kind: "atBat",
          batterId: "away-2",
          result: "double",
          movements: [
            {
              playerId: "away-pinch-runner",
              from: "second",
              to: "home",
              isRBI: true,
            },
            {
              playerId: "away-2",
              from: "batter",
              to: "second",
              isRBI: false,
            },
          ],
        },
        {
          id: "pinch-hitter",
          kind: "substitution",
          team: "away",
          inPlayerId: "away-pinch-hitter",
          outPlayerId: "away-3",
          role: "pinchHitter",
        },
        batterOut("pinch-hitter-out", "away-pinch-hitter"),
      ],
      { away }
    );
  },
};

const forceOutNullifiesRun: DevGameScenario = {
  id: "force-third-out-nullifies-run",
  title: "フォース第3アウトで得点無効",
  description:
    "2アウト満塁から走者が生還しますが、一塁走者のフォースアウトが第3アウトとなるため得点されない境界ケースです。",
  category: "management",
  statusLabel: "試合中",
  expectation: "第3アウトがフォースのためホームインが得点にならない",
  expectedState: {
    score: { away: 0, home: 0 },
    gameStatus: "live",
    inning: 1,
    half: "bottom",
    outs: 0,
  },
  createGame: () =>
    game("force-third-out-nullifies-run", 7, [
      {
        id: "force-single-1",
        kind: "atBat",
        batterId: "away-1",
        result: "single",
        movements: [
          {
            playerId: "away-1",
            from: "batter",
            to: "first",
            isRBI: false,
          },
        ],
      },
      {
        id: "force-single-2",
        kind: "atBat",
        batterId: "away-2",
        result: "single",
        movements: [
          {
            playerId: "away-1",
            from: "first",
            to: "second",
            isRBI: false,
          },
          {
            playerId: "away-2",
            from: "batter",
            to: "first",
            isRBI: false,
          },
        ],
      },
      {
        id: "force-single-3",
        kind: "atBat",
        batterId: "away-3",
        result: "single",
        movements: [
          {
            playerId: "away-1",
            from: "second",
            to: "third",
            isRBI: false,
          },
          {
            playerId: "away-2",
            from: "first",
            to: "second",
            isRBI: false,
          },
          {
            playerId: "away-3",
            from: "batter",
            to: "first",
            isRBI: false,
          },
        ],
      },
      batterOut("force-first-out", "away-4"),
      batterOut("force-second-out", "away-5"),
      {
        id: "inning-ending-force",
        kind: "atBat",
        batterId: "away-6",
        result: "fieldersChoice",
        movements: [
          {
            playerId: "away-1",
            from: "third",
            to: "home",
            isRBI: true,
          },
          {
            playerId: "away-2",
            from: "second",
            to: "third",
            isRBI: false,
          },
          {
            playerId: "away-3",
            from: "first",
            to: "out",
            isRBI: false,
            outType: "force",
          },
          {
            playerId: "away-6",
            from: "batter",
            to: "first",
            isRBI: false,
          },
        ],
      },
    ]),
};

const smallBallAndSpecialResults: DevGameScenario = {
  id: "small-ball-special-results",
  title: "四球・失策・犠飛の小技戦",
  description:
    "四球と失策で走者をため、暴投・犠飛・捕逸で進塁と得点を重ねる特殊結果の確認用データです。",
  category: "offense",
  statusLabel: "試合中",
  expectation: "四球・失策・犠飛・暴投・捕逸を経て2対0・1アウトになる",
  expectedState: {
    score: { away: 2, home: 0 },
    gameStatus: "live",
    inning: 1,
    half: "top",
    outs: 1,
  },
  createGame: () =>
    game("small-ball-special-results", 7, [
      {
        id: "leadoff-walk",
        kind: "atBat",
        batterId: "away-1",
        result: "walk",
        movements: [
          {
            playerId: "away-1",
            from: "batter",
            to: "first",
            isRBI: false,
          },
        ],
      },
      {
        id: "fielding-error",
        kind: "atBat",
        batterId: "away-2",
        result: "error",
        movements: [
          {
            playerId: "away-1",
            from: "first",
            to: "second",
            isRBI: false,
          },
          {
            playerId: "away-2",
            from: "batter",
            to: "first",
            isRBI: false,
          },
        ],
      },
      {
        id: "advance-on-wild-pitch",
        kind: "baseRunning",
        type: "wildPitch",
        movements: [
          {
            playerId: "away-1",
            from: "second",
            to: "third",
            isRBI: false,
          },
          {
            playerId: "away-2",
            from: "first",
            to: "second",
            isRBI: false,
          },
        ],
      },
      {
        id: "sacrifice-fly",
        kind: "atBat",
        batterId: "away-3",
        result: "sacrificeFly",
        movements: [
          {
            playerId: "away-1",
            from: "third",
            to: "home",
            isRBI: true,
          },
          {
            playerId: "away-3",
            from: "batter",
            to: "out",
            isRBI: false,
          },
        ],
      },
      {
        id: "advance-on-passed-ball",
        kind: "baseRunning",
        type: "passedBall",
        movements: [
          {
            playerId: "away-2",
            from: "second",
            to: "third",
            isRBI: false,
          },
        ],
      },
      {
        id: "score-on-wild-pitch",
        kind: "baseRunning",
        type: "wildPitch",
        movements: [
          {
            playerId: "away-2",
            from: "third",
            to: "home",
            isRBI: false,
          },
        ],
      },
    ]),
};

export const DEVELOPMENT_GAME_SCENARIOS: readonly DevGameScenario[] = [
  pitchingDuel,
  slugfest,
  walkOff,
  extraInnings,
  dhPitchingChange,
  substitutionsAndRunning,
  forceOutNullifiesRun,
  smallBallAndSpecialResults,
];

export function buildDevGameScenario(id: string): PersistedGameV2 | null {
  return (
    DEVELOPMENT_GAME_SCENARIOS.find(
      (scenario) => scenario.id === id
    )?.createGame() ?? null
  );
}
