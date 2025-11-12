export interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: string;
}

// Map from player ID to their selected option and submission timestamp
export interface PlayerAnswer {
    [playerId: string]: {
        option: string;
        submittedAt: number;
    };
}

// Map from player ID to their name
export interface Players {
    [playerId:string]: {
        name: string;
    }
}

// Map from player ID to their total score
export interface Scores {
    [playerId: string]: number;
}

export interface GameState {
    status: 'lobby' | 'in-progress' | 'question-results' | 'leaderboard' | 'finished';
    questions: QuizQuestion[];
    currentQuestionIndex: number;
    playerAnswers: { [questionIndex: number]: PlayerAnswer };
    scores: Scores;
    previousScores?: Scores;
    players: Players;
    questionStartTime: number | null; // Timestamp when the current question was shown
    showResults: boolean;
}

export type Message =
    | { type: 'GAME_STATE_UPDATE'; payload: GameState }
    | { type: 'PLAYER_JOIN'; payload: { name: string } }
    | { type: 'PLAYER_ANSWER'; payload: { questionIndex: number; option: string; submittedAt: number } };