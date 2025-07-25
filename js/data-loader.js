// データ読み込み管理
class DataLoader {
    constructor() {
        this.eras = null;
        this.questions = {};
        this.cache = new Map();
    }

    // 時代データの読み込み
    async loadEras() {
        if (this.eras) return this.eras;

        try {
            const response = await fetch('../data/eras.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.eras = await response.json();
            return this.eras;
        } catch (error) {
            console.error('Error loading eras:', error);
            // フォールバック用のダミーデータ
            this.eras = this.getDefaultEras();
            return this.eras;
        }
    }

    // 問題データの読み込み
    async loadQuestions(eraId) {
        if (this.questions[eraId]) return this.questions[eraId];

        try {
            const response = await fetch(`../data/questions/${eraId}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.questions[eraId] = data;
            return data;
        } catch (error) {
            console.error(`Error loading questions for ${eraId}:`, error);
            // フォールバック用のダミーデータ
            const dummyData = this.getDefaultQuestions(eraId);
            this.questions[eraId] = dummyData;
            return dummyData;
        }
    }

    // デフォルト時代データ
    getDefaultEras() {
        return {
            "eras": [
                {
                    "id": "jomon",
                    "name": "縄文時代",
                    "period": "紀元前14000年頃～紀元前300年頃",
                    "description": "土器と狩猟採集の時代",
                    "color": "#8B4513",
                    "questionCount": 20,
                    "difficulty": {
                        "easy": 12,
                        "medium": 6,
                        "hard": 2
                    }
                },
                {
                    "id": "yayoi",
                    "name": "弥生時代",
                    "period": "紀元前300年頃～紀元後300年頃",
                    "description": "稲作と金属器の時代",
                    "color": "#228B22",
                    "questionCount": 20,
                    "difficulty": {
                        "easy": 12,
                        "medium": 6,
                        "hard": 2
                    }
                },
                {
                    "id": "kofun",
                    "name": "古墳時代",
                    "period": "3世紀中頃～7世紀頃",
                    "description": "大型古墳と王権の時代",
                    "color": "#B8860B",
                    "questionCount": 20,
                    "difficulty": {
                        "easy": 10,
                        "medium": 8,
                        "hard": 2
                    }
                },
                {
                    "id": "asuka",
                    "name": "飛鳥時代",
                    "period": "593年～710年",
                    "description": "仏教伝来と法制整備の時代",
                    "color": "#FF69B4",
                    "questionCount": 20,
                    "difficulty": {
                        "easy": 10,
                        "medium": 8,
                        "hard": 2
                    }
                },
                {
                    "id": "nara",
                    "name": "奈良時代",
                    "period": "710年～794年",
                    "description": "平城京と律令国家の時代",
                    "color": "#DDA0DD",
                    "questionCount": 20,
                    "difficulty": {
                        "easy": 10,
                        "medium": 8,
                        "hard": 2
                    }
                },
                {
                    "id": "heian",
                    "name": "平安時代",
                    "period": "794年～1185年",
                    "description": "平安京と貴族文化の時代",
                    "color": "#FFB6C1",
                    "questionCount": 20,
                    "difficulty": {
                        "easy": 8,
                        "medium": 10,
                        "hard": 2
                    }
                }
            ]
        };
    }

    // デフォルト問題データ
    getDefaultQuestions(eraId) {
        const questionsMap = {
            "jomon": {
                "era": "jomon",
                "metadata": {
                    "totalQuestions": 20,
                    "difficulty": {"easy": 12, "medium": 6, "hard": 2},
                    "lastUpdated": "2024-01-15"
                },
                "questions": [
                    {
                        "id": "jomon_001",
                        "question": "縄文土器の特徴として正しいものはどれか。",
                        "choices": [
                            "縄目の文様がついている",
                            "表面がつるつるしている",
                            "金属で作られている",
                            "文字が書かれている"
                        ],
                        "correctAnswer": 0,
                        "answer": "縄目の文様がついている",
                        "explanation": "縄文土器は縄を押し付けて文様をつけた土器です。縄文時代の名前の由来でもあります。",
                        "difficulty": 1,
                        "category": "文化",
                        "tags": ["土器", "工芸", "基本"]
                    },
                    {
                        "id": "jomon_002",
                        "question": "縄文時代の主な生活様式は何か。",
                        "answer": "狩猟採集",
                        "explanation": "縄文時代の人々は動物を狩り、木の実や魚を採って生活していました。",
                        "difficulty": 1,
                        "category": "生活",
                        "tags": ["生活", "基本"]
                    }
                ]
            }
        };

        return questionsMap[eraId] || {
            "era": eraId,
            "metadata": {
                "totalQuestions": 5,
                "difficulty": {"easy": 3, "medium": 2, "hard": 0},
                "lastUpdated": "2024-01-15"
            },
            "questions": [
                {
                    "id": `${eraId}_001`,
                    "question": `${eraId}時代に関する問題です。`,
                    "answer": "サンプル回答",
                    "explanation": "これはサンプル問題です。",
                    "difficulty": 1,
                    "category": "一般",
                    "tags": ["基本"]
                }
            ]
        };
    }

    // 時代選択画面の表示
    async displayEraSelection() {
        const eraGrid = document.getElementById('eraGrid');
        if (!eraGrid) return;

        showLoading();

        try {
            const erasData = await this.loadEras();
            eraGrid.innerHTML = '';

            erasData.eras.forEach(era => {
                const eraCard = this.createEraCard(era);
                eraGrid.appendChild(eraCard);
            });

        } catch (error) {
            showError('時代データの読み込みに失敗しました');
            console.error('Error displaying era selection:', error);
        } finally {
            hideLoading();
        }
    }

    // 時代カードの作成
    createEraCard(era) {
        const card = document.createElement('div');
        card.className = 'era-card';
        card.style.borderLeftColor = era.color;
        
        // 進捗データの取得
        const progress = this.getEraProgress(era.id);
        const accuracy = progress.questionsAnswered > 0 
            ? Math.round((progress.correctAnswers / progress.questionsAnswered) * 100)
            : 0;

        card.innerHTML = `
            <div class="era-name">${era.name}</div>
            <div class="era-period">${era.period}</div>
            <div class="era-description">${era.description}</div>
            <div class="era-stats">
                <span>問題数: ${era.questionCount}</span>
                <span>正答率: ${accuracy}%</span>
            </div>
        `;

        card.addEventListener('click', () => {
            this.startEraQuiz(era.id);
        });

        return card;
    }

    // 時代別進捗の取得
    getEraProgress(eraId) {
        const progress = JSON.parse(localStorage.getItem('historyQuizProgress') || '{}');
        return progress[eraId] || {
            questionsAnswered: 0,
            correctAnswers: 0,
            lastStudied: null,
            masteryLevel: 'beginner'
        };
    }

    // クイズ開始
    startEraQuiz(eraId) {
        // URLパラメータでeraIdを渡してクイズ画面に遷移
        window.location.href = `quiz.html?era=${eraId}`;
    }

    // URLパラメータの取得
    getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
}

// グローバル変数
let dataLoader;

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    dataLoader = new DataLoader();
});

// 時代選択画面の読み込み
async function loadEraSelection() {
    if (dataLoader) {
        await dataLoader.displayEraSelection();
    }
}

// エクスポート
window.DataLoader = DataLoader;