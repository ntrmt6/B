// APK Builder JavaScript
class APKBuilder {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {
            websiteUrl: '',
            startUrl: '/',
            appName: '',
            shortName: '',
            packageName: '',
            appDescription: '',
            versionName: '1.0.0',
            versionCode: 1,
            appIcon: null,
            welcomeImage: null,
            themeColor: '#6366f1',
            backgroundColor: '#ffffff',
            displayMode: 'standalone',
            orientation: 'portrait',
            enableNotifications: true,
            enableOffline: false,
            enableDeepLinks: true
        };
        
        this.init();
    }
    
    init() {
        this.form = document.getElementById('apkBuilderForm');
        this.steps = document.querySelectorAll('.step');
        this.formSteps = document.querySelectorAll('.form-step');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.generateBtn = document.getElementById('generateBtn');
        this.progressBar = document.getElementById('buildProgress');
        this.progressFill = document.getElementById('progressFill');
        this.progressStatus = document.getElementById('progressStatus');
        this.downloadModal = document.getElementById('downloadModal');
        
        this.bindEvents();
        this.setupAutoFields();
    }
    
    bindEvents() {
        this.prevBtn.addEventListener('click', () => this.prevStep());
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById("downloadBtn").addEventListener("click", () => this.downloadAPK());
        document.getElementById("closeModal").addEventListener("click", () => this.closeModal());
        
        // App Icon upload
        const iconUploadArea = document.getElementById('iconUploadArea');
        const appIconInput = document.getElementById('appIcon');
        
        iconUploadArea.addEventListener('click', () => appIconInput.click());
        appIconInput.addEventListener('change', (e) => this.handleIconUpload(e));
        
        iconUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            iconUploadArea.classList.add('dragover');
        });
        iconUploadArea.addEventListener('dragleave', () => {
            iconUploadArea.classList.remove('dragover');
        });
        iconUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            iconUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processIcon(files[0]);
            }
        });
        
        // Welcome image upload
        const welcomeImageUploadArea = document.getElementById('welcomeImageUploadArea');
        const welcomeImageInput = document.getElementById('welcomeImage');
        
        welcomeImageUploadArea.addEventListener('click', () => welcomeImageInput.click());
        welcomeImageInput.addEventListener('change', (e) => this.handleWelcomeImageUpload(e));
        
        // Drag and drop for welcome image
        welcomeImageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            welcomeImageUploadArea.classList.add('dragover');
        });
        welcomeImageUploadArea.addEventListener('dragleave', () => {
            welcomeImageUploadArea.classList.remove('dragover');
        });
        welcomeImageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            welcomeImageUploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processWelcomeImage(files[0]);
            }
        });
        
        // Color sync
        this.syncColorInputs('themeColor', 'themeColorText');
        this.syncColorInputs('backgroundColor', 'backgroundColorText');
    }
    
    syncColorInputs(colorId, textId) {
        const colorInput = document.getElementById(colorId);
        const textInput = document.getElementById(textId);
        
        colorInput.addEventListener('input', (e) => {
            textInput.value = e.target.value.toUpperCase();
            this.formData[colorId] = e.target.value;
        });
        
        textInput.addEventListener('input', (e) => {
            let value = e.target.value;
            if (!value.startsWith('#')) value = '#' + value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                colorInput.value = value;
                this.formData[colorId] = value;
            }
        });
    }
    
    setupAutoFields() {
        const websiteUrlInput = document.getElementById('websiteUrl');
        const appNameInput = document.getElementById('appName');
        const packageNameInput = document.getElementById('packageName');
        
        websiteUrlInput.addEventListener('input', (e) => {
            const url = e.target.value;
            this.formData.websiteUrl = url;
            
            try {
                const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
                const hostname = urlObj.hostname;
                
                if (!appNameInput.value || appNameInput.dataset.autoGenerated === 'true') {
                    const parts = hostname.replace('www.', '').split('.');
                    const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
                    appNameInput.value = name;
                    appNameInput.dataset.autoGenerated = 'true';
                    this.formData.appName = name;
                    this.formData.shortName = name;
                    document.getElementById('shortName').value = name;
                }
                
                if (!packageNameInput.value || packageNameInput.dataset.autoGenerated === 'true') {
                    const parts = hostname.replace('www.', '').split('.').reverse();
                    const pkg = parts.map(p => p.replace(/[^a-zA-Z0-9]/g, '')).join('.');
                    packageNameInput.value = pkg;
                    packageNameInput.dataset.autoGenerated = 'true';
                    this.formData.packageName = pkg;
                }
            } catch (err) {}
        });
        
        appNameInput.addEventListener('input', (e) => {
            appNameInput.dataset.autoGenerated = 'false';
            this.formData.appName = e.target.value;
        });
        
        packageNameInput.addEventListener('input', (e) => {
            packageNameInput.dataset.autoGenerated = 'false';
            this.formData.packageName = e.target.value;
        });
    }
    
    handleIconUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processIcon(file);
        }
    }
    
    processIcon(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.formData.appIcon = e.target.result;
            
            const preview = document.getElementById('iconPreview');
            const placeholder = document.getElementById('uploadPlaceholder');
            
            preview.src = e.target.result;
            preview.classList.add('visible');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
    
    handleWelcomeImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processWelcomeImage(file);
        }
    }
    
    processWelcomeImage(file) {
        if (!file.type.match(/image\/(png|jpeg|jpg|svg\+xml)/)) {
            alert('Please upload a PNG, JPG, or SVG image.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.formData.welcomeImage = e.target.result;
            const preview = document.getElementById('welcomeImagePreview');
            const placeholder = document.getElementById('welcomeImagePlaceholder');
            
            preview.src = e.target.result;
            preview.classList.add('visible');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }
    
    updateStepIndicators() {
        this.steps.forEach((step, index) => {
            const stepNum = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNum === this.currentStep) {
                step.classList.add('active');
            } else if (stepNum < this.currentStep) {
                step.classList.add('completed');
            }
        });
    }
    
    showStep(stepNum) {
        this.formSteps.forEach((step, index) => {
            step.classList.toggle('active', index + 1 === stepNum);
        });
        
        this.prevBtn.style.display = stepNum === 1 ? 'none' : 'flex';
        this.nextBtn.style.display = stepNum === this.totalSteps ? 'none' : 'flex';
        this.generateBtn.style.display = stepNum === this.totalSteps ? 'flex' : 'none';
        
        if (stepNum === this.totalSteps) {
            this.updateSummary();
        }
        
        this.updateStepIndicators();
    }
    
    validateCurrentStep() {
        const currentFormStep = this.formSteps[this.currentStep - 1];
        const requiredInputs = currentFormStep.querySelectorAll('[required]');
        
        let isValid = true;
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });
        
        // Validate icon on step 3
        if (this.currentStep === 3) {
            if (!this.formData.appIcon) {
                isValid = false;
                const iconArea = document.getElementById('iconUploadArea');
                iconArea.classList.add('error');
                setTimeout(() => iconArea.classList.remove('error'), 2000);
            }
            if (!this.formData.welcomeImage) {
                isValid = false;
                const welcomeArea = document.getElementById('welcomeImageUploadArea');
                welcomeArea.classList.add('error');
                setTimeout(() => welcomeArea.classList.remove('error'), 2000);
            }
        }
        
        return isValid;
    }
    
    collectFormData() {
        this.formData = {
            websiteUrl: document.getElementById('websiteUrl').value,
            startUrl: document.getElementById('startUrl').value || '/',
            appName: document.getElementById('appName').value,
            shortName: document.getElementById('shortName').value,
            packageName: document.getElementById('packageName').value,
            appDescription: document.getElementById('appDescription').value,
            versionName: document.getElementById('versionName').value,
            versionCode: parseInt(document.getElementById('versionCode').value) || 1,
            appIcon: this.formData.appIcon, // Keep existing uploaded icon
            welcomeImage: this.formData.welcomeImage, // Keep existing uploaded welcome image
            themeColor: document.getElementById('themeColor').value,
            backgroundColor: document.getElementById('backgroundColor').value,
            displayMode: document.querySelector('input[name="displayMode"]:checked').value,
            orientation: document.querySelector('input[name="orientation"]:checked').value,
            enableNotifications: document.querySelector('input[name="enableNotifications"]').checked,
            enableOffline: document.querySelector('input[name="enableOffline"]').checked,
            enableDeepLinks: document.querySelector('input[name="enableDeepLinks"]').checked
        };
    }
    
    updateSummary() {
        const summary = document.getElementById('configSummary');
        this.collectFormData();
        
        const iconPreviewHtml = this.formData.appIcon 
            ? `<img src="${this.formData.appIcon}" alt="App Icon" style="width: 48px; height: 48px; border-radius: 8px; object-fit: cover;">` 
            : '<span style="color: var(--danger);">Not set</span>';
        
        const welcomePreviewHtml = this.formData.welcomeImage 
            ? `<img src="${this.formData.welcomeImage}" alt="Welcome Image" style="width: 32px; height: 56px; border-radius: 4px; object-fit: cover;">` 
            : '<span style="color: var(--danger);">Not set</span>';
        
        summary.innerHTML = `
            <h3>Configuration Summary</h3>
            <div class="config-item">
                <span class="label">Website URL</span>
                <span class="value">${this.formData.websiteUrl}</span>
            </div>
            <div class="config-item">
                <span class="label">App Name</span>
                <span class="value">${this.formData.appName}</span>
            </div>
            <div class="config-item">
                <span class="label">Package Name</span>
                <span class="value">${this.formData.packageName}</span>
            </div>
            <div class="config-item">
                <span class="label">Version</span>
                <span class="value">${this.formData.versionName} (${this.formData.versionCode})</span>
            </div>
            <div class="config-item">
                <span class="label">App Icon</span>
                <span class="value">${iconPreviewHtml}</span>
            </div>
            <div class="config-item">
                <span class="label">Welcome Image</span>
                <span class="value">${welcomePreviewHtml}</span>
            </div>
            <div class="config-item">
                <span class="label">Display Mode</span>
                <span class="value">${this.formData.displayMode}</span>
            </div>
            <div class="config-item">
                <span class="label">Orientation</span>
                <span class="value">${this.formData.orientation}</span>
            </div>
            <div class="config-item">
                <span class="label">Theme Color</span>
                <span class="value" style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="width: 16px; height: 16px; background: ${this.formData.themeColor}; border-radius: 4px; display: inline-block;"></span>
                    ${this.formData.themeColor}
                </span>
            </div>
        `;
    }
    
    nextStep() {
        if (!this.validateCurrentStep()) {
            if (this.currentStep === 3 && (!this.formData.appIcon || !this.formData.welcomeImage)) {
                let missingItems = [];
                if (!this.formData.appIcon) missingItems.push('App Icon');
                if (!this.formData.welcomeImage) missingItems.push('Welcome Image');
                alert('Please upload: ' + missingItems.join(' and '));
            } else {
                alert('Please fill in all required fields');
            }
            return;
        }
        
        this.collectFormData();
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showStep(this.currentStep);
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }
    
    goToStep(step) {
        if (step >= 1 && step <= this.totalSteps) {
            this.currentStep = step;
            this.showStep(this.currentStep);
        }
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        this.collectFormData();
        
        // Validate images
        if (!this.formData.appIcon) {
            alert('Please upload an App Icon.');
            this.goToStep(3);
            return;
        }
        
        if (!this.formData.welcomeImage) {
            alert('Please upload a Welcome/Splash Image.');
            this.goToStep(3);
            return;
        }
        
        // Show progress
        this.progressBar.style.display = 'block';
        this.generateBtn.disabled = true;
        
        try {
            await this.buildAPK();
        } catch (error) {
            console.error('Build failed:', error);
            alert('Build failed: ' + error.message);
            this.progressBar.style.display = 'none';
            this.generateBtn.disabled = false;
        }
    }
    
    async buildAPK() {
        this.generateBtn.disabled = true;
        this.progressBar.style.display = 'block';
        this.progressFill.style.width = '5%';
        this.progressStatus.textContent = 'Submitting build request...';
        
        try {
            // Start the API call immediately
            this.progressFill.style.width = '10%';
            this.progressStatus.textContent = 'Starting APK build (this takes ~60-90 seconds)...';
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout
            
            // Start progress animation while waiting
            let progress = 10;
            const progressInterval = setInterval(() => {
                if (progress < 90) {
                    progress += Math.random() * 3;
                    this.progressFill.style.width = Math.min(progress, 90) + '%';
                    
                    if (progress < 30) {
                        this.progressStatus.textContent = 'Creating Android project structure...';
                    } else if (progress < 50) {
                        this.progressStatus.textContent = 'Generating app icons...';
                    } else if (progress < 70) {
                        this.progressStatus.textContent = 'Compiling Android application...';
                    } else {
                        this.progressStatus.textContent = 'Building APK file...';
                    }
                }
            }, 1000);
            
            const response = await fetch('/api/apk-builder/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.formData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            clearInterval(progressInterval);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate APK');
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Build failed');
            }
            
            this.progressFill.style.width = '100%';
            this.progressStatus.textContent = 'APK generated successfully!';
            
            await this.delay(500);
            
            // Show download modal with real data
            document.getElementById('downloadFileName').textContent = result.fileName;
            document.getElementById('downloadFileSize').textContent = result.fileSize;
            this.downloadUrl = result.downloadUrl;
            this.downloadModal.classList.add('active');
            
        } catch (error) {
            console.error('APK Build Error:', error);
            
            this.progressFill.style.width = '0%';
            this.progressStatus.textContent = 'Build failed: ' + error.message;
            this.progressStatus.style.color = '#ef4444';
            
            alert('APK generation failed: ' + error.message + '\n\nPlease try again or check your inputs.');
            
            setTimeout(() => {
                this.progressStatus.style.color = '';
            }, 3000);
        }
        
        this.progressBar.style.display = 'none';
        this.generateBtn.disabled = false;
    }
    
    downloadAPK() {
        if (this.downloadUrl) {
            // Trigger download
            window.location.href = this.downloadUrl;
            
            // Close modal after a delay
            setTimeout(() => {
                this.closeModal();
            }, 1000);
        } else {
            alert('Download URL not available. Please generate the APK again.');
        }
    }
    
    closeModal() {
        this.downloadModal.classList.remove('active');
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.apkBuilder = new APKBuilder();
});

// Global functions for button clicks
function downloadAPK() {
    window.apkBuilder.downloadAPK();
}

function closeModal() {
    window.apkBuilder.closeModal();
}
