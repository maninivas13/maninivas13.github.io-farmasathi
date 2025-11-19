// voice-recorder.js - Enhanced voice recording component

class VoiceRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioUrl = null;
        this.isRecording = false;
        this.stream = null;
        
        this.init();
    }
    
    init() {
        // Check for browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.warn('Voice recording not supported in this browser');
            return;
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const startBtn = document.getElementById('startRec');
        const stopBtn = document.getElementById('stopRec');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startRecording());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopRecording());
        }
    }
    
    async startRecording() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } 
            });
            
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: 'audio/webm'
            });
            
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                this.audioUrl = URL.createObjectURL(this.audioBlob);
                
                // Store globally for form submission
                window.audioBlob = this.audioBlob;
                window.audioUrl = this.audioUrl;
                
                this.updateAudioUI();
                this.cleanupStream();
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateRecordingUI(true);
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Error accessing microphone. Please check permissions.');
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateRecordingUI(false);
        }
    }
    
    cleanupStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
    
    deleteRecording() {
        if (this.audioUrl) {
            URL.revokeObjectURL(this.audioUrl);
        }
        
        this.audioBlob = null;
        this.audioUrl = null;
        window.audioBlob = null;
        window.audioUrl = null;
        
        this.updateAudioUI();
        this.updateRecordingUI(false);
        
        const recStatus = document.getElementById('recStatus');
        if (recStatus) {
            recStatus.textContent = 'Recording deleted';
            recStatus.className = 'text-muted ms-2';
        }
    }
    
    updateRecordingUI(recording) {
        const startBtn = document.getElementById('startRec');
        const stopBtn = document.getElementById('stopRec');
        const recStatus = document.getElementById('recStatus');
        
        if (recording) {
            if (startBtn) startBtn.disabled = true;
            if (stopBtn) stopBtn.disabled = false;
            if (recStatus) {
                recStatus.innerHTML = '<span class="recording-indicator"></span> Recording...';
                recStatus.className = 'text-danger ms-2 fw-bold';
            }
        } else {
            if (startBtn) startBtn.disabled = false;
            if (stopBtn) stopBtn.disabled = true;
            if (recStatus && this.audioUrl) {
                recStatus.textContent = 'Recording saved';
                recStatus.className = 'text-success ms-2';
            }
        }
    }
    
    updateAudioUI() {
        const audioPlayback = document.getElementById('audioPlayback');
        const recStatus = document.getElementById('recStatus');
        
        if (this.audioUrl && audioPlayback) {
            audioPlayback.src = this.audioUrl;
            audioPlayback.style.display = 'block';
            
            // Add delete button if not exists
            if (!document.getElementById('deleteAudio')) {
                const deleteBtn = document.createElement('button');
                deleteBtn.id = 'deleteAudio';
                deleteBtn.className = 'btn btn-outline-danger btn-sm ms-2';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete';
                deleteBtn.title = 'Delete recording';
                deleteBtn.onclick = () => this.deleteRecording();
                
                if (recStatus && recStatus.parentNode) {
                    recStatus.parentNode.appendChild(deleteBtn);
                }
            }
        } else {
            if (audioPlayback) {
                audioPlayback.style.display = 'none';
            }
            
            const deleteBtn = document.getElementById('deleteAudio');
            if (deleteBtn) {
                deleteBtn.remove();
            }
        }
    }
    
    showError(message) {
        const formMsg = document.getElementById('formMsg');
        if (formMsg) {
            formMsg.innerHTML = `<div class="alert alert-danger">${message}</div>`;
            setTimeout(() => {
                formMsg.innerHTML = '';
            }, 5000);
        }
    }
    
    getAudioBlob() {
        return this.audioBlob;
    }
    
    getAudioUrl() {
        return this.audioUrl;
    }
}

// Initialize voice recorder when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.voiceRecorder = new VoiceRecorder();
});
