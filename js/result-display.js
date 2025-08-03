// 結果表示機能
class ResultDisplay {
    constructor() {
        this.results = null;
        this.messageTemplates = {
            perfect: {
                icon: '🎉',
                messages: [
                    'パーフェクト！素晴らしい成績です！',
                    '完璧です！歴史マスターですね！',
                    '全問正解！この調子で頑張りましょう！'
                ]
            },
            excellent: {
                icon: '🌟',
                messages: [
                    '素晴らしい成績です！',
                    'とても良くできました！',
                    '優秀な成果です！'
                ]
            },
            good: {
                icon: '👍',
                messages: [
                    'よく頑張りました！',
                    '良い結果です！',
                    'この調子で続けましょう！'
                ]
            },
            average: {
                icon: '📚',
                messages: [
                    'もう少し頑張りましょう！',
                    '復習して再挑戦してみましょう！',
                    '基礎をしっかり固めましょう！'
                ]
            },
            poor: {
                icon: '💪',
                messages: [
                    '諦めずに頑張りましょう！',
                    'しっかり復習して再挑戦！',
                    '基礎から丁寧に学習しましょう！'
                ]
            }
        };
    }

    // 結果表示の初期化
    async init() {
        try {
            // 結果データの読み込み
            const resultsData = localStorage.getItem('quizResults');
            if (!resultsData) {
                showError('結果データが見つかりません');
                setTimeout(() => goHome(), 2000);
                return;
            }

            this.results = JSON.parse(resultsData);
            this.displayResults();
            this.setupEventListeners();
            
            // 結果音再生
            this.playResultSound();
            
            // パーフェクト時のエフェクト
            if (this.results.accuracy === 100) {
                this.showCelebrationEffect();
            }

        } catch (error) {
            console.error('Result display error:', error);
            showError('結果の表示中にエラーが発生しました');
        }
    }

    // 結果表示
    displayResults() {
        // ヘッダー情報
        const eraName = document.getElementById('eraName');
        if (eraName) {
            eraName.textContent = this.results.era.name;
        }

        // スコア表示
        const finalScore = document.getElementById('finalScore');
        const scorePercentage = document.getElementById('scorePercentage');
        
        if (finalScore) {
            finalScore.textContent = this.results.score;
        }
        if (scorePercentage) {
            scorePercentage.textContent = `${this.results.accuracy}%`;
        }

        // 結果メッセージ
        this.displayResultMessage();

        // 詳細統計
        this.displayDetailedStats();

        // 間違えた問題
        this.displayWrongAnswers();
    }

    // 結果メッセージ表示
    displayResultMessage() {
        const resultMessage = document.getElementById('resultMessage');
        if (!resultMessage) return;

        const messageIcon = resultMessage.querySelector('.message-icon');
        const messageText = resultMessage.querySelector('.message-text');

        let category;
        if (this.results.accuracy === 100) {
            category = 'perfect';
        } else if (this.results.accuracy >= 80) {
            category = 'excellent';
        } else if (this.results.accuracy >= 60) {
            category = 'good';
        } else if (this.results.accuracy >= 40) {
            category = 'average';
        } else {
            category = 'poor';
        }

        const template = this.messageTemplates[category];
        const randomMessage = template.messages[Math.floor(Math.random() * template.messages.length)];

        if (messageIcon) {
            messageIcon.textContent = template.icon;
        }
        if (messageText) {
            messageText.textContent = randomMessage;
        }
    }

    // 詳細統計表示
    displayDetailedStats() {
        const correctCount = document.getElementById('correctCount');
        const incorrectCount = document.getElementById('incorrectCount');
        const accuracyRate = document.getElementById('accuracyRate');
        const studyTime = document.getElementById('studyTime');

        if (correctCount) {
            correctCount.textContent = `${this.results.score}問`;
        }
        if (incorrectCount) {
            incorrectCount.textContent = `${this.results.totalQuestions - this.results.score}問`;
        }
        if (accuracyRate) {
            accuracyRate.textContent = `${this.results.accuracy}%`;
        }
        if (studyTime) {
            studyTime.textContent = formatTime(this.results.timeSpent);
        }
    }

    // 間違えた問題表示
    displayWrongAnswers() {
        const wrongAnswersSection = document.getElementById('wrongAnswersSection');
        const wrongAnswersList = document.getElementById('wrongAnswersList');

        if (!this.results.wrongAnswers || this.results.wrongAnswers.length === 0) {
            if (wrongAnswersSection) {
                wrongAnswersSection.style.display = 'none';
            }
            return;
        }

        if (wrongAnswersList) {
            wrongAnswersList.innerHTML = '';
            
            this.results.wrongAnswers.forEach((wrongAnswer, index) => {
                const item = this.createWrongAnswerItem(wrongAnswer, index);
                wrongAnswersList.appendChild(item);
            });
        }
    }

    // 間違えた問題アイテム作成
    createWrongAnswerItem(wrongAnswer, index) {
        const item = document.createElement('div');
        item.className = 'wrong-answer-item';
        item.style.cssText = `
            background: var(--card-background);
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            cursor: pointer;
            transition: var(--transition);
        `;

        item.innerHTML = `
            <div class="wrong-question-number" style="font-size: 0.8rem; color: var(--primary-color); font-weight: bold; margin-bottom: 0.5rem;">
                問題 ${index + 1}
            </div>
            <div class="wrong-question-text" style="margin-bottom: 0.5rem; font-weight: bold;">
                ${wrongAnswer.question.question}
            </div>
            <div class="wrong-answer-details" style="font-size: 0.9rem;">
                <div style="color: #E74C3C; margin-bottom: 0.25rem;">
                    ❌ あなたの回答: ${wrongAnswer.userAnswer}
                </div>
                <div style="color: #27AE60; margin-bottom: 0.5rem;">
                    ✅ 正解: ${wrongAnswer.question.answer}
                </div>
                <div style="color: var(--text-color); opacity: 0.8; line-height: 1.5;">
                    ${wrongAnswer.question.explanation}
                </div>
            </div>
        `;

        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-2px)';
            item.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = '';
            item.style.boxShadow = '';
        });

        return item;
    }

    // イベントリスナー設定
    setupEventListeners() {
        // アクションボタンのイベント設定は既にHTMLで設定済み
    }

    // 結果音再生
    playResultSound() {
        if (!app || !app.settings.soundEnabled || !app.audioInitialized) return;

        // 成績に応じて再生する音を選択
        let soundType = 'correct';
        if (this.results.accuracy === 100) {
            soundType = 'perfect';
        } else if (this.results.accuracy >= 80) {
            soundType = 'streak';
        }
        
        // 生成音声を再生
        app.playGeneratedSound(soundType);
    }

    // お祝いエフェクト
    showCelebrationEffect() {
        const celebrationEffects = document.getElementById('celebrationEffects');
        if (!celebrationEffects) return;

        // 簡単な紙吹雪エフェクト
        celebrationEffects.innerHTML = '';
        
        for (let i = 0; i < 20; i++) {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: absolute;
                width: 10px;
                height: 10px;
                background: ${this.getRandomColor()};
                top: -10px;
                left: ${Math.random() * 100}%;
                animation: confetti-fall 3s linear forwards;
                border-radius: 50%;
            `;
            
            celebrationEffects.appendChild(confetti);
        }

        // アニメーション定義
        const style = document.createElement('style');
        style.textContent = `
            @keyframes confetti-fall {
                to {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        // 3秒後にクリーンアップ
        setTimeout(() => {
            celebrationEffects.innerHTML = '';
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 3000);
    }

    // ランダムカラー取得
    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 学習ヒントの表示
    displayLearningTips() {
        // 成績に応じた学習アドバイスを表示
        const tipsSection = document.querySelector('.tips-section');
        if (!tipsSection) return;

        let tips = [];
        
        if (this.results.accuracy < 50) {
            tips = [
                '基礎的な年代を覚えることから始めましょう',
                '歴史の流れを理解することが重要です',
                '繰り返し学習で記憶を定着させましょう'
            ];
        } else if (this.results.accuracy < 80) {
            tips = [
                '細かい事実も含めて覚えていきましょう',
                '時代と時代のつながりを意識しましょう',
                '間違えた問題を重点的に復習しましょう'
            ];
        } else {
            tips = [
                'この調子で他の時代も挑戦してみましょう',
                '歴史の関連性をより深く理解しましょう',
                '継続的な学習で知識を維持しましょう'
            ];
        }

        // ヒントを動的に更新
        const tipItems = tipsSection.querySelectorAll('.tip-item .tip-text');
        tipItems.forEach((item, index) => {
            if (tips[index]) {
                item.textContent = tips[index];
            }
        });
    }
}

// グローバル関数
let resultDisplay;

// 結果表示初期化
async function displayResults() {
    resultDisplay = new ResultDisplay();
    await resultDisplay.init();
}

// アクション関数
function retryQuiz() {
    if (resultDisplay && resultDisplay.results) {
        window.location.href = `quiz.html?era=${resultDisplay.results.era.id}`;
    }
}

function reviewWrongAnswers() {
    if (resultDisplay && resultDisplay.results && resultDisplay.results.wrongAnswers.length > 0) {
        // 間違えた問題のみでクイズを作成
        const wrongQuestions = resultDisplay.results.wrongAnswers.map(wa => wa.question);
        localStorage.setItem('reviewQuestions', JSON.stringify(wrongQuestions));
        window.location.href = `quiz.html?era=${resultDisplay.results.era.id}&mode=review`;
    }
}

// エクスポート
window.ResultDisplay = ResultDisplay;