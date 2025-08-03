// メインアプリケーション
class HistoryQuizApp {
    constructor() {
        this.currentTheme = 'ocean';
        this.settings = this.loadSettings();
        this.stats = this.loadStats();
        this.progress = this.loadProgress();
        this.oceanAudioContext = null;
        this.oceanSource = null;
        this.oceanGain = null;
        this.audioInitialized = false;
        this.correctSoundFiles = [
            '決定ボタンを押す22.mp3',
            '決定ボタンを押す23.mp3',
            '決定ボタンを押す24.mp3',
            '決定ボタンを押す27.mp3',
            '決定ボタンを押す37.mp3',
            '決定ボタンを押す39.mp3',
            '決定ボタンを押す41 (1).mp3',
            '決定ボタンを押す41.mp3'
        ];
        this.bgmFiles = {
            ocean: [
                '海岸3.mp3',
                '海岸4.mp3'
            ],
            night: [
                '街を襲う集中豪雨.mp3',
                '雷雨 (1).mp3',
                '雷雨.mp3'
            ]
        };
        this.currentBGMAudio = null;
        this.init();
    }

    init() {
        this.applyTheme(this.settings.theme);
        this.updateStats();
        this.setupEventListeners();
        this.setupAudioInitialization();
        this.updateAudioStatus();
        this.setupPageUnloadHandlers();
    }

    // ページ離脱時の処理
    setupPageUnloadHandlers() {
        // ページを離れる時にBGMを停止
        window.addEventListener('beforeunload', () => {
            this.stopBGM();
        });

        // ページが非表示になった時にBGMを停止
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.stopBGM();
            }
        });

        // ページフォーカスが外れた時にBGMを停止
        window.addEventListener('blur', () => {
            this.stopBGM();
        });
    }

    // 音声初期化のセットアップ
    setupAudioInitialization() {
        // ユーザーが最初にクリックした時に音声を有効化
        const enableAudio = () => {
            if (!this.audioInitialized) {
                this.initializeAudio();
                this.audioInitialized = true;
                this.updateAudioStatus();
                document.removeEventListener('click', enableAudio);
                document.removeEventListener('touchstart', enableAudio);
                console.log('Audio initialized by user interaction');
            }
        };

        document.addEventListener('click', enableAudio);
        document.addEventListener('touchstart', enableAudio);
    }

    // 音声初期化
    initializeAudio() {
        // AudioContextを作成してテスト音を再生（無音）
        try {
            const testContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = testContext.createOscillator();
            const gain = testContext.createGain();
            
            oscillator.connect(gain);
            gain.connect(testContext.destination);
            
            gain.gain.setValueAtTime(0, testContext.currentTime);
            oscillator.frequency.setValueAtTime(440, testContext.currentTime);
            
            oscillator.start();
            oscillator.stop(testContext.currentTime + 0.01);
            
            testContext.close();
            this.updateAudioStatus();
        } catch (error) {
            console.log('Audio initialization failed:', error);
        }
    }

    // 音声ステータス更新
    updateAudioStatus() {
        const audioStatus = document.getElementById('audioStatus');
        if (audioStatus) {
            if (this.audioInitialized && this.settings.soundEnabled) {
                audioStatus.textContent = '🔊';
                audioStatus.style.color = '#27AE60';
            } else if (this.settings.soundEnabled) {
                audioStatus.textContent = '🔇';
                audioStatus.style.color = '#E74C3C';
            } else {
                audioStatus.textContent = '';
            }
        }
    }

    // テスト用音声再生
    testAudio() {
        console.log('Testing audio...');
        console.log('Audio initialized:', this.audioInitialized);
        console.log('Sound enabled:', this.settings.soundEnabled);
        
        if (!this.audioInitialized) {
            console.log('Initializing audio...');
            this.initializeAudio();
            this.audioInitialized = true;
        }
        
        // ランダム正解音をテスト再生
        this.playRandomCorrectSound();
    }

    // BGMテスト
    testBGM() {
        console.log('Testing BGM...');
        console.log('Audio initialized:', this.audioInitialized);
        console.log('Sound enabled:', this.settings.soundEnabled);
        console.log('Current theme:', this.currentTheme);
        
        if (!this.audioInitialized) {
            console.log('Initializing audio...');
            this.initializeAudio();
            this.audioInitialized = true;
        }
        
        // BGMの再生/停止を切り替え
        const isPlaying = (this.currentBGMAudio && !this.currentBGMAudio.paused) || 
                         (this.oceanSource);
        
        if (isPlaying) {
            console.log('Stopping all BGM...');
            this.stopBGM();
        } else {
            console.log('Starting theme BGM...');
            this.playThemeBGM();
        }
    }

    // すべての音声を停止
    stopAllAudio() {
        console.log('Stopping all audio...');
        this.stopBGM();
        
        // 効果音も停止（もしあれば）
        document.querySelectorAll('audio').forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        
        console.log('All audio stopped');
    }

    // 設定の読み込み
    loadSettings() {
        const defaultSettings = {
            theme: 'ocean',
            soundEnabled: true,
            bgmVolume: 0.3,
            effectVolume: 0.7
        };
        
        const saved = localStorage.getItem('historyQuizSettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }

    // 統計の読み込み
    loadStats() {
        const defaultStats = {
            totalQuestionsAnswered: 0,
            correctAnswers: 0,
            overallAccuracy: 0,
            studyStreak: 0,
            totalStudyTimeMinutes: 0
        };
        
        const saved = localStorage.getItem('historyQuizStats');
        return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    }

    // 進捗データの読み込み
    loadProgress() {
        const defaultProgress = {
            dailyStats: {}, // 日別統計 { "2025-08-03": { questionsAnswered: 5, correctAnswers: 4, studyTimeMinutes: 15 } }
            eraStats: {}, // 時代別統計 { "jomon": { totalQuestions: 20, correctAnswers: 15, wrongQuestions: new Set([1, 5]) } }
            wrongQuestions: {}, // 間違えた問題 { "jomon": new Set([1, 5, 10]), "yayoi": new Set([3, 7]) }
            lastStudyDate: null, // 最後の学習日
            consecutiveStudyDays: 0, // 連続学習日数
            totalStudySessions: 0 // 総学習セッション数
        };
        
        const saved = localStorage.getItem('historyQuizProgress');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Setオブジェクトを復元
            if (parsed.wrongQuestions) {
                Object.keys(parsed.wrongQuestions).forEach(era => {
                    parsed.wrongQuestions[era] = new Set(parsed.wrongQuestions[era]);
                });
            }
            if (parsed.eraStats) {
                Object.keys(parsed.eraStats).forEach(era => {
                    if (parsed.eraStats[era].wrongQuestions) {
                        parsed.eraStats[era].wrongQuestions = new Set(parsed.eraStats[era].wrongQuestions);
                    }
                });
            }
            return { ...defaultProgress, ...parsed };
        }
        return defaultProgress;
    }

    // 設定の保存
    saveSettings() {
        localStorage.setItem('historyQuizSettings', JSON.stringify(this.settings));
    }

    // 統計の保存
    saveStats() {
        localStorage.setItem('historyQuizStats', JSON.stringify(this.stats));
    }

    // 進捗データの保存
    saveProgress() {
        const progressToSave = { ...this.progress };
        // Setオブジェクトを配列に変換して保存
        if (progressToSave.wrongQuestions) {
            Object.keys(progressToSave.wrongQuestions).forEach(era => {
                progressToSave.wrongQuestions[era] = Array.from(progressToSave.wrongQuestions[era]);
            });
        }
        if (progressToSave.eraStats) {
            Object.keys(progressToSave.eraStats).forEach(era => {
                if (progressToSave.eraStats[era].wrongQuestions) {
                    progressToSave.eraStats[era].wrongQuestions = Array.from(progressToSave.eraStats[era].wrongQuestions);
                }
            });
        }
        localStorage.setItem('historyQuizProgress', JSON.stringify(progressToSave));
    }

    // テーマの適用
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const wasPlaying = this.currentBGMAudio && !this.currentBGMAudio.paused;
        
        this.currentTheme = theme;
        this.settings.theme = theme;
        this.saveSettings();
        
        // BGMが再生中だった場合は新しいテーマのBGMに切り替え
        if (wasPlaying && this.audioInitialized) {
            this.playThemeBGM();
        }
    }

    // 統計の更新
    updateStats() {
        // メインページの統計カード更新
        const todayQuestionsEl = document.getElementById('todayQuestions');
        const totalQuestionsEl = document.getElementById('totalQuestions');
        const studyStreakEl = document.getElementById('studyStreak');
        const overallAccuracyEl = document.getElementById('overallAccuracy');

        if (todayQuestionsEl) {
            todayQuestionsEl.textContent = this.getTodayQuestionCount();
        }
        if (totalQuestionsEl) {
            totalQuestionsEl.textContent = this.stats.totalQuestionsAnswered || 0;
        }
        if (studyStreakEl) {
            studyStreakEl.textContent = this.progress.consecutiveStudyDays || 0;
        }
        if (overallAccuracyEl) {
            const rate = this.stats.totalQuestionsAnswered > 0 
                ? Math.round((this.stats.correctAnswers / this.stats.totalQuestionsAnswered) * 100)
                : 0;
            overallAccuracyEl.textContent = `${rate}%`;
        }

        // レガシー要素の更新（他のページ用）
        const elements = {
            totalQuestions: document.getElementById('totalQuestions'),
            correctRate: document.getElementById('correctRate'),
            studyStreak: document.getElementById('studyStreak')
        };

        if (elements.totalQuestions && elements.totalQuestions !== totalQuestionsEl) {
            elements.totalQuestions.textContent = this.stats.totalQuestionsAnswered || '-';
        }
        if (elements.correctRate) {
            const rate = this.stats.totalQuestionsAnswered > 0 
                ? Math.round((this.stats.correctAnswers / this.stats.totalQuestionsAnswered) * 100)
                : 0;
            elements.correctRate.textContent = rate > 0 ? `${rate}%` : '-';
        }
        if (elements.studyStreak && elements.studyStreak !== studyStreakEl) {
            elements.studyStreak.textContent = this.progress.consecutiveStudyDays || '-';
        }
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // テーマ切り替え
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                themeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                const theme = option.dataset.theme;
                this.applyTheme(theme);
            });
        });

        // 音響設定
        const soundToggle = document.getElementById('soundEnabled');
        if (soundToggle) {
            soundToggle.checked = this.settings.soundEnabled;
            soundToggle.addEventListener('change', (e) => {
                this.settings.soundEnabled = e.target.checked;
                this.saveSettings();
                this.updateAudioStatus();
                
                // 音声をOFFにした場合はすべての音声を停止
                if (!e.target.checked) {
                    this.stopBGM();
                } else {
                    // 音声をONにした場合は音声初期化
                    if (!this.audioInitialized) {
                        this.initializeAudio();
                        this.audioInitialized = true;
                    }
                }
            });
        }

        const bgmVolume = document.getElementById('bgmVolume');
        if (bgmVolume) {
            bgmVolume.value = this.settings.bgmVolume * 100;
            bgmVolume.addEventListener('input', (e) => {
                this.settings.bgmVolume = e.target.value / 100;
                this.saveSettings();
                this.updateBGMVolume();
            });
        }

        const effectVolume = document.getElementById('effectVolume');
        if (effectVolume) {
            effectVolume.value = this.settings.effectVolume * 100;
            effectVolume.addEventListener('input', (e) => {
                this.settings.effectVolume = e.target.value / 100;
                this.saveSettings();
            });
        }
    }

    // BGM音量の更新
    updateBGMVolume() {
        // 音声ファイルBGMの音量更新
        if (this.currentBGMAudio) {
            this.currentBGMAudio.volume = this.settings.bgmVolume;
        }
        
        // 生成音BGMの音量更新
        this.updateOceanVolume();
    }

    // 効果音再生
    playSound(soundType, condition = null) {
        if (!this.settings.soundEnabled || !this.audioInitialized) {
            console.log('Sound disabled or not initialized');
            return;
        }

        // 正解音の場合はランダム音声ファイルを再生
        if (soundType === 'correct') {
            this.playRandomCorrectSound();
        } else {
            // その他の音は生成音を再生
            this.playGeneratedSound(soundType);
        }
    }

    // ランダム正解音再生
    playRandomCorrectSound() {
        try {
            // ランダムに音声ファイルを選択
            const randomIndex = Math.floor(Math.random() * this.correctSoundFiles.length);
            const selectedFile = this.correctSoundFiles[randomIndex];
            
            // ページの場所に応じてパスを調整
            const basePath = window.location.pathname.includes('/pages/') ? '../' : '';
            const audioPath = `${basePath}assets/audio music/${selectedFile}`;
            
            console.log('Playing random correct sound:', selectedFile);
            console.log('Audio path:', audioPath);
            
            // 音声ファイルを動的に作成して再生
            const audio = new Audio(audioPath);
            audio.volume = this.settings.effectVolume;
            
            audio.play().catch(e => {
                console.log('Random sound file play failed, using generated sound:', e);
                this.playGeneratedSound('correct');
            });
            
            // 再生終了後にオブジェクトを解放
            audio.addEventListener('ended', () => {
                audio.src = '';
            });
            
        } catch (error) {
            console.error('Error playing random correct sound:', error);
            this.playGeneratedSound('correct');
        }
    }

    // 生成音声再生
    playGeneratedSound(soundType) {
        if (!this.settings.soundEnabled) {
            console.log('Sound disabled, not playing');
            return;
        }

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('AudioContext created:', audioContext.state);
            
            switch (soundType) {
                case 'correct':
                    this.playCorrectSound(audioContext);
                    break;
                case 'streak':
                    this.playStreakSound(audioContext);
                    break;
                case 'perfect':
                    this.playPerfectSound(audioContext);
                    break;
                default:
                    this.playCorrectSound(audioContext);
            }
        } catch (error) {
            console.error('Failed to create AudioContext:', error);
        }
    }

    // 正解音（基本）
    playCorrectSound(audioContext) {
        try {
            console.log('Playing correct sound...');
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.settings.effectVolume * 0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            console.log('Volume setting:', this.settings.effectVolume);
            console.log('AudioContext time:', audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.5);
            
            console.log('Sound playback started');
        } catch (error) {
            console.error('Error playing correct sound:', error);
        }
    }

    // 連続正解音
    playStreakSound(audioContext) {
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        notes.forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const startTime = audioContext.currentTime + i * 0.1;
            oscillator.frequency.setValueAtTime(freq, startTime);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.settings.effectVolume * 0.2, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.2);
        });
    }

    // パーフェクト音
    playPerfectSound(audioContext) {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const startTime = audioContext.currentTime + i * 0.08;
            oscillator.frequency.setValueAtTime(freq, startTime);
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(this.settings.effectVolume * 0.25, startTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.3);
        });
    }

    // BGM再生/停止
    toggleBGM(play = true) {
        if (!this.settings.soundEnabled || !this.audioInitialized) {
            this.stopBGM();
            return;
        }

        if (play) {
            this.playThemeBGM();
        } else {
            this.stopBGM();
        }
    }

    // テーマBGM再生
    playThemeBGM() {
        try {
            // 現在のテーマに応じてBGMファイルを選択
            const themeFiles = this.bgmFiles[this.currentTheme] || this.bgmFiles['ocean'];
            const randomIndex = Math.floor(Math.random() * themeFiles.length);
            const selectedFile = themeFiles[randomIndex];
            
            // テーマ名をフォルダー名に変換
            const themeFolder = this.currentTheme === 'ocean' ? '沖縄の海' : '夜の雨';
            const basePath = window.location.pathname.includes('/pages/') ? '../' : '';
            const audioPath = `${basePath}assets/BGM/${themeFolder}/${selectedFile}`;
            
            console.log('Playing theme BGM:', selectedFile);
            console.log('Theme:', this.currentTheme);
            console.log('Audio path:', audioPath);
            
            // 既存のBGMを停止
            this.stopBGM();
            
            // 新しいBGMを再生
            this.currentBGMAudio = new Audio(audioPath);
            this.currentBGMAudio.volume = this.settings.bgmVolume;
            this.currentBGMAudio.loop = true;
            
            this.currentBGMAudio.play().catch(e => {
                console.log('Theme BGM file play failed, using generated ocean sound:', e);
                this.playOceanSound();
            });
            
        } catch (error) {
            console.error('Error playing theme BGM:', error);
            this.playOceanSound();
        }
    }

    // BGM停止
    stopBGM() {
        // 音声ファイルBGMを停止
        if (this.currentBGMAudio) {
            this.currentBGMAudio.pause();
            this.currentBGMAudio.src = '';
            this.currentBGMAudio = null;
        }
        
        // 生成音BGMを停止
        this.stopOceanSound();
    }

    // 波の音生成・再生
    playOceanSound() {
        if (this.oceanAudioContext) {
            this.stopOceanSound();
        }

        this.oceanAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.oceanGain = this.oceanAudioContext.createGain();
        this.oceanGain.connect(this.oceanAudioContext.destination);
        this.oceanGain.gain.setValueAtTime(this.settings.bgmVolume * 0.3, this.oceanAudioContext.currentTime);

        // 波の音の生成（ホワイトノイズベース）
        this.createOceanWaves();
    }

    // 波の音作成
    createOceanWaves() {
        // ホワイトノイズ生成
        const bufferSize = this.oceanAudioContext.sampleRate * 2; // 2秒分
        const buffer = this.oceanAudioContext.createBuffer(1, bufferSize, this.oceanAudioContext.sampleRate);
        const data = buffer.getChannelData(0);

        // ランダムノイズ生成
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }

        // フィルター設定（低周波を強調して波っぽく）
        const filter = this.oceanAudioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.oceanAudioContext.currentTime);
        filter.Q.setValueAtTime(1, this.oceanAudioContext.currentTime);

        // エンベロープ用のゲイン
        const envelope = this.oceanAudioContext.createGain();
        
        // 音源作成
        this.oceanSource = this.oceanAudioContext.createBufferSource();
        this.oceanSource.buffer = buffer;
        this.oceanSource.loop = true;
        
        // 接続
        this.oceanSource.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.oceanGain);

        // 波のようなエンベロープ効果
        const now = this.oceanAudioContext.currentTime;
        envelope.gain.setValueAtTime(0.2, now);
        
        // 波の満ち引きパターン
        const wavePattern = () => {
            const currentTime = this.oceanAudioContext.currentTime;
            envelope.gain.cancelScheduledValues(currentTime);
            envelope.gain.setValueAtTime(envelope.gain.value, currentTime);
            
            // 3-5秒の周期で音量を変化
            const period = 3 + Math.random() * 2;
            const target = 0.1 + Math.random() * 0.3;
            envelope.gain.linearRampToValueAtTime(target, currentTime + period);
            
            setTimeout(wavePattern, period * 1000);
        };

        this.oceanSource.start();
        wavePattern();
    }

    // 波の音停止
    stopOceanSound() {
        if (this.oceanSource) {
            this.oceanSource.stop();
            this.oceanSource = null;
        }
        if (this.oceanAudioContext) {
            this.oceanAudioContext.close();
            this.oceanAudioContext = null;
        }
        this.oceanGain = null;
    }

    // 今日の日付を取得（YYYY-MM-DD形式）
    getTodayString() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    // 今日の統計を更新
    updateDailyStats(questionsAnswered, correctAnswers, studyTimeMinutes) {
        const todayString = this.getTodayString();
        
        if (!this.progress.dailyStats[todayString]) {
            this.progress.dailyStats[todayString] = {
                questionsAnswered: 0,
                correctAnswers: 0,
                studyTimeMinutes: 0
            };
        }
        
        const todayStats = this.progress.dailyStats[todayString];
        todayStats.questionsAnswered += questionsAnswered;
        todayStats.correctAnswers += correctAnswers;
        todayStats.studyTimeMinutes += studyTimeMinutes;
        
        this.saveProgress();
    }

    // 今日解いた問題数を取得
    getTodayQuestionCount() {
        const todayString = this.getTodayString();
        return this.progress.dailyStats[todayString]?.questionsAnswered || 0;
    }

    // 連続学習日数を更新
    updateStudyStreak() {
        const todayString = this.getTodayString();
        const lastStudyDate = this.progress.lastStudyDate;
        
        if (!lastStudyDate) {
            // 初回学習
            this.progress.consecutiveStudyDays = 1;
            this.progress.lastStudyDate = todayString;
        } else if (lastStudyDate === todayString) {
            // 同日の継続学習（連続日数は変更なし）
            return;
        } else {
            const lastDate = new Date(lastStudyDate);
            const today = new Date(todayString);
            const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                // 連続学習
                this.progress.consecutiveStudyDays++;
            } else {
                // 学習が途切れた
                this.progress.consecutiveStudyDays = 1;
            }
            
            this.progress.lastStudyDate = todayString;
        }
        
        this.saveProgress();
    }

    // 時代別統計を更新
    updateEraStats(eraId, questionsAnswered, correctAnswers, wrongQuestionIds = []) {
        if (!this.progress.eraStats[eraId]) {
            this.progress.eraStats[eraId] = {
                totalQuestions: 0,
                correctAnswers: 0,
                wrongQuestions: new Set()
            };
        }
        
        const eraStats = this.progress.eraStats[eraId];
        eraStats.totalQuestions += questionsAnswered;
        eraStats.correctAnswers += correctAnswers;
        
        // 間違えた問題IDを追加
        wrongQuestionIds.forEach(questionId => {
            eraStats.wrongQuestions.add(questionId);
        });
        
        // 全体の間違えた問題も更新
        if (!this.progress.wrongQuestions[eraId]) {
            this.progress.wrongQuestions[eraId] = new Set();
        }
        wrongQuestionIds.forEach(questionId => {
            this.progress.wrongQuestions[eraId].add(questionId);
        });
        
        this.saveProgress();
    }

    // 時代別正答率を取得
    getEraAccuracy(eraId) {
        const eraStats = this.progress.eraStats[eraId];
        if (!eraStats || eraStats.totalQuestions === 0) {
            return 0;
        }
        return Math.round((eraStats.correctAnswers / eraStats.totalQuestions) * 100);
    }

    // 時代別学習済み問題数を取得
    getEraQuestionCount(eraId) {
        return this.progress.eraStats[eraId]?.totalQuestions || 0;
    }

    // 間違えた問題のIDリストを取得
    getWrongQuestions(eraId) {
        return this.progress.wrongQuestions[eraId] ? Array.from(this.progress.wrongQuestions[eraId]) : [];
    }

    // 間違えた問題をクリア（正解した場合）
    clearWrongQuestion(eraId, questionId) {
        if (this.progress.wrongQuestions[eraId]) {
            this.progress.wrongQuestions[eraId].delete(questionId);
        }
        if (this.progress.eraStats[eraId]?.wrongQuestions) {
            this.progress.eraStats[eraId].wrongQuestions.delete(questionId);
        }
        this.saveProgress();
    }

    // BGM音量更新（波の音にも適用）
    updateOceanVolume() {
        if (this.oceanGain) {
            this.oceanGain.gain.setValueAtTime(this.settings.bgmVolume * 0.3, this.oceanAudioContext.currentTime);
        }
    }
}

// グローバル関数
let app;

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    app = new HistoryQuizApp();
    loadSavedPhoto();
});

// ナビゲーション関数
function startQuiz() {
    // 音声を有効化
    if (app && !app.audioInitialized) {
        app.initializeAudio();
        app.audioInitialized = true;
        console.log('Audio initialized by start quiz button');
    }
    window.location.href = 'pages/era-selection.html';
}

function goHome() {
    window.location.href = '../index.html';
}

function goToEraSelection() {
    window.location.href = 'era-selection.html';
}

// 設定モーダル
function openSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeSettings() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// モーダル外クリックで閉じる
document.addEventListener('click', (e) => {
    const settingsModal = document.getElementById('settingsModal');
    const progressModal = document.getElementById('progressModal');
    
    if (settingsModal && e.target === settingsModal) {
        closeSettings();
    }
    if (progressModal && e.target === progressModal) {
        closeProgress();
    }
});

// エラーハンドリング
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #E74C3C;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        max-width: 300px;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// 成功メッセージ
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27AE60;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 1001;
        max-width: 300px;
    `;
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

// ローディング表示/非表示
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// ユーティリティ関数
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds.toString().padStart(2, '0')}秒`;
}

// 沖縄写真アップロード機能
function selectPhoto() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.click();
    }
}

function loadSavedPhoto() {
    const photoInput = document.getElementById('photoInput');
    const okinawaPhoto = document.getElementById('okinawaPhoto');
    const photoContainer = document.querySelector('.okinawa-photo-container');
    
    if (!photoInput || !okinawaPhoto || !photoContainer) return;
    
    // 保存された写真を読み込み
    const savedPhoto = localStorage.getItem('okinawaPhoto');
    if (savedPhoto) {
        displayPhoto(savedPhoto);
    }
    
    // ファイル選択時のイベント
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoData = e.target.result;
                // ローカルストレージに保存
                localStorage.setItem('okinawaPhoto', photoData);
                displayPhoto(photoData);
                showSuccess('沖縄の写真をアップロードしました！🌊');
            };
            reader.readAsDataURL(file);
        } else {
            showError('画像ファイルを選択してください');
        }
    });
}

function displayPhoto(photoData) {
    const okinawaPhoto = document.getElementById('okinawaPhoto');
    const photoContainer = document.querySelector('.okinawa-photo-container');
    const removeButton = document.getElementById('removeButton');
    
    if (okinawaPhoto && photoContainer) {
        okinawaPhoto.src = photoData;
        okinawaPhoto.onload = () => {
            okinawaPhoto.classList.add('loaded');
            photoContainer.classList.add('has-photo');
            if (removeButton) {
                removeButton.style.display = 'inline-block';
            }
        };
    }
}

function removePhoto() {
    if (confirm('沖縄の写真を削除しますか？')) {
        localStorage.removeItem('okinawaPhoto');
        const okinawaPhoto = document.getElementById('okinawaPhoto');
        const photoContainer = document.querySelector('.okinawa-photo-container');
        const removeButton = document.getElementById('removeButton');
        
        if (okinawaPhoto && photoContainer) {
            okinawaPhoto.src = '';
            okinawaPhoto.classList.remove('loaded');
            photoContainer.classList.remove('has-photo');
            if (removeButton) {
                removeButton.style.display = 'none';
            }
        }
        showSuccess('写真を削除しました');
    }
}

// デバッグ用
function resetProgress() {
    if (confirm('学習進捗をリセットしますか？この操作は取り消せません。')) {
        localStorage.removeItem('historyQuizStats');
        localStorage.removeItem('historyQuizProgress');
        location.reload();
    }
}

// 進捗モーダル関数
function openProgress() {
    const modal = document.getElementById('progressModal');
    if (modal && app) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // 進捗データを更新して表示
        updateProgressModal();
        setupProgressTabs();
    }
}

function closeProgress() {
    const modal = document.getElementById('progressModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function setupProgressTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // タブボタンの状態更新
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // タブコンテンツの表示切り替え
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab + 'Tab') {
                    content.classList.add('active');
                }
            });
            
            // タブに応じてデータを更新
            updateProgressTab(targetTab);
        });
    });
}

function updateProgressModal() {
    if (!app) return;
    
    // 初期表示は日別進捗
    updateProgressTab('daily');
}

function updateProgressTab(tabType) {
    if (!app) return;
    
    switch (tabType) {
        case 'daily':
            updateDailyProgress();
            break;
        case 'era':
            updateEraProgress();
            break;
        case 'wrong':
            updateWrongQuestions();
            break;
    }
}

function updateDailyProgress() {
    const container = document.getElementById('dailyProgressContainer');
    if (!container) return;
    
    const dailyStats = app.progress.dailyStats;
    const dates = Object.keys(dailyStats).sort().reverse().slice(0, 14); // 最新14日間
    
    if (dates.length === 0) {
        container.innerHTML = '<p class="no-data">まだ学習データがありません</p>';
        return;
    }
    
    const html = dates.map(date => {
        const stats = dailyStats[date];
        const accuracy = stats.questionsAnswered > 0 
            ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100) 
            : 0;
        
        return `
            <div class="daily-stat-item">
                <div class="date">${new Date(date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}</div>
                <div class="questions">問題数: ${stats.questionsAnswered}</div>
                <div class="accuracy">正答率: ${accuracy}%</div>
                <div class="time">時間: ${stats.studyTimeMinutes}分</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

async function updateEraProgress() {
    const container = document.getElementById('eraProgressContainer');
    if (!container) return;
    
    try {
        const erasData = await dataLoader.loadEras();
        const eraStats = app.progress.eraStats;
        
        const html = erasData.eras.map(era => {
            const stats = eraStats[era.id];
            const questionCount = stats?.totalQuestions || 0;
            const accuracy = stats && stats.totalQuestions > 0 
                ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) 
                : 0;
            const wrongCount = stats?.wrongQuestions?.size || 0;
            
            return `
                <div class="era-stat-item">
                    <div class="era-name" style="color: ${era.color}">${era.name}</div>
                    <div class="era-period">${era.period}</div>
                    <div class="era-stats">
                        <span>問題数: ${questionCount}/${era.questionCount}</span>
                        <span>正答率: ${accuracy}%</span>
                        <span>間違い: ${wrongCount}問</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html || '<p class="no-data">まだ学習データがありません</p>';
    } catch (error) {
        container.innerHTML = '<p class="error">データの読み込みに失敗しました</p>';
    }
}

async function updateWrongQuestions() {
    const container = document.getElementById('wrongQuestionsContainer');
    if (!container) return;
    
    try {
        const erasData = await dataLoader.loadEras();
        const wrongQuestions = app.progress.wrongQuestions;
        
        const wrongItems = [];
        
        for (const [eraId, wrongSet] of Object.entries(wrongQuestions)) {
            if (wrongSet.size === 0) continue;
            
            const era = erasData.eras.find(e => e.id === eraId);
            if (!era) continue;
            
            wrongItems.push({
                era: era,
                count: wrongSet.size
            });
        }
        
        if (wrongItems.length === 0) {
            container.innerHTML = '<p class="no-data">間違えた問題はありません！</p>';
            return;
        }
        
        const html = wrongItems.map(item => `
            <div class="wrong-era-item">
                <div class="era-name" style="color: ${item.era.color}">${item.era.name}</div>
                <div class="wrong-count">${item.count}問の復習が必要</div>
                <button class="review-button" onclick="startReview('${item.era.id}')">復習する</button>
            </div>
        `).join('');
        
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = '<p class="error">データの読み込みに失敗しました</p>';
    }
}

function startReview(eraId) {
    // 間違えた問題のみで復習クイズを開始
    window.location.href = `pages/era-selection.html?review=${eraId}`;
}

// エクスポート（他のファイルで使用）
window.HistoryQuizApp = HistoryQuizApp;