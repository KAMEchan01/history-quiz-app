// クイズエンジン
class QuizEngine {
    constructor() {
        this.currentEra = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.startTime = null;
        this.isAnswered = false;
        this.consecutiveCorrect = 0;
    }

    // クイズの初期化
    async init(eraId) {
        try {
            showLoading();
            
            // データ読み込み
            const erasData = await dataLoader.loadEras();
            this.currentEra = erasData.eras.find(era => era.id === eraId);
            
            if (!this.currentEra) {
                throw new Error('指定された時代が見つかりません');
            }

            const questionsData = await dataLoader.loadQuestions(eraId);
            
            // 問題をシャッフルして20問選択
            this.questions = this.selectQuestions(questionsData.questions, 20);
            
            this.startTime = Date.now();
            this.updateHeader();
            this.displayQuestion();
            
            // BGM開始
            if (app) {
                app.toggleBGM(true);
            }
            
        } catch (error) {
            showError('クイズの初期化に失敗しました');
            console.error('Quiz initialization error:', error);
        } finally {
            hideLoading();
        }
    }

    // 問題選択（シャッフル）
    selectQuestions(allQuestions, count) {
        const shuffled = shuffleArray(allQuestions);
        return shuffled.slice(0, Math.min(count, shuffled.length));
    }

    // ヘッダー情報の更新
    updateHeader() {
        const eraTitle = document.getElementById('eraTitle');
        const questionProgress = document.getElementById('questionProgress');
        const currentScore = document.getElementById('currentScore');
        const totalQuestions = document.getElementById('totalQuestions');
        const progressFill = document.getElementById('progressFill');

        if (eraTitle) eraTitle.textContent = this.currentEra.name;
        if (questionProgress) {
            questionProgress.textContent = `${this.currentQuestionIndex + 1}/${this.questions.length}`;
        }
        if (currentScore) currentScore.textContent = this.score;
        if (totalQuestions) totalQuestions.textContent = this.questions.length;
        if (progressFill) {
            const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
            progressFill.style.width = `${progress}%`;
        }
    }

    // 問題表示
    displayQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.finishQuiz();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        this.isAnswered = false;

        // 問題番号と文章
        const questionNumber = document.getElementById('questionNumber');
        const questionText = document.getElementById('questionText');
        
        if (questionNumber) {
            questionNumber.textContent = this.currentQuestionIndex + 1;
        }
        if (questionText) {
            questionText.textContent = question.question;
        }

        // 選択肢がある場合
        if (question.choices && question.choices.length > 0) {
            this.displayChoices(question);
        } else {
            this.displayTextInput(question);
        }

        // 結果コンテナを隠す
        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
            resultContainer.classList.add('hidden');
        }

        this.updateHeader();
    }

    // 選択肢表示
    displayChoices(question) {
        const choicesContainer = document.getElementById('choicesContainer');
        const answerContainer = document.getElementById('answerContainer');

        if (choicesContainer) {
            choicesContainer.style.display = 'grid';
            choicesContainer.classList.remove('hidden');
            choicesContainer.innerHTML = '';

            question.choices.forEach((choice, index) => {
                const button = document.createElement('button');
                button.className = 'choice-button';
                button.dataset.choice = index;
                
                button.innerHTML = `
                    <span class="choice-label">${String.fromCharCode(65 + index)}</span>
                    <span class="choice-text">${choice}</span>
                `;
                
                button.addEventListener('click', () => {
                    if (!this.isAnswered) {
                        this.selectChoice(index);
                    }
                });
                
                choicesContainer.appendChild(button);
            });
        }

        if (answerContainer) {
            answerContainer.classList.add('hidden');
        }
    }

    // テキスト入力表示
    displayTextInput(question) {
        const choicesContainer = document.getElementById('choicesContainer');
        const answerContainer = document.getElementById('answerContainer');
        const answerInput = document.getElementById('answerInput');

        if (choicesContainer) {
            choicesContainer.classList.add('hidden');
        }

        if (answerContainer) {
            answerContainer.classList.remove('hidden');
            answerContainer.style.display = 'flex';
        }

        if (answerInput) {
            answerInput.value = '';
            answerInput.focus();
            
            // Enterキーで回答
            answerInput.onkeypress = (e) => {
                if (e.key === 'Enter' && !this.isAnswered) {
                    this.submitAnswer();
                }
            };
        }
    }

    // 選択肢選択
    selectChoice(choiceIndex) {
        const choiceButtons = document.querySelectorAll('.choice-button');
        choiceButtons.forEach(btn => btn.classList.remove('selected'));
        
        const selectedButton = document.querySelector(`[data-choice="${choiceIndex}"]`);
        if (selectedButton) {
            selectedButton.classList.add('selected');
        }

        // 自動で回答処理
        setTimeout(() => {
            if (!this.isAnswered) {
                this.checkAnswer(choiceIndex.toString());
            }
        }, 500);
    }

    // 回答送信
    submitAnswer() {
        console.log('submitAnswer called'); // デバッグ用
        const answerInput = document.getElementById('answerInput');
        if (!answerInput || this.isAnswered) {
            console.log('answerInput not found or already answered', {answerInput, isAnswered: this.isAnswered}); // デバッグ用
            return;
        }

        const userAnswer = answerInput.value.trim();
        console.log('User answer:', userAnswer); // デバッグ用
        if (!userAnswer) {
            showError('回答を入力してください');
            return;
        }

        this.checkAnswer(userAnswer);
    }

    // 回答チェック
    checkAnswer(userAnswer) {
        if (this.isAnswered) return;
        
        this.isAnswered = true;
        const question = this.questions[this.currentQuestionIndex];
        let isCorrect = false;

        // 選択肢問題の場合
        if (question.choices && question.choices.length > 0) {
            isCorrect = parseInt(userAnswer) === question.correctAnswer;
        } else {
            // テキスト入力問題の場合（部分一致でチェック）
            const correctAnswer = question.answer.toLowerCase().trim();
            const userAnswerNormalized = userAnswer.toLowerCase().trim();
            isCorrect = correctAnswer.includes(userAnswerNormalized) || 
                       userAnswerNormalized.includes(correctAnswer);
        }

        // スコア更新
        if (isCorrect) {
            this.score++;
            this.consecutiveCorrect++;
        } else {
            this.consecutiveCorrect = 0;
        }

        // 回答記録
        this.userAnswers.push({
            question: question,
            userAnswer: userAnswer,
            isCorrect: isCorrect,
            timeSpent: Date.now() - this.startTime
        });

        // 結果表示
        this.displayResult(isCorrect, question);
        
        // 効果音再生
        this.playResultSound(isCorrect);
    }

    // 結果表示
    displayResult(isCorrect, question) {
        const resultContainer = document.getElementById('resultContainer');
        const resultStatus = document.getElementById('resultStatus');
        const correctAnswer = document.getElementById('correctAnswer');
        const explanation = document.getElementById('explanation');

        if (resultContainer) {
            resultContainer.classList.remove('hidden');
        }

        if (resultStatus) {
            resultStatus.className = `result-status ${isCorrect ? 'correct' : 'incorrect'}`;
            const icon = isCorrect ? '✓' : '✗';
            const text = isCorrect ? '正解！' : '不正解';
            resultStatus.innerHTML = `
                <span class="result-icon">${icon}</span>
                <span class="result-text">${text}</span>
            `;
        }

        if (correctAnswer) {
            correctAnswer.textContent = `正解: ${question.answer}`;
        }

        if (explanation) {
            explanation.textContent = question.explanation || '';
        }

        // 選択肢のハイライト
        if (question.choices) {
            const choiceButtons = document.querySelectorAll('.choice-button');
            choiceButtons.forEach((btn, index) => {
                btn.style.pointerEvents = 'none';
                if (index === question.correctAnswer) {
                    btn.style.background = '#27AE60';
                    btn.style.color = 'white';
                } else if (btn.classList.contains('selected') && !isCorrect) {
                    btn.style.background = '#E74C3C';
                    btn.style.color = 'white';
                }
            });
        }

        this.updateHeader();
    }

    // 効果音再生
    playResultSound(isCorrect) {
        if (!app || !app.settings.soundEnabled) return;

        if (isCorrect) {
            // 連続正解数に応じて音声を変更
            let soundType = 'correct';
            if (this.consecutiveCorrect >= 20) {
                soundType = 'perfect';
            } else if (this.consecutiveCorrect >= 10) {
                soundType = 'streak';
            }
            
            app.playSound(soundType);
        }
    }

    // 次の問題へ
    nextQuestion() {
        this.currentQuestionIndex++;
        this.displayQuestion();
    }

    // クイズ終了
    finishQuiz() {
        const endTime = Date.now();
        const totalTime = Math.floor((endTime - this.startTime) / 1000);
        
        // 結果データ作成
        const results = {
            era: this.currentEra,
            score: this.score,
            totalQuestions: this.questions.length,
            accuracy: Math.round((this.score / this.questions.length) * 100),
            timeSpent: totalTime,
            answers: this.userAnswers,
            wrongAnswers: this.userAnswers.filter(answer => !answer.isCorrect)
        };

        // 統計更新
        this.updateStats(results);
        
        // BGM停止
        if (app) {
            app.toggleBGM(false);
        }

        // 結果画面に遷移
        localStorage.setItem('quizResults', JSON.stringify(results));
        window.location.href = 'result.html';
    }

    // 統計更新
    updateStats(results) {
        if (!app) return;

        app.stats.totalQuestionsAnswered += results.totalQuestions;
        app.stats.correctAnswers += results.score;
        app.stats.overallAccuracy = Math.round(
            (app.stats.correctAnswers / app.stats.totalQuestionsAnswered) * 100
        );
        app.stats.totalStudyTimeMinutes += Math.floor(results.timeSpent / 60);
        
        // 連続学習日数の更新（簡易版）
        const today = new Date().toDateString();
        const lastStudyDate = localStorage.getItem('lastStudyDate');
        if (lastStudyDate !== today) {
            app.stats.studyStreak++;
            localStorage.setItem('lastStudyDate', today);
        }

        app.saveStats();

        // 時代別進捗の更新
        const progress = JSON.parse(localStorage.getItem('historyQuizProgress') || '{}');
        progress[results.era.id] = {
            questionsAnswered: (progress[results.era.id]?.questionsAnswered || 0) + results.totalQuestions,
            correctAnswers: (progress[results.era.id]?.correctAnswers || 0) + results.score,
            lastStudied: new Date().toISOString(),
            masteryLevel: this.calculateMasteryLevel(results.accuracy)
        };
        localStorage.setItem('historyQuizProgress', JSON.stringify(progress));
    }

    // 習熟度計算
    calculateMasteryLevel(accuracy) {
        if (accuracy >= 90) return 'master';
        if (accuracy >= 70) return 'good';
        if (accuracy >= 50) return 'average';
        return 'beginner';
    }
}

// グローバル変数
let quizEngine;

// 初期化
async function initQuiz() {
    const eraId = dataLoader.getUrlParameter('era');
    if (!eraId) {
        showError('時代が指定されていません');
        setTimeout(() => goToEraSelection(), 2000);
        return;
    }

    quizEngine = new QuizEngine();
    await quizEngine.init(eraId);
}

// グローバル関数
function submitAnswer() {
    if (quizEngine) {
        quizEngine.submitAnswer();
    }
}

function nextQuestion() {
    if (quizEngine) {
        quizEngine.nextQuestion();
    }
}

// エクスポート
window.QuizEngine = QuizEngine;