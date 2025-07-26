// メインアプリケーション
class HistoryQuizApp {
    constructor() {
        this.currentTheme = 'ocean';
        this.settings = this.loadSettings();
        this.stats = this.loadStats();
        this.init();
    }

    init() {
        this.applyTheme(this.settings.theme);
        this.updateStats();
        this.setupEventListeners();
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

    // 設定の保存
    saveSettings() {
        localStorage.setItem('historyQuizSettings', JSON.stringify(this.settings));
    }

    // 統計の保存
    saveStats() {
        localStorage.setItem('historyQuizStats', JSON.stringify(this.stats));
    }

    // テーマの適用
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.settings.theme = theme;
        this.saveSettings();
    }

    // 統計の更新
    updateStats() {
        const elements = {
            totalQuestions: document.getElementById('totalQuestions'),
            correctRate: document.getElementById('correctRate'),
            studyStreak: document.getElementById('studyStreak')
        };

        if (elements.totalQuestions) {
            elements.totalQuestions.textContent = this.stats.totalQuestionsAnswered || '-';
        }
        if (elements.correctRate) {
            const rate = this.stats.totalQuestionsAnswered > 0 
                ? Math.round((this.stats.correctAnswers / this.stats.totalQuestionsAnswered) * 100)
                : 0;
            elements.correctRate.textContent = rate > 0 ? `${rate}%` : '-';
        }
        if (elements.studyStreak) {
            elements.studyStreak.textContent = this.stats.studyStreak || '-';
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
        const bgmSound = document.getElementById('bgmSound');
        if (bgmSound) {
            bgmSound.volume = this.settings.bgmVolume;
        }
    }

    // 効果音再生
    playSound(soundType, condition = null) {
        if (!this.settings.soundEnabled) return;

        const audio = document.getElementById(`${soundType}Sound`);
        if (audio) {
            audio.volume = this.settings.effectVolume;
            audio.currentTime = 0;
            audio.play().catch(e => console.log('Sound play failed:', e));
        }
    }

    // BGM再生/停止
    toggleBGM(play = true) {
        const bgmSound = document.getElementById('bgmSound');
        if (bgmSound && this.settings.soundEnabled) {
            bgmSound.volume = this.settings.bgmVolume;
            if (play) {
                bgmSound.play().catch(e => console.log('BGM play failed:', e));
            } else {
                bgmSound.pause();
            }
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
    const modal = document.getElementById('settingsModal');
    if (modal && e.target === modal) {
        closeSettings();
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

// エクスポート（他のファイルで使用）
window.HistoryQuizApp = HistoryQuizApp;